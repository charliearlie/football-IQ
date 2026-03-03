/**
 * NextMilestoneTicker - Animated progress bar toward the next unlock.
 *
 * Layout:
 *   - Icon (Flame / Trophy / Star) + label text in floodlightWhite
 *   - current/target subtitle in textSecondary
 *   - 6px tall progress bar: pitchGreen fill over glassBackground track, rounded ends
 *
 * The filled width animates from 0 → (current/target * 100)% on mount
 * using react-native-reanimated withTiming.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Flame, Trophy, Star } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { MilestoneInfo, MilestoneType } from '../types/scoutReport.types';

const MILESTONE_ICON: Record<MilestoneType, LucideIcon> = {
  streak: Flame,
  games: Trophy,
  perfects: Star,
};

export interface NextMilestoneTickerProps {
  milestone: MilestoneInfo;
  testID?: string;
}

export function NextMilestoneTicker({ milestone, testID }: NextMilestoneTickerProps) {
  const { type, current, target, label } = milestone;

  const progressPercent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progressPercent, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressPercent, animatedWidth]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const Icon = MILESTONE_ICON[type];

  return (
    <View style={styles.container} testID={testID}>
      {/* Header row: icon + label */}
      <View style={styles.headerRow}>
        <Icon size={16} color={colors.pitchGreen} strokeWidth={2} />
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* Subtitle: current / target */}
      <Text style={styles.subtitle}>
        {current.toLocaleString()} / {target.toLocaleString()}
      </Text>

      {/* Progress bar */}
      <View style={styles.trackBackground}>
        <Animated.View style={[styles.trackFill, animatedBarStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontWeight: fontWeights.bold,
    fontSize: 14,
    color: colors.floodlightWhite,
    flex: 1,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  trackBackground: {
    height: 6,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.pitchGreen,
    borderRadius: borderRadius.sm,
  },
});
