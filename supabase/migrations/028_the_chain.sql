-- =============================================================================
-- Migration: 028_the_chain
-- Description: RPC functions for The Chain puzzle mode
-- - check_players_linked: Validates if two players shared a club with overlapping years
-- - find_shortest_player_path: BFS pathfinding for PAR calculation
-- Date: 2026-02-05
-- =============================================================================

-- STEP 1: Check if two players are linked (shared club with overlapping years)
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
  -- Find shared clubs with overlapping years
  RETURN QUERY
  SELECT
    TRUE as is_linked,
    c.id as shared_club_id,
    c.name as shared_club_name,
    GREATEST(
      COALESCE(pa_a.start_year, 1900),
      COALESCE(pa_b.start_year, 1900)
    ) as overlap_start,
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
    -- Check year overlap: A.start <= B.end AND B.start <= A.end
    AND COALESCE(pa_a.start_year, 1900) <= COALESCE(pa_b.end_year, EXTRACT(YEAR FROM NOW())::INTEGER)
    AND COALESCE(pa_b.start_year, 1900) <= COALESCE(pa_a.end_year, EXTRACT(YEAR FROM NOW())::INTEGER)
  LIMIT 1;

  -- Check if we found any rows
  GET DIAGNOSTICS found_link = ROW_COUNT;

  -- If no rows returned, return a single row with is_linked = false
  IF NOT found_link OR found_link = FALSE THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
  END IF;
END;
$$;

COMMENT ON FUNCTION check_players_linked IS
  'Check if two players shared a club with overlapping years. '
  'Used for The Chain game mode validation.';

-- STEP 2: Find shortest path between two players (BFS for PAR calculation)
-- Uses iterative BFS with depth limit to prevent timeout on large graphs
CREATE OR REPLACE FUNCTION find_shortest_player_path(
  start_qid TEXT,
  end_qid TEXT,
  max_depth INTEGER DEFAULT 8
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
  visited_players TEXT[] := ARRAY[start_qid];
  current_frontier TEXT[] := ARRAY[start_qid];
  next_frontier TEXT[];
  parent_map JSONB := '{}'::JSONB;
  result_path TEXT[];
  result_names TEXT[];
  neighbor TEXT;
  curr TEXT;
BEGIN
  -- Validate inputs exist
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = start_qid) THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::TEXT[], NULL::TEXT[];
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = end_qid) THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::TEXT[], NULL::TEXT[];
    RETURN;
  END IF;

  -- Check if start equals end (trivial case)
  IF start_qid = end_qid THEN
    RETURN QUERY SELECT
      TRUE,
      0,
      ARRAY[start_qid],
      ARRAY[(SELECT name FROM players WHERE id = start_qid)];
    RETURN;
  END IF;

  -- BFS loop
  WHILE current_depth < max_depth AND NOT found AND array_length(current_frontier, 1) > 0 LOOP
    next_frontier := ARRAY[]::TEXT[];
    current_depth := current_depth + 1;

    -- For each player in current frontier, find linked neighbors
    FOR curr IN SELECT unnest(current_frontier) LOOP
      FOR neighbor IN
        SELECT DISTINCT pa_b.player_id
        FROM player_appearances pa_a
        JOIN player_appearances pa_b
          ON pa_a.club_id = pa_b.club_id
          AND pa_a.player_id != pa_b.player_id
        WHERE pa_a.player_id = curr
          AND NOT pa_b.player_id = ANY(visited_players)
          -- Year overlap check (same as check_players_linked)
          AND COALESCE(pa_a.start_year, 1900) <= COALESCE(pa_b.end_year, 9999)
          AND COALESCE(pa_b.start_year, 1900) <= COALESCE(pa_a.end_year, 9999)
      LOOP
        -- Check if we found the target
        IF neighbor = end_qid THEN
          found := TRUE;
          parent_map := parent_map || jsonb_build_object(neighbor, curr);
          EXIT;
        END IF;

        -- Add to next frontier and visited
        next_frontier := array_append(next_frontier, neighbor);
        visited_players := array_append(visited_players, neighbor);
        parent_map := parent_map || jsonb_build_object(neighbor, curr);
      END LOOP;

      IF found THEN EXIT; END IF;
    END LOOP;

    current_frontier := next_frontier;
  END LOOP;

  -- Reconstruct path if found
  IF found THEN
    result_path := ARRAY[end_qid];
    curr := end_qid;
    WHILE curr != start_qid LOOP
      curr := parent_map->>curr;
      result_path := array_prepend(curr, result_path);
    END LOOP;

    -- Get names for the path
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

COMMENT ON FUNCTION find_shortest_player_path IS
  'Find shortest path between two players through shared club history. '
  'Uses BFS with depth limit. Returns path length (PAR) and the actual path. '
  'Used for The Chain puzzle mode PAR calculation.';

-- STEP 3: Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_players_linked(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_players_linked(TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION find_shortest_player_path(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_shortest_player_path(TEXT, TEXT, INTEGER) TO anon;
