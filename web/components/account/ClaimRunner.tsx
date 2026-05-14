"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { createClient } from "@/lib/supabase/client";
import { ensureRevenueCat, hasActiveEntitlement } from "@/lib/billing/revenuecat";
import { upgradeToPremium } from "@/lib/billing/upgradeToPremium";
import { isRevenueCatConfigured } from "@/lib/billing/config";
import { PURCHASE_CLAIM_STORAGE_KEY } from "@/lib/billing/usePurchaseFlow";

type ClaimStatus = "running" | "success" | "error";

interface ClaimRunnerProps {
  /** Anonymous RC App User ID from the magic-link query string. May be null
   * if the link was opened on a device that doesn't have one — we'll fall
   * back to localStorage. */
  anonRcId: string | null;
  /** The Supabase user ID to migrate the entitlement onto. */
  userId: string;
}

/**
 * Runs the explicit anon → authed merge sequence on RC and flips the
 * Supabase mirror. Lives on /account/claim. The order matters:
 *   1. Identify RC with the anonymous ID (Purchases.configure or changeUser).
 *   2. Call changeUser(supabaseUserId) — RC creates an alias because the
 *      current ID is anonymous, merging entitlements onto the new ID.
 *   3. Confirm the entitlement is active on the resulting CustomerInfo.
 *   4. Run the upgrade_to_premium RPC so server components see is_premium.
 */
export function ClaimRunner({ anonRcId, userId }: ClaimRunnerProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const [status, setStatus] = useState<ClaimStatus>("running");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (!isRevenueCatConfigured()) {
          setStatus("error");
          setErrorMessage("Billing isn't configured for this environment.");
          return;
        }

        const fallbackAnon = readStoredAnonId();
        const sourceAnonId = anonRcId ?? fallbackAnon;

        // Identify with the anonymous ID first so RC's changeUser creates an
        // alias rather than a plain identity switch. If no anon ID is
        // available, skip the alias step — RC will simply identify as the
        // Supabase user (in which case there's nothing to merge anyway).
        if (sourceAnonId) {
          await ensureRevenueCat(sourceAnonId);
        }

        const purchases = await ensureRevenueCat(userId);
        if (cancelled || !purchases) return;

        const info = await purchases.getCustomerInfo();
        if (cancelled) return;

        const supabase = createClient();

        if (hasActiveEntitlement(info)) {
          const sync = await upgradeToPremium(
            supabase as unknown as Parameters<typeof upgradeToPremium>[0],
          );
          if (!sync.ok) {
            posthog?.capture("premium_sync_failed", {
              source: "claim",
              error: sync.error,
            });
          }
          posthog?.capture("subscription_claimed", {
            source: anonRcId ? "magic_link" : "localStorage_fallback",
          });
          clearStoredAnonId();
          if (cancelled) return;
          setStatus("success");
          // Small delay so the success state is visible before the redirect.
          setTimeout(() => {
            if (!cancelled) router.replace("/account?claimed=1");
          }, 600);
        } else {
          // No active entitlement on this user — likely the magic link was
          // clicked on a different browser than the original purchase and
          // we don't have the anonymous RC ID. Surface a clear next step.
          posthog?.capture("subscription_claim_failed", {
            had_anon_id: Boolean(sourceAnonId),
            reason: "no_entitlement",
          });
          setStatus("error");
          setErrorMessage(
            sourceAnonId
              ? "We couldn't find an active subscription tied to that purchase. Contact support and we'll sort it."
              : "We need the link from the device you bought on. Open the email there and click again, or contact support.",
          );
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Claim failed.";
        setStatus("error");
        setErrorMessage(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [anonRcId, userId, router, posthog]);

  if (status === "running") {
    return (
      <p className="text-sm text-slate-400" role="status">
        Linking your purchase to this account…
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="text-sm text-pitch-green" role="status">
        Done. Sending you to your account…
      </p>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <p className="text-sm text-warning-orange" role="alert">
        {errorMessage ?? "Something went wrong claiming your subscription."}
      </p>
      <div className="flex flex-col gap-2 text-sm">
        <Link
          href="/account"
          className="text-pitch-green hover:underline text-center"
        >
          Go to my account
        </Link>
        <a
          href="mailto:support@football-iq.app"
          className="text-slate-400 hover:text-floodlight text-center text-xs"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

interface StoredClaim {
  email: string;
  anonRcId: string;
}

function readStoredAnonId(): string | null {
  try {
    const raw = window.localStorage.getItem(PURCHASE_CLAIM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredClaim>;
    return parsed.anonRcId ?? null;
  } catch {
    return null;
  }
}

function clearStoredAnonId(): void {
  try {
    window.localStorage.removeItem(PURCHASE_CLAIM_STORAGE_KEY);
  } catch {
    // ignore
  }
}
