"use client";

/**
 * Initialises RevenueCat Web Billing once the page mounts and keeps the
 * RC App User ID in sync with the Supabase auth state.
 *
 * Mounted in `app/layout.tsx`. Renders nothing. When
 * `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY` is unset (dev/CI), every operation is
 * a no-op so this never crashes preview deploys without billing wired up.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureRevenueCat } from "@/lib/billing/revenuecat";
import { isRevenueCatConfigured } from "@/lib/billing/config";

export function RevenueCatProvider() {
  useEffect(() => {
    if (!isRevenueCatConfigured()) return;

    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      const appUserId =
        user && !user.is_anonymous ? user.id : null;
      await ensureRevenueCat(appUserId);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user;
        const appUserId = user && !user.is_anonymous ? user.id : null;
        await ensureRevenueCat(appUserId);
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
