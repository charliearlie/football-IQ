-- Migration: Create upgrade_to_premium RPC
--
-- The protect_profile_privileged_fields trigger (from restrict_profile_updates)
-- silently reverts is_premium on every client-side UPDATE. This meant
-- syncPremiumToSupabase was a no-op — it wrote true, the trigger reverted it.
--
-- Fix: Add a bypass flag to the trigger and create a SECURITY DEFINER RPC
-- that sets the flag before updating. This is the only client-safe way to
-- grant premium status.

-- Update trigger to support bypass flag from trusted functions
CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow bypass from trusted SECURITY DEFINER functions
  IF current_setting('app.bypass_profile_protection', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Silently revert privileged fields to their current (OLD) values.
  NEW.is_premium := OLD.is_premium;
  NEW.is_admin := OLD.is_admin;
  NEW.is_readonly := OLD.is_readonly;
  NEW.total_iq := OLD.total_iq;
  NEW.premium_purchased_at := OLD.premium_purchased_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RPC: upgrade the calling user to premium.
-- SECURITY DEFINER so it runs as the function owner (postgres),
-- which can set the bypass flag. Only sets premium=true for auth.uid().
CREATE OR REPLACE FUNCTION upgrade_to_premium()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set bypass flag (transaction-local, cleared automatically)
  PERFORM set_config('app.bypass_profile_protection', 'true', true);

  UPDATE profiles
  SET
    is_premium = true,
    premium_purchased_at = NOW()
  WHERE id = auth.uid();

  RETURN QUERY SELECT * FROM profiles WHERE id = auth.uid();
END;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION upgrade_to_premium() FROM anon;
GRANT EXECUTE ON FUNCTION upgrade_to_premium() TO authenticated;
