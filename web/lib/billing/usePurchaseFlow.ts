"use client";

import { useCallback, useState } from "react";
import type { Package } from "@revenuecat/purchases-js";
import { usePostHog } from "posthog-js/react";
import { createClient } from "@/lib/supabase/client";
import { ensureRevenueCat, hasActiveEntitlement } from "@/lib/billing/revenuecat";
import { upgradeToPremium } from "@/lib/billing/upgradeToPremium";

export type PurchaseStatus = "idle" | "checkout" | "success" | "error";

export interface PurchaseFlowState {
  status: PurchaseStatus;
  /** Identifier of the package currently being purchased, for button state. */
  pendingPackageId: string | null;
  error: string | null;
}

export interface PurchaseFlowApi {
  state: PurchaseFlowState;
  /** Kicks off Stripe checkout and waits for the user to complete or abandon. */
  buy: (pkg: Package, source: string) => Promise<void>;
  reset: () => void;
}

/**
 * Orchestrates the full web purchase flow:
 *   1. Resolve the Supabase user (must be signed in — non-anonymous).
 *   2. Identify RC with that user id (idempotent).
 *   3. `purchasePackage` → Stripe-hosted checkout.
 *   4. Verify entitlement is now active on the returned CustomerInfo.
 *   5. Flip the Supabase mirror via the `upgrade_to_premium` RPC.
 *   6. Emit PostHog `subscription_purchased`.
 *
 * Non-anonymous sign-in is the caller's responsibility — this hook surfaces a
 * clear error if the user isn't signed in rather than dispatching purchases on
 * an RC anonymous id that we can't merge with their account later.
 */
export function usePurchaseFlow(): PurchaseFlowApi {
  const [state, setState] = useState<PurchaseFlowState>({
    status: "idle",
    pendingPackageId: null,
    error: null,
  });
  const posthog = usePostHog();

  const buy = useCallback(
    async (pkg: Package, source: string) => {
      setState({ status: "checkout", pendingPackageId: pkg.identifier, error: null });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || user.is_anonymous) {
          setState({
            status: "error",
            pendingPackageId: null,
            error: "Please sign in before subscribing — purchases are tied to your account.",
          });
          return;
        }

        const purchases = await ensureRevenueCat(user.id);
        if (!purchases) {
          setState({
            status: "error",
            pendingPackageId: null,
            error: "Billing isn't configured for this environment.",
          });
          return;
        }

        posthog?.capture("checkout_started", {
          package_id: pkg.identifier,
          source,
        });

        const result = await purchases.purchasePackage(pkg);

        if (!hasActiveEntitlement(result.customerInfo)) {
          setState({
            status: "error",
            pendingPackageId: null,
            error: "Purchase didn't activate the Football IQ Pro entitlement. Contact support.",
          });
          return;
        }

        const sync = await upgradeToPremium(
          supabase as unknown as Parameters<typeof upgradeToPremium>[0],
        );
        if (!sync.ok) {
          // Entitlement is live in RC but the Supabase mirror failed.
          // Don't block the user — RC is source of truth — but capture the
          // mismatch so we can reconcile.
          posthog?.capture("premium_sync_failed", {
            package_id: pkg.identifier,
            error: sync.error,
          });
        }

        posthog?.capture("subscription_purchased", {
          package_id: pkg.identifier,
          source,
        });

        setState({ status: "success", pendingPackageId: null, error: null });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Purchase failed.";
        // RC throws when the user cancels Stripe checkout — keep it quiet.
        const cancelled = /cancel/i.test(message);
        setState({
          status: cancelled ? "idle" : "error",
          pendingPackageId: null,
          error: cancelled ? null : message,
        });
      }
    },
    [posthog],
  );

  const reset = useCallback(() => {
    setState({ status: "idle", pendingPackageId: null, error: null });
  }, []);

  return { state, buy, reset };
}
