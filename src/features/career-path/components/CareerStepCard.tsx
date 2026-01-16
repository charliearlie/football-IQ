import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { CheckCircle } from 'lucide-react-native';
import { GlassCard } from '@/components';
import { colors, spacing, textStyles, borderRadius, glows } from '@/theme';
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
  /** Highlight as the winning step in review mode (green border/glow) */
  isWinningStep?: boolean;
  /** Mark as the missed step when lost in review mode (red border + "MISSED" badge) */
  isMissedStep?: boolean;
  /** Force reveal this card during victory sequence (overrides isRevealed) */
  forceReveal?: boolean;
  /** Delay in ms for staggered reveal animation */
  revealDelay?: number;
  /** Style as victory-revealed card (green glow) */
  isVictoryReveal?: boolean;
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
  isWinningStep = false,
  isMissedStep = false,
  forceReveal = false,
  revealDelay = 0,
  isVictoryReveal = false,
}: CareerStepCardProps) {
  const animatedProgress = useSharedValue(isRevealed ? 1 : 0);
  const victoryProgress = useSharedValue(0);

  useEffect(() => {
    if (isRevealed) {
      // Animate in with spring when revealed
      animatedProgress.value = withSpring(1, ENTRANCE_SPRING);
    }
  }, [isRevealed, animatedProgress]);

  // Victory reveal animation - staggered entrance for hidden cards during win
  useEffect(() => {
    if (forceReveal && !isRevealed) {
      // Trigger animation after delay for staggered effect
      const timer = setTimeout(() => {
        victoryProgress.value = withSpring(1, {
          damping: 10,
          stiffness: 120,
          mass: 0.8,
        });
      }, revealDelay);
      return () => clearTimeout(timer);
    }
  }, [forceReveal, revealDelay, isRevealed, victoryProgress]);

  // Victory reveal animated style with scale bounce
  const victoryAnimatedStyle = useAnimatedStyle(() => {
    if (!forceReveal || isRevealed) return {};

    return {
      opacity: victoryProgress.value,
      transform: [
        {
          translateY: interpolate(
            victoryProgress.value,
            [0, 1],
            [20, 0],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            victoryProgress.value,
            [0, 0.5, 1],
            [0.9, 1.05, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

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

  // Show locked card if not revealed AND not force-revealing (victory sequence)
  if (!isRevealed && !forceReveal) {
    return <LockedCard stepNumber={stepNumber} testID={testID} />;
  }

  // Determine which animation style to use
  const currentAnimatedStyle = forceReveal && !isRevealed ? victoryAnimatedStyle : animatedStyle;

  const isLoan = step.type === 'loan';

  // Determine card style based on state (victory > winning > missed > latest > default)
  const getCardStyle = () => {
    if (isVictoryReveal) return styles.victoryCard;
    if (isWinningStep) return styles.winningCard;
    if (isMissedStep) return styles.missedCard;
    if (isLatest) return styles.latestCard;
    return undefined;
  };

  // Determine step badge style
  const getStepBadgeStyle = () => {
    if (isWinningStep) return styles.stepBadgeWinning;
    if (isLatest) return styles.stepBadgeLatest;
    return undefined;
  };

  // Determine step number text style
  const getStepNumberStyle = () => {
    if (isWinningStep || isLatest) return styles.stepNumberLatest;
    return undefined;
  };

  return (
    <Animated.View style={currentAnimatedStyle} testID={testID}>
      <GlassCard style={getCardStyle()}>
        <View style={styles.content}>
          {/* Step number badge */}
          <View style={[styles.stepBadge, getStepBadgeStyle()]}>
            <Text style={[styles.stepNumber, getStepNumberStyle()]}>
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
            {/* Stats row (apps/goals) - only render if either exists */}
            {(step.apps !== undefined || step.goals !== undefined) && (
              <View style={styles.statsRow}>
                {step.apps !== undefined && (
                  <Text style={styles.statText}>{step.apps} Apps</Text>
                )}
                {step.apps !== undefined && step.goals !== undefined && (
                  <Text style={styles.statSeparator}>•</Text>
                )}
                {step.goals !== undefined && (
                  <Text style={styles.statText}>{step.goals} Gls</Text>
                )}
              </View>
            )}
          </View>

          {/* Winning badge */}
          {isWinningStep && (
            <View style={styles.winningBadge} testID="winning-badge">
              <CheckCircle size={20} color={colors.stadiumNavy} strokeWidth={2.5} />
            </View>
          )}
        </View>
      </GlassCard>

      {/* Missed badge - positioned outside GlassCard for overlap */}
      {isMissedStep && (
        <View style={styles.missedBadge} testID="missed-badge">
          <Text style={styles.missedBadgeText}>MISSED</Text>
        </View>
      )}
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
    ...glows.green,
  },
  // Victory reveal card style - shown during victory sequence animation
  victoryCard: {
    borderColor: colors.pitchGreen,
    borderWidth: 2,
    ...glows.green,
    shadowOpacity: 0.5,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statText: {
    ...textStyles.caption,
    color: 'rgba(248, 250, 252, 0.8)', // floodlightWhite at 80% opacity
  },
  statSeparator: {
    ...textStyles.caption,
    color: 'rgba(248, 250, 252, 0.5)', // muted separator
  },
  // Winning step styles (review mode)
  winningCard: {
    borderColor: colors.pitchGreen,
    borderWidth: 2,
    ...glows.green,
    shadowOpacity: 0.6, // Stronger glow for winning state
    shadowRadius: 16,
  },
  stepBadgeWinning: {
    backgroundColor: colors.pitchGreen,
  },
  winningBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.pitchGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Missed step styles (review mode)
  missedCard: {
    borderColor: colors.redCard,
    borderWidth: 2,
    ...glows.red,
    shadowOpacity: 0.4,
  },
  missedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.redCard,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  missedBadgeText: {
    ...textStyles.caption,
    color: colors.floodlightWhite,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
