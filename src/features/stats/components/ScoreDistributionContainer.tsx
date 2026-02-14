/**
 * ScoreDistributionContainer
 *
 * Smart component that manages data fetching and renders
 * either the graph or skeleton loading state.
 *
 * Use this component in result modals to show score distribution.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useScoreDistribution } from '../hooks/useScoreDistribution';
import { ScoreDistributionGraph } from './ScoreDistributionGraph';
import { ScoreDistributionSkeleton } from './ScoreDistributionSkeleton';
import {
  getMaxScoreForMode,
  getBucketSizeForMode,
  getBarCountForMode,
  getScoreLabelsForMode,
} from '../utils/distributionConfig';
import { DistributionEntry } from '../services/distributionService';

/**
 * Transform Career Path distribution from normalized 0-100 scores to points.
 *
 * The bucket/label relationship:
 * - Bucket 5 (points=5) -> index 0 -> label "1 club" (best)
 * - Bucket 4 (points=4) -> index 1 -> label "2 clubs"
 * - Bucket 1 (points=1) -> index 4 -> label "5 clubs" (worst)
 *
 * @see src/features/stats/utils/careerPathDistribution.ts for standalone version
 */
function transformCareerPathDistribution(
  distribution: DistributionEntry[],
  maxSteps: number
): DistributionEntry[] {
  // Group by points value
  const pointsMap = new Map<number, number>();

  for (const entry of distribution) {
    // Convert normalized score (0-100) back to points (0 to maxSteps)
    // normalized = (points / maxSteps) * 100
    // points = normalized * maxSteps / 100
    const points = Math.round((entry.score * maxSteps) / 100);

    // Clamp to valid bucket range (1 to maxSteps)
    // Score of 0 (loss) maps to bucket 1 (worst)
    const clampedPoints = Math.max(1, Math.min(points, maxSteps));

    const current = pointsMap.get(clampedPoints) || 0;
    pointsMap.set(clampedPoints, current + entry.percentage);
  }

  // Convert to array with points as score
  return Array.from(pointsMap.entries()).map(([points, percentage]) => ({
    score: points,
    count: 0, // Not used for display
    percentage,
  }));
}

/**
 * Transform Goalscorer Recall distribution from normalized 0-100 scores to scorer counts.
 * Scorer count = normalizedScore / 100 * totalScorers
 */
function transformGoalscorerDistribution(
  distribution: DistributionEntry[],
  totalScorers: number
): DistributionEntry[] {
  const scorerMap = new Map<number, number>();

  for (const entry of distribution) {
    // Convert normalized score back to scorers found
    const scorersFound = Math.round(entry.score / 100 * totalScorers);
    const current = scorerMap.get(scorersFound) || 0;
    scorerMap.set(scorersFound, current + entry.percentage);
  }

  return Array.from(scorerMap.entries()).map(([scorers, percentage]) => ({
    score: scorers,
    count: 0, // Not used for display
    percentage,
  }));
}

/**
 * Transform Threads distribution from normalized 0-100 scores to hint-count buckets.
 *
 * Possible normalized scores: 100 (0 hints), 60 (1 hint), 40 (2 hints), 20 (3 hints), 0 (give up).
 * Maps to 5 buckets: 4 (best) → 0 (worst).
 */
function transformThreadDistribution(
  distribution: DistributionEntry[]
): DistributionEntry[] {
  const bucketMap = new Map<number, number>();

  for (const entry of distribution) {
    // Map normalized score to hint bucket
    let bucket: number;
    if (entry.score >= 80) bucket = 4;       // 0 hints (100 normalized)
    else if (entry.score >= 50) bucket = 3;  // 1 hint (60 normalized)
    else if (entry.score >= 30) bucket = 2;  // 2 hints (40 normalized)
    else if (entry.score >= 10) bucket = 1;  // 3 hints (20 normalized)
    else bucket = 0;                          // Give up (0 normalized)

    const current = bucketMap.get(bucket) || 0;
    bucketMap.set(bucket, current + entry.percentage);
  }

  return Array.from(bucketMap.entries()).map(([score, percentage]) => ({
    score,
    count: 0,
    percentage,
  }));
}

/**
 * Map Threads raw points to hint-count bucket value.
 * 10 pts → 4 (0 hints), 6 → 3 (1 hint), 4 → 2, 2 → 1, 0 → 0.
 */
