-- =============================================================================
-- Migration: 032_club_canonicals
-- Description: Add canonical_club_id to handle Wikidata duplicate QIDs for same club
-- Date: 2026-02-05
-- =============================================================================

-- Problem: Wikidata has multiple QIDs for the same club (e.g., Q8682 "Barcelona" vs
-- Q12299 "Futbol Club Barcelona"). When checking if players linked, we need to resolve
-- duplicate club IDs to a canonical one.

-- Step 1: Add canonical_club_id column
-- If NULL, the club IS canonical. If set, points to the canonical club.
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS canonical_club_id TEXT REFERENCES clubs(id);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_clubs_canonical ON clubs(canonical_club_id)
WHERE canonical_club_id IS NOT NULL;

-- Step 2: Create helper function to get canonical club ID
CREATE OR REPLACE FUNCTION get_canonical_club_id(club_id TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    (SELECT canonical_club_id FROM clubs WHERE id = club_id),
    club_id
  );
$$;

-- Step 3: Auto-detect and fix duplicate clubs
-- Groups clubs by search_name prefix (first 10 chars), picks the one with most appearances as canonical
DO $$
DECLARE
  duplicate_group RECORD;
  canonical_id TEXT;
BEGIN
  -- Find groups of potential duplicates based on search_name similarity
  FOR duplicate_group IN
    WITH club_groups AS (
      -- Group by first significant portion of search_name (handles fc/cf variations)
      SELECT
        c.id,
        c.name,
        c.search_name,
        -- Normalize: remove common prefixes like 'fc ', 'cf ', 'afc ', etc.
        REGEXP_REPLACE(c.search_name, '^(fc |cf |afc |ac |as |ss |sc |us |rc |cd |ud |sd |rcd |)(.+)$', '\2') as normalized_name,
        (SELECT COUNT(*) FROM player_appearances WHERE club_id = c.id) as appearance_count
      FROM clubs c
      WHERE c.canonical_club_id IS NULL  -- Only process non-aliased clubs
    ),
    grouped AS (
      SELECT
        normalized_name,
        COUNT(*) as club_count,
        ARRAY_AGG(id ORDER BY appearance_count DESC) as club_ids,
        ARRAY_AGG(name ORDER BY appearance_count DESC) as club_names
      FROM club_groups
      GROUP BY normalized_name
      HAVING COUNT(*) > 1  -- Only groups with duplicates
    )
    SELECT * FROM grouped
    WHERE club_count > 1
  LOOP
    -- The first ID in the array has the most appearances - make it canonical
    canonical_id := duplicate_group.club_ids[1];

    -- Update all other clubs in this group to point to the canonical
    UPDATE clubs
    SET canonical_club_id = canonical_id
    WHERE id = ANY(duplicate_group.club_ids)
      AND id != canonical_id;

    RAISE NOTICE 'Merged % clubs for "%": % -> %',
      array_length(duplicate_group.club_ids, 1) - 1,
      duplicate_group.normalized_name,
      duplicate_group.club_names,
      (SELECT name FROM clubs WHERE id = canonical_id);
  END LOOP;
END $$;

