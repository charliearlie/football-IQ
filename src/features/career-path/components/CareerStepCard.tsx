import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GlassCard } from '@/components';
import { colors, spacing, textStyles, borderRadius } from '@/theme';
import { CareerStep } from '../types/careerPath.types';
import { LockedCard } from './LockedCard';

/** Spring configuration for card entrance animation */
const ENTRANCE_SPRING = {
  damping: 12,
  stiffness: 100,
  mass: 0.8,
};

export interface CareerStepCardProps {
  /** The career step data */
  step: CareerStep;
  /** The step number (1-indexed) */
  stepNumber: number;
  /** Whether this step is revealed */
  isRevealed: boolean;
  /** Whether this is the most recently revealed step */
  isLatest: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * CareerStepCard - Displays a single career step.
 *
 * Shows a locked blur overlay when not revealed, and animates in
 * with a spring entrance when revealed. Displays step number,
 * type badge (club/loan), club name, and year range.
 */
export function CareerStepCard({
  step,
  stepNumber,
  isRevealed,
  isLatest,
  testID,
}: CareerStepCardProps) {
  const animatedProgress = useSharedValue(isRevealed ? 1 : 0);

  useEffect(() => {
    if (isRevealed) {
      // Animate in with spring when revealed
      animatedProgress.value = withSpring(1, ENTRANCE_SPRING);
    }
  }, [isRevealed, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedProgress.value,
    transform: [
      {
        translateY: interpolate(
          animatedProgress.value,
          [0, 1],
          [30, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          animatedProgress.value,
          [0, 1],
          [0.95, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  if (!isRevealed) {
    return <LockedCard stepNumber={stepNumber} testID={testID} />;
  }

  const isLoan = step.type === 'loan';

  return (
    <Animated.View style={animatedStyle} testID={testID}>
      <GlassCard style={isLatest ? styles.latestCard : undefined}>
        <View style={styles.content}>
          {/* Step number badge */}
          <View style={[styles.stepBadge, isLatest && styles.stepBadgeLatest]}>
            <Text
              style={[styles.stepNumber, isLatest && styles.stepNumberLatest]}
            >
              {stepNumber}
            </Text>
          </View>

          {/* Step details */}
          <View style={styles.details}>
            <View style={styles.topRow}>
              <Text style={styles.clubName}>{step.text}</Text>
              {isLoan && (
                <View style={styles.loanBadge}>
                  <Text style={styles.loanText}>LOAN</Text>
                </View>
              )}
            </View>
            <Text style={styles.year}>{step.year}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  latestCard: {
    borderColor: colors.pitchGreen,
    borderWidth: 2,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeLatest: {
    backgroundColor: colors.pitchGreen,
  },
  stepNumber: {
    ...textStyles.subtitle,
    fontSize: 14,
    color: colors.textSecondary,
  },
  stepNumberLatest: {
    color: colors.stadiumNavy,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  clubName: {
    ...textStyles.subtitle,
    fontSize: 16,
    flex: 1,
  },
  loanBadge: {
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  loanText: {
    ...textStyles.caption,
    color: colors.stadiumNavy,
    fontWeight: '600',
  },
  year: {
    ...textStyles.bodySmall,
  },
});
