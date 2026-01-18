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
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  SlideInDown,
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
  Crown,
  Archive,
  Sparkles,
  TrendingUp,
  X,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/components/Confetti';
import { useAuth } from '@/features/auth';
import { processPackagesWithOffers, type OfferInfo } from '@/features/subscription';
import { colors } from '@/theme/colors';

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
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { PREMIUM_OFFERING_ID } from '@/config/revenueCat';

/**
 * Modal state machine states.
 */
type ModalState = 'loading' | 'selecting' | 'purchasing' | 'success' | 'error';

/**
 * Condensed benefits for display alongside pricing.
 */
const CONDENSED_BENEFITS = [
  { icon: Archive, text: 'Full Archive' },
  { icon: Sparkles, text: 'Ad-Free' },
  { icon: TrendingUp, text: 'Exclusive Stats' },
];

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
  puzzleDate,
  mode = 'upsell',
  testID,
}: PremiumUpsellModalProps) {
  const [state, setState] = useState<ModalState>('loading');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();

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

        // Check if purchase granted the entitlement
        if (customerInfo.entitlements.active['premium_access']) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setState('success');
        } else {
          // Purchase completed but entitlement not active
          // This happens with Test Store purchases (simulator only)
          console.warn('[PremiumUpsellModal] No premium_access entitlement found. This is expected for Test Store purchases on simulator.');
          setErrorMessage('Purchase completed but subscription not activated. Use a physical device with sandbox account for real testing.');
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
    [user]
  );

  /**
   * Handle restore purchases.
   */
  const handleRestore = useCallback(async () => {
    setState('purchasing');
    try {
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active['premium_access']) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setState('success');
      } else {
        setErrorMessage('No previous purchases found');
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
  }, []);

  /**
   * Handle retry after error.
   */
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    fetchOfferings();
  }, [fetchOfferings]);

  /**
   * Get title based on mode and state.
   */
  const getTitle = () => {
    if (state === 'success') return 'WELCOME TO PRO!';
    if (mode === 'blocked') return 'PRO CONTENT';
    return 'UNLOCK ARCHIVE';
  };

  /**
   * Get subtitle based on mode.
   */
  const getSubtitle = () => {
    if (state === 'success') return 'You now have full access to everything!';
    if (mode === 'blocked') return 'This puzzle requires Pro access';
    return 'Get unlimited access to all past puzzles';
  };

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
          style={styles.modal}
        >
          {/* Close Button */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={12}
            testID={`${testID}-close`}
          >
            <X size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              state === 'success' && styles.iconContainerSuccess,
            ]}
          >
            {state === 'success' ? (
              <Check size={32} color={colors.stadiumNavy} strokeWidth={3} />
            ) : (
              <Crown size={32} color={colors.stadiumNavy} strokeWidth={2} />
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{getTitle()}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{getSubtitle()}</Text>

          {/* Scrollable content area */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {state === 'loading' && <LoadingContent />}

            {state === 'selecting' && (
              <SelectingContent
                packages={packages}
                onSelectPackage={handlePurchase}
                onRestore={handleRestore}
                puzzleDate={puzzleDate}
                testID={testID}
              />
            )}

            {state === 'purchasing' && (
              <PurchasingContent package={selectedPackage} testID={testID} />
            )}

            {state === 'success' && <SuccessContent testID={testID} />}

            {state === 'error' && (
              <ErrorContent
                message={errorMessage}
                onRetry={handleRetry}
                onClose={onClose}
                testID={testID}
              />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Loading state content.
 */
function LoadingContent() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.cardYellow} />
      <Text style={styles.loadingText}>Loading plans...</Text>
    </View>
  );
}

/**
 * Selecting state content - shows condensed benefits and RevenueCat packages.
 */
function SelectingContent({
  packages,
  onSelectPackage,
  onRestore,
  puzzleDate,
  testID,
}: {
  packages: PurchasesPackage[];
  onSelectPackage: (pkg: PurchasesPackage) => void;
  onRestore: () => void;
  puzzleDate?: string | null;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.plansContainer}
    >
      {/* Condensed Benefits Row */}
      <View style={styles.condensedBenefits}>
        {CONDENSED_BENEFITS.map((benefit, index) => (
          <View key={index} style={styles.condensedBenefitItem}>
            <benefit.icon size={14} color={colors.cardYellow} />
            <Text style={styles.condensedBenefitText}>{benefit.text}</Text>
          </View>
        ))}
      </View>

      {/* Puzzle Date Info */}
      {puzzleDate && (
        <Text style={styles.puzzleInfo}>
          You tried to access a puzzle from {puzzleDate}
        </Text>
      )}

      <Text style={styles.plansTitle}>Choose Your Plan</Text>

      {processPackagesWithOffers(packages, 'MONTHLY').map(({ package: pkg, offer }) => (
        <PackageCard
          key={pkg.identifier}
          package={pkg}
          offer={offer}
          onSelect={() => onSelectPackage(pkg)}
          testID={`${testID}-plan-${pkg.identifier}`}
        />
      ))}

      {/* Restore Purchases Button */}
      <Pressable
        style={styles.restoreButton}
        onPress={onRestore}
        testID={`${testID}-restore-button`}
      >
        <RotateCcw size={14} color={colors.textSecondary} />
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </Pressable>

      <Text style={styles.planNote}>
        Cancel anytime in your App Store settings.
      </Text>
    </Animated.View>
  );
}

/**
 * Individual package card using RevenueCat price data.
 */
function PackageCard({
  package: pkg,
  offer,
  onSelect,
  testID,
}: {
  package: PurchasesPackage;
  offer: OfferInfo;
  onSelect: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const product = pkg.product;
  const hasBadge = offer.badgeText !== null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  /**
   * Get period label from package type.
   */
  const getPeriodLabel = (): string => {
    switch (pkg.packageType) {
      case 'WEEKLY':
        return '/week';
      case 'MONTHLY':
        return '/month';
      case 'ANNUAL':
        return '/year';
      case 'LIFETIME':
        return ' forever';
      default:
        return '';
    }
  };

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.planCard,
          hasBadge && styles.planCardHighlighted,
          animatedStyle,
        ]}
      >
        {hasBadge && (
          <View
            style={[
              styles.badge,
              offer.badgeText === 'LIMITED OFFER' && styles.badgeLimitedOffer,
            ]}
          >
            <Text style={styles.badgeText}>{offer.badgeText}</Text>
          </View>
        )}

        <View style={styles.planInfo}>
          <Text style={styles.planLabel}>{product.title}</Text>
          {offer.isOfferActive && offer.savingsText ? (
            <Text style={styles.savingsText}>{offer.savingsText}</Text>
          ) : (
            product.description && (
              <Text style={styles.planSavings} numberOfLines={1}>
                {product.description}
              </Text>
            )
          )}
        </View>

        <View style={styles.planPricing}>
          {offer.isOfferActive && (
            <Text style={styles.originalPrice}>{offer.originalPriceString}</Text>
          )}
          <Text
            style={[
              styles.planPrice,
              offer.isOfferActive && styles.planPriceHighlighted,
            ]}
          >
            {offer.discountedPriceString}
          </Text>
          <Text style={styles.planPeriod}>{getPeriodLabel()}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Purchasing state content - shows loading.
 */
function PurchasingContent({
  package: pkg,
  testID,
}: {
  package: PurchasesPackage | null;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.purchasingContainer}
    >
      <ActivityIndicator size="large" color={colors.cardYellow} />
      <Text style={styles.purchasingText}>
        {pkg
          ? `Processing your ${pkg.product.title.toLowerCase()} subscription...`
          : 'Restoring your purchases...'}
      </Text>
    </Animated.View>
  );
}

