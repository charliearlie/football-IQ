/**
 * RankBadge - Displays the user's current tier with progress to next rank
 *
 * Shows:
 * - Current tier name (e.g., "Impact Sub")
 * - Total IQ points
 * - Progress bar to next tier
 * - Points needed to reach next tier
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { TrendingUp } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import {
  getTierForPoints,
  getProgressToNextTier,
  getPointsToNextTier,
  getTierColor,
  getNextTier,
  formatTotalIQ,
} from '../../utils/tierProgression';

export interface RankBadgeProps {
  totalIQ: number;
  testID?: string;
}

export function RankBadge({ totalIQ, testID }: RankBadgeProps) {
  const tier = getTierForPoints(totalIQ);
  const progress = getProgressToNextTier(totalIQ);
  const pointsNeeded = getPointsToNextTier(totalIQ);
  const nextTier = getNextTier(tier);
  const tierColor = getTierColor(tier.tier);

  // Animated progress bar width
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      300,
      withSpring(progress, { damping: 15, stiffness: 100 })
    );
  }, [progress, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const isMaxLevel = tier.tier === 10;

  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(400)}
      style={styles.container}
      testID={testID}
    >
      {/* Header: Tier name + Total IQ */}
      <View style={styles.header}>
        <View style={styles.tierSection}>
          <View style={[styles.tierIndicator, { backgroundColor: tierColor }]} />
          <Text style={[styles.tierName, { color: tierColor }]}>
            {tier.name}
          </Text>
        </View>
        <View style={styles.iqSection}>
          <TrendingUp size={14} color={colors.pitchGreen} />
          <Text style={styles.totalIQ}>{formatTotalIQ(totalIQ)}</Text>
        </View>
      </View>

      {/* Progress bar */}
      {!isMaxLevel && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: tierColor },
                progressBarStyle,
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {progress}% to {nextTier?.name}
            </Text>
            <Text style={styles.pointsNeeded}>
              {pointsNeeded.toLocaleString()} pts needed
            </Text>
          </View>
        </View>
      )}

      {/* Max level message */}
      {isMaxLevel && (
        <View style={styles.maxLevelSection}>
          <Text style={[styles.maxLevelText, { color: tierColor }]}>
            Maximum Level Achieved
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierName: {
    fontFamily: fonts.headline,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  iqSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  totalIQ: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  pointsNeeded: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  maxLevelSection: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  maxLevelText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