-- Step 4: Update check_players_linked to use canonical club IDs
CREATE OR REPLACE FUNCTION check_players_linked(
  player_a_qid TEXT,
  player_b_qid TEXT
)
RETURNS TABLE (
  is_linked BOOLEAN,
  shared_club_id TEXT,
  shared_club_name TEXT,
  overlap_start INTEGER,
  overlap_end INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_link BOOLEAN := FALSE;
BEGIN
  RETURN QUERY
  SELECT
    TRUE as is_linked,
    c.id as shared_club_id,
    c.name as shared_club_name,
    GREATEST(pa_a.start_year, pa_b.start_year) as overlap_start,
    LEAST(
      COALESCE(pa_a.end_year, EXTRACT(YEAR FROM NOW())::INTEGER),
      COALESCE(pa_b.end_year, EXTRACT(YEAR FROM NOW())::INTEGER)
    ) as overlap_end
  FROM player_appearances pa_a
  JOIN player_appearances pa_b
    -- Match on CANONICAL club ID (resolves duplicates like Barcelona/FC Barcelona)
    ON get_canonical_club_id(pa_a.club_id) = get_canonical_club_id(pa_b.club_id)
    AND pa_a.player_id != pa_b.player_id
  JOIN clubs c ON c.id = pa_a.club_id
  WHERE pa_a.player_id = player_a_qid
    AND pa_b.player_id = player_b_qid
    -- REQUIRE non-NULL start_year for both players
    AND pa_a.start_year IS NOT NULL
    AND pa_b.start_year IS NOT NULL
    -- Check actual year overlap
    AND pa_a.start_year <= COALESCE(pa_b.end_year, EXTRACT(YEAR FROM NOW())::INTEGER)
    AND pa_b.start_year <= COALESCE(pa_a.end_year, EXTRACT(YEAR FROM NOW())::INTEGER)
  LIMIT 1;

  GET DIAGNOSTICS found_link = ROW_COUNT;

  IF NOT found_link OR found_link = FALSE THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
  END IF;
END;
$$;

-- Step 5: Update find_shortest_player_path to use canonical club IDs
CREATE OR REPLACE FUNCTION find_shortest_player_path(
  start_qid TEXT,
  end_qid TEXT,
  max_depth INTEGER DEFAULT 6
)
RETURNS TABLE (
  path_found BOOLEAN,
  path_length INTEGER,
  path_qids TEXT[],
  path_names TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_depth INTEGER := 0;
  found BOOLEAN := FALSE;
  meeting_point TEXT := NULL;

  fwd_visited TEXT[] := ARRAY[start_qid];
  fwd_frontier TEXT[] := ARRAY[start_qid];
  fwd_parent JSONB := '{}'::JSONB;

  bwd_visited TEXT[] := ARRAY[end_qid];
  bwd_frontier TEXT[] := ARRAY[end_qid];
  bwd_parent JSONB := '{}'::JSONB;

  next_frontier TEXT[];
  neighbor TEXT;
  curr TEXT;
  result_path TEXT[];
  result_names TEXT[];
  half_depth INTEGER;
  current_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = start_qid) THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::TEXT[], NULL::TEXT[];
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = end_qid) THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::TEXT[], NULL::TEXT[];
    RETURN;
  END IF;

  IF start_qid = end_qid THEN
    RETURN QUERY SELECT TRUE, 0, ARRAY[start_qid],
      ARRAY[(SELECT name FROM players WHERE id = start_qid)];
    RETURN;
  END IF;

  -- Check direct link (1-step) with canonical club matching
  IF EXISTS (
    SELECT 1 FROM player_appearances pa_a
    JOIN player_appearances pa_b
      ON get_canonical_club_id(pa_a.club_id) = get_canonical_club_id(pa_b.club_id)
    WHERE pa_a.player_id = start_qid AND pa_b.player_id = end_qid
    AND pa_a.player_id != pa_b.player_id
    AND pa_a.start_year IS NOT NULL
    AND pa_b.start_year IS NOT NULL
    AND pa_a.start_year <= COALESCE(pa_b.end_year, current_year)
    AND pa_b.start_year <= COALESCE(pa_a.end_year, current_year)
    LIMIT 1
  ) THEN
    SELECT array_agg(p.name ORDER BY idx)
    INTO result_names
    FROM unnest(ARRAY[start_qid, end_qid]) WITH ORDINALITY AS t(qid, idx)
    JOIN players p ON p.id = t.qid;

    RETURN QUERY SELECT TRUE, 1, ARRAY[start_qid, end_qid], result_names;
    RETURN;
  END IF;

  half_depth := max_depth / 2;

  WHILE current_depth < half_depth AND NOT found
    AND (array_length(fwd_frontier, 1) > 0 OR array_length(bwd_frontier, 1) > 0)
  LOOP
    current_depth := current_depth + 1;

    -- Forward BFS with canonical club matching
    IF array_length(fwd_frontier, 1) > 0 THEN
      next_frontier := ARRAY[]::TEXT[];

      FOR curr IN SELECT unnest(fwd_frontier) LOOP
        FOR neighbor IN
          SELECT DISTINCT pa_b.player_id
          FROM player_appearances pa_a
          JOIN player_appearances pa_b
            ON get_canonical_club_id(pa_a.club_id) = get_canonical_club_id(pa_b.club_id)
          WHERE pa_a.player_id = curr
            AND pa_a.player_id != pa_b.player_id
            AND NOT pa_b.player_id = ANY(fwd_visited)
            AND pa_a.start_year IS NOT NULL
            AND pa_b.start_year IS NOT NULL
            AND pa_a.start_year <= COALESCE(pa_b.end_year, current_year)
            AND pa_b.start_year <= COALESCE(pa_a.end_year, current_year)
          LIMIT 50
        LOOP
          IF neighbor = ANY(bwd_visited) THEN
            found := TRUE;
            meeting_point := neighbor;
            fwd_parent := fwd_parent || jsonb_build_object(neighbor, curr);
            EXIT;
          END IF;

          next_frontier := array_append(next_frontier, neighbor);
          fwd_visited := array_append(fwd_visited, neighbor);
          fwd_parent := fwd_parent || jsonb_build_object(neighbor, curr);
        END LOOP;
        IF found THEN EXIT; END IF;
      END LOOP;

      fwd_frontier := next_frontier;
    END IF;

    IF found THEN EXIT; END IF;

    -- Backward BFS with canonical club matching
    IF array_length(bwd_frontier, 1) > 0 THEN
      next_frontier := ARRAY[]::TEXT[];

      FOR curr IN SELECT unnest(bwd_frontier) LOOP
        FOR neighbor IN
          SELECT DISTINCT pa_b.player_id
          FROM player_appearances pa_a
          JOIN player_appearances pa_b
            ON get_canonical_club_id(pa_a.club_id) = get_canonical_club_id(pa_b.club_id)
          WHERE pa_a.player_id = curr
            AND pa_a.player_id != pa_b.player_id
            AND NOT pa_b.player_id = ANY(bwd_visited)
            AND pa_a.start_year IS NOT NULL
            AND pa_b.start_year IS NOT NULL
            AND pa_a.start_year <= COALESCE(pa_b.end_year, current_year)
            AND pa_b.start_year <= COALESCE(pa_a.end_year, current_year)
          LIMIT 50
        LOOP
          IF neighbor = ANY(fwd_visited) THEN
            found := TRUE;
            meeting_point := neighbor;
            bwd_parent := bwd_parent || jsonb_build_object(neighbor, curr);
            EXIT;
          END IF;

          next_frontier := array_append(next_frontier, neighbor);
          bwd_visited := array_append(bwd_visited, neighbor);
          bwd_parent := bwd_parent || jsonb_build_object(neighbor, curr);
        END LOOP;
        IF found THEN EXIT; END IF;
      END LOOP;

      bwd_frontier := next_frontier;
    END IF;
  END LOOP;

  IF found AND meeting_point IS NOT NULL THEN
    result_path := ARRAY[meeting_point];
    curr := meeting_point;
    WHILE fwd_parent ? curr LOOP
      curr := fwd_parent->>curr;
      result_path := array_prepend(curr, result_path);
    END LOOP;

    curr := meeting_point;
    WHILE bwd_parent ? curr LOOP
      curr := bwd_parent->>curr;
      result_path := array_append(result_path, curr);
    END LOOP;

    SELECT array_agg(p.name ORDER BY idx)
    INTO result_names
    FROM unnest(result_path) WITH ORDINALITY AS t(qid, idx)
    JOIN players p ON p.id = t.qid;

    RETURN QUERY SELECT TRUE, array_length(result_path, 1) - 1, result_path, result_names;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::TEXT[], NULL::TEXT[];
  END IF;