function threadPointsToHintBucket(points: number): number {
  if (points >= 10) return 4;
  if (points >= 6) return 3;
  if (points >= 4) return 2;
  if (points >= 2) return 1;
  return 0;
}

/**
 * Optimistically merge user's score into distribution.
 *
 * The API may not yet include the user's just-completed attempt due to sync delay.
 * This function adjusts all percentages to reflect totalAttempts + 1,
 * ensuring the user's score is immediately visible in the chart.
 *
 * Math:
 * - old_count = old_percentage * old_total / 100
 * - new_percentage = old_count / new_total * 100
 * - For user's bucket: add 1 to count before calculating new percentage
 */
function mergeUserAttemptOptimistically(
  distribution: DistributionEntry[],
  totalAttempts: number,
  userBucket: number,
  bucketSize: number = 10
): { distribution: DistributionEntry[]; totalAttempts: number } {
  const newTotal = totalAttempts + 1;

  // Recalculate all percentages for new total
  const merged = distribution.map((entry) => {
    // new_percentage = old_percentage * old_total / new_total
    const newPercentage = totalAttempts > 0
      ? (entry.percentage * totalAttempts) / newTotal
      : 0;
    return { ...entry, percentage: newPercentage };
  });

  // Find user's bucket (floor to bucket boundary)
  const userBucketKey = Math.floor(userBucket / bucketSize) * bucketSize;

  // Find or create user's bucket and add their attempt
  const userEntry = merged.find((e) => e.score === userBucketKey);
  if (userEntry) {
    // Add 1 attempt: increment percentage by (100 / new_total)
    userEntry.percentage += (100 / newTotal);
  } else {
    // Create new bucket with 1 attempt
    merged.push({
      score: userBucketKey,
      count: 1,
      percentage: 100 / newTotal,
    });
  }

  return { distribution: merged, totalAttempts: newTotal };
}

export interface ScoreDistributionContainerProps {
  /** Puzzle ID to fetch distribution for */
  puzzleId: string;
  /** Game mode for display configuration */
  gameMode: GameMode;
  /** User's score for highlighting (raw score for dynamic modes, normalized for others) */
  userScore: number;
  /** Max steps for dynamic modes (career_path: clubs, guess_the_goalscorers: total scorers) */
  maxSteps?: number;
  /** Test ID */
  testID?: string;
}

/**
 * Container component for score distribution graph.
 *
 * Handles:
 * - Data fetching via useScoreDistribution hook
 * - Loading state with skeleton
 * - Error handling (fails silently, graph is nice-to-have)
 * - Per-game-mode configuration
 *
 * @example
 * ```tsx
 * // In TopTensResultModal:
 * <ScoreDistributionContainer
 *   puzzleId={puzzleId}
 *   gameMode="top_tens"
 *   userScore={score.points * 10}  // Normalize 0-10 to 0-100
 * />
 *
 * // In GoalscorerRecallResultModal (dynamic scale):
 * <ScoreDistributionContainer
 *   puzzleId={puzzleId}
 *   gameMode="guess_the_goalscorers"
 *   userScore={score.points}       // Raw scorer count (0-N)
 *   maxSteps={score.totalScorers}  // For dynamic labels
 * />
 * ```
 */
