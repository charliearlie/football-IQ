"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureRevenueCat,
  getCurrentCustomerInfo,
  hasActiveEntitlement,
} from "@/lib/billing/revenuecat";
import { isRevenueCatConfigured } from "@/lib/billing/config";

export interface PremiumState {
  /** True once we know the answer (RC or Supabase fallback). */
  ready: boolean;
  /** Whether the current user has the Football IQ Pro entitlement. */
  isPremium: boolean;
  /** Source of truth used to derive isPremium. */
  source: "rc" | "supabase" | "fallback";
}

const INITIAL: PremiumState = {
  ready: false,
  isPremium: false,
  source: "fallback",
};

/**
 * Resolves premium status from RevenueCat when configured, falling back to
 * the Supabase `profiles.is_premium` mirror for cases where RC hasn't
 * loaded yet (slow connection, ad-blocker, no key in env).
 */
export function usePremium(): PremiumState {
  const [state, setState] = useState<PremiumState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function resolve() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user || user.is_anonymous) {
        setState({ ready: true, isPremium: false, source: "fallback" });
        return;
      }

      if (isRevenueCatConfigured()) {
        try {
          await ensureRevenueCat(user.id);
          const info = await getCurrentCustomerInfo();
          if (cancelled) return;
          if (info) {
            setState({
              ready: true,
              isPremium: hasActiveEntitlement(info),
              source: "rc",
            });
            return;
          }
        } catch {
          // fall through to Supabase mirror
        }
      }

      const { data: profile } = (await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle()) as { data: { is_premium: boolean | null } | null };

      if (cancelled) return;
      setState({
        ready: true,
        isPremium: Boolean(profile?.is_premium),
        source: "supabase",
      });
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
