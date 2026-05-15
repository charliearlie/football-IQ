"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import type { Package } from "@revenuecat/purchases-js";
import { useOffering, type OfferingState } from "@/lib/billing/useOffering";
import { usePurchaseFlow } from "@/lib/billing/usePurchaseFlow";
import { useAuthUser } from "@/lib/auth/useAuthUser";

interface PaywallProps {
  /**
   * Where to send the user after sign-in / cancel. Defaults to the current path.
   */
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

/**
 * Full-page paywall surface. Used both as a modal-style overlay and as a route
 * gate (Career Path Pro renders this in place of the game when locked).
 *
 * Behaviour:
 *   - Signed-out users see "Sign in to subscribe" — purchases must attach to an
 *     account, otherwise we can't reconcile entitlement when they later log in.
 *   - Signed-in users see monthly + annual buttons with localised pricing
 *     pulled from the active RC offering. Annual highlighted as "Best value".
 *   - On purchase success, fires `onSuccess` so the orchestrator can re-render.
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

  const isSignedIn = Boolean(user) && !user?.is_anonymous;
  const isLoading = !userReady || !offering.ready;

  useEffect(() => {
    posthog?.capture("paywall_viewed", { source });
  }, [posthog, source]);

  useEffect(() => {
    if (purchase.state.status === "success") {
      router.refresh();
      onSuccess?.();
    }
  }, [purchase.state.status, router, onSuccess]);

  const handleBuy = (pkg: Package | null) => {
    if (!pkg) return;
    void purchase.buy(pkg, source);
  };

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

      {!isLoading && !isSignedIn && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Sign in to subscribe. Your premium access works on this site and the
            mobile app under the same account.
          </p>
          <Link
            href={`/account/sign-in?next=${encodeURIComponent(redirectPath ?? "/")}`}
            className="inline-block w-full bg-pitch-green text-stadium-navy font-bold py-3 px-6 rounded-xl hover:bg-pitch-green/90 transition-colors"
          >
            Sign in to subscribe
          </Link>
        </div>
      )}

      {!isLoading && isSignedIn && !offering.offering && (
        <p className="text-sm text-warning-orange">
          Subscriptions aren&apos;t available in this environment yet. Try the
          mobile app — your premium status carries over.
        </p>
      )}

      {!isLoading && isSignedIn && offering.offering && (
        <div className="space-y-3">
          <PaywallButton
            pkg={offering.annual}
            label="Yearly"
            badge="Best value"
            isPending={purchase.state.pendingPackageId === offering.annual?.identifier}
            disabled={purchase.state.status === "checkout"}
            onClick={() => handleBuy(offering.annual)}
            featured
          />
          <PaywallButton
            pkg={offering.monthly}
            label="Monthly"
            isPending={purchase.state.pendingPackageId === offering.monthly?.identifier}
            disabled={purchase.state.status === "checkout"}
            onClick={() => handleBuy(offering.monthly)}
          />
          {purchase.state.error && (
            <p className="text-xs text-warning-orange">{purchase.state.error}</p>
          )}
        </div>
      )}

      <PaywallDisclosure offering={offering} />
    </div>
  );
}

/**
 * Subscription-terms fine print. UK/EU consumer law and Stripe require showing
 * price, billing period, free-trial terms, auto-renew wording and Terms/Privacy
 * links before purchase. Per-plan lines render once the RC offering resolves;
 * the auto-renew and legal copy always shows.
 */
function PaywallDisclosure({ offering }: { offering: OfferingState }) {
  const annualPrice =
    offering.annual?.webBillingProduct?.currentPrice?.formattedPrice ?? null;
  const monthlyPrice =
    offering.monthly?.webBillingProduct?.currentPrice?.formattedPrice ?? null;

  return (
    <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
      {(annualPrice || monthlyPrice) && (
        <p>
          {annualPrice && (
            <>
              Yearly plan: {annualPrice}
              {offering.annualTrial ? ` after a ${offering.annualTrial}` : ""}.{" "}
            </>
          )}
          {monthlyPrice && (
            <>
              Monthly plan: {monthlyPrice}
              {offering.monthlyTrial ? ` after a ${offering.monthlyTrial}` : ""}
              .
            </>
          )}
        </p>
      )}
      <p>
        Plans renew automatically until cancelled. Cancel anytime from your{" "}
        <Link href="/account" className="underline">
          account
        </Link>
        . Payments are processed securely by Stripe.
      </p>
      <p>
        By subscribing you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
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

  // RC Web Billing surfaces the formatted price on the product price object.
  const formatted = formatPrice(pkg);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        featured
          ? "w-full bg-pitch-green text-stadium-navy font-bold py-4 px-6 rounded-xl hover:bg-pitch-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
          : "w-full border border-white/15 text-floodlight font-semibold py-4 px-6 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-between"
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
