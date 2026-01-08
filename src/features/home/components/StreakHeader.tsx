import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors, textStyles, spacing, fonts } from '@/theme';

interface StreakHeaderProps {
  /**
   * Current streak count (consecutive days with at least 1 completed puzzle).
   */
  currentStreak: number;
  /**
   * Number of puzzles completed today.
   */
  completedCount: number;
  /**
   * Total number of puzzles available today.
   */
  totalCount: number;
}

/**
 * Header component showing streak and daily progress.
 *
 * Displays:
 * - Fire icon + current streak count (left side)
 * - "Puzzles Today (X/Y)" progress (right side)
 *
 * Uses Bebas Neue for the streak number for strong visual impact.
 */
export function StreakHeader({
  currentStreak,
  completedCount,
  totalCount,
}: StreakHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Streak Section */}
      <View style={styles.streakContainer}>
        <Flame
          color={currentStreak > 0 ? colors.cardYellow : colors.textSecondary}
          size={28}
          fill={currentStreak > 0 ? colors.cardYellow : 'transparent'}
        />
        <Text style={styles.streakCount}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>day streak</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Puzzles Today
        </Text>
        <Text style={styles.progressCount}>
          {completedCount}/{totalCount}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakCount: {
    fontFamily: fonts.headline,
    fontSize: 36,
    lineHeight: 40,
    color: colors.floodlightWhite,
    marginLeft: spacing.xs,
  },
  streakLabel: {
    ...textStyles.bodySmall,
    marginLeft: spacing.xs,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    ...textStyles.caption,
  },
  progressCount: {
    fontFamily: fonts.headline,
    fontSize: 24,
    lineHeight: 28,
    color: colors.pitchGreen,
  },
});
