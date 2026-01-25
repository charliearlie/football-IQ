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
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import {
  identifyUser,
  logOutUser,
  addCustomerInfoListener,
  checkPremiumEntitlement,
  syncPremiumToSupabase,
} from '../services/SubscriptionSync';

interface SubscriptionSyncContextValue {
  /** Force a sync of current entitlement status */
  forceSync: () => Promise<void>;
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

  /**
   * Handle customer info updates from RevenueCat.
   */
  const handleCustomerInfoUpdate = useCallback(
    async (customerInfo: CustomerInfo) => {
      const userId = currentUserIdRef.current;
      if (!userId) return;

      const { hasPremium } = checkPremiumEntitlement(customerInfo);

      console.log('[SubscriptionSync] Entitlement update:', {
        userId,
        hasPremium,
      });

      const { error } = await syncPremiumToSupabase(userId, hasPremium);
      if (error) {
        console.error('[SubscriptionSync] Failed to sync to Supabase:', error);
      } else {
        // Refetch profile to update React state immediately
        await refetchProfile();
        console.log('[SubscriptionSync] Profile refetched after premium sync');
      }
    },
    [refetchProfile]
  );

  /**
   * Start subscription sync for authenticated user.
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
        await handleCustomerInfoUpdate(customerInfo);
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
    <SubscriptionSyncContext.Provider value={{ forceSync }}>
      {children}
    </SubscriptionSyncContext.Provider>
  );
}

/**
 * Hook to access subscription sync functionality.
 *
 * @returns Object with forceSync method
 * @throws Error if used outside SubscriptionSyncProvider
 */
export function useSubscriptionSync(): SubscriptionSyncContextValue {
  const context = useContext(SubscriptionSyncContext);
  if (!context) {
    throw new Error(
      'useSubscriptionSync must be used within a SubscriptionSyncProvider'
    );
  }
  return context;
}
