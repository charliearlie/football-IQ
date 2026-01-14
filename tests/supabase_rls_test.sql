-- =============================================================================
-- Football IQ - Supabase RLS Policy Tests
-- =============================================================================
-- These tests verify Row Level Security policies work correctly.
-- Run these tests using Supabase SQL Editor or psql.
--
-- Test Setup:
-- 1. Create test users (anon, authenticated non-premium, premium)
-- 2. Insert test puzzles with various dates
-- 3. Assert RLS policies block/allow as expected
-- =============================================================================

-- Clean up any existing test data
DELETE FROM puzzle_attempts WHERE puzzle_id IN (
  SELECT id FROM daily_puzzles WHERE game_mode LIKE 'test_%'
);
DELETE FROM user_streaks WHERE game_mode LIKE 'test_%';
DELETE FROM daily_puzzles WHERE game_mode LIKE 'test_%';

-- =============================================================================
-- TEST DATA SETUP
-- =============================================================================

-- Insert test puzzles at various dates (bypass RLS for admin insert)
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, status) VALUES
  ('test_mode', CURRENT_DATE, '{"question": "Today puzzle"}', 'live'),
  ('test_mode', CURRENT_DATE - INTERVAL '1 day', '{"question": "Yesterday puzzle"}', 'live'),
  ('test_mode', CURRENT_DATE - INTERVAL '6 days', '{"question": "6 days ago puzzle"}', 'live'),
  ('test_mode', CURRENT_DATE - INTERVAL '7 days', '{"question": "7 days ago puzzle"}', 'live'),
  ('test_mode', CURRENT_DATE - INTERVAL '10 days', '{"question": "10 days ago puzzle"}', 'live'),
  ('test_mode', CURRENT_DATE - INTERVAL '30 days', '{"question": "30 days ago puzzle"}', 'live');

