-- =============================================================================
-- Migration: claim_play_history RPC
-- Description: Re-points puzzle_attempts rows from a previous anonymous
--              auth user to the caller, so a user who plays anonymously and
--              later signs in with an email keeps their progress.
-- =============================================================================
--
-- Usage from client:
--   await supabase.rpc("claim_play_history", { p_anonymous_id: <uuid> })
--
-- Security:
--   - Caller must be authenticated (auth.uid() IS NOT NULL).
--   - Source user must be is_anonymous = true (we don't allow stealing
--     attempts from another fully-registered user even if their UUID leaked).
--   - On conflict (caller already has an attempt for that puzzle), the
--     existing authed row wins — anonymous data is treated as the lower
--     trust source.
--   - Idempotent: a second call after the first finds nothing to move.

CREATE OR REPLACE FUNCTION claim_play_history(p_anonymous_id UUID)
RETURNS TABLE (
  moved_count INT,
  skipped_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_source_is_anonymous BOOLEAN;
  v_moved INT := 0;
  v_skipped INT := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'claim_play_history requires an authenticated session';
  END IF;

  IF p_anonymous_id IS NULL OR p_anonymous_id = v_caller THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  SELECT is_anonymous INTO v_source_is_anonymous
  FROM auth.users
  WHERE id = p_anonymous_id;

  IF v_source_is_anonymous IS NULL THEN
    -- Source user no longer exists — nothing to do.
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  IF v_source_is_anonymous IS NOT TRUE THEN
    RAISE EXCEPTION 'claim_play_history only accepts anonymous source users';
  END IF;

  -- Drop anon rows for puzzles the caller already has an attempt for —
  -- the authed attempt wins.
  WITH skipped AS (
    DELETE FROM puzzle_attempts
    WHERE user_id = p_anonymous_id
      AND puzzle_id IN (
        SELECT puzzle_id FROM puzzle_attempts WHERE user_id = v_caller
      )
    RETURNING 1
  )
  SELECT count(*)::INT INTO v_skipped FROM skipped;

  -- Re-point the remaining anon rows to the caller.
  WITH moved AS (
    UPDATE puzzle_attempts
    SET user_id = v_caller, updated_at = NOW()
    WHERE user_id = p_anonymous_id
    RETURNING 1
  )
  SELECT count(*)::INT INTO v_moved FROM moved;

  RETURN QUERY SELECT v_moved, v_skipped;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_play_history(UUID) TO authenticated;

COMMENT ON FUNCTION claim_play_history IS
  'Migrates puzzle_attempts from a previous anonymous user to the caller. '
  'Anonymous source users only; the caller-owned row always wins on conflict. '
  'Returns (moved_count, skipped_count). Idempotent.';
