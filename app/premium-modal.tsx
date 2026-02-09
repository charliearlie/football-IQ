/**
 * Premium Modal Screen
 *
 * Full-screen native modal for premium upgrade.
 * Uses Expo Router's native presentation for iOS/Android modal animations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';


import Purchases, {
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
  IntroEligibility,
} from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { Confetti } from '@/components/Confetti';
import { useAuth, useSubscriptionSync, waitForEntitlementActivation } from '@/features/auth';
import {
  PremiumUpsellContent,
} from '@/features/subscription';
import { colors } from '@/theme/colors';
import { PREMIUM_OFFERING_ID } from '@/config/revenueCat';

/** Type guard for RevenueCat errors */
function isRevenueCatError(error: unknown): error is { code: string; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/** Timeout duration for API calls */
const API_TIMEOUT_MS = 15000;

type ModalState = 'loading' | 'selecting' | 'purchasing' | 'success' | 'error';

export default function PremiumModalScreen() {
  const { mode } = useLocalSearchParams<{
    mode?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { forceSync } = useSubscriptionSync();

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);

  const [state, setState] = useState<ModalState>('loading');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [eligibility, setEligibility] = useState<Record<string, IntroEligibility>>({});
  const [_selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track mounted state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isMountedRef.current) {
      router.back();
    }
  }, [router]);

  const fetchOfferings = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);

    try {
      // Add timeout to prevent infinite loading
      const offerings = await Promise.race([
        Purchases.getOfferings(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), API_TIMEOUT_MS)
        )
      ]);

      if (!isMountedRef.current) return;

      const offering = offerings.all[PREMIUM_OFFERING_ID] || offerings.current;

      if (offering?.availablePackages.length) {
        const availablePackages = offering.availablePackages;
        setPackages(availablePackages);
        
        // Fetch eligibility for these packages
        try {
          const productIdentifiers = availablePackages.map(p => p.product.identifier);
          const eligibilityMap = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIdentifiers);
          if (isMountedRef.current) {
             setEligibility(eligibilityMap);
          }
        } catch (e) {
          console.warn('[PremiumModal] Failed to check intro eligibility:', e);
          // Fallback: don't set eligibility, defaults to safe state (no offer)
        }

        if (isMountedRef.current) {
          setState('selecting');
        }
      } else {
        setErrorMessage('No subscription plans available');
        setState('error');
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('[PremiumModal] Failed to fetch offerings:', error);
      setErrorMessage(
        error instanceof Error && error.message === 'Request timed out'
          ? 'Connection timed out. Please check your internet.'
          : 'Failed to load subscription plans'
      );
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          handleClose();
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state, handleClose]);

  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!user) return;

      setSelectedPackage(pkg);
      setState('purchasing');

      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);

        if (!isMountedRef.current) return;

        // Wait for entitlement with retry logic (handles RevenueCat timing issues)
        const result = await waitForEntitlementActivation(customerInfo);

        if (!isMountedRef.current) return;

        if (result.success) {
          // Force sync premium status to Supabase
          await forceSync();

          // Haptics may fail on some devices - don't let it break the flow
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            // Haptics not available - ignore
          }

          if (isMountedRef.current) {
            setState('success');
          }
        } else {
          // Purchase completed but entitlement pending - still try to sync
          await forceSync();
          setErrorMessage(result.errorMessage);
          setState('error');
        }
      } catch (error: unknown) {
        if (!isMountedRef.current) return;

        // Type-safe error handling
        if (
          isRevenueCatError(error) &&
          error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
        ) {
          setState('selecting');
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Purchase failed. Please try again.';
        setErrorMessage(message);
        setState('error');
      }
    },
    [user, forceSync]
  );

  const handleRestore = useCallback(async () => {
    setState('purchasing');

    try {
      const customerInfo = await Purchases.restorePurchases();

      if (!isMountedRef.current) return;

      // Wait for entitlement with retry logic
      const result = await waitForEntitlementActivation(customerInfo);

      if (!isMountedRef.current) return;

      if (result.success) {
        // Force sync premium status to Supabase
        await forceSync();

        // Haptics may fail on some devices - don't let it break the flow
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Haptics not available - ignore
        }

        if (isMountedRef.current) {
          setState('success');
        }
      } else {
        // Check if there are any transactions at all
        const hasAnyPurchases = customerInfo.allPurchasedProductIdentifiers.length > 0;
        if (hasAnyPurchases) {
          // Has purchases but entitlement not granted - likely a RevenueCat config issue
          setErrorMessage('Subscription found but not activated. Please contact support.');
        } else {
          setErrorMessage('No previous purchases found');
        }
        setState('error');
      }
    } catch (error: unknown) {
      if (!isMountedRef.current) return;

      const message =
        error instanceof Error ? error.message : 'Restore failed. Please try again.';
      setErrorMessage(message);
      setState('error');
    }
  }, [forceSync]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Confetti active={state === 'success'} />
      
       <PremiumUpsellContent
          onClose={handleClose}
          onPurchase={handlePurchase}
          onRestore={handleRestore}
          packages={packages}
          eligibility={eligibility}
          state={state}
          errorMessage={errorMessage}
          onRetry={fetchOfferings}
       />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
});