-- =============================================================================
-- TEST 1: Anonymous user can only see TODAY's puzzle
-- =============================================================================
-- To test: Run as anon role (no auth.uid())
-- Expected: Only 1 row (today's puzzle)

DO $$
DECLARE
  puzzle_count INTEGER;
BEGIN
  -- Simulate anon context by setting auth.uid() to NULL
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT COUNT(*) INTO puzzle_count
  FROM daily_puzzles
  WHERE game_mode = 'test_mode';

  -- Anon should only see today's puzzle
  IF puzzle_count != 1 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Anon user should see 1 puzzle (today), got %', puzzle_count;
  END IF;

  RAISE NOTICE 'TEST 1 PASSED: Anon user sees only today''s puzzle';
END $$;

-- =============================================================================
-- TEST 2: Authenticated non-premium user sees 7-day window
-- =============================================================================
-- To test: Create a test user, authenticate, verify 7-day window
-- Window = today + 6 previous days (7 days total)
-- Expected: Puzzles from today to 6 days ago (3 puzzles in our test data)
-- Note: 7 days ago is OUTSIDE the window and should be locked

-- Note: For a complete test, you would:
-- 1. Create a user via auth.users
-- 2. Set their JWT claim
-- 3. Query and count results

-- SQL assertion for manual testing:
-- When authenticated as non-premium user, this should return 3 rows
-- SELECT COUNT(*) FROM daily_puzzles WHERE game_mode = 'test_mode';
-- Expected: 3 (today, yesterday, 6 days) - 7 days ago is locked

-- =============================================================================
-- TEST 3: Premium user sees full archive
-- =============================================================================
-- To test: Set user's is_premium = true, verify all puzzles visible
-- Expected: All 6 test puzzles visible

-- SQL assertion for manual testing:
-- When authenticated as premium user, this should return 6 rows
-- SELECT COUNT(*) FROM daily_puzzles WHERE game_mode = 'test_mode';
-- Expected: 6 (all puzzles)

-- =============================================================================
-- TEST 4: User A cannot UPDATE User B's profile
-- =============================================================================
-- Verify profile isolation: users can only update their own profile

-- This test would be run as authenticated user A:
-- UPDATE profiles SET display_name = 'Hacked' WHERE id = '<user_b_id>';
-- Expected: 0 rows affected (RLS blocks the update)

-- =============================================================================
-- TEST 5: User A cannot read User B's puzzle_attempts
-- =============================================================================
-- Verify attempt isolation: users can only see their own attempts

-- This test would be run as authenticated user A:
-- SELECT * FROM puzzle_attempts WHERE user_id = '<user_b_id>';
-- Expected: 0 rows (RLS blocks access to other user's data)

-- =============================================================================
-- TEST 6: User A cannot read User B's user_streaks
-- =============================================================================
-- Verify streak isolation: users can only see their own streaks

-- This test would be run as authenticated user A:
-- SELECT * FROM user_streaks WHERE user_id = '<user_b_id>';
-- Expected: 0 rows (RLS blocks access to other user's data)

-- =============================================================================
-- CLEANUP (optional - run after testing)
-- =============================================================================
-- DELETE FROM daily_puzzles WHERE game_mode LIKE 'test_%';

-- =============================================================================
-- TEST 7: Anonymous user CAN INSERT puzzle attempts
-- =============================================================================
-- Test that anonymous users can insert attempts for distribution graph
-- Expected: Insert succeeds

DO $$
DECLARE
  v_test_puzzle_id UUID;
BEGIN
  -- Simulate anonymous context
  PERFORM set_config('request.jwt.claim.sub', '', true);

  -- Get a test puzzle ID
  SELECT id INTO STRICT v_test_puzzle_id
  FROM daily_puzzles
  WHERE game_mode = 'test_mode'
  LIMIT 1;

  -- Attempt anonymous insert
  INSERT INTO puzzle_attempts (id, user_id, puzzle_id, completed, score)
  VALUES (gen_random_uuid(), gen_random_uuid(), v_test_puzzle_id, true, 80);

  -- Should succeed (no exception thrown)
  RAISE NOTICE 'TEST 7 PASSED: Anonymous user can insert attempts';

  -- Cleanup
  DELETE FROM puzzle_attempts WHERE puzzle_id = v_test_puzzle_id;
END $$;

-- =============================================================================
-- TEST 8: Anonymous user CANNOT READ others' attempts
-- =============================================================================
-- Test that anonymous users cannot see other users' data
-- Expected: SELECT returns empty (RLS blocks)

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Simulate anonymous context
  PERFORM set_config('request.jwt.claim.sub', '', true);

  SELECT COUNT(*) INTO v_count FROM puzzle_attempts;

  IF v_count != 0 THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Anonymous should see 0 attempts, got %', v_count;
  END IF;

  RAISE NOTICE 'TEST 8 PASSED: Anonymous cannot read others attempts';
END $$;

-- =============================================================================
-- TEST 9: Authenticated user cannot insert with different user_id
-- =============================================================================
-- Test that authenticated users can only insert with their own user_id
-- Expected: Insert fails (RLS blocks)

DO $$
DECLARE
  v_test_puzzle_id UUID;
BEGIN
  -- Simulate authenticated user
  PERFORM set_config('request.jwt.claim.sub', 'user-123', true);

  -- Get a test puzzle ID
  SELECT id INTO STRICT v_test_puzzle_id
  FROM daily_puzzles
  WHERE game_mode = 'test_mode'
  LIMIT 1;

  -- Attempt insert with different user_id (should fail)
  BEGIN
    INSERT INTO puzzle_attempts (id, user_id, puzzle_id, completed)
    VALUES (gen_random_uuid(), 'different-user', v_test_puzzle_id, true);

    -- Should not reach here
    RAISE EXCEPTION 'TEST 9 FAILED: Should have been blocked by RLS';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'TEST 9 PASSED: Authenticated user cannot insert for others';
    WHEN check_violation THEN
      RAISE NOTICE 'TEST 9 PASSED: Authenticated user cannot insert for others';
  END;

  -- Reset context
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- RLS Policy Tests:
-- 1. daily_puzzles: 3-tier access
--    - anon: today only
--    - auth (non-premium): today + 6 previous days (7 days total)
--    - premium: full archive
-- 2. profiles: read all, update own only
-- 3. puzzle_attempts: owner-only access (UPDATED: anonymous can INSERT)
-- 4. user_streaks: owner-only access
-- 5. agent_runs: no RLS (admin table)
-- 6. match_data: no RLS (admin table)
--
-- IMPORTANT: The RLS policy must use: puzzle_date >= CURRENT_DATE - INTERVAL '6 days'
-- This creates a 7-day window (today counts as day 1).
--
-- NEW (2026-01-14): Anonymous users can INSERT puzzle_attempts for distribution graphs
-- =============================================================================
