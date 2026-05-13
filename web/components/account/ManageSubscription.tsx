"use client";

import { useEffect, useState } from "react";
import { ensureRevenueCat, getCurrentCustomerInfo } from "@/lib/billing/revenuecat";
import { isRevenueCatConfigured } from "@/lib/billing/config";
import { createClient } from "@/lib/supabase/client";

interface ManageSubscriptionProps {
  /**
   * Whether the Supabase profile says this user is premium. When true and the
   * RC SDK is unconfigured (no env key on this deploy), we still show a help
   * pointer instead of a dead "manage" link.
   */
  isPremium: boolean;
}

interface State {
  ready: boolean;
  managementURL: string | null;
  fromMobile: boolean;
}

/**
 * Resolves the RC customer portal URL for the signed-in user and renders the
 * appropriate "Manage subscription" affordance. RC returns `managementURL` per
 * store — for Stripe-backed Web Billing it links to Stripe's customer portal;
 * for an App Store-backed user it returns Apple's settings deep link.
 *
 * Edge cases handled:
 *   - User is premium but bought on mobile → show iOS/Android pointer rather
 *     than a Stripe portal link that wouldn't apply.
 *   - RC isn't configured on this deploy → defer to the mobile app.
 *   - User isn't premium → render nothing (handled by parent's conditional).
 */
export function ManageSubscription({ isPremium }: ManageSubscriptionProps) {
  const [state, setState] = useState<State>({
    ready: false,
    managementURL: null,
    fromMobile: false,
  });

  useEffect(() => {
    if (!isPremium) {
      setState({ ready: true, managementURL: null, fromMobile: false });
      return;
    }
    if (!isRevenueCatConfigured()) {
      setState({ ready: true, managementURL: null, fromMobile: true });
      return;
    }

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user || user.is_anonymous) {
        setState({ ready: true, managementURL: null, fromMobile: false });
        return;
      }

      await ensureRevenueCat(user.id);
      const info = await getCurrentCustomerInfo();
      if (cancelled) return;

      // RC's managementURL is store-specific. For App Store users it points to
      // Apple's subscriptions page (itms-apps://...). We only render that
      // pattern as "mobile" so users don't try to manage Stripe via Apple.
      const url = info?.managementURL ?? null;
      const fromMobile = url?.startsWith("itms-apps") || url?.includes("play.google.com") || false;
      setState({ ready: true, managementURL: url, fromMobile });
    })();

    return () => {
      cancelled = true;
    };
  }, [isPremium]);

  if (!isPremium || !state.ready) return null;

  if (state.fromMobile) {
    return (
      <p className="text-xs text-slate-500">
        You subscribed in the mobile app. Manage billing in your iOS or Android
        device settings.
      </p>
    );
  }

  if (state.managementURL) {
    return (
      <a
        href={state.managementURL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs font-semibold text-pitch-green hover:text-pitch-green/80 transition-colors"
      >
        Manage subscription →
      </a>
    );
  }

  // Premium per Supabase mirror, but RC hasn't surfaced a portal URL yet. This
  // happens briefly right after a purchase before customer info refreshes.
  return (
    <p className="text-xs text-slate-500">
      Subscription details loading. Refresh if it doesn&apos;t appear shortly.
    </p>
  );
}
