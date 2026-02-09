/**
 * PremiumUpsellModal Component
 *
 * High-conversion modal for premium upgrade with:
 * - State machine: idle → loading → selecting → purchasing → success
 * - Dynamic offerings from RevenueCat
 * - Real purchase flow via Purchases.purchasePackage()
 * - Restore purchases support
 * - Localized pricing via priceString
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  SlideInDown,
} from 'react-native-reanimated';
import Purchases, {
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import * as Haptics from 'expo-haptics';
import { Confetti } from '@/components/Confetti';
import { useAuth, useSubscriptionSync, waitForEntitlementActivation } from '@/features/auth';
import {
  PremiumUpsellContent,
} from '@/features/subscription';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { PREMIUM_OFFERING_ID } from '@/config/revenueCat';

/**
 * Type guard for RevenueCat PurchasesError.
 * RevenueCat errors have a `code` property with PURCHASES_ERROR_CODE value.
 */
function isPurchasesError(
  error: unknown
): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Modal state machine states.
 */
type ModalState = 'loading' | 'selecting' | 'purchasing' | 'success' | 'error';

interface PremiumUpsellModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Date of the puzzle user tried to access (optional) */
  puzzleDate?: string | null;
  /** Mode of the modal */
  mode?: 'upsell' | 'locked' | 'blocked';
  /** Test ID for testing */
  testID?: string;
}

/**
 * Premium upgrade prompt modal with subscription plans.
 *
 * State Machine:
 * - idle: Shows benefits and "See Plans" button
 * - loading: Fetching offerings from RevenueCat
 * - selecting: Shows subscription plan options
 * - purchasing: Shows loading state during purchase
 * - success: Shows celebration with confetti
 * - error: Shows error message with retry option
 */
export function PremiumUpsellModal({
  visible,
  onClose,
  puzzleDate: _puzzleDate,
  mode = 'upsell',
  testID,
}: PremiumUpsellModalProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768; // Standard iPad breakpoint
  const [state, setState] = useState<ModalState>('loading');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [_selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const { forceSync } = useSubscriptionSync();

  /**
   * Fetch offerings from RevenueCat.
   */
  const fetchOfferings = useCallback(async () => {
    setState('loading');
    try {
      const offerings = await Purchases.getOfferings();

      // Try specific offering first, then fall back to current/default offering
      const offering = offerings.all[PREMIUM_OFFERING_ID] || offerings.current;

      if (offering?.availablePackages.length) {
        setPackages(offering.availablePackages);
        setState('selecting');
      } else {
        console.warn('[PremiumUpsellModal] No packages in offering. Available offerings:', Object.keys(offerings.all));
        setErrorMessage('No subscription plans available');
        setState('error');
      }
    } catch (error) {
      console.error('[PremiumUpsellModal] Failed to fetch offerings:', error);
      setErrorMessage('Failed to load subscription plans');
      setState('error');
    }
  }, []);

  // Auto-fetch offerings when modal opens, reset when it closes
  useEffect(() => {
    if (visible) {
      // Immediately fetch offerings when modal becomes visible
      fetchOfferings();
    } else {
      setState('loading');
      setPackages([]);
      setSelectedPackage(null);
      setErrorMessage(null);
    }
  }, [visible, fetchOfferings]);

  // Auto-close after success
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

  /**
   * Handle package purchase.
   */
  const handlePurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!user) return;

      setSelectedPackage(pkg);
      setState('purchasing');

      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);

        // Debug: Log all entitlements
        console.log('[PremiumUpsellModal] Purchase completed. Active entitlements:',
          Object.keys(customerInfo.entitlements.active)
        );

        // Wait for entitlement with retry logic (handles RevenueCat timing issues)
        const result = await waitForEntitlementActivation(customerInfo);

        if (result.success) {
          // Force sync premium status to Supabase
          await forceSync();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setState('success');
        } else {
          // Purchase completed but entitlement pending - still try to sync
          await forceSync();
          console.warn('[PremiumUpsellModal] Entitlement pending after purchase');
          setErrorMessage(result.errorMessage);
          setState('error');
        }
      } catch (error: unknown) {
        // Handle user cancellation gracefully
        if (
          isPurchasesError(error) &&
          error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
        ) {
          setState('selecting');
          return;
        }

        console.error('[PremiumUpsellModal] Purchase error:', error);
        const message = isPurchasesError(error)
          ? error.message
          : 'Purchase failed. Please try again.';
        setErrorMessage(message || 'Purchase failed. Please try again.');
        setState('error');
      }
    },
    [user, forceSync]
  );

  /**
   * Handle restore purchases.
   */
  const handleRestore = useCallback(async () => {
    setState('purchasing');
    try {
      const customerInfo = await Purchases.restorePurchases();

      // Wait for entitlement with retry logic
      const result = await waitForEntitlementActivation(customerInfo);

      if (result.success) {
        // Force sync premium status to Supabase
        await forceSync();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setState('success');
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
      console.error('[PremiumUpsellModal] Restore error:', error);
      const message = isPurchasesError(error)
        ? error.message
        : 'Restore failed. Please try again.';
      setErrorMessage(message || 'Restore failed. Please try again.');
      setState('error');
    }
  }, [forceSync]);

  /**
   * Handle retry after error.
   */
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    fetchOfferings();
  }, [fetchOfferings]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Success Confetti */}
        <Confetti active={state === 'success'} testID={`${testID}-confetti`} />

        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={[styles.modal, isTablet && styles.modalTablet]}
        >
           <PremiumUpsellContent
              onClose={onClose}
              onPurchase={handlePurchase}
              onRestore={handleRestore}
              packages={packages}
              state={state}
              errorMessage={errorMessage}
              onRetry={handleRetry}
              testID={testID}
           />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.cardYellow,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    position: 'relative',
  },
  modalTablet: {
    maxWidth: 500,
    padding: spacing.lg,
  },
  scrollContent: {
    width: '100%',
    flexShrink: 1,
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainerSuccess: {
    backgroundColor: colors.pitchGreen,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 26,
    letterSpacing: 2,
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  // Condensed benefits
  condensedBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  condensedBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  condensedBenefitText: {
    ...textStyles.caption,
    color: colors.floodlightWhite,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  // Plans
  plansContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  plansTitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing.sm,
    position: 'relative',
  },
  planCardHighlighted: {
    borderColor: colors.cardYellow,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeLimitedOffer: {
    backgroundColor: colors.pitchGreen,
  },
  badgeText: {
    fontFamily: fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.stadiumNavy,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
  },
  planSavings: {
    ...textStyles.caption,
    color: colors.pitchGreen,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.cardYellow,
  },
  planPriceHighlighted: {
    color: colors.pitchGreen,
  },
  originalPrice: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontSize: 14,
  },
  savingsText: {
    ...textStyles.caption,
    color: colors.pitchGreen,
    fontWeight: '600',
  },
  planPeriod: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  restoreText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  planNote: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  legalText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  legalLink: {
    color: colors.cardYellow,
    textDecorationLine: 'underline',
  },
  // Purchasing
  purchasingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  purchasingText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    textAlign: 'center',
  },
  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  successText: {
    ...textStyles.body,
    color: colors.pitchGreen,
    fontWeight: '600',
    textAlign: 'center',
  },
  thankYouText: {
    ...textStyles.caption,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  successSubtext: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Error
  errorContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
  },
  errorText: {
    ...textStyles.body,
    color: colors.redCard,
    textAlign: 'center',
  },
});
