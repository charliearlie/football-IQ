/**
 * Web RevenueCat configuration.
 *
 * Mirror of `src/config/revenueCat.ts` (mobile) so the entitlement IDs stay
 * in lockstep across platforms. RevenueCat keys are per-platform — the web
 * key is a Web Billing key (`rcb_…`), not the iOS `appl_…` key.
 *
 * Dashboard setup required before this is functional in production:
 *   1. Create a Web Billing app in RevenueCat under the same project.
 *   2. Link a Stripe account to that app.
 *   3. Create products that resolve to the existing `Football IQ Pro`
 *      entitlement (monthly + annual, matching mobile pricing).
 *   4. Group them in an offering named `web_default_offering`.
 *   5. Drop the public API key into `NEXT_PUBLIC_REVENUECAT_WEB_API_KEY`.
 *
 * Until the key is set, the SDK never initialises — the rest of the web app
 * keeps working with the existing free-tier behaviour.
 */

export const PREMIUM_ENTITLEMENT_ID = "Football IQ Pro";

export const WEB_OFFERING_ID = "web_default_offering";

export function getWebRevenueCatApiKey(): string | null {
  return process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY ?? null;
}

export function isRevenueCatConfigured(): boolean {
  return Boolean(getWebRevenueCatApiKey());
}

/**
 * Master feature flag for the web subscription system.
 *
 * When disabled (the default), no paywall is ever shown, the archive never
 * locks, and the upgrade affordances are hidden — every game is free. Existing
 * entitlements (e.g. a mobile subscriber visiting the web) are still honoured
 * for ad-free play; the flag only governs whether we *sell* on web.
 *
 * Set `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=true` per environment to turn it on.
 * Keep it off on Production until the billing flow is verified; flip it on
 * Preview to test end-to-end.
 */
export function isSubscriptionsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === "true";
}
