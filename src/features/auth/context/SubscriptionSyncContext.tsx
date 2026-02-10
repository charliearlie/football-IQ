/**
 * SubscriptionSyncProvider
 *
 * Context provider that manages RevenueCat user identification
 * and entitlement sync lifecycle based on authentication state.
 *
 * Responsibilities:
 * - Identify user to RevenueCat when authenticated
 * - Listen for entitlement changes
 * - Sync premium status to Supabase
 * - Clean up on sign-out
 *
 * RevenueCat is the source of truth for premium status.
 */

import React, {
  createContext,
  use,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerInfo } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import {
  identifyUser,
  logOutUser,
  addCustomerInfoListener,
  checkPremiumEntitlement,
  syncPremiumToSupabase,
  silentRestorePurchases,
  restorePurchases,
} from '../services/SubscriptionSync';

/**
 * Key to track if we've attempted silent restore for this install.
 * Gets cleared on reinstall (AsyncStorage is deleted), so we'll
 * only attempt restore once per install lifecycle.
 */
const SILENT_RESTORE_ATTEMPTED_KEY = '@silent_restore_attempted';

interface SubscriptionSyncContextValue {
  /** Force a sync of current entitlement status */
  forceSync: () => Promise<void>;
  /** Restore purchases from App Store */
  restorePurchases: () => Promise<{ success: boolean; hasPremium: boolean }>;
}

const SubscriptionSyncContext =
  createContext<SubscriptionSyncContextValue | null>(null);

interface SubscriptionSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that manages RevenueCat sync lifecycle.
 * Starts listening when user authenticates, stops on sign-out.
 */