/**
 * Success state content.
 */
function SuccessContent({ testID }: { testID?: string }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.successContainer}
    >
      <Text style={styles.successText}>
        Your archive is now fully unlocked!
      </Text>
      <Text style={styles.successSubtext}>
        Tap anywhere to continue exploring
      </Text>
    </Animated.View>
  );
}

/**
 * Error state content.
 */
function ErrorContent({
  message,
  onRetry,
  onClose,
  testID,
}: {
  message: string | null;
  onRetry: () => void;
  onClose: () => void;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.errorContainer}
    >
      <Text style={styles.errorText}>
        {message || 'Something went wrong. Please try again.'}
      </Text>
      <View style={styles.buttonContainer}>
        <ElevatedButton
          title="Try Again"
          onPress={onRetry}
          size="medium"
          topColor={colors.cardYellow}
          shadowColor="#D4A500"
          fullWidth
          testID={`${testID}-retry-button`}
        />
        <ElevatedButton
          title="Cancel"
          onPress={onClose}
          size="medium"
          topColor={colors.glassBackground}
          shadowColor={colors.glassBorder}
          fullWidth
          testID={`${testID}-cancel-button`}
        />
      </View>
    </Animated.View>
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
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    position: 'relative',
  },
  scrollContent: {
    width: '100%',
    flexShrink: 1,
  },
  scrollContentContainer: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainerSuccess: {
    backgroundColor: colors.pitchGreen,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 32,
    letterSpacing: 2,
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  // Condensed benefits
  condensedBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  puzzleInfo: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
    gap: spacing.md,
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
    padding: spacing.md,
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
    paddingVertical: spacing.sm,
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
    marginTop: spacing.sm,
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
