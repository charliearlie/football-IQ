/**
 * Thin wrapper around `@revenuecat/purchases-js`.
 *
 * Why a wrapper:
 *   - Centralises the single `Purchases.configure(...)` call so we don't
 *     accidentally re-configure on remount.
 *   - Treats "no API key" as a soft no-op so dev/CI/preview environments
 *     without a Web Billing key keep running.
 *   - Keeps the rest of the codebase from importing the SDK directly,
 *     which makes mocking in tests trivial.
 */

import type { CustomerInfo, Purchases as PurchasesType } from "@revenuecat/purchases-js";
import {
  PREMIUM_ENTITLEMENT_ID,
  getWebRevenueCatApiKey,
  isRevenueCatConfigured,
} from "./config";

let cachedInstance: PurchasesType | null = null;
let configuredForUser: string | null = null;

async function loadSdk(): Promise<typeof import("@revenuecat/purchases-js") | null> {
  if (typeof window === "undefined") return null;
  return import("@revenuecat/purchases-js");
}

/**
 * Initialise the SDK for the given user (or anonymous if undefined). Safe to
 * call multiple times — second call with the same user is a no-op, second
 * call with a different user invokes `changeUser`.
 */
export async function ensureRevenueCat(
  appUserId: string | null,
): Promise<PurchasesType | null> {
  const apiKey = getWebRevenueCatApiKey();
  if (!apiKey) return null;

  const sdk = await loadSdk();
  if (!sdk) return null;

  const desiredUser = appUserId ?? sdk.Purchases.generateRevenueCatAnonymousAppUserId();

  if (!cachedInstance) {
    cachedInstance = sdk.Purchases.configure(apiKey, desiredUser);
    configuredForUser = desiredUser;
    return cachedInstance;
  }

  if (appUserId && configuredForUser !== appUserId) {
    await cachedInstance.changeUser(appUserId);
    configuredForUser = appUserId;
  }

  return cachedInstance;
}

export function hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}

/**
 * Returns the App User ID currently configured in the SDK, or null if RC
 * hasn't been initialised yet. Used by the post-purchase claim flow to
 * thread the anonymous RC ID into the magic-link redirect.
 */
export function getCurrentAppUserId(): string | null {
  return configuredForUser;
}

export async function getCurrentCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatConfigured() || !cachedInstance) return null;
  return cachedInstance.getCustomerInfo();
}

/** Reset module state. Test-only. */
export function __resetRevenueCatForTests(): void {
  cachedInstance = null;
  configuredForUser = null;
}
