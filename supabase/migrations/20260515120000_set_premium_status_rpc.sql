-- Migration: Create set_premium_status RPC
--
-- upgrade_to_premium (044) and downgrade_from_premium only act on auth.uid(),
-- so they can't be used by a server-side webhook that has no authenticated
-- user. The RevenueCat -> Supabase webhook needs to flip is_premium for an
-- arbitrary user identified by their RevenueCat App User ID (= the Supabase
-- auth uid).
--
-- A direct UPDATE from the service-role client is not enough: the
-- protect_profile_privileged_fields trigger silently reverts is_premium
-- unless the app.bypass_profile_protection flag is set. So this mirrors the
-- bypass-flag pattern of 044, but takes the target user id as a parameter and
-- is granted to service_role only.

CREATE OR REPLACE FUNCTION set_premium_status(p_user_id uuid, p_premium boolean)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set bypass flag (transaction-local, cleared automatically)
  PERFORM set_config('app.bypass_profile_protection', 'true', true);

  IF p_premium THEN
    UPDATE profiles
    SET
      is_premium = true,
      premium_purchased_at = COALESCE(premium_purchased_at, NOW())
    WHERE id = p_user_id;
  ELSE
    -- Preserve premium_purchased_at on revoke (analytics / win-back),
    -- consistent with downgrade_from_premium.
    UPDATE profiles
    SET is_premium = false
    WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT * FROM profiles WHERE id = p_user_id;
END;
$$;

-- Webhook-only: callable solely by the service role, never by clients.
REVOKE ALL ON FUNCTION set_premium_status(uuid, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION set_premium_status(uuid, boolean) TO service_role;
