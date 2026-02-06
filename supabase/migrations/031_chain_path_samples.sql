-- =============================================================================
-- Migration: 031_chain_path_samples
-- Description: RPC to find multiple sample paths and depth counts for The Chain
-- Date: 2026-02-05
-- =============================================================================

-- Function to find multiple sample paths between two players
-- Returns optimal length, sample paths, and depth counts
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

  -- BFS variables
  current_depth INTEGER := 0;
  max_depth INTEGER := 6;
  visited_players TEXT[];
  current_frontier TEXT[];
  next_frontier TEXT[];
  parent_map JSONB;

  -- Path reconstruction
  curr TEXT;
  neighbor TEXT;
  found_count INTEGER := 0;
  result_path TEXT[];
  result_names TEXT[];
  path_obj JSONB;

  -- Depth counting
  depth_player_count INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  -- Validate inputs exist
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = start_qid) THEN
    RETURN QUERY SELECT NULL::INTEGER, '[]'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM players WHERE id = end_qid) THEN
    RETURN QUERY SELECT NULL::INTEGER, '[]'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;

  -- Trivial case
  IF start_qid = end_qid THEN
    RETURN QUERY SELECT 0, '[]'::JSONB, '{}'::JSONB;
    RETURN;
  END IF;

  -- Initialize BFS
  visited_players := ARRAY[start_qid];
  current_frontier := ARRAY[start_qid];
  parent_map := '{}'::JSONB;

  -- BFS to find paths and count depths
  WHILE current_depth < max_depth AND array_length(current_frontier, 1) > 0 LOOP
    current_depth := current_depth + 1;
    next_frontier := ARRAY[]::TEXT[];

    -- Count reachable players at this depth (for depth_counts)
    SELECT COUNT(DISTINCT pa_b.player_id) INTO depth_player_count
    FROM player_appearances pa_a
    JOIN player_appearances pa_b ON pa_a.club_id = pa_b.club_id
    WHERE pa_a.player_id = ANY(current_frontier)
      AND pa_a.player_id != pa_b.player_id
      AND NOT pa_b.player_id = ANY(visited_players)
      AND pa_a.start_year IS NOT NULL
      AND pa_b.start_year IS NOT NULL
      AND pa_a.start_year <= COALESCE(pa_b.end_year, current_year)
      AND pa_b.start_year <= COALESCE(pa_a.end_year, current_year);

    depth_count_map := depth_count_map || jsonb_build_object(current_depth::TEXT, depth_player_count);

    -- Explore neighbors (randomized via subquery to avoid DISTINCT + ORDER BY conflict)
    FOR curr IN SELECT unnest(current_frontier) LOOP
      FOR neighbor IN
        SELECT player_id FROM (
          SELECT DISTINCT pa_b.player_id
          FROM player_appearances pa_a
          JOIN player_appearances pa_b ON pa_a.club_id = pa_b.club_id
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
        -- Check if we reached target
        IF neighbor = end_qid THEN
          -- Found a path!
          IF optimal_path_length IS NULL THEN
            optimal_path_length := current_depth;
          END IF;

          -- Only collect paths at optimal length
          IF current_depth = optimal_path_length AND found_count < sample_count THEN
            -- Reconstruct this path
            result_path := ARRAY[end_qid];
            parent_map := parent_map || jsonb_build_object(neighbor, curr);

            curr := end_qid;
            WHILE parent_map ? curr LOOP
              curr := parent_map->>curr;
              result_path := array_prepend(curr, result_path);
            END LOOP;

            -- Get names for path
            SELECT array_agg(p.name ORDER BY idx)
            INTO result_names
            FROM unnest(result_path) WITH ORDINALITY AS t(qid, idx)
            JOIN players p ON p.id = t.qid;

            -- Build path object
            path_obj := jsonb_build_object(
              'qids', to_jsonb(result_path),
              'names', to_jsonb(result_names)
            );

            collected_paths := collected_paths || path_obj;
            found_count := found_count + 1;

            -- Remove the last parent entry to allow different paths
            parent_map := parent_map - end_qid;
          END IF;

          -- Continue looking for more paths at this depth
          CONTINUE;
        END IF;

        -- Add to frontier if not found optimal yet or still collecting
        IF optimal_path_length IS NULL OR current_depth < optimal_path_length THEN
          next_frontier := array_append(next_frontier, neighbor);
          visited_players := array_append(visited_players, neighbor);
          parent_map := parent_map || jsonb_build_object(neighbor, curr);
        END IF;
      END LOOP;
    END LOOP;

    -- If we found optimal length and have enough samples, stop
    IF optimal_path_length IS NOT NULL AND found_count >= sample_count THEN
      EXIT;
    END IF;

    current_frontier := next_frontier;
  END LOOP;

  RETURN QUERY SELECT optimal_path_length, collected_paths, depth_count_map;
END;
$$;

COMMENT ON FUNCTION find_chain_path_samples IS
  'Find multiple sample paths between two players for The Chain puzzle. '
  'Returns optimal path length, sample paths (randomized), and depth counts. '
  'Used for CMS validation of puzzle playability.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_chain_path_samples(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_chain_path_samples(TEXT, TEXT, INTEGER) TO anon;
