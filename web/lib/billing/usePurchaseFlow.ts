"use client";

import { useCallback, useState } from "react";
import type { Package } from "@revenuecat/purchases-js";
import { usePostHog } from "posthog-js/react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureRevenueCat,
  getCurrentAppUserId,
  hasActiveEntitlement,
} from "@/lib/billing/revenuecat";
import { upgradeToPremium } from "@/lib/billing/upgradeToPremium";
import { sendMagicLink } from "@/lib/auth/magic-link";

export type PurchaseStatus = "idle" | "checkout" | "success" | "error";

/** localStorage key for the post-purchase email/anon-id fallback. */
export const PURCHASE_CLAIM_STORAGE_KEY = "fiq.purchaseClaim";

export interface PurchaseFlowState {
  status: PurchaseStatus;
  /** Identifier of the package currently being purchased, for button state. */
  pendingPackageId: string | null;
  error: string | null;
  /** Whether the post-purchase magic-link email was sent successfully. */
  claimEmailSent: boolean;
  /** The email the magic link was sent to (for the success-state copy). */
  claimEmail: string | null;
}

export interface PurchaseFlowApi {
  state: PurchaseFlowState;
  /**
   * Kicks off Stripe checkout. `email` is required when the user is
   * anonymous — it's used to send the post-purchase claim magic link.
   */
  buy: (pkg: Package, source: string, email?: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: PurchaseFlowState = {
  status: "idle",
  pendingPackageId: null,
  error: null,
  claimEmailSent: false,
  claimEmail: null,
};

/**
 * Orchestrates the full web purchase flow:
 *   1. Resolve the Supabase user. Signed-in users use their Supabase ID as the
 *      RC App User ID. Anonymous users get a fresh RC anonymous ID.
 *   2. Identify RC with that ID (idempotent).
 *   3. `purchasePackage` → Stripe-hosted checkout.
 *   4. Verify entitlement is now active on the returned CustomerInfo.
 *   5. For signed-in users, flip the Supabase mirror via the `upgrade_to_premium`
 *      RPC. For anonymous purchases, send a magic link to the email so the user
 *      can claim the subscription on any device — the claim page handles the
 *      RC anon → authed merge and runs the RPC after sign-in.
 *   6. Emit PostHog `checkout_started` / `subscription_purchased`.
 */
export function usePurchaseFlow(): PurchaseFlowApi {
  const [state, setState] = useState<PurchaseFlowState>(INITIAL_STATE);
  const posthog = usePostHog();

  const buy = useCallback(
    async (pkg: Package, source: string, email?: string) => {
      setState({
        ...INITIAL_STATE,
        status: "checkout",
        pendingPackageId: pkg.identifier,
      });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const signedIn = Boolean(user) && !user?.is_anonymous;
        const trimmedEmail = email?.trim().toLowerCase() ?? "";

        // Anonymous users must give us an email so we can send the claim link.
        if (!signedIn && !trimmedEmail) {
          setState({
            ...INITIAL_STATE,
            status: "error",
            error: "Please enter your email so we can send your subscription link.",
          });
          return;
        }

        const purchases = await ensureRevenueCat(signedIn ? user!.id : null);
        if (!purchases) {
          setState({
            ...INITIAL_STATE,
            status: "error",
            error: "Billing isn't configured for this environment.",
          });
          return;
        }

        // Capture the RC App User ID *before* the purchase. For anonymous users
        // this is the freshly generated `$RCAnonymousID:…` that the claim flow
        // needs to merge entitlements onto a real account later.
        const appUserId = getCurrentAppUserId();

        posthog?.capture("checkout_started", {
          package_id: pkg.identifier,
          source,
          signed_in: signedIn,
        });

        const result = await purchases.purchasePackage(pkg);

        if (!hasActiveEntitlement(result.customerInfo)) {
          setState({
            ...INITIAL_STATE,
            status: "error",
            error: "Purchase didn't activate the Football IQ Pro entitlement. Contact support.",
          });
          return;
        }

        let claimEmailSent = false;
        let claimEmail: string | null = null;

        if (signedIn) {
          // Flip the Supabase mirror immediately.
          const sync = await upgradeToPremium(
            supabase as unknown as Parameters<typeof upgradeToPremium>[0],
          );
          if (!sync.ok) {
            posthog?.capture("premium_sync_failed", {
              package_id: pkg.identifier,
              error: sync.error,
            });
          }
        } else if (trimmedEmail && appUserId) {
          // Stash the email + anon ID locally so the user can re-send the
          // claim link from the account page if they lose the email.
          try {
            window.localStorage.setItem(
              PURCHASE_CLAIM_STORAGE_KEY,
              JSON.stringify({ email: trimmedEmail, anonRcId: appUserId }),
            );
          } catch {
            // localStorage unavailable (private browsing limit, etc.) — ignore.
          }

          const claimPath = `/account/claim?anon=${encodeURIComponent(appUserId)}`;
          const linkResult = await sendMagicLink(
            trimmedEmail,
            "post_purchase_claim",
            claimPath,
          );
          claimEmailSent = linkResult.ok;
          claimEmail = trimmedEmail;
          if (!linkResult.ok) {
            posthog?.capture("claim_email_failed", {
              package_id: pkg.identifier,
              error: linkResult.error,
            });
          }
        }

        posthog?.capture("subscription_purchased", {
          package_id: pkg.identifier,
          source,
          signed_in: signedIn,
        });

        setState({
          status: "success",
          pendingPackageId: null,
          error: null,
          claimEmailSent,
          claimEmail,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Purchase failed.";
        // RC throws when the user cancels Stripe checkout — keep it quiet.
        const cancelled = /cancel/i.test(message);
        setState({
          ...INITIAL_STATE,
          status: cancelled ? "idle" : "error",
          error: cancelled ? null : message,
        });
      }
    },
    [posthog],
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, buy, reset };
}
