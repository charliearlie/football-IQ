-- =============================================================================
-- Migration: 030_fix_chain_year_validation
-- Description: Fix year overlap validation - require actual year data
-- Date: 2026-02-05
-- =============================================================================

-- Fix check_players_linked: require non-NULL start_year
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
    ON pa_a.club_id = pa_b.club_id
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

-- Fix find_shortest_player_path: require non-NULL start_year in all queries
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

  -- Check direct link (1-step) with STRICT year validation
  IF EXISTS (
    SELECT 1 FROM player_appearances pa_a
    JOIN player_appearances pa_b ON pa_a.club_id = pa_b.club_id
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

    -- Forward BFS with STRICT year validation
    IF array_length(fwd_frontier, 1) > 0 THEN
      next_frontier := ARRAY[]::TEXT[];

      FOR curr IN SELECT unnest(fwd_frontier) LOOP
        FOR neighbor IN
          SELECT DISTINCT pa_b.player_id
          FROM player_appearances pa_a
          JOIN player_appearances pa_b ON pa_a.club_id = pa_b.club_id
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

    -- Backward BFS with STRICT year validation
    IF array_length(bwd_frontier, 1) > 0 THEN
      next_frontier := ARRAY[]::TEXT[];

      FOR curr IN SELECT unnest(bwd_frontier) LOOP
        FOR neighbor IN
          SELECT DISTINCT pa_b.player_id
          FROM player_appearances pa_a
          JOIN player_appearances pa_b ON pa_a.club_id = pa_b.club_id
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
