-- Migration: 009_fix_career_path_distribution
-- Description: Fix Career Path score calculation to handle legacy data
--
-- Problem: Old Career Path attempts don't have 'points' and 'maxPoints' in metadata.
-- They only have 'revealedCount', 'totalSteps', and 'won'.
-- This migration updates the RPC to calculate points from those fields as a fallback.
--
-- Formula: points = totalSteps - (revealedCount - 1) when won, 0 when lost
-- Normalized: (points / totalSteps) * 100

-- =============================================================================
-- Function: get_puzzle_score_distribution (updated)
-- =============================================================================
-- Now handles Career Path legacy data by calculating from revealedCount/totalSteps

CREATE OR REPLACE FUNCTION get_puzzle_score_distribution(
  target_puzzle_id UUID
)
RETURNS TABLE (
  score INTEGER,
  count BIGINT,
  percentage NUMERIC,
  total_attempts BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_mode TEXT;
  v_total BIGINT;
BEGIN
  -- Get the game mode for this puzzle
  SELECT dp.game_mode INTO v_game_mode
  FROM daily_puzzles dp
  WHERE dp.id = target_puzzle_id;

  -- If puzzle not found, return empty
  IF v_game_mode IS NULL THEN
    RETURN;
  END IF;

  -- Count total completed attempts for this puzzle
  SELECT COUNT(*) INTO v_total
  FROM puzzle_attempts pa
  WHERE pa.puzzle_id = target_puzzle_id
    AND pa.completed = true;

  -- If no attempts, return empty
  IF v_total = 0 THEN
    RETURN;
  END IF;

  -- Return distribution based on game mode
  -- Scores are normalized to 0-100 scale and grouped
  RETURN QUERY
  WITH normalized_scores AS (
    SELECT
      CASE v_game_mode
        -- Career Path: (points / maxPoints) * 100
        -- Fallback: calculate from revealedCount/totalSteps for legacy data
        WHEN 'career_path' THEN
          CASE
            -- New format: has points and maxPoints
            WHEN COALESCE((pa.metadata->>'maxPoints')::numeric, 0) > 0
            THEN ROUND(((pa.metadata->>'points')::numeric / (pa.metadata->>'maxPoints')::numeric) * 100)
            -- Legacy format: calculate from revealedCount and totalSteps
            WHEN COALESCE((pa.metadata->>'totalSteps')::numeric, 0) > 0
            THEN
              CASE
                WHEN (pa.metadata->>'won')::boolean = true
                THEN ROUND((
                  ((pa.metadata->>'totalSteps')::numeric - ((pa.metadata->>'revealedCount')::numeric - 1))
                  / (pa.metadata->>'totalSteps')::numeric
                ) * 100)
                ELSE 0  -- Lost = 0 points
              END
            ELSE 0
          END
        -- Top Tens: score field * 10 (0-10 -> 0-100)
        WHEN 'top_tens' THEN
          COALESCE(pa.score, 0) * 10
        -- Transfer Guess: metadata.points * 10 (0-10 -> 0-100)
        WHEN 'guess_the_transfer' THEN
          COALESCE((pa.metadata->>'points')::numeric, 0) * 10
        -- Topical Quiz: metadata.points * 10 (0-10 -> 0-100)
        WHEN 'topical_quiz' THEN
          COALESCE((pa.metadata->>'points')::numeric, 0) * 10
        -- Goalscorer Recall: (points / totalScorers) * 100
        WHEN 'guess_the_goalscorers' THEN
          CASE
            WHEN COALESCE((pa.metadata->>'totalScorers')::numeric, 0) > 0
            THEN ROUND(((pa.metadata->>'points')::numeric / (pa.metadata->>'totalScorers')::numeric) * 100)
            ELSE COALESCE((pa.metadata->>'percentage')::numeric, 0)
          END
        -- The Grid: score field (already 0-100)
        WHEN 'the_grid' THEN
          COALESCE(pa.score, 0)
        -- Tic Tac Toe (legacy): win=100, draw=50, loss=0
        WHEN 'tic_tac_toe' THEN
          CASE pa.metadata->>'result'
            WHEN 'win' THEN 100
            WHEN 'draw' THEN 50
            ELSE 0
          END
        ELSE 0
      END::INTEGER AS normalized_score
    FROM puzzle_attempts pa
    WHERE pa.puzzle_id = target_puzzle_id
      AND pa.completed = true
  ),
  score_counts AS (
    SELECT
      ns.normalized_score AS score,
      COUNT(*)::BIGINT AS count
    FROM normalized_scores ns
    GROUP BY ns.normalized_score
  )
  SELECT
    sc.score,
    sc.count,
    ROUND((sc.count::numeric / v_total) * 100, 1) AS percentage,
    v_total AS total_attempts
  FROM score_counts sc
  ORDER BY sc.score DESC;
END;
$$;

-- Grant execute permission to all users (distribution is public data)
GRANT EXECUTE ON FUNCTION get_puzzle_score_distribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_puzzle_score_distribution(UUID) TO anon;
