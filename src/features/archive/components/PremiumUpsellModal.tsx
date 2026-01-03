/**
 * PremiumUpsellModal Component
 *
 * High-conversion modal for premium upgrade with:
 * - State machine: idle → selecting → purchasing → success
 * - Subscription plans: Weekly, Monthly, Yearly (mocked)
 * - Benefits list with icons
 * - Mock purchase flow that toggles is_premium in Supabase
 * - Success celebration with confetti and haptics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  SlideInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Lock,
  Crown,
  Archive,
  Sparkles,
  TrendingUp,
  Heart,
  X,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/features/career-path/components/Confetti';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';

/**
 * Modal state machine states.
 */
type ModalState = 'idle' | 'selecting' | 'purchasing' | 'success' | 'error';

/**
 * Subscription plan options.
 */
interface PlanOption {
  id: 'weekly' | 'monthly' | 'yearly';
  label: string;
  price: string;
  period: string;
  savings?: string;
  recommended?: boolean;
}

const PLANS: PlanOption[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$1.99',
    period: '/week',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$4.99',
    period: '/month',
    savings: 'Save 37%',
    recommended: true,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$29.99',
    period: '/year',
    savings: 'Save 71%',
  },
];

/**
 * Benefits list with icons.
 */
const BENEFITS = [
  {
    icon: Archive,
    text: 'Full Archive Access',
    subtext: '1000+ puzzles unlocked',
  },
  {
    icon: Sparkles,
    text: 'Ad-Free Experience',
    subtext: 'Distraction-free gameplay',
  },
  {
    icon: TrendingUp,
    text: 'Exclusive Stats',
    subtext: 'Deep performance insights',
  },
  {
    icon: Heart,
    text: 'Support the Creator',
    subtext: 'Keep Football IQ growing',
  },
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
 * - selecting: Shows subscription plan options
 * - purchasing: Shows loading state during mock purchase
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
  const [state, setState] = useState<ModalState>('idle');
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const { user, profile } = useAuth();

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setState('idle');
      setSelectedPlan(null);
    }
  }, [visible]);

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
   * Handle transition to plan selection.
   */
  const handleSeePlans = useCallback(() => {
    setState('selecting');
  }, []);

  /**
   * Handle plan selection and mock purchase.
   */
  const handleSelectPlan = useCallback(
    async (plan: PlanOption) => {
      if (!user) return;

      setSelectedPlan(plan);
      setState('purchasing');

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        // Update profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            premium_purchased_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          console.error('[PremiumUpsellModal] Purchase error:', error);
          setState('error');
          return;
        }

        // Trigger success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setState('success');
      } catch (err) {
        console.error('[PremiumUpsellModal] Purchase exception:', err);
        setState('error');
      }
    },
    [user]
  );

  /**
   * Handle retry after error.
   */
  const handleRetry = useCallback(() => {
    setState('selecting');
  }, []);

  /**
   * Get title based on mode and state.
   */
  const getTitle = () => {
    if (state === 'success') return 'WELCOME TO PREMIUM!';
    if (mode === 'blocked') return 'PREMIUM CONTENT';
    return 'UNLOCK ARCHIVE';
  };

  /**
   * Get subtitle based on mode.
   */
  const getSubtitle = () => {
    if (state === 'success') return 'You now have full access to everything!';
    if (mode === 'blocked') return 'This puzzle requires premium access';
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

          {/* Content based on state */}
          {state === 'idle' && (
            <IdleContent
              benefits={BENEFITS}
              puzzleDate={puzzleDate}
              onSeePlans={handleSeePlans}
              onClose={onClose}
              testID={testID}
            />
          )}

          {state === 'selecting' && (
            <SelectingContent
              plans={PLANS}
              onSelectPlan={handleSelectPlan}
              testID={testID}
            />
          )}

          {state === 'purchasing' && (
            <PurchasingContent plan={selectedPlan} testID={testID} />
          )}

          {state === 'success' && <SuccessContent testID={testID} />}

          {state === 'error' && (
            <ErrorContent onRetry={handleRetry} onClose={onClose} testID={testID} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Idle state content - shows benefits.
 */
function IdleContent({
  benefits,
  puzzleDate,
  onSeePlans,
  onClose,
  testID,
}: {
  benefits: typeof BENEFITS;
  puzzleDate?: string | null;
  onSeePlans: () => void;
  onClose: () => void;
  testID?: string;
}) {
  return (
    <>
      {/* Benefits List */}
      <View style={styles.benefitsContainer}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <benefit.icon size={20} color={colors.cardYellow} />
            </View>
            <View style={styles.benefitTextContainer}>
              <Text style={styles.benefitText}>{benefit.text}</Text>
              <Text style={styles.benefitSubtext}>{benefit.subtext}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Puzzle Date Info */}
      {puzzleDate && (
        <Text style={styles.puzzleInfo}>
          You tried to access a puzzle from {puzzleDate}
        </Text>
      )}

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <ElevatedButton
          title="See Plans"
          onPress={onSeePlans}
          size="medium"
          topColor={colors.cardYellow}
          shadowColor="#D4A500"
          testID={`${testID}-see-plans-button`}
        />
        <ElevatedButton
          title="Maybe Later"
          onPress={onClose}
          size="medium"
          topColor={colors.glassBackground}
          shadowColor={colors.glassBorder}
          testID={`${testID}-close-button`}
        />
      </View>
    </>
  );
}

/**
 * Selecting state content - shows plan options.
 */
function SelectingContent({
  plans,
  onSelectPlan,
  testID,
}: {
  plans: PlanOption[];
  onSelectPlan: (plan: PlanOption) => void;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.plansContainer}
    >
      <Text style={styles.plansTitle}>Choose Your Plan</Text>

      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onSelect={() => onSelectPlan(plan)}
          testID={`${testID}-plan-${plan.id}`}
        />
      ))}

      <Text style={styles.planNote}>
        Cancel anytime. Restore purchases in Settings.
      </Text>
    </Animated.View>
  );
}

