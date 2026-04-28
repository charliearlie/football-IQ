/**
 * SubscriptionSync Service
 *
 * Manages RevenueCat customer info and syncs entitlement status to Supabase.
 * RevenueCat is the source of truth for premium status.
 *
 * Key responsibilities:
 * - Check premium entitlement from CustomerInfo
 * - Sync premium status to Supabase profiles table
 * - Identify/logout users with RevenueCat
 * - Wrap customer info listener
 * - Wait for entitlement activation with retry logic
 */

import Purchases, { CustomerInfo } from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import { PREMIUM_ENTITLEMENT_ID } from '@/config/revenueCat';
import { Profile } from '@/features/auth/types/auth.types';

/**
 * Result of checking entitlement status.
 */
export interface EntitlementCheckResult {
  /** Whether user has premium access */
  hasPremium: boolean;
  /** Expiration date if applicable, null for lifetime */
  expirationDate: string | null;
}

/**
 * Determines if customer has premium entitlement.
 *
 * @param customerInfo - RevenueCat CustomerInfo object
 * @returns EntitlementCheckResult with premium status and expiration
 */
export function checkPremiumEntitlement(
  customerInfo: CustomerInfo
): EntitlementCheckResult {
  const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

  return {
    hasPremium: entitlement !== undefined,
    expirationDate: entitlement?.expirationDate ?? null,
  };
}

/**
 * Upgrades the user to premium via a SECURITY DEFINER RPC.
 *
 * The profiles table has a trigger (protect_profile_privileged_fields) that
 * silently reverts is_premium on direct UPDATE. The upgrade_to_premium() RPC
 * bypasses this trigger and is the only client-safe way to set premium status.
 *
 * Note: only upgrades (is_premium=true) are supported client-side.
 * Downgrades are handled server-side via RevenueCat webhooks.
 *
 * @param userId - Supabase user ID (used for verification logging only; RPC uses auth.uid())
 * @param isPremium - Must be true; false is a no-op (kept for call-site compatibility)
 * @returns Object with updated profile and/or error
 */
export async function syncPremiumToSupabase(
  userId: string,
  isPremium: boolean
): Promise<{ profile: Profile | null; error: Error | null }> {
  try {
    const rpcName = isPremium ? 'upgrade_to_premium' : 'downgrade_from_premium';
    const { data, error } = await supabase.rpc(rpcName);

    if (error) {
      console.error(`[SubscriptionSync] ${rpcName} RPC error:`, error);
      return { profile: null, error: new Error(error.message) };
    }

    // RPC returns an array (RETURNS SETOF), take the first row
    const profile = Array.isArray(data) ? data[0] : data;

    if (!profile) {
      return { profile: null, error: new Error(`${rpcName} returned no profile`) };
    }

    // For upgrades, verify it took effect
    if (isPremium && !profile.is_premium) {
      return { profile: null, error: new Error('Premium upgrade did not take effect') };
    }

    return { profile, error: null };
  } catch (err) {
    console.error('[SubscriptionSync] Sync exception:', err);
    return { profile: null, error: err as Error };
  }
}

/**
 * Identifies the user to RevenueCat.
 * Must be called after user authenticates.
 *
 * @param userId - Supabase user ID to identify with RevenueCat
 * @returns CustomerInfo if successful, error otherwise
 */
export async function identifyUser(userId: string): Promise<{
  customerInfo: CustomerInfo | null;
  error: Error | null;
}> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[SubscriptionSync] User identified:', userId);
    return { customerInfo, error: null };
  } catch (error) {
    console.error('[SubscriptionSync] Failed to identify user:', error);
    return { customerInfo: null, error: error as Error };
  }
}

/**
 * Signs out the user from RevenueCat.
 * Resets to anonymous RevenueCat user.
 *
 * @returns Object with error if logout failed
 */
export async function logOutUser(): Promise<{ error: Error | null }> {
  try {
    await Purchases.logOut();
    console.log('[SubscriptionSync] User logged out');
    return { error: null };
  } catch (error) {
    console.error('[SubscriptionSync] Failed to log out:', error);
    return { error: error as Error };
  }
}

/**
 * Result of silent restore operation.
 */
export interface SilentRestoreResult {
  /** CustomerInfo if restore was successful */
  customerInfo: CustomerInfo | null;
  /** Whether user has premium entitlement after restore */
  hasPremium: boolean;
}

/**
 * Checks entitlement status after a restore operation.
 * Helper for restore functions.
 */
