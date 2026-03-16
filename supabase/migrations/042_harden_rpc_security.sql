-- =============================================================================
-- Migration: harden_rpc_security
-- Purpose: Lock down RPC functions, fix RLS policies, set search_path
-- Context: Content scraping detected from DigitalOcean server (204.48.77.164)
--          calling SECURITY DEFINER RPCs with the extractable anon key.
--          Also fixes daily_puzzles RLS discrepancy (7 days -> 3 days).
-- =============================================================================

-- STEP 1: Revoke anon + PUBLIC access to content-serving RPCs
-- (authenticated, service_role, postgres retain their explicit grants)
REVOKE EXECUTE ON FUNCTION get_puzzle_by_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION get_puzzle_by_id(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION get_puzzle_catalog(timestamp with time zone) FROM anon;
REVOKE EXECUTE ON FUNCTION get_puzzle_catalog(timestamp with time zone) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION get_elite_index_delta(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION get_elite_index_delta(integer) FROM PUBLIC;

-- STEP 2: Restrict get_user_list to service_role only (admin function)
REVOKE EXECUTE ON FUNCTION get_user_list(text, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION get_user_list(text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_user_list(text, text, integer, integer) FROM authenticated;

-- STEP 3: Fix daily_puzzles RLS — 3-day window (today + 2 previous), not 7
DROP POLICY IF EXISTS "Premium puzzle access" ON daily_puzzles;
CREATE POLICY "Premium puzzle access" ON daily_puzzles
  FOR SELECT USING (
    status = 'live' AND (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_premium = true)
      OR puzzle_date >= (CURRENT_DATE - INTERVAL '2 days')
    )
  );

-- STEP 4: Enable RLS on player_links (was completely unprotected)
ALTER TABLE player_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read player_links" ON player_links
  FOR SELECT USING (true);

-- STEP 5: Fix content_reports INSERT policy — require authentication
DROP POLICY IF EXISTS "Anyone can create reports" ON content_reports;
CREATE POLICY "Authenticated users can create reports" ON content_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- STEP 6: Set search_path on functions that are missing it
-- (get_puzzle_by_id and get_elite_index_delta already have it)
ALTER FUNCTION get_puzzle_catalog(timestamp with time zone) SET search_path = public;
ALTER FUNCTION get_user_list(text, text, integer, integer) SET search_path = public;
ALTER FUNCTION get_server_time() SET search_path = public;
ALTER FUNCTION count_distinct_users_played() SET search_path = public;
ALTER FUNCTION count_active_users_7d() SET search_path = public;
ALTER FUNCTION count_no_career_players() SET search_path = public;
ALTER FUNCTION get_no_career_players(integer, integer) SET search_path = public;
ALTER FUNCTION match_club_by_name(text, text) SET search_path = public;
ALTER FUNCTION update_content_reports_updated_at() SET search_path = public;
ALTER FUNCTION update_player_links_on_appearance_change() SET search_path = public;
ALTER FUNCTION get_canonical_club_id(text) SET search_path = public;
