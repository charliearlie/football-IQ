-- =============================================================================
-- Migration: 010_allow_anonymous_attempts
-- Description: Allow anonymous users to insert puzzle attempts for distribution graphs
--
-- Context: Users don't need to authenticate to use the app. This is a fun trivia
-- game where we only need attempt data for the "How You Compare" distribution graph.
-- Anonymous users should be able to insert their attempts to participate in the
-- global distribution statistics.
--
-- Date: 2026-01-14
-- =============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Own attempts" ON puzzle_attempts;

-- =============================================================================
-- NEW RLS POLICIES
-- =============================================================================

-- Policy 1: INSERT - Allow users to insert attempts
-- - Authenticated users: Can only insert with their own user_id
-- - Anonymous users: Can insert with any user_id (client-generated UUID)
CREATE POLICY "Insert own attempts" ON puzzle_attempts
  FOR INSERT
  WITH CHECK (
    -- Authenticated users must use their own user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Anonymous users can insert (will use client-generated UUID as user_id)
    (auth.uid() IS NULL)
  );

-- Policy 2: SELECT - Users can only read their own attempts
CREATE POLICY "Read own attempts" ON puzzle_attempts
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 3: UPDATE - Users can only update their own attempts
CREATE POLICY "Update own attempts" ON puzzle_attempts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Users can only delete their own attempts
CREATE POLICY "Delete own attempts" ON puzzle_attempts
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant necessary permissions to anonymous role
GRANT INSERT ON puzzle_attempts TO anon;
GRANT SELECT ON puzzle_attempts TO anon;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE puzzle_attempts IS
  'Stores puzzle attempts from all users (authenticated and anonymous). '
  'Anonymous users can insert attempts for distribution graphs but cannot read others attempts. '
  'Each user can only see/modify their own data. '
  'RLS enforces data isolation at the database level.';

COMMENT ON COLUMN puzzle_attempts.user_id IS
  'User ID from auth.users or client-generated UUID for anonymous users. '
  'Used for attempt ownership and RLS enforcement.';
