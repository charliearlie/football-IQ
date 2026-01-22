-- Migration: 015_bonus_puzzles
-- Purpose: Add is_bonus flag for ad-hoc/bonus puzzle support
-- Date: 2026-01-22

-- ============================================================================
-- STEP 1: Add is_bonus column
-- ============================================================================
-- Bonus puzzles are extra content beyond the scheduled requirements.
-- They do not count toward daily coverage/requirements, allowing content
-- creators to add extra puzzles without disrupting the schedule.

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN DEFAULT false;

-- ============================================================================
-- STEP 2: Backfill existing puzzles as non-bonus
-- ============================================================================

UPDATE daily_puzzles
SET is_bonus = false
WHERE is_bonus IS NULL;

-- ============================================================================
-- STEP 3: Add column comment for documentation
-- ============================================================================

COMMENT ON COLUMN daily_puzzles.is_bonus IS
  'Whether this is a bonus puzzle that does not count toward daily schedule requirements. Bonus puzzles are extra content beyond the mandatory schedule.';
