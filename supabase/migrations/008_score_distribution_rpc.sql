-- Migration: 008_score_distribution_rpc
-- Description: Create RPC function for per-puzzle score distribution
--
-- Function: get_puzzle_score_distribution
-- Returns the distribution of normalized scores (0-100) for a specific puzzle
-- Used by the "How You Compare" feature in result modals

-- =============================================================================
-- Function: get_puzzle_score_distribution
-- =============================================================================
-- Returns score distribution for a specific puzzle, normalized to 0-100 scale
-- All game modes are normalized to allow consistent display:
-- - Career Path: (points / maxPoints) * 100
-- - Top Tens: score * 10 (0-10 -> 0-100)
-- - Transfer Guess: points * 10 (0-10 -> 0-100)
-- - Topical Quiz: points * 10 (0-10 -> 0-100)
-- - Goalscorer Recall: percentage (already 0-100)
-- - The Grid: score (already 0-100)

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
        WHEN 'career_path' THEN
          CASE
            WHEN COALESCE((pa.metadata->>'maxPoints')::numeric, 0) > 0
            THEN ROUND(((pa.metadata->>'points')::numeric / (pa.metadata->>'maxPoints')::numeric) * 100)
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
        -- Goalscorer Recall: metadata.percentage (already 0-100)
        WHEN 'guess_the_goalscorers' THEN
          COALESCE((pa.metadata->>'percentage')::numeric, 0)
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

-- =============================================================================
-- Performance Index
-- =============================================================================
-- Optimize distribution queries by puzzle_id

CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_distribution
ON puzzle_attempts (puzzle_id, completed)
WHERE completed = true;
