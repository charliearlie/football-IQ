-- Migration: 033_special_events
-- Purpose: Add "Special Event" support to daily_puzzles
-- Date: 2026-02-09
--
-- Allows admins to designate puzzles as "Specials" that appear via
-- a dedicated Event Banner on the Home Screen instead of in the
-- standard daily feed. Includes CMS-configurable banner fields.

-- ============================================================================
-- STEP 1: Add is_special flag
-- ============================================================================

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 2: Add CMS-configurable event banner fields
-- ============================================================================
-- These fields are only used when is_special = TRUE.
-- They control the appearance of the Event Banner on the mobile Home Screen.

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS event_title TEXT;

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS event_subtitle TEXT;

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS event_tag TEXT DEFAULT 'LIMITED TIME';

ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS event_theme TEXT DEFAULT 'gold';

-- ============================================================================
-- STEP 3: Backfill existing puzzles
-- ============================================================================

UPDATE daily_puzzles
SET is_special = FALSE
WHERE is_special IS NULL;

-- ============================================================================
-- STEP 4: Update unique constraint
-- ============================================================================
-- The existing partial unique index (puzzle_date, game_mode) prevents having
-- both a Regular and a Special puzzle of the same mode on the same day.
-- We need to include is_special in the uniqueness check.
--
-- This allows:
--   (2026-02-15, career_path, FALSE)  -- Regular daily puzzle
--   (2026-02-15, career_path, TRUE)   -- Special event puzzle
-- But still prevents:
--   Two regular career_path puzzles on 2026-02-15
--   Two special career_path puzzles on 2026-02-15

-- Drop the partial index for scheduled puzzles
DROP INDEX IF EXISTS idx_daily_puzzles_scheduled_unique;

CREATE UNIQUE INDEX idx_daily_puzzles_scheduled_unique
  ON daily_puzzles (puzzle_date, game_mode, is_special)
  WHERE puzzle_date IS NOT NULL;

-- Drop the table-level unique constraint (blocks specials with same mode+date)
ALTER TABLE daily_puzzles
  DROP CONSTRAINT IF EXISTS daily_puzzles_game_mode_puzzle_date_key;

ALTER TABLE daily_puzzles
  ADD CONSTRAINT daily_puzzles_game_mode_puzzle_date_special_key
  UNIQUE (game_mode, puzzle_date, is_special);

-- ============================================================================
-- STEP 5: Add check constraint for event fields
-- ============================================================================
-- Ensure event_title is provided when is_special is true

ALTER TABLE daily_puzzles
  ADD CONSTRAINT chk_special_event_title
  CHECK (is_special = FALSE OR event_title IS NOT NULL);

-- ============================================================================
-- STEP 6: Add documentation comments
-- ============================================================================

COMMENT ON COLUMN daily_puzzles.is_special IS
  'Whether this puzzle is a Special Event, shown via EventBanner instead of the daily feed.';

COMMENT ON COLUMN daily_puzzles.event_title IS
  'Banner title for Special Event puzzles (e.g., "DERBY DAY SPECIAL"). Required when is_special = TRUE.';

COMMENT ON COLUMN daily_puzzles.event_subtitle IS
  'Banner subtitle for Special Event puzzles (e.g., "Double XP - Ends Tonight"). Optional.';

COMMENT ON COLUMN daily_puzzles.event_tag IS
  'Banner tag badge text (e.g., "LIMITED TIME"). Defaults to "LIMITED TIME".';

COMMENT ON COLUMN daily_puzzles.event_theme IS
  'Banner color theme: gold, red, or blue. Defaults to gold.';

COMMENT ON INDEX idx_daily_puzzles_scheduled_unique IS
  'Ensures uniqueness per (date, game_mode, is_special) for scheduled puzzles. Allows 1 regular + 1 special of same mode per day.';
