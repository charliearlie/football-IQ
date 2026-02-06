-- =============================================================================
-- Migration: 029_optimize_chain_pathfinding
-- Description: Optimize The Chain pathfinding with indexes and bidirectional BFS
-- =============================================================================

-- STEP 1: Add indexes for faster player_appearances lookups
CREATE INDEX IF NOT EXISTS idx_player_appearances_player_club
ON player_appearances(player_id, club_id);

CREATE INDEX IF NOT EXISTS idx_player_appearances_club_player
ON player_appearances(club_id, player_id);

-- STEP 2: Replace with optimized bidirectional BFS with stricter limits
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

  -- Forward search (from start)
  fwd_visited TEXT[] := ARRAY[start_qid];
  fwd_frontier TEXT[] := ARRAY[start_qid];
  fwd_parent JSONB := '{}'::JSONB;

  -- Backward search (from end)
  bwd_visited TEXT[] := ARRAY[end_qid];
  bwd_frontier TEXT[] := ARRAY[end_qid];
  bwd_parent JSONB := '{}'::JSONB;

  next_frontier TEXT[];
  neighbor TEXT;
  curr TEXT;
  result_path TEXT[];
  result_names TEXT[];
  half_depth INTEGER;
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

  -- Trivial case
  IF start_qid = end_qid THEN
    RETURN QUERY SELECT TRUE, 0, ARRAY[start_qid],
      ARRAY[(SELECT name FROM players WHERE id = start_qid)];
    RETURN;
  END IF;

  -- Check direct link first (1-step path)
  IF EXISTS (
    SELECT 1 FROM player_appearances pa_a
    JOIN player_appearances pa_b ON pa_a.club_id = pa_b.club_id
    WHERE pa_a.player_id = start_qid AND pa_b.player_id = end_qid
    AND COALESCE(pa_a.start_year, 1900) <= COALESCE(pa_b.end_year, 9999)
    AND COALESCE(pa_b.start_year, 1900) <= COALESCE(pa_a.end_year, 9999)
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

  -- Bidirectional BFS - expand smaller frontier
  WHILE current_depth < half_depth AND NOT found
    AND (array_length(fwd_frontier, 1) > 0 OR array_length(bwd_frontier, 1) > 0)
  LOOP
    current_depth := current_depth + 1;

    -- Expand forward frontier (limit neighbors to prevent explosion)
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
            AND COALESCE(pa_a.start_year, 1900) <= COALESCE(pa_b.end_year, 9999)
            AND COALESCE(pa_b.start_year, 1900) <= COALESCE(pa_a.end_year, 9999)
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

    -- Expand backward frontier
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
            AND COALESCE(pa_a.start_year, 1900) <= COALESCE(pa_b.end_year, 9999)
            AND COALESCE(pa_b.start_year, 1900) <= COALESCE(pa_a.end_year, 9999)
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

  -- Reconstruct path if found
  IF found AND meeting_point IS NOT NULL THEN
    -- Build forward path (start -> meeting_point)
    result_path := ARRAY[meeting_point];
    curr := meeting_point;
    WHILE fwd_parent ? curr LOOP
      curr := fwd_parent->>curr;
      result_path := array_prepend(curr, result_path);
    END LOOP;

    -- Build backward path (meeting_point -> end)
    curr := meeting_point;
    WHILE bwd_parent ? curr LOOP
      curr := bwd_parent->>curr;
      result_path := array_append(result_path, curr);
    END LOOP;

    -- Get names
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