END;
$$;

-- Step 6: Update find_chain_path_samples to use canonical club IDs
CREATE OR REPLACE FUNCTION find_chain_path_samples(
  start_qid TEXT,
  end_qid TEXT,
  sample_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  optimal_length INTEGER,
  paths JSONB,
  depth_counts JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
  optimal_path_length INTEGER := NULL;
  collected_paths JSONB := '[]'::JSONB;
  depth_count_map JSONB := '{}'::JSONB;

  current_depth INTEGER := 0;
  max_depth INTEGER := 6;
  visited_players TEXT[];
  current_frontier TEXT[];
  next_frontier TEXT[];
  parent_map JSONB;

  curr TEXT;
  neighbor TEXT;
  found_count INTEGER := 0;
  result_path TEXT[];
  result_names TEXT[];
  path_obj JSONB;

  depth_player_count INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = start_qid) THEN
    RETURN QUERY SELECT NULL::INTEGER, '[]'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = end_qid) THEN
    RETURN QUERY SELECT NULL::INTEGER, '[]'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;

  IF start_qid = end_qid THEN
    RETURN QUERY SELECT 0, '[]'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;

  visited_players := ARRAY[start_qid];
  current_frontier := ARRAY[start_qid];
  parent_map := '{}'::JSONB;

  WHILE current_depth < max_depth AND array_length(current_frontier, 1) > 0 LOOP
    current_depth := current_depth + 1;
    next_frontier := ARRAY[]::TEXT[];

    -- Count reachable players with canonical club matching
    SELECT COUNT(DISTINCT pa_b.player_id) INTO depth_player_count
    FROM player_appearances pa_a
    JOIN player_appearances pa_b
      ON get_canonical_club_id(pa_a.club_id) = get_canonical_club_id(pa_b.club_id)
    WHERE pa_a.player_id = ANY(current_frontier)
      AND pa_a.player_id != pa_b.player_id
      AND NOT pa_b.player_id = ANY(visited_players)
      AND pa_a.start_year IS NOT NULL
      AND pa_b.start_year IS NOT NULL
      AND pa_a.start_year <= COALESCE(pa_b.end_year, current_year)
      AND pa_b.start_year <= COALESCE(pa_a.end_year, current_year);

    depth_count_map := depth_count_map || jsonb_build_object(current_depth::TEXT, depth_player_count);

    FOR curr IN SELECT unnest(current_frontier) LOOP
      FOR neighbor IN
        SELECT player_id FROM (
          SELECT DISTINCT pa_b.player_id
          FROM player_appearances pa_a
          JOIN player_appearances pa_b
            ON get_canonical_club_id(pa_a.club_id) = get_canonical_club_id(pa_b.club_id)
          WHERE pa_a.player_id = curr
            AND pa_a.player_id != pa_b.player_id
            AND NOT pa_b.player_id = ANY(visited_players)
            AND pa_a.start_year IS NOT NULL
            AND pa_b.start_year IS NOT NULL
            AND pa_a.start_year <= COALESCE(pa_b.end_year, current_year)
            AND pa_b.start_year <= COALESCE(pa_a.end_year, current_year)
        ) sub
        ORDER BY RANDOM()
        LIMIT 100
      LOOP
        IF neighbor = end_qid THEN
          IF optimal_path_length IS NULL THEN
            optimal_path_length := current_depth;
          END IF;

          IF current_depth = optimal_path_length AND found_count < sample_count THEN
            result_path := ARRAY[end_qid];
            parent_map := parent_map || jsonb_build_object(neighbor, curr);

            curr := end_qid;
            WHILE parent_map ? curr LOOP
              curr := parent_map->>curr;
              result_path := array_prepend(curr, result_path);
            END LOOP;

            SELECT array_agg(p.name ORDER BY idx)
            INTO result_names
            FROM unnest(result_path) WITH ORDINALITY AS t(qid, idx)
            JOIN players p ON p.id = t.qid;

            path_obj := jsonb_build_object(
              'qids', to_jsonb(result_path),
              'names', to_jsonb(result_names)
            );

            collected_paths := collected_paths || path_obj;
            found_count := found_count + 1;

            parent_map := parent_map - end_qid;
          END IF;

          CONTINUE;
        END IF;

        IF optimal_path_length IS NULL OR current_depth < optimal_path_length THEN
          next_frontier := array_append(next_frontier, neighbor);
          visited_players := array_append(visited_players, neighbor);
          parent_map := parent_map || jsonb_build_object(neighbor, curr);
        END IF;
      END LOOP;
    END LOOP;

    IF optimal_path_length IS NOT NULL AND found_count >= sample_count THEN
      EXIT;
    END IF;

    current_frontier := next_frontier;
  END LOOP;

  RETURN QUERY SELECT optimal_path_length, collected_paths, depth_count_map;
END;
$$;

-- Verify: Show detected duplicates
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM clubs WHERE canonical_club_id IS NOT NULL;
  RAISE NOTICE 'Club deduplication complete: % clubs marked as aliases', dup_count;
END $$;
