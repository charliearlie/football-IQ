-- =============================================================================
-- Migration: 011_fix_anonymous_insert_grants
-- Description: Fix GRANT statements to use 'authenticated' role for anonymous users
--
-- Context: Anonymous users created via signInAnonymously() use the 'authenticated'
-- role, not the 'anon' role. The previous migration granted permissions to the
-- wrong role, blocking all anonymous user INSERTs.
--
-- Date: 2026-01-14
-- =============================================================================

-- Revoke incorrect grants from anon role (cleanup)
REVOKE INSERT ON puzzle_attempts FROM anon;
REVOKE SELECT ON puzzle_attempts FROM anon;

-- Grant correct permissions to authenticated role
-- This includes both anonymous users (user.is_anonymous = true) AND
-- fully authenticated users (user.is_anonymous = false)
GRANT INSERT ON puzzle_attempts TO authenticated;
GRANT SELECT ON puzzle_attempts TO authenticated;
GRANT UPDATE ON puzzle_attempts TO authenticated;
GRANT DELETE ON puzzle_attempts TO authenticated;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE puzzle_attempts IS
  'Stores puzzle attempts from all users. '
  'Anonymous users (signInAnonymously) and authenticated users both use the ''authenticated'' role. '
  'RLS policies enforce data isolation: users can only see/modify their own attempts. '
  'The ''anon'' role (completely unauthenticated) is not used by this app.';
