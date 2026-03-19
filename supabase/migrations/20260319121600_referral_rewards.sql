-- Referral rewards system
-- Adds tables and RPCs for referral tracking, rewards, and extended free windows.

-- ============================================================
-- 1. referral_codes — one code per user
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_user_unique UNIQUE (user_id)
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own code
CREATE POLICY "Users can read own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. referrals — tracks who referred whom
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT referrals_referred_unique UNIQUE (referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can read referrals where they are the referrer
CREATE POLICY "Referrers can read own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Referred users can read their own referral record
CREATE POLICY "Referred users can read own referral"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_user_id);

-- ============================================================
-- 3. RPC: generate_referral_code
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_existing text;
BEGIN
  -- Check caller matches
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Return existing code if present
  SELECT code INTO v_existing FROM referral_codes WHERE user_id = p_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Generate a short alphanumeric code (8 chars)
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- Code collision, retry
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- ============================================================
-- 4. RPC: attribute_referral
-- ============================================================
CREATE OR REPLACE FUNCTION public.attribute_referral(p_code text, p_new_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Look up the referrer from the code
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = upper(trim(p_code));

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;

  -- Don't allow self-referral
  IF v_referrer_id = p_new_user_id THEN
    RETURN;
  END IF;

  -- Insert referral (ignore if already attributed)
  INSERT INTO referrals (referrer_user_id, referred_user_id, code, status)
  VALUES (v_referrer_id, p_new_user_id, upper(trim(p_code)), 'pending')
  ON CONFLICT (referred_user_id) DO NOTHING;
END;
$$;

-- ============================================================
-- 5. RPC: complete_referral — called when referred user finishes first game
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_referral(p_referred_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the referred user themselves can trigger this
  IF auth.uid() IS DISTINCT FROM p_referred_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE referrals
  SET status = 'completed', completed_at = now()
  WHERE referred_user_id = p_referred_user_id
    AND status = 'pending';
END;
$$;

-- ============================================================
-- 6. RPC: get_referral_stats — returns referral counts for a user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_completed int;
  v_unclaimed int;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT count(*) INTO v_total
  FROM referrals WHERE referrer_user_id = p_user_id;

  SELECT count(*) INTO v_completed
  FROM referrals WHERE referrer_user_id = p_user_id AND status = 'completed';

  SELECT count(*) INTO v_unclaimed
  FROM referrals WHERE referrer_user_id = p_user_id AND status = 'completed' AND reward_claimed = false;

  RETURN json_build_object(
    'total_referrals', v_total,
    'completed_referrals', v_completed,
    'unclaimed_rewards', v_unclaimed,
    'archive_unlocks_available', v_unclaimed * 3
  );
END;
$$;

-- ============================================================
-- 7. RPC: claim_referral_rewards — marks completed referrals as claimed
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_referral_rewards(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed int;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE referrals
  SET reward_claimed = true
  WHERE referrer_user_id = p_user_id
    AND status = 'completed'
    AND reward_claimed = false;

  GET DIAGNOSTICS v_claimed = ROW_COUNT;

  -- Return number of referrals claimed (each worth 3 archive unlocks)
  RETURN v_claimed * 3;
END;
$$;

-- ============================================================
-- 8. RPC: check_referred_status — check if current user was referred
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_referred_status(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_user_id = p_user_id
  LIMIT 1;

  IF v_referral.id IS NULL THEN
    RETURN json_build_object('is_referred', false, 'extended_window_days', 3);
  END IF;

  RETURN json_build_object(
    'is_referred', true,
    'extended_window_days', 7,
    'referred_at', v_referral.created_at
  );
END;
$$;
