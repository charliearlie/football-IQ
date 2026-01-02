-- Migration: 006_create_leaderboard_rpcs
-- Description: Create RPC functions for leaderboard functionality
--
-- Functions:
-- 1. get_daily_leaderboard - Get top users by daily score (normalized 0-500)
-- 2. get_global_iq_leaderboard - Get top users by global IQ (weighted average)
-- 3. get_user_rank - Get a specific user's rank on either leaderboard

-- =============================================================================
-- Function: get_daily_leaderboard
-- =============================================================================
-- Returns top users ranked by their normalized daily score (0-500 max)
-- Each game mode is normalized to 0-100 and summed
-- Tie-breaking: earlier completion time wins
-- Uses DENSE_RANK for ties (1, 1, 2 not 1, 1, 3)

CREATE OR REPLACE FUNCTION get_daily_leaderboard(
  for_date DATE DEFAULT CURRENT_DATE,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  daily_score INTEGER,
  games_played INTEGER,
  last_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH today_puzzles AS (
    -- Get all puzzles for the specified date
    SELECT dp.id, dp.game_mode
    FROM daily_puzzles dp
    WHERE dp.puzzle_date = for_date
      AND dp.status = 'live'
  ),
  user_scores AS (
    SELECT
      pa.user_id,
      COUNT(DISTINCT pa.puzzle_id)::INTEGER AS games_played,
      -- Normalize each game mode to 0-100, then sum (max 500)
      SUM(
        CASE tp.game_mode
          WHEN 'career_path' THEN
            CASE
              WHEN COALESCE((pa.metadata->>'maxPoints')::numeric, 0) > 0
              THEN ROUND(((pa.metadata->>'points')::numeric / (pa.metadata->>'maxPoints')::numeric) * 100)
              ELSE 0
            END
          WHEN 'guess_the_transfer' THEN
            ROUND(COALESCE((pa.metadata->>'points')::numeric, 0) / 10 * 100)
          WHEN 'guess_the_goalscorers' THEN
            ROUND(COALESCE((pa.metadata->>'percentage')::numeric, 0))
          WHEN 'tic_tac_toe' THEN
            CASE pa.metadata->>'result'
              WHEN 'win' THEN 100
              WHEN 'draw' THEN 50
              ELSE 0
            END
          WHEN 'topical_quiz' THEN
            ROUND(COALESCE((pa.metadata->>'points')::numeric, 0) / 10 * 100)
          ELSE 0
        END
      )::INTEGER AS daily_score,
      MAX(pa.completed_at) AS last_completed_at
    FROM puzzle_attempts pa
    JOIN today_puzzles tp ON pa.puzzle_id = tp.id
    WHERE pa.completed = true
      AND pa.user_id IS NOT NULL
    GROUP BY pa.user_id
  )
  SELECT
    DENSE_RANK() OVER (
      ORDER BY us.daily_score DESC, us.last_completed_at ASC, us.user_id
    )::BIGINT AS rank,
    us.user_id,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    p.avatar_url,
    us.daily_score,
    us.games_played,
    us.last_completed_at
  FROM user_scores us
  LEFT JOIN profiles p ON us.user_id = p.id
  ORDER BY rank, us.user_id
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_daily_leaderboard(DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_leaderboard(DATE, INTEGER) TO anon;

-- =============================================================================
-- Function: get_global_iq_leaderboard
-- =============================================================================
-- Returns top users ranked by global IQ (weighted average 0-100)
-- Weights: career_path=25%, transfer=25%, goalscorers=20%, tictactoe=15%, quiz=15%
-- Uses same weighting logic as client-side iqCalculation.ts
-- Weight redistribution: if user hasn't played a mode, weight redistributed to played modes

CREATE OR REPLACE FUNCTION get_global_iq_leaderboard(
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  global_iq INTEGER,
  total_games INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_game_stats AS (
    -- Calculate average normalized score per game mode per user
    SELECT
      pa.user_id,
      dp.game_mode,
      COUNT(*)::INTEGER AS games_in_mode,
      AVG(
        CASE dp.game_mode
          WHEN 'career_path' THEN
            CASE
              WHEN COALESCE((pa.metadata->>'maxPoints')::numeric, 0) > 0
              THEN ((pa.metadata->>'points')::numeric / (pa.metadata->>'maxPoints')::numeric) * 100
              ELSE 0
            END
          WHEN 'guess_the_transfer' THEN
            COALESCE((pa.metadata->>'points')::numeric, 0) / 10 * 100
          WHEN 'guess_the_goalscorers' THEN
            COALESCE((pa.metadata->>'percentage')::numeric, 0)
          WHEN 'tic_tac_toe' THEN
            CASE pa.metadata->>'result'
              WHEN 'win' THEN 100
              WHEN 'draw' THEN 50
              ELSE 0
            END
          WHEN 'topical_quiz' THEN
            COALESCE((pa.metadata->>'points')::numeric, 0) / 10 * 100
          ELSE 0
        END
      ) AS avg_score
    FROM puzzle_attempts pa
    JOIN daily_puzzles dp ON pa.puzzle_id = dp.id
    WHERE pa.completed = true
      AND pa.user_id IS NOT NULL
    GROUP BY pa.user_id, dp.game_mode
  ),
  user_iq AS (
    SELECT
      ugs.user_id,
      SUM(ugs.games_in_mode)::INTEGER AS total_games,
      -- Weighted IQ with redistribution for unplayed modes
      -- Sum(avg_score * weight) / Sum(weight for played modes)
      ROUND(
        SUM(
          ugs.avg_score *
          CASE ugs.game_mode
            WHEN 'career_path' THEN 0.25
            WHEN 'guess_the_transfer' THEN 0.25
            WHEN 'guess_the_goalscorers' THEN 0.20
            WHEN 'tic_tac_toe' THEN 0.15
            WHEN 'topical_quiz' THEN 0.15
            ELSE 0
          END
        ) /
        NULLIF(
          SUM(
            CASE ugs.game_mode
              WHEN 'career_path' THEN 0.25
              WHEN 'guess_the_transfer' THEN 0.25
              WHEN 'guess_the_goalscorers' THEN 0.20
              WHEN 'tic_tac_toe' THEN 0.15
              WHEN 'topical_quiz' THEN 0.15
              ELSE 0
            END
          ), 0
        )
      )::INTEGER AS global_iq
    FROM user_game_stats ugs
    GROUP BY ugs.user_id
  )
  SELECT
    DENSE_RANK() OVER (
      ORDER BY ui.global_iq DESC, ui.total_games DESC, ui.user_id
    )::BIGINT AS rank,
    ui.user_id,
    COALESCE(p.display_name, 'Anonymous') AS display_name,
    p.avatar_url,
    ui.global_iq,
    ui.total_games
  FROM user_iq ui
  LEFT JOIN profiles p ON ui.user_id = p.id
  WHERE ui.global_iq IS NOT NULL
  ORDER BY rank, ui.user_id
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_global_iq_leaderboard(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_iq_leaderboard(INTEGER) TO anon;

-- =============================================================================
-- Function: get_user_rank
-- =============================================================================
-- Returns a specific user's rank on either leaderboard
-- Used for the "sticky Me bar" when user is outside top 100

CREATE OR REPLACE FUNCTION get_user_rank(
  target_user_id UUID,
  leaderboard_type TEXT DEFAULT 'daily',
  for_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  rank BIGINT,
  score INTEGER,
  total_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF leaderboard_type = 'daily' THEN
    RETURN QUERY
    WITH ranked AS (
      SELECT * FROM get_daily_leaderboard(for_date, 10000)
    )
    SELECT
      r.rank,
      r.daily_score AS score,
      (SELECT COUNT(*) FROM ranked)::BIGINT AS total_users
    FROM ranked r
    WHERE r.user_id = target_user_id;
  ELSE
    RETURN QUERY
    WITH ranked AS (
      SELECT * FROM get_global_iq_leaderboard(10000)
    )
    SELECT
      r.rank,
      r.global_iq AS score,
      (SELECT COUNT(*) FROM ranked)::BIGINT AS total_users
    FROM ranked r
    WHERE r.user_id = target_user_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_rank(UUID, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank(UUID, TEXT, DATE) TO anon;

-- =============================================================================
-- Performance Indexes (optional but recommended)
-- =============================================================================
-- These indexes can improve leaderboard query performance

-- Index for daily leaderboard queries
CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_leaderboard
ON puzzle_attempts (puzzle_id, completed, user_id)
WHERE completed = true;

-- Index for puzzle date lookup
CREATE INDEX IF NOT EXISTS idx_daily_puzzles_date_status
ON daily_puzzles (puzzle_date, status)
WHERE status = 'live';
