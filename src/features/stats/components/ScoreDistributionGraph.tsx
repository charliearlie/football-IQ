/**
 * ScoreDistributionGraph Component
 *
 * Horizontal bar chart showing score distribution for a puzzle.
 * Highlights the user's score bucket in Pitch Green.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { DistributionEntry } from '../services/distributionService';

export interface ScoreDistributionGraphProps {
  /** Distribution data from API */
  distribution: DistributionEntry[];
  /** Total attempts for footer text */
  totalAttempts: number;
  /** User's normalized score (0-100) to highlight */
  userScore: number;
  /** Maximum possible score for bucket calculation */
  maxScore?: number;
  /** Minimum possible score for bucket calculation (default 0) */
  minScore?: number;
  /** Size of each bucket (default 10) */
  bucketSize?: number;
  /** Custom score labels (e.g., ["10/10", "9/10", ...]) */
  scoreLabels?: string[];
  /** Whether this is the first player (no prior attempts) */
  isFirstPlayer?: boolean;
  /** Test ID */
  testID?: string;
}

/**
 * Group distribution into display buckets and calculate max percentage.
 */
function prepareDistributionData(
  distribution: DistributionEntry[],
  maxScore: number,
  bucketSize: number,
  minScore: number = 0
): { buckets: { score: number; percentage: number }[]; maxPercentage: number } {
  // Initialize bucket map
  const bucketMap: Map<number, number> = new Map();
  for (let i = maxScore; i >= minScore; i -= bucketSize) {
    bucketMap.set(i, 0);
  }

  // Sum percentages into buckets
  for (const entry of distribution) {
    const bucketKey = Math.floor(entry.score / bucketSize) * bucketSize;
    if (bucketMap.has(bucketKey)) {
      const current = bucketMap.get(bucketKey) || 0;
      bucketMap.set(bucketKey, current + entry.percentage);
    }
  }

  // Convert to array sorted by score descending (100 to 0)
  const buckets = Array.from(bucketMap.entries())
    .map(([score, percentage]) => ({ score, percentage }))
    .sort((a, b) => b.score - a.score);

  // Find max percentage for scaling bars
  const maxPercentage = Math.max(...buckets.map((b) => b.percentage), 1);

  return { buckets, maxPercentage };
}

/**
 * Generate default labels from scores.
 */
function getDefaultLabel(score: number): string {
  return `${score}%`;
}

export function ScoreDistributionGraph({
  distribution,
  totalAttempts,
  userScore,
  maxScore = 100,
  minScore = 0,
  bucketSize = 10,
  scoreLabels,
  isFirstPlayer = false,
  testID,
}: ScoreDistributionGraphProps) {
  // For first player, create a synthetic distribution with 100% in their bucket
  const effectiveDistribution = isFirstPlayer
    ? [{ score: Math.floor(userScore / bucketSize) * bucketSize, count: 1, percentage: 100 }]
    : distribution;

  const { buckets, maxPercentage } = prepareDistributionData(
    effectiveDistribution,
    maxScore,
    bucketSize,
    minScore
  );

  // Find which bucket the user's score falls into
  const userBucket = Math.floor(userScore / bucketSize) * bucketSize;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.container}
      testID={testID}
    >
      {/* Header */}
      <Text style={styles.header}>HOW YOU COMPARE</Text>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        {buckets.map((bucket, index) => {
          const isUserScore = bucket.score === userBucket;
          // Use absolute percentage for bar width (25% = 25% width)
          // Minimum 3% width for non-zero values to ensure visibility
          const barWidth = bucket.percentage > 0 ? Math.max(bucket.percentage, 3) : 0;

          // Get label - use custom if provided, otherwise default
          const label = scoreLabels?.[index] ?? getDefaultLabel(bucket.score);

          return (
            <View key={bucket.score} style={styles.barRow}>
              {/* Score Label */}
              <Text
                style={[
                  styles.scoreLabel,
                  isUserScore && styles.userScoreLabel,
                ]}
              >
                {label}
              </Text>

              {/* Bar Track */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: isUserScore
                        ? colors.pitchGreen
                        : colors.glassBackground,
                    },
                    isUserScore && styles.userBar,
                  ]}
                />
              </View>

              {/* Percentage Label */}
              <Text
                style={[
                  styles.percentageLabel,
                  isUserScore && styles.userPercentageLabel,
                ]}
              >
                {bucket.percentage > 0
                  ? `${Math.round(bucket.percentage)}%`
                  : ''}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        {isFirstPlayer
          ? "You're setting the bar!"
          : `Based on ${totalAttempts.toLocaleString()} global attempt${totalAttempts !== 1 ? 's' : ''}`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.md,
  },
  header: {
    fontFamily: fonts.headline,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.textSecondary,
    textAlign: 'center',
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
  scoreLabel: {
    fontFamily: fonts.body,
    fontWeight: '400',
    fontSize: 11,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  userScoreLabel: {
    color: colors.pitchGreen,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  userBar: {
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  percentageLabel: {
    fontFamily: fonts.body,
    fontWeight: '400',
    fontSize: 10,
    color: colors.textSecondary,
    width: 32,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  userPercentageLabel: {
    color: colors.pitchGreen,
    fontWeight: '600',
  },
  footer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
