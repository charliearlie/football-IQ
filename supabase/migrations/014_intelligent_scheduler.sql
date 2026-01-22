-- Migration: 014_intelligent_scheduler
-- Purpose: Enable backlog puzzles (null puzzle_date) and add is_premium tracking
-- Date: 2026-01-22

-- ============================================================================
-- STEP 1: Make puzzle_date nullable to support backlog puzzles
-- ============================================================================
-- Backlog puzzles are content prepared in advance but not yet scheduled
-- They have puzzle_date = NULL until assigned to a specific date

ALTER TABLE daily_puzzles
  ALTER COLUMN puzzle_date DROP NOT NULL;

-- ============================================================================
-- STEP 2: Add is_premium column for schedule-aware premium tracking
-- ============================================================================
-- Some game modes have different premium status based on day of week
-- e.g., topical_quiz is Free on Friday but Premium on Tuesday
-- This column stores the resolved premium status when puzzle is scheduled

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- ============================================================================
-- STEP 3: Backfill is_premium for existing puzzles
-- ============================================================================
-- Set is_premium based on game_mode for existing data
-- Note: This is a simple backfill - doesn't account for day-specific rules
-- because we don't have schedule history for existing puzzles

UPDATE daily_puzzles
SET is_premium = (game_mode IN ('career_path_pro', 'top_tens'))
WHERE is_premium IS NULL OR is_premium = false;

-- ============================================================================
-- STEP 4: Create partial unique index for scheduled puzzles
-- ============================================================================
-- The old composite unique constraint (puzzle_date, game_mode) would prevent
-- multiple backlog puzzles of the same mode. We need to:
-- 1. Drop the existing constraint (if it exists as an index)
-- 2. Create a partial unique index that only applies when puzzle_date IS NOT NULL
-- This allows multiple backlog puzzles while preserving uniqueness for scheduled ones

-- Drop existing unique constraint/index if present
DROP INDEX IF EXISTS daily_puzzles_puzzle_date_game_mode_key;
DROP INDEX IF EXISTS idx_daily_puzzles_date_mode;

-- Create partial unique index for scheduled puzzles only
CREATE UNIQUE INDEX idx_daily_puzzles_scheduled_unique
  ON daily_puzzles (puzzle_date, game_mode)
  WHERE puzzle_date IS NOT NULL;

-- ============================================================================
-- STEP 5: Create index for efficient backlog queries
-- ============================================================================
-- Index to quickly fetch all backlog puzzles grouped by game_mode

CREATE INDEX idx_daily_puzzles_backlog
  ON daily_puzzles (game_mode, created_at DESC)
  WHERE puzzle_date IS NULL;

-- ============================================================================
-- STEP 6: Add documentation comments
-- ============================================================================

COMMENT ON COLUMN daily_puzzles.puzzle_date IS
  'Scheduled date for the puzzle. NULL indicates a backlog puzzle not yet scheduled.';

COMMENT ON COLUMN daily_puzzles.is_premium IS
  'Whether this puzzle is premium-only content. Set based on schedule rules when initialized or assigned.';

COMMENT ON INDEX idx_daily_puzzles_scheduled_unique IS
  'Ensures only one puzzle per (date, game_mode) for scheduled puzzles. Allows multiple backlog puzzles.';

COMMENT ON INDEX idx_daily_puzzles_backlog IS
  'Efficient lookup of backlog puzzles (puzzle_date IS NULL) grouped by game_mode.';
