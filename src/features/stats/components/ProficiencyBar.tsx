/**
 * Proficiency Bar Component
 *
 * Single skill progress bar with animated fill.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
  LucideIcon,
} from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

interface ProficiencyBarProps {
  gameMode: GameMode;
  displayName: string;
  percentage: number;
  gamesPlayed: number;
}

/**
 * Get icon component for a game mode.
 */
function getGameModeIcon(gameMode: GameMode): LucideIcon {
  switch (gameMode) {
    case 'career_path':
      return Briefcase;
    case 'guess_the_transfer':
      return ArrowRightLeft;
    case 'guess_the_goalscorers':
      return Target;
    case 'tic_tac_toe':
      return Grid3X3;
    case 'topical_quiz':
      return HelpCircle;
  }
}

/**
 * Get color based on percentage tier.
 * Green: 70+, Yellow: 40-69, Orange: <40
 */
function getTierColor(percentage: number): string {
  if (percentage >= 70) return colors.pitchGreen;
  if (percentage >= 40) return colors.cardYellow;
  return colors.warningOrange;
}

export function ProficiencyBar({
  gameMode,
  displayName,
  percentage,
  gamesPlayed,
}: ProficiencyBarProps) {
  const IconComponent = getGameModeIcon(gameMode);
  const tierColor = getTierColor(percentage);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(percentage, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage, animatedWidth]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          <IconComponent
            color={colors.floodlightWhite}
            size={16}
            strokeWidth={2}
          />
          <Text style={[textStyles.bodySmall, styles.displayName]}>
            {displayName}
          </Text>
        </View>
        <Text style={[textStyles.bodySmall, { color: tierColor }]}>
          {percentage}%
        </Text>
      </View>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: tierColor },
            animatedBarStyle,
          ]}
        />
      </View>
      <Text style={[textStyles.caption, styles.gamesPlayed]}>
        {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'} played
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  displayName: {
    color: colors.floodlightWhite,
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  gamesPlayed: {
    marginTop: spacing.xs,
    opacity: 0.6,
  },
});