function getRestoreResult(customerInfo: CustomerInfo): SilentRestoreResult {
  const { hasPremium } = checkPremiumEntitlement(customerInfo);
  return { customerInfo, hasPremium };
}

/**
 * Silently attempts to restore purchases from the App Store.
 *
 * This is called on app initialization when user is logged in but
 * isPremium is false. It handles the reinstall scenario where the
 * user has an active subscription but the local state doesn't know.
 *
 * Does not show any UI - silently checks and returns result.
 * Network errors or no purchases are not treated as errors.
 *
 * @returns SilentRestoreResult with premium status
 */
export async function silentRestorePurchases(): Promise<SilentRestoreResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const result = getRestoreResult(customerInfo);
    console.log(
      '[SubscriptionSync] Silent restore:',
      result.hasPremium ? 'Pro found' : 'No Pro'
    );
    return result;
  } catch (error) {
    // No purchases to restore or network error - not a failure case
    console.log('[SubscriptionSync] Silent restore - no purchases:', error);
    return { customerInfo: null, hasPremium: false };
  }
}

/**
 * Explicitly restores purchases from the App Store.
 * Called when user taps "Restore Purchases" in settings.
 *
 * @returns Object with success flag and premium status
 */
export async function restorePurchases(): Promise<
  SilentRestoreResult & { success: boolean; error?: Error }
> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const result = getRestoreResult(customerInfo);
    console.log(
      '[SubscriptionSync] Manual restore:',
      result.hasPremium ? 'Pro found' : 'No Pro'
    );
    return { ...result, success: true };
  } catch (error) {
    console.error('[SubscriptionSync] Manual restore failed:', error);
    return {
      customerInfo: null,
      hasPremium: false,
      success: false,
      error: error as Error,
    };
  }
}

/**
 * Type for the customer info update listener callback.
 */
export type CustomerInfoListener = (info: CustomerInfo) => void;

/**
 * Adds a listener for customer info updates.
 * Returns a function to remove the listener.
 *
 * @param listener - Callback when customer info changes
 * @returns Function to unsubscribe from updates
 */
export function addCustomerInfoListener(
  listener: CustomerInfoListener
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/**
 * Configuration for entitlement verification retry logic.
 */
export const ENTITLEMENT_RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 1.5,
};

/**
 * Result of waiting for entitlement activation.
 */
export interface EntitlementActivationResult {
  /** Whether the entitlement was successfully verified */
  success: boolean;
  /** Final CustomerInfo if successful */
  customerInfo: CustomerInfo | null;
  /** Number of attempts made */
  attempts: number;
  /** Error message if failed */
  errorMessage: string | null;
}

/**
 * Waits for premium entitlement to be active, with retry logic.
 *
 * This handles the timing issue where RevenueCat may not have
 * processed the entitlement immediately after purchase.
 *
 * @param initialCustomerInfo - CustomerInfo from purchase/restore
 * @returns EntitlementActivationResult with success status
 */
export async function waitForEntitlementActivation(
  initialCustomerInfo: CustomerInfo
): Promise<EntitlementActivationResult> {
  // Check if already active
  if (checkPremiumEntitlement(initialCustomerInfo).hasPremium) {
    return {
      success: true,
      customerInfo: initialCustomerInfo,
      attempts: 1,
      errorMessage: null,
    };
  }

  const { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier } =
    ENTITLEMENT_RETRY_CONFIG;

  let delay = initialDelayMs;
  let hasSynced = false;

  for (let attempt = 2; attempt <= maxAttempts; attempt++) {
    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      // First retry: force sync with Apple
      if (!hasSynced) {
        await Purchases.syncPurchases();
        hasSynced = true;
        console.log('[SubscriptionSync] Synced purchases with Apple');
      }

      // Fetch latest customer info
      const customerInfo = await Purchases.getCustomerInfo();

      if (checkPremiumEntitlement(customerInfo).hasPremium) {
        console.log(
          `[SubscriptionSync] Entitlement active after ${attempt} attempts`
        );
        return {
          success: true,
          customerInfo,
          attempts: attempt,
          errorMessage: null,
        };
      }
    } catch (error) {
      console.warn(`[SubscriptionSync] Retry ${attempt} failed:`, error);
    }

    // Exponential backoff
    delay = Math.min(delay * backoffMultiplier, maxDelayMs);
  }

  // All retries exhausted
  console.warn('[SubscriptionSync] Entitlement not active after all retries');
  return {
    success: false,
    customerInfo: null,
    attempts: maxAttempts,
    errorMessage:
      'Purchase successful but activation pending. Please try refreshing.',
  };
}
