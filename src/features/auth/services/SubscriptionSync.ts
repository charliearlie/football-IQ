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
 */

import Purchases, { CustomerInfo } from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import { PREMIUM_ENTITLEMENT_ID } from '@/config/revenueCat';

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
 * Updates the user's premium status in Supabase profiles table.
 *
 * @param userId - Supabase user ID
 * @param isPremium - Whether user should be premium
 * @returns Object with error if update failed
 */
export async function syncPremiumToSupabase(
  userId: string,
  isPremium: boolean
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: isPremium,
        premium_purchased_at: isPremium ? new Date().toISOString() : null,
      })
      .eq('id', userId);

    if (error) {
      console.error('[SubscriptionSync] Supabase update error:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('[SubscriptionSync] Sync exception:', err);
    return { error: err as Error };
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
  return Purchases.addCustomerInfoUpdateListener(listener);
}
