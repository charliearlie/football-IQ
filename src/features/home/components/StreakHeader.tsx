import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame, ShieldCheck } from 'lucide-react-native';
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
  /**
   * Number of streak freezes available.
   */
  availableFreezes?: number;
}

/**
 * Header component showing streak and daily progress.
 *
 * Displays:
 * - Fire icon + current streak count (left side)
 * - Shield icon if freezes available
 * - "Puzzles Today (X/Y)" progress (right side)
 *
 * Uses Bebas Neue for the streak number for strong visual impact.
 */
export function StreakHeader({
  currentStreak,
  completedCount,
  totalCount,
  availableFreezes = 0,
}: StreakHeaderProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleShieldPress = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  const hasFreezes = availableFreezes > 0;

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

        {/* Freeze Shield Icon */}
        {hasFreezes && (
          <Pressable onPress={handleShieldPress} style={styles.shieldButton}>
            <ShieldCheck
              color={colors.pitchGreen}
              size={24}
              fill={colors.pitchGreen}
            />
            {showTooltip && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  {Number.isFinite(availableFreezes)
                    ? `You have ${availableFreezes} streak ${availableFreezes === 1 ? 'freeze' : 'freezes'}`
                    : 'You have unlimited streak freezes'}
                </Text>
              </View>
            )}
          </Pressable>
        )}
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
  shieldButton: {
    marginLeft: spacing.sm,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 30,
    left: -50,
    backgroundColor: colors.stadiumNavy,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.pitchGreen,
    minWidth: 150,
    zIndex: 1000,
  },
  tooltipText: {
    ...textStyles.caption,
    color: colors.floodlightWhite,
    textAlign: 'center',
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
