/**
 * Premium Modal Screen
 *
 * Full-screen native modal for premium upgrade.
 * Uses Expo Router's native presentation for iOS/Android modal animations.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Purchases, {
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import {
  Archive,
  Sparkles,
  X,
  Check,
} from 'lucide-react-native';
import { ProBadge } from '@/components/ProBadge';
import * as Haptics from 'expo-haptics';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/components/Confetti';
import { useAuth, useSubscriptionSync, waitForEntitlementActivation } from '@/features/auth';
import {
  PremiumUpsellContent,
  processPackagesWithOffers,
  OfferInfo,
} from '@/features/subscription';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { PREMIUM_OFFERING_ID, PREMIUM_ENTITLEMENT_ID } from '@/config/revenueCat';

/** Type guard for RevenueCat errors */
function isRevenueCatError(error: unknown): error is { code: string; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/** Timeout duration for API calls */
const API_TIMEOUT_MS = 15000;

type ModalState = 'loading' | 'selecting' | 'purchasing' | 'success' | 'error';

const BENEFITS = [
  { icon: Archive, text: 'Full Archive', description: 'Access all past puzzles' },
  { icon: Sparkles, text: 'Ad-Free', description: 'No interruptions' },
];

export default function PremiumModalScreen() {
  const { puzzleDate, mode } = useLocalSearchParams<{
    puzzleDate?: string;
    mode?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { forceSync } = useSubscriptionSync();

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);

  const [state, setState] = useState<ModalState>('loading');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
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
        ),
      ]);

      if (!isMountedRef.current) return;

      const offering = offerings.all[PREMIUM_OFFERING_ID] || offerings.current;

      if (offering?.availablePackages.length) {
        setPackages(offering.availablePackages);
        setState('selecting');
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

  const getTitle = () => {
    if (state === 'success') return 'WELCOME TO PRO!';
    if (mode === 'blocked') return 'PRO CONTENT';
    return 'UNLOCK ARCHIVE';
  };

  const getSubtitle = () => {
    if (state === 'success') return 'You now have full access to everything!';
    if (mode === 'blocked') return 'This puzzle requires Pro access';
    return 'Get unlimited access to all past puzzles';
  };

  const isPurchasing = state === 'purchasing';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Confetti active={state === 'success'} />
      
       <PremiumUpsellContent
          onClose={handleClose}
          onPurchase={handlePurchase}
          onRestore={handleRestore}
          packages={packages}
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