/**
 * Individual plan card.
 */
function PlanCard({
  plan,
  onSelect,
  testID,
}: {
  plan: PlanOption;
  onSelect: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
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
          plan.recommended && styles.planCardRecommended,
          animatedStyle,
        ]}
      >
        {plan.recommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>BEST VALUE</Text>
          </View>
        )}

        <View style={styles.planInfo}>
          <Text style={styles.planLabel}>{plan.label}</Text>
          {plan.savings && (
            <Text style={styles.planSavings}>{plan.savings}</Text>
          )}
        </View>

        <View style={styles.planPricing}>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Purchasing state content - shows loading.
 */
function PurchasingContent({
  plan,
  testID,
}: {
  plan: PlanOption | null;
  testID?: string;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.purchasingContainer}
    >
      <ActivityIndicator size="large" color={colors.cardYellow} />
      <Text style={styles.purchasingText}>
        Processing your {plan?.label.toLowerCase()} subscription...
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
  onRetry,
  onClose,
  testID,
}: {
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
        Something went wrong. Please try again.
      </Text>
      <View style={styles.buttonContainer}>
        <ElevatedButton
          title="Try Again"
          onPress={onRetry}
          size="medium"
          topColor={colors.cardYellow}
          shadowColor="#D4A500"
          testID={`${testID}-retry-button`}
        />
        <ElevatedButton
          title="Cancel"
          onPress={onClose}
          size="medium"
          topColor={colors.glassBackground}
          shadowColor={colors.glassBorder}
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
    position: 'relative',
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
    marginBottom: spacing.lg,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '600',
  },
  benefitSubtext: {
    ...textStyles.caption,
    color: colors.textSecondary,
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
  planCardRecommended: {
    borderColor: colors.cardYellow,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
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
  planPeriod: {
    ...textStyles.caption,
    color: colors.textSecondary,
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
