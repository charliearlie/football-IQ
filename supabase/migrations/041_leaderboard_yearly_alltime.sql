-- Migration: 041_leaderboard_yearly_alltime
-- Description: Add all-time and yearly leaderboard RPCs for Tier 3 leaderboard features
--
-- Functions added / replaced:
-- 1. get_alltime_leaderboard  - Rank users by total_iq (profiles.total_iq)
-- 2. get_yearly_leaderboard   - Rank users by sum of scores within a calendar year
-- 3. get_user_rank (updated)  - Extend with 'alltime', 'yearly', and 'global' (alias) branches
--
-- Index added:
-- idx_puzzle_attempts_yearly  - Partial index for yearly leaderboard aggregation

-- =============================================================================
-- Function: get_alltime_leaderboard
-- =============================================================================
-- Returns top users ranked by their cumulative total_iq stored on the profiles
-- table. total_iq is auto-incremented by a trigger on puzzle_attempts inserts
-- (added in migration 018), so no aggregation across puzzle_attempts is needed
-- here — one cheap index scan on profiles is sufficient.
--
-- Tie-breaking: earlier account creation wins (then id for determinism).
-- Uses DENSE_RANK so tied users share a rank (1, 1, 2 not 1, 1, 3).

CREATE OR REPLACE FUNCTION get_alltime_leaderboard(
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank        BIGINT,
  user_id     UUID,
  display_name TEXT,
  avatar_url  TEXT,
  total_iq    INTEGER,
  total_games BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_game_counts AS (
    -- Count every completed attempt per user once, regardless of score value.
    SELECT
      pa.user_id AS uid,
      COUNT(*)::BIGINT AS game_count
    FROM puzzle_attempts pa
    WHERE pa.completed = true
    GROUP BY pa.user_id
  )
  SELECT
    DENSE_RANK() OVER (
      ORDER BY p.total_iq DESC, p.created_at ASC, p.id
    )::BIGINT AS rank,
    p.id                                          AS user_id,
    COALESCE(p.display_name, 'Anonymous')::TEXT   AS display_name,
    p.avatar_url::TEXT,
    p.total_iq,
    COALESCE(ugc.game_count, 0)::BIGINT           AS total_games
  FROM profiles p
  LEFT JOIN user_game_counts ugc ON ugc.uid = p.id
  WHERE p.total_iq > 0
  ORDER BY rank, p.id
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to all roles (matches pattern from migration 006)
GRANT EXECUTE ON FUNCTION get_alltime_leaderboard(INTEGER) TO authenticated, anon;

-- =============================================================================
-- Function: get_yearly_leaderboard
-- =============================================================================
-- Returns top users ranked by the sum of their puzzle_attempts.score values
-- within a specific calendar year. Only completed attempts with a positive
-- score are included, matching the partial index added below.
--
-- Tie-breaking: earliest last_completed_at wins (then uid for determinism).
-- Uses DENSE_RANK so tied users share a rank.

CREATE OR REPLACE FUNCTION get_yearly_leaderboard(
  for_year    INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank             BIGINT,
  user_id          UUID,
  display_name     TEXT,
  avatar_url       TEXT,
  yearly_score     BIGINT,
  games_played     BIGINT,
  last_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH yearly_attempts AS (
    -- Aggregate per-user score totals for the requested calendar year.
    SELECT
      pa.user_id                                    AS uid,
      SUM(COALESCE(pa.score, 0))::BIGINT            AS yearly_score,
      COUNT(*)::BIGINT                              AS games_played,
      MAX(pa.completed_at)                          AS last_completed_at
    FROM puzzle_attempts pa
    WHERE pa.completed = true
      AND pa.score IS NOT NULL
      AND pa.score > 0
      AND EXTRACT(YEAR FROM pa.completed_at) = for_year
    GROUP BY pa.user_id
  )
  SELECT
    DENSE_RANK() OVER (
      ORDER BY ya.yearly_score DESC, ya.last_completed_at ASC, ya.uid
    )::BIGINT AS rank,
    ya.uid                                          AS user_id,
    COALESCE(p.display_name, 'Anonymous')::TEXT     AS display_name,
    p.avatar_url::TEXT,
    ya.yearly_score,
    ya.games_played,
    ya.last_completed_at
  FROM yearly_attempts ya
  LEFT JOIN profiles p ON ya.uid = p.id
  ORDER BY rank, ya.uid
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION get_yearly_leaderboard(INTEGER, INTEGER) TO authenticated, anon;

-- =============================================================================
-- Function: get_user_rank (extended)
-- =============================================================================
-- Returns a specific user's rank, score, and the total number of ranked users
-- for the requested leaderboard type.
--
-- Supported leaderboard_type values:
--   'daily'   - daily normalized score (0-500) for for_date
--   'global'  - legacy alias for 'alltime' (backwards-compatible)
--   'alltime' - cumulative total_iq from profiles
--   'yearly'  - sum of scores in EXTRACT(YEAR FROM for_date)
--
-- The 'daily' branch is preserved exactly as it was in migration 006.
-- The ELSE branch now maps to 'alltime' instead of 'global' so that both
-- the old 'global' call sites and new 'alltime' callers get the same data.

CREATE OR REPLACE FUNCTION get_user_rank(
  target_user_id UUID,
  leaderboard_type TEXT DEFAULT 'daily',
  for_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  rank        BIGINT,
  score       INTEGER,
  total_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ------------------------------------------------------------------
  -- Branch: daily
  -- Delegates to get_daily_leaderboard — unchanged from migration 006.
  -- ------------------------------------------------------------------
  IF leaderboard_type = 'daily' THEN
    RETURN QUERY
    WITH ranked AS (
      SELECT * FROM get_daily_leaderboard(for_date, 10000)
    )
    SELECT
      r.rank,
      r.daily_score                              AS score,
      (SELECT COUNT(*) FROM ranked)::BIGINT      AS total_users
    FROM ranked r
    WHERE r.user_id = target_user_id;

  -- ------------------------------------------------------------------
  -- Branch: alltime (and 'global' as a legacy alias)
  -- Ranks the user by total_iq across all time.
  -- ------------------------------------------------------------------
  ELSIF leaderboard_type IN ('alltime', 'global') THEN
    RETURN QUERY
    WITH ranked AS (
      SELECT * FROM get_alltime_leaderboard(1000000)
    )
    SELECT
      r.rank,
      r.total_iq                                 AS score,
      (SELECT COUNT(*) FROM ranked)::BIGINT      AS total_users
    FROM ranked r
    WHERE r.user_id = target_user_id;

  -- ------------------------------------------------------------------
  -- Branch: yearly
  -- Ranks the user by score sum within the year of for_date.
  -- ------------------------------------------------------------------
  ELSIF leaderboard_type = 'yearly' THEN
    RETURN QUERY
    WITH ranked AS (
      SELECT * FROM get_yearly_leaderboard(
        EXTRACT(YEAR FROM for_date)::INTEGER,
        1000000
      )
    )
    SELECT
      r.rank,
      r.yearly_score::INTEGER                    AS score,
      (SELECT COUNT(*) FROM ranked)::BIGINT      AS total_users
    FROM ranked r
    WHERE r.user_id = target_user_id;

  END IF;
END;
$$;

-- Grants already exist from migration 006, but re-stating them is idempotent
-- and makes intent explicit if this migration is applied in isolation.
GRANT EXECUTE ON FUNCTION get_user_rank(UUID, TEXT, DATE) TO authenticated, anon;

-- =============================================================================
-- Performance Index
-- =============================================================================
-- Partial index covering the yearly leaderboard aggregation query.
-- Only rows where completed = true AND score > 0 are indexed, matching the
-- WHERE clause used in get_yearly_leaderboard's CTE exactly.
-- This also benefits any future queries that filter on the same predicates.

CREATE INDEX IF NOT EXISTS idx_puzzle_attempts_yearly
ON puzzle_attempts (user_id, score, completed_at)
WHERE completed = true AND score > 0;
