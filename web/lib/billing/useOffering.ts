"use client";

import { useEffect, useState } from "react";
import type { Offering, Package } from "@revenuecat/purchases-js";
import { ensureRevenueCat } from "@/lib/billing/revenuecat";
import { isRevenueCatConfigured, WEB_OFFERING_ID } from "@/lib/billing/config";

export interface OfferingState {
  /** True once the SDK has resolved (offering may still be null). */
  ready: boolean;
  /** The web_default_offering, or null if RC is unconfigured / not found. */
  offering: Offering | null;
  /** The monthly package, if attached to the offering. */
  monthly: Package | null;
  /** The annual package, if attached to the offering. */
  annual: Package | null;
  /** True when fetch failed (network, ad-blocker, misconfigured offering). */
  error: boolean;
}

const INITIAL: OfferingState = {
  ready: false,
  offering: null,
  monthly: null,
  annual: null,
  error: false,
};

/**
 * Fetches the `web_default_offering` from RevenueCat and resolves its monthly
 * and annual packages. Returns a stable INITIAL until RC has responded.
 *
 * Skips entirely when the SDK isn't configured (no env key) — the UI should
 * fall back to an App Store / Play Store CTA in that case.
 */
export function useOffering(): OfferingState {
  const [state, setState] = useState<OfferingState>(INITIAL);

  useEffect(() => {
    if (!isRevenueCatConfigured()) {
      setState({ ...INITIAL, ready: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const purchases = await ensureRevenueCat(null);
        if (!purchases || cancelled) return;
        const offerings = await purchases.getOfferings();
        const offering = offerings.all[WEB_OFFERING_ID] ?? null;
        if (cancelled) return;
        setState({
          ready: true,
          offering,
          monthly: offering?.availablePackages.find((p) => p.identifier === "$rc_monthly") ?? null,
          annual: offering?.availablePackages.find((p) => p.identifier === "$rc_annual") ?? null,
          error: !offering,
        });
      } catch {
        if (!cancelled) setState({ ...INITIAL, ready: true, error: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