export function SubscriptionSyncProvider({
  children,
}: SubscriptionSyncProviderProps) {
  const { user, isInitialized, refetchProfile } = useAuth();
  const removeListenerRef = useRef<(() => void) | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  // Track last known premium status to avoid unnecessary refetches
  const lastPremiumStatusRef = useRef<boolean | null>(null);

  /**
   * Handle customer info updates from RevenueCat.
   * Only triggers profile refetch if premium status actually changed.
   */
  const handleCustomerInfoUpdate = useCallback(
    async (customerInfo: CustomerInfo) => {
      const userId = currentUserIdRef.current;
      if (!userId) return;

      const { hasPremium } = checkPremiumEntitlement(customerInfo);

      // Only proceed if premium status actually changed
      const premiumChanged = hasPremium !== lastPremiumStatusRef.current;
      if (!premiumChanged && lastPremiumStatusRef.current !== null) {
        // Status unchanged - skip sync to avoid unnecessary re-renders
        return;
      }

      console.log('[SubscriptionSync] Entitlement update:', {
        userId,
        hasPremium,
        previousStatus: lastPremiumStatusRef.current,
        changed: premiumChanged,
      });

      const { error } = await syncPremiumToSupabase(userId, hasPremium);
      if (error) {
        console.error('[SubscriptionSync] Failed to sync to Supabase:', error);
      } else {
        // Update tracked status BEFORE refetch to prevent re-triggering
        lastPremiumStatusRef.current = hasPremium;
        // Only refetch profile when status actually changed
        await refetchProfile();
        console.log('[SubscriptionSync] Profile refetched after premium sync');
      }
    },
    [refetchProfile]
  );

  /**
   * Start subscription sync for authenticated user.
   * Includes silent restore for reinstall scenario.
   */
  const startSync = useCallback(
    async (userId: string) => {
      console.log('[SubscriptionSync] Starting for user:', userId);
      currentUserIdRef.current = userId;

      // Identify user to RevenueCat
      const { customerInfo, error } = await identifyUser(userId);
      if (error) {
        console.error('[SubscriptionSync] Failed to identify user:', error);
        return;
      }

      // Initial sync of current entitlement status
      if (customerInfo) {
        const { hasPremium } = checkPremiumEntitlement(customerInfo);

        // REINSTALL SCENARIO: If not premium, try silent restore ONCE per install
        // This recovers Pro status from App Store after reinstall
        // We only attempt once to avoid triggering Apple ID prompts on every launch
        if (!hasPremium) {
          let alreadyAttempted = false;
          try {
            alreadyAttempted = !!(await AsyncStorage.getItem(SILENT_RESTORE_ATTEMPTED_KEY));
          } catch (e) {
            console.warn('[SubscriptionSync] Failed to read silent restore flag:', e);
          }

          if (!alreadyAttempted) {
            console.log(
              '[SubscriptionSync] No premium detected, attempting silent restore (first time this install)...'
            );
            // Mark as attempted BEFORE calling to prevent double-attempts
            try {
              await AsyncStorage.setItem(SILENT_RESTORE_ATTEMPTED_KEY, 'true');
            } catch (e) {
              console.warn('[SubscriptionSync] Failed to write silent restore flag:', e);
            }

            const restoreResult = await silentRestorePurchases();

            if (restoreResult.hasPremium && restoreResult.customerInfo) {
              console.log('[SubscriptionSync] Silent restore found Pro status');
              await handleCustomerInfoUpdate(restoreResult.customerInfo);
            } else {
              // No Pro found - sync current (non-premium) status
              console.log('[SubscriptionSync] Silent restore found no Pro status');
              await handleCustomerInfoUpdate(customerInfo);
            }
          } else {
            // Already attempted this install - just sync current status
            console.log('[SubscriptionSync] Silent restore already attempted, skipping');
            await handleCustomerInfoUpdate(customerInfo);
          }
        } else {
          // Already premium - sync normally
          await handleCustomerInfoUpdate(customerInfo);
        }
      }

      // Start listening for changes
      removeListenerRef.current = addCustomerInfoListener(
        handleCustomerInfoUpdate
      );
    },
    [handleCustomerInfoUpdate]
  );

  /**
   * Stop subscription sync and clean up.
   */
  const stopSync = useCallback(async () => {
    console.log('[SubscriptionSync] Stopping');

    // Remove listener
    if (removeListenerRef.current) {
      removeListenerRef.current();
      removeListenerRef.current = null;
    }

    // Log out from RevenueCat
    if (currentUserIdRef.current) {
      await logOutUser();
      currentUserIdRef.current = null;
    }

    // Reset premium status tracking for next session
    lastPremiumStatusRef.current = null;
  }, []);

  /**
   * Force a manual sync of current entitlement status.
   */
  const forceSync = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;

    const { customerInfo } = await identifyUser(userId);
    if (customerInfo) {
      await handleCustomerInfoUpdate(customerInfo);
    }
  }, [handleCustomerInfoUpdate]);

  /**
   * Manually restore purchases (via Settings).
   */
  const handleRestorePurchases = useCallback(async () => {
    const result = await restorePurchases();
    
    if (result.success && result.customerInfo) {
      // Sync the restored status (handles identity verification)
      await handleCustomerInfoUpdate(result.customerInfo);
    }
    
    return { 
      success: result.success, 
      hasPremium: result.hasPremium 
    };
  }, [handleCustomerInfoUpdate]);

  // Manage sync lifecycle based on auth state
  useEffect(() => {
    if (!isInitialized) return;

    if (user?.id) {
      // User authenticated - start sync
      startSync(user.id);
    } else {
      // User signed out - stop sync
      stopSync();
    }

    return () => {
      // Cleanup on unmount
      if (removeListenerRef.current) {
        removeListenerRef.current();
      }
    };
  }, [user?.id, isInitialized, startSync, stopSync]);

  return (
    <SubscriptionSyncContext
      value={{
        forceSync,
        restorePurchases: handleRestorePurchases
      }}
    >
      {children}
    </SubscriptionSyncContext>
  );
}

/**
 * Hook to access subscription sync functionality.
 *
 * @returns Object with forceSync and restorePurchases methods
 * @throws Error if used outside SubscriptionSyncProvider
 */
export function useSubscriptionSync(): SubscriptionSyncContextValue {
  const context = use(SubscriptionSyncContext);
  if (!context) {
    throw new Error(
      'useSubscriptionSync must be used within a SubscriptionSyncProvider'
    );
  }
  return context;
}
