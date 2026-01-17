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
  Crown,
  Archive,
  Sparkles,
  TrendingUp,
  X,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/features/career-path/components/Confetti';
import { useAuth, useSubscriptionSync } from '@/features/auth';
import { processPackagesWithOffers, type OfferInfo } from '@/features/subscription';
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
  { icon: TrendingUp, text: 'Exclusive Stats', description: 'Track your progress' },
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

        if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
          // Force sync premium status to Supabase BEFORE showing success
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
          setErrorMessage('Purchase completed but subscription not activated.');
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

      if (customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
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
        setErrorMessage('No previous purchases found');
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Confetti active={state === 'success'} />

      {/* Header with close button - disabled during purchase */}
      <View style={styles.header}>
        <Pressable
          style={[styles.closeButton, isPurchasing && styles.closeButtonDisabled]}
          onPress={handleClose}
          hitSlop={12}
          disabled={isPurchasing}
        >
          <X size={28} color={isPurchasing ? colors.glassBorder : colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            state === 'success' && styles.iconContainerSuccess,
          ]}
        >
          {state === 'success' ? (
            <Check size={40} color={colors.stadiumNavy} strokeWidth={3} />
          ) : (
            <Crown size={40} color={colors.stadiumNavy} strokeWidth={2} />
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {/* Content based on state */}
        {state === 'loading' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.cardYellow} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        )}

        {state === 'selecting' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              {BENEFITS.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <benefit.icon size={24} color={colors.cardYellow} />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={styles.benefitTitle}>{benefit.text}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Puzzle date info */}
            {puzzleDate && (
              <Text style={styles.puzzleInfo}>
                You tried to access a puzzle from {puzzleDate}
              </Text>
            )}

            {/* Plans */}
            <Text style={styles.plansTitle}>Choose Your Plan</Text>

            {processPackagesWithOffers(packages, 'MONTHLY').map(({ package: pkg, offer }) => (
              <PackageCard
                key={pkg.identifier}
                package={pkg}
                offer={offer}
                onSelect={() => handlePurchase(pkg)}
              />
            ))}

            {/* Restore */}
            <View style={styles.restoreContainer}>
              <ElevatedButton
                title="Restore Purchases"
                onPress={handleRestore}
                variant="outline"
                size="small"
                fullWidth
              />
            </View>

            <Text style={styles.planNote}>
              Cancel anytime in your App Store settings.
            </Text>
          </Animated.View>
        )}

        {state === 'purchasing' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.cardYellow} />
            <Text style={styles.loadingText}>
              {selectedPackage
                ? `Processing your subscription...`
                : 'Restoring your purchases...'}
            </Text>
          </View>
        )}

        {state === 'success' && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Your archive is now fully unlocked!</Text>
            <Text style={styles.successSubtext}>Tap anywhere to continue</Text>
          </View>
        )}

        {state === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {errorMessage || 'Something went wrong. Please try again.'}
            </Text>
            <ElevatedButton
              title="Try Again"
              onPress={fetchOfferings}
              size="medium"
              topColor={colors.cardYellow}
              shadowColor="#D4A500"
              fullWidth
            />
            <ElevatedButton
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              size="medium"
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PackageCard({
  package: pkg,
  offer,
  onSelect,
}: {
  package: PurchasesPackage;
  offer: OfferInfo;
  onSelect: () => void;
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
              <Text style={styles.planDescription} numberOfLines={1}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonDisabled: {
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  iconContainerSuccess: {
    backgroundColor: colors.pitchGreen,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 36,
    letterSpacing: 2,
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  content: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
  },
  benefitDescription: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  puzzleInfo: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  plansTitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
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
  planDescription: {
    ...textStyles.caption,
    color: colors.pitchGreen,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: fonts.headline,
    fontSize: 28,
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
  restoreContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  planNote: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
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
  errorContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  errorText: {
    ...textStyles.body,
    color: colors.redCard,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
