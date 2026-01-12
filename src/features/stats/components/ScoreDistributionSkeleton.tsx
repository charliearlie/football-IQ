/**
 * ScoreDistributionSkeleton Component
 *
 * Shimmer loading state for ScoreDistributionGraph.
 * Matches the exact layout of the real graph for smooth transitions.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/Skeletons';
import { spacing } from '@/theme/spacing';

export interface ScoreDistributionSkeletonProps {
  /** Number of bars to show (default: 11 for 0-100 in 10s) */
  barCount?: number;
  /** Test ID */
  testID?: string;
}

/**
 * Skeleton placeholder for the score distribution graph.
 *
 * Renders a header skeleton, bar skeletons with varying widths,
 * and a footer skeleton to match the real graph layout.
 */
export function ScoreDistributionSkeleton({
  barCount = 11,
  testID,
}: ScoreDistributionSkeletonProps) {
  // Generate varying widths for visual interest
  // Higher scores (first bars) tend to have fewer players
  const getBarWidth = (index: number): number => {
    // Create a bell-curve-ish distribution
    const mid = Math.floor(barCount / 2);
    const distFromMid = Math.abs(index - mid);
    const baseWidth = 80 - distFromMid * 10;
    return Math.max(20, Math.min(90, baseWidth));
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Header skeleton */}
      <View style={styles.headerRow}>
        <SkeletonBox width={140} height={14} radius={4} />
      </View>

      {/* Bar skeletons */}
      <View style={styles.chartContainer}>
        {Array.from({ length: barCount }).map((_, index) => (
          <View key={index} style={styles.barRow}>
            {/* Score label skeleton */}
            <View style={styles.labelContainer}>
              <SkeletonBox width={32} height={12} radius={4} />
            </View>

            {/* Bar skeleton */}
            <View style={styles.barWrapper}>
              <SkeletonBox
                width={`${getBarWidth(index)}%`}
                height={14}
                radius={4}
              />
            </View>

            {/* Percentage skeleton */}
            <View style={styles.percentageContainer}>
              <SkeletonBox width={24} height={10} radius={4} />
            </View>
          </View>
        ))}
      </View>

      {/* Footer skeleton */}
      <View style={styles.footerRow}>
        <SkeletonBox width={160} height={11} radius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartContainer: {
    gap: spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  labelContainer: {
    width: 40,
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  barWrapper: {
    flex: 1,
  },
  percentageContainer: {
    width: 32,
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  footerRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
