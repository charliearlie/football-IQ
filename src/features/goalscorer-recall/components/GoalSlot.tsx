/**
 * Goal Slot component for Goalscorer Recall.
 *
 * Displays a single goal slot that can be:
 * - Locked: Shows "???" placeholder with minute badge
 * - Revealed: Shows player name with minute badge (spring animation)
 * - Own Goal: Always revealed with "OG" badge, dimmed styling
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/theme';
import type { GoalWithState } from '../types/goalscorerRecall.types';

interface GoalSlotProps {
  goal: GoalWithState;
  isJustFound?: boolean;
}

const ENTRANCE_SPRING = {
  damping: 12,
  stiffness: 100,
  mass: 0.8,
};

export function GoalSlot({ goal, isJustFound = false }: GoalSlotProps) {
  const { scorer, minute, found, isOwnGoal } = goal;

  const animatedStyle = useAnimatedStyle(() => {
    if (found && isJustFound) {
      return {
        transform: [{ scale: withSpring(1, ENTRANCE_SPRING) }],
        opacity: withSpring(1, ENTRANCE_SPRING),
      };
    }
    return {
      transform: [{ scale: 1 }],
      opacity: 1,
    };
  }, [found, isJustFound]);

  // Format minute (e.g., "45'" or "90+3'")
  const formatMinute = (min: number): string => {
    if (min > 90) {
      return `90+${min - 90}'`;
    }
    if (min > 45 && min <= 48) {
      return `45+${min - 45}'`;
    }
    return `${min}'`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        found && styles.foundContainer,
        isOwnGoal && styles.ownGoalContainer,
        animatedStyle,
      ]}
      layout={Layout.springify()}
    >
      {/* Minute Badge */}
      <View style={[styles.minuteBadge, isOwnGoal && styles.ownGoalBadge]}>
        <Text style={styles.minuteText}>{formatMinute(minute)}</Text>
      </View>

      {/* Scorer Name or Placeholder */}
      <View style={styles.scorerContainer}>
        {found ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text
              style={[
                styles.scorerName,
                isOwnGoal && styles.ownGoalText,
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {scorer}
              {isOwnGoal && <Text style={styles.ownGoalLabel}> (OG)</Text>}
            </Text>
          </Animated.View>
        ) : (
          <Text style={styles.placeholder}>???</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  foundContainer: {
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    borderColor: colors.pitchGreen,
  },
  ownGoalContainer: {
    opacity: 0.6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.redCard,
  },
  minuteBadge: {
    backgroundColor: colors.cardYellow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 44,
    alignItems: 'center',
  },
  ownGoalBadge: {
    backgroundColor: colors.redCard,
  },
  minuteText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: colors.stadiumNavy,
  },
  scorerContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  scorerName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.floodlightWhite,
  },
  ownGoalText: {
    color: colors.redCard,
  },
  ownGoalLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    opacity: 0.8,
  },
  placeholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.floodlightWhite,
    opacity: 0.4,
  },
});
