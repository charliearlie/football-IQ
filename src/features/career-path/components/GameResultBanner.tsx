import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Trophy, XCircle } from 'lucide-react-native';
import { GlassCard } from '@/components';
import { colors, spacing, textStyles, borderRadius } from '@/theme';

/** Spring configuration for banner entrance */
const BANNER_SPRING = {
  damping: 12,
  stiffness: 120,
  mass: 0.8,
};

export interface GameResultBannerProps {
  /** Whether the player won */
  won: boolean;
  /** Number of steps used to solve (or total if lost) */
  stepsUsed: number;
  /** Total number of steps in the puzzle */
  totalSteps: number;
  /** The correct answer (shown on loss) */
  correctAnswer?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * GameResultBanner - Displays win or lose result.
 *
 * Shows a celebratory banner on win with the score,
 * or reveals the correct answer on loss.
 */
export function GameResultBanner({
  won,
  stepsUsed,
  totalSteps,
  correctAnswer,
  testID,
}: GameResultBannerProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(1, BANNER_SPRING);
  }, [animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedProgress.value,
    transform: [
      { scale: animatedProgress.value },
      { translateY: (1 - animatedProgress.value) * 20 },
    ],
  }));

  const Icon = won ? Trophy : XCircle;
  const iconColor = won ? colors.pitchGreen : colors.redCard;

  const cardStyle = useMemo<ViewStyle>(
    () => ({
      ...styles.card,
      ...(won ? styles.wonCard : styles.lostCard),
    }),
    [won]
  );

  return (
    <Animated.View style={animatedStyle} testID={testID}>
      <GlassCard style={cardStyle}>
        <View style={styles.content}>
          <View style={[styles.iconCircle, won ? styles.wonIcon : styles.lostIcon]}>
            <Icon size={32} color={iconColor} strokeWidth={2} />
          </View>

          <View style={styles.textContent}>
            <Text style={[styles.title, won ? styles.wonTitle : styles.lostTitle]}>
              {won ? 'Correct!' : 'Game Over'}
            </Text>

            {won ? (
              <Text style={styles.score}>
                Solved in {stepsUsed} of {totalSteps} clues
              </Text>
            ) : (
              <>
                <Text style={styles.revealLabel}>The answer was:</Text>
                <Text style={styles.answer}>{correctAnswer}</Text>
              </>
            )}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  wonCard: {
    borderColor: colors.pitchGreen,
    borderWidth: 2,
  },
  lostCard: {
    borderColor: colors.redCard,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wonIcon: {
    backgroundColor: 'rgba(88, 204, 2, 0.2)',
  },
  lostIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  textContent: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.h2,
  },
  wonTitle: {
    color: colors.pitchGreen,
  },
  lostTitle: {
    color: colors.redCard,
  },
  score: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  revealLabel: {
    ...textStyles.bodySmall,
  },
  answer: {
    ...textStyles.h3,
    color: colors.cardYellow,
  },
});
