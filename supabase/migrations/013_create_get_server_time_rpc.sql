-- Migration: Create get_server_time RPC
-- Purpose: Provide authoritative server time for client-side clock validation
-- Used by the time integrity system to detect clock manipulation

-- Create the RPC function
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NOW();
$$;

-- Grant execute permissions to both authenticated and anonymous users
-- Anonymous users need this to validate time before signing in
GRANT EXECUTE ON FUNCTION get_server_time() TO authenticated;
GRANT EXECUTE ON FUNCTION get_server_time() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION get_server_time() IS
  'Returns the current server timestamp for client-side clock validation. Used by the time integrity system to prevent clock manipulation.';
