-- Migration: Scoring System Overhaul
--
-- This migration:
-- 1. Transforms Transfer Guess hints: Year becomes hint[0], replacing shirt number
-- 2. Deletes existing Top Tens attempts (scoring changed from 30-point to 8-point scale)
--
-- Date: 2026-01-26

-- =============================================================================
-- TRANSFER GUESS: Transform hints array
-- =============================================================================
-- Old structure: hints = [shirt_number, position, nation]
-- New structure: hints = [year, position, nation]
--
-- The year field already exists in content.year, so we copy it to hints[0]
-- Position and Nation remain in hints[1] and hints[2]

UPDATE daily_puzzles
SET content = jsonb_set(
  content,
  '{hints}',
  jsonb_build_array(
    (content->>'year')::text,           -- Year becomes hints[0]
    content->'hints'->1,                -- Position stays as hints[1]
    content->'hints'->2                 -- Nation stays as hints[2]
  )
)
WHERE game_mode = 'guess_the_transfer'
  AND content->'hints' IS NOT NULL
  AND jsonb_array_length(content->'hints') = 3;

-- =============================================================================
-- TOP TENS: Delete existing attempts
-- =============================================================================
-- Scoring system changed from 30-point cumulative to 8-point flat tier.
-- Clean slate approach since app just launched with minimal users.

DELETE FROM puzzle_attempts
WHERE puzzle_id IN (
  SELECT id FROM daily_puzzles WHERE game_mode = 'top_tens'
);

-- =============================================================================
-- VERIFICATION QUERIES (for manual checking after migration)
-- =============================================================================
--
-- Check Transfer Guess hints transformed correctly:
-- SELECT id, puzzle_date, content->'hints' as hints, content->>'year' as year
-- FROM daily_puzzles
-- WHERE game_mode = 'guess_the_transfer'
-- LIMIT 5;
--
-- Count remaining Top Tens attempts (should be 0):
-- SELECT COUNT(*) FROM puzzle_attempts
-- WHERE puzzle_id IN (SELECT id FROM daily_puzzles WHERE game_mode = 'top_tens');