export function ScoreDistributionContainer({
  puzzleId,
  gameMode,
  userScore,
  maxSteps,
  testID,
}: ScoreDistributionContainerProps) {
  const { isConnected } = useNetworkStatus();
  const { distribution, totalAttempts, isLoading, error } = useScoreDistribution(
    puzzleId,
    gameMode
  );

  // Show offline placeholder when offline or on fetch error
  if (isConnected === false || error) {
    return (
      <View
        style={offlineStyles.container}
        testID={testID ? `${testID}-offline` : undefined}
      >
        <Text style={offlineStyles.text}>
          Score distribution unavailable offline
        </Text>
      </View>
    );
  }

  // Show skeleton while loading
  if (isLoading) {
    return (
      <ScoreDistributionSkeleton
        barCount={getBarCountForMode(gameMode, maxSteps)}
        testID={testID ? `${testID}-skeleton` : undefined}
      />
    );
  }

  // Check if this is the first player (no prior attempts)
  const isFirstPlayer = distribution.length === 0 && totalAttempts === 0;

  // For Career Path and Career Path Pro, transform distribution and scores to club counts
  if ((gameMode === 'career_path' || gameMode === 'career_path_pro') && maxSteps) {
    // userScore is in points (1 to maxSteps), convert to normalized for bucket matching
    // normalized = (points / maxSteps) * 100
    const normalizedUserScore = (userScore / maxSteps) * 100;

    // Optimistically merge user's attempt into distribution (API uses buckets of 10)
    const { distribution: mergedDistribution } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 10);

    // Transform merged distribution to points-based display
    const transformedDistribution = transformCareerPathDistribution(mergedDistribution, maxSteps);

    // We use club count directly, with maxScore = maxSteps, minScore = 1, and bucketSize = 1
    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        userScore={userScore}
        maxScore={maxSteps}
        minScore={1}
        bucketSize={1}
        scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
        isFirstPlayer={isFirstPlayer}
        testID={testID}
      />
    );
  }

  // For Goalscorer Recall, transform distribution to scorer counts (dynamic scale)
  if (gameMode === 'guess_the_goalscorers' && maxSteps) {
    // userScore is raw scorer count (0 to totalScorers)
    // Convert to normalized for bucket matching: (scorersFound / totalScorers) * 100
    const normalizedUserScore = (userScore / maxSteps) * 100;

    // Optimistically merge user's attempt into distribution (API uses buckets of 10)
    const { distribution: mergedDistribution } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 10);

    // Transform merged distribution to scorer-count-based display
    const transformedDistribution = transformGoalscorerDistribution(mergedDistribution, maxSteps);

    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        userScore={userScore}
        maxScore={maxSteps}
        minScore={0}
        bucketSize={1}
        scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
        isFirstPlayer={isFirstPlayer}
        testID={testID}
      />
    );
  }

  // For Threads, transform distribution to hint-count display (5 bars)
  if (gameMode === 'the_thread') {
    // userScore is raw points (0, 2, 4, 6, 10), normalize to 0-100
    const normalizedUserScore = userScore * 10;

    // Optimistically merge at normalized scale (API uses 20-point buckets)
    const { distribution: mergedDistribution } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 20);

    // Transform to 5 hint-count buckets
    const transformedDistribution = transformThreadDistribution(mergedDistribution);

    // Map user points to hint bucket: 10→4, 6→3, 4→2, 2→1, 0→0
    const userHintBucket = threadPointsToHintBucket(userScore);

    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        userScore={userHintBucket}
        maxScore={4}
        minScore={0}
        bucketSize={1}
        scoreLabels={getScoreLabelsForMode(gameMode)}
        isFirstPlayer={isFirstPlayer}
        testID={testID}
      />
    );
  }

  // For The Chain, use normalized 0-100 scores with step count labels
  // Lower steps = better = higher normalized score (2 steps = 100, 11+ steps = 0)
  if (gameMode === 'the_chain') {
    // userScore is step count (e.g., 5 steps)
    // Convert to normalized: (12 - steps) * 10, clamped to 0-100
    // 2 steps → 100, 3 → 90, 4 → 80, 5 → 70, ..., 11+ → 10/0
    const normalizedUserScore = Math.max(0, Math.min(100, (12 - userScore) * 10));

    // Optimistically merge user's attempt into distribution (API uses buckets of 10)
    const { distribution: mergedDistribution } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 10);

    // Use default 0-100 display with custom step labels
    return (
      <ScoreDistributionGraph
        distribution={mergedDistribution}
        userScore={normalizedUserScore}
        maxScore={100}
        bucketSize={10}
        scoreLabels={getScoreLabelsForMode(gameMode)}
        isFirstPlayer={isFirstPlayer}
        testID={testID}
      />
    );
  }

  // For all other game modes (normalized 0-100 scores)
  // userScore is already normalized for these modes
  const bucketSize = getBucketSizeForMode(gameMode, maxSteps);

  // Optimistically merge user's attempt into distribution
  const { distribution: mergedDistribution } =
    mergeUserAttemptOptimistically(distribution, totalAttempts, userScore, bucketSize);

  return (
    <ScoreDistributionGraph
      distribution={mergedDistribution}
      userScore={userScore}
      maxScore={getMaxScoreForMode(gameMode)}
      bucketSize={bucketSize}
      scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
      isFirstPlayer={isFirstPlayer}
      testID={testID}
    />
  );
}

const offlineStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  text: {
    fontSize: 13,
    color: 'rgba(248, 250, 252, 0.5)',
    fontStyle: 'italic',
  },
});
