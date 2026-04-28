-- Migration: Create downgrade_from_premium RPC
--
-- Mirrors upgrade_to_premium (044). When RevenueCat reports that a user's
-- premium entitlement has expired or been revoked, the client calls this
-- RPC to flip is_premium back to false.
--
-- Uses the same bypass-flag pattern so the protect_profile_privileged_fields
-- trigger doesn't silently revert the change.
--
-- Does NOT clear premium_purchased_at — preserves the original purchase
-- timestamp for analytics and win-back campaigns.

CREATE OR REPLACE FUNCTION downgrade_from_premium()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set bypass flag (transaction-local, cleared automatically)
  PERFORM set_config('app.bypass_profile_protection', 'true', true);

  UPDATE profiles
  SET is_premium = false
  WHERE id = auth.uid();

  RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
END;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION downgrade_from_premium() FROM anon;
GRANT EXECUTE ON FUNCTION downgrade_from_premium() TO authenticated;
