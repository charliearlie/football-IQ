-- =============================================================================
-- Migration: 018_total_iq_progression
-- Description: Implements the 10-tier cumulative IQ progression system.
--
-- Changes:
-- 1. Add total_iq column to profiles table
-- 2. Create index for leaderboard queries on total_iq
-- 3. Create trigger to increment total_iq on completed puzzle attempts
-- 4. Backfill existing users with their historical point totals
--
-- Tier System (0-20,000 points):
-- 1. Trialist (0-24)
-- 2. Youth Squad (25-99)
-- 3. Reserve Team (100-249)
-- 4. Impact Sub (250-499)
-- 5. Rotation Player (500-999)
-- 6. First Team Regular (1,000-1,999)
-- 7. Key Player (2,000-3,999)
-- 8. Club Legend (4,000-7,999)
-- 9. National Treasure (8,000-19,999)
-- 10. GOAT (20,000+)
--
-- Date: 2026-01-26
-- =============================================================================

-- =============================================================================
-- STEP 1: Add total_iq column to profiles
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_iq INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.total_iq IS
  'Cumulative IQ points earned from all completed puzzle attempts. '
  'Used for the 10-tier progression system (0-20,000 points). '
  'Incremented automatically via trigger on puzzle_attempts.';

-- =============================================================================
-- STEP 2: Create index for leaderboard queries
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_total_iq
  ON profiles (total_iq DESC);

-- =============================================================================
-- STEP 3: Create trigger function to increment total_iq
-- =============================================================================
-- This function is called on INSERT to puzzle_attempts.
-- It increments the user's total_iq by the attempt's score.
--
-- Logic:
-- - Only fires when completed = true AND score IS NOT NULL
-- - Adds the score to the user's total_iq in profiles
-- - Uses COALESCE to handle NULL scores gracefully
--
-- Note: The safe_upsert_attempt RPC already handles completion protection,
-- so we don't need to worry about duplicate point awards from retries.

CREATE OR REPLACE FUNCTION increment_total_iq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process completed attempts with a valid score
  IF NEW.completed = true AND NEW.score IS NOT NULL AND NEW.score > 0 THEN
    UPDATE profiles
    SET total_iq = total_iq + NEW.score,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION increment_total_iq IS
  'Trigger function to increment user total_iq when a puzzle attempt is completed. '
  'Only fires when completed=true and score>0. '
  'Part of the 10-tier IQ progression system.';

-- =============================================================================
-- STEP 4: Create trigger on puzzle_attempts
-- =============================================================================
-- We use AFTER INSERT because:
-- - The safe_upsert_attempt RPC uses ON CONFLICT ... DO UPDATE which fires INSERT
-- - Completion protection in that RPC prevents duplicate completions
-- - This ensures points are only awarded once per puzzle

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_increment_total_iq ON puzzle_attempts;

CREATE TRIGGER trigger_increment_total_iq
  AFTER INSERT ON puzzle_attempts
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_iq();

-- =============================================================================
-- STEP 5: Backfill existing users' total_iq
-- =============================================================================
-- Sum all historical completed attempt scores for each user.
-- This brings existing users up to their correct total_iq.

UPDATE profiles p
SET total_iq = COALESCE(
  (
    SELECT SUM(COALESCE(score, 0))
    FROM puzzle_attempts
    WHERE user_id = p.id
      AND completed = true
      AND score IS NOT NULL
      AND score > 0
  ),
  0
),
updated_at = NOW();

-- =============================================================================
-- VERIFICATION QUERIES (for manual checking after migration)
-- =============================================================================
--
-- Check profiles with total_iq populated:
-- SELECT id, display_name, total_iq
-- FROM profiles
-- WHERE total_iq > 0
-- ORDER BY total_iq DESC
-- LIMIT 20;
--
-- Verify backfill accuracy for a specific user:
-- SELECT
--   p.id,
--   p.display_name,
--   p.total_iq as profile_total,
--   (SELECT SUM(score) FROM puzzle_attempts WHERE user_id = p.id AND completed = true) as calculated_total
-- FROM profiles p
-- WHERE p.total_iq > 0
-- LIMIT 5;
--
-- Check trigger is attached:
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trigger_increment_total_iq';
