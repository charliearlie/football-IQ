"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import type { Package } from "@revenuecat/purchases-js";
import { useOffering } from "@/lib/billing/useOffering";
import { usePurchaseFlow } from "@/lib/billing/usePurchaseFlow";
import { useAuthUser } from "@/lib/auth/useAuthUser";

interface PaywallProps {
  /** Where to send the user after sign-in / cancel. Defaults to the current path. */
  redirectPath?: string;
  /** Analytics source label, e.g. "career_path_pro_page", "archive_unlock". */
  source: string;
  /** Optional headline override. */
  headline?: string;
  /** Optional subheadline override. */
  subheadline?: string;
  /** Called once the purchase confirms — the parent typically reloads game state. */
  onSuccess?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Full-page paywall. Used both as a modal-style overlay and as a route gate
 * (Career Path Pro renders this in place of the game when locked).
 *
 * Anonymous-first behaviour: anyone can subscribe — signed in or not. For
 * anonymous users we require an email up front so the post-purchase magic
 * link can claim the subscription onto a real account (cross-device).
 *
 * Signed-in non-anonymous users skip the email field; their Supabase ID is
 * the RC App User ID directly.
 */
export function Paywall({
  redirectPath,
  source,
  headline,
  subheadline,
  onSuccess,
}: PaywallProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const { user, ready: userReady } = useAuthUser();
  const offering = useOffering();
  const purchase = usePurchaseFlow();
  const [email, setEmail] = useState("");

  const isSignedIn = Boolean(user) && !user?.is_anonymous;
  const isLoading = !userReady || !offering.ready;
  const emailValid = EMAIL_PATTERN.test(email.trim());
  // Signed-in users don't need the field; everyone else must fill it in.
  const canPurchase = isSignedIn || emailValid;

  useEffect(() => {
    posthog?.capture("paywall_viewed", { source, signed_in: isSignedIn });
  }, [posthog, source, isSignedIn]);

  useEffect(() => {
    if (purchase.state.status === "success") {
      // Refresh server state so signed-in users see the premium pill etc.
      // Anonymous users keep the post-purchase claim panel visible until they
      // navigate away.
      router.refresh();
      if (isSignedIn) {
        onSuccess?.();
      }
    }
  }, [purchase.state.status, router, onSuccess, isSignedIn]);

  const handleBuy = (pkg: Package | null) => {
    if (!pkg) return;
    void purchase.buy(pkg, source, isSignedIn ? undefined : email.trim());
  };

  // ------------------------------------------------------------------
  // POST-PURCHASE SUCCESS STATE (anonymous claim path)
  // ------------------------------------------------------------------
  if (purchase.state.status === "success" && !isSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-green">
            Subscription active
          </p>
          <h1 className="font-bebas text-3xl tracking-wider text-floodlight">
            You&apos;re all set
          </h1>
        </header>
        <p className="text-sm text-slate-300">
          Premium is live on this browser — refresh the page or jump back to{" "}
          <Link href="/play" className="text-pitch-green underline">
            today&apos;s puzzles
          </Link>
          .
        </p>
        {purchase.state.claimEmailSent && purchase.state.claimEmail ? (
          <div className="rounded-xl border border-pitch-green/20 bg-pitch-green/[0.04] p-4 text-left space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-pitch-green">
              Save your subscription
            </p>
            <p className="text-sm text-slate-300">
              We&apos;ve emailed{" "}
              <span className="font-semibold text-floodlight">
                {purchase.state.claimEmail}
              </span>{" "}
              a one-tap link. Click it from any device to access Pro
              everywhere you sign in.
            </p>
          </div>
        ) : (
          <p className="text-xs text-warning-orange">
            We couldn&apos;t send the claim email automatically. You can request
            one from{" "}
            <Link href="/account/sign-in" className="underline">
              the sign-in page
            </Link>{" "}
            using the same email.
          </p>
        )}
        <p className="text-xs text-slate-600">
          Stripe has also emailed you a receipt with billing details.
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // DEFAULT (PRE-PURCHASE) STATE
  // ------------------------------------------------------------------
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-green">
          Football IQ Pro
        </p>
        <h1 className="font-bebas text-4xl tracking-wider text-floodlight">
          {headline ?? "Unlock the full Football IQ experience"}
        </h1>
        <p className="text-sm text-slate-400">
          {subheadline ??
            "Career Path Pro, the full puzzle archive, and zero ads — across web and mobile."}
        </p>
      </header>

      <ul className="text-left space-y-2 text-sm text-slate-300">
        <li className="flex gap-2">
          <span className="text-pitch-green">✓</span>
          <span>Career Path Pro — every day, no limits</span>
        </li>
        <li className="flex gap-2">
          <span className="text-pitch-green">✓</span>
          <span>Full archive: replay any past puzzle</span>
        </li>
        <li className="flex gap-2">
          <span className="text-pitch-green">✓</span>
          <span>Ad-free everywhere — web, iOS, Android</span>
        </li>
        <li className="flex gap-2">
          <span className="text-pitch-green">✓</span>
          <span>Cancel anytime from your account page</span>
        </li>
      </ul>

      {isLoading && (
        <p className="text-sm text-slate-500">Loading subscription options…</p>
      )}

      {!isLoading && !offering.offering && (
        <p className="text-sm text-warning-orange">
          Subscriptions aren&apos;t available in this environment yet. Try the
          mobile app — your premium status carries over.
        </p>
      )}

      {!isLoading && offering.offering && (
        <div className="space-y-3 text-left">
          {!isSignedIn && (
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your email
              </span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-floodlight placeholder:text-slate-600 focus:outline-none focus:border-pitch-green/60"
                aria-label="Email address"
                disabled={purchase.state.status === "checkout"}
              />
              <span className="block text-[11px] text-slate-500 leading-snug">
                Required. We&apos;ll email a link to access your subscription on
                other devices.
              </span>
            </label>
          )}

          <PaywallButton
            pkg={offering.annual}
            label="Yearly"
            badge="Best value"
            isPending={purchase.state.pendingPackageId === offering.annual?.identifier}
            disabled={!canPurchase || purchase.state.status === "checkout"}
            onClick={() => handleBuy(offering.annual)}
            featured
          />
          <PaywallButton
            pkg={offering.monthly}
            label="Monthly"
            isPending={purchase.state.pendingPackageId === offering.monthly?.identifier}
            disabled={!canPurchase || purchase.state.status === "checkout"}
            onClick={() => handleBuy(offering.monthly)}
          />
          {purchase.state.error && (
            <p className="text-xs text-warning-orange text-center">
              {purchase.state.error}
            </p>
          )}
          {redirectPath && !isSignedIn && (
            <p className="text-[11px] text-slate-500 text-center pt-1">
              Already paid?{" "}
              <Link
                href={`/account/sign-in?next=${encodeURIComponent(redirectPath)}`}
                className="underline hover:text-slate-300"
              >
                Sign in
              </Link>{" "}
              to restore.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-600">
        Subscriptions renew automatically. Cancel anytime in your{" "}
        <Link href="/account" className="underline">
          account
        </Link>
        .
      </p>
    </div>
  );
}

interface PaywallButtonProps {
  pkg: Package | null;
  label: string;
  badge?: string;
  isPending: boolean;
  disabled: boolean;
  onClick: () => void;
  featured?: boolean;
}

function PaywallButton({
  pkg,
  label,
  badge,
  isPending,
  disabled,
  onClick,
  featured,
}: PaywallButtonProps) {
  if (!pkg) return null;

  const formatted = formatPrice(pkg);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        featured
          ? "w-full bg-pitch-green text-stadium-navy font-bold py-4 px-6 rounded-xl hover:bg-pitch-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
          : "w-full border border-white/15 text-floodlight font-semibold py-4 px-6 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
      }
    >
      <span className="flex items-center gap-2">
        {label}
        {badge && (
          <span
            className={
              featured
                ? "text-[10px] uppercase tracking-wider bg-stadium-navy text-pitch-green px-2 py-0.5 rounded-full"
                : "text-[10px] uppercase tracking-wider bg-pitch-green/20 text-pitch-green px-2 py-0.5 rounded-full"
            }
          >
            {badge}
          </span>
        )}
      </span>
      <span>{isPending ? "Opening checkout…" : formatted}</span>
    </button>
  );
}

function formatPrice(pkg: Package): string {
  return pkg.webBillingProduct?.currentPrice?.formattedPrice ?? "Subscribe";
}
