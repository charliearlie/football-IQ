/**
 * ScoreDistributionContainer
 *
 * Smart component that manages data fetching and renders
 * either the graph or skeleton loading state.
 *
 * Use this component in result modals to show score distribution.
 */

import React from 'react';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
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
  const { distribution, totalAttempts, isLoading, error } = useScoreDistribution(
    puzzleId,
    gameMode
  );

  // Fail silently on error - graph is a nice-to-have feature
  if (error) {
    return null;
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
    const { distribution: mergedDistribution, totalAttempts: mergedTotal } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 10);

    // Transform merged distribution to points-based display
    const transformedDistribution = transformCareerPathDistribution(mergedDistribution, maxSteps);

    // We use club count directly, with maxScore = maxSteps, minScore = 1, and bucketSize = 1
    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        totalAttempts={isFirstPlayer ? 1 : mergedTotal}
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
    const { distribution: mergedDistribution, totalAttempts: mergedTotal } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 10);

    // Transform merged distribution to scorer-count-based display
    const transformedDistribution = transformGoalscorerDistribution(mergedDistribution, maxSteps);

    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        totalAttempts={isFirstPlayer ? 1 : mergedTotal}
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

  // For The Chain, use normalized 0-100 scores with step count labels
  // Lower steps = better = higher normalized score (2 steps = 100, 11+ steps = 0)
  if (gameMode === 'the_chain') {
    // userScore is step count (e.g., 5 steps)
    // Convert to normalized: (12 - steps) * 10, clamped to 0-100
    // 2 steps → 100, 3 → 90, 4 → 80, 5 → 70, ..., 11+ → 10/0
    const normalizedUserScore = Math.max(0, Math.min(100, (12 - userScore) * 10));

    // Optimistically merge user's attempt into distribution (API uses buckets of 10)
    const { distribution: mergedDistribution, totalAttempts: mergedTotal } =
      mergeUserAttemptOptimistically(distribution, totalAttempts, normalizedUserScore, 10);

    // Use default 0-100 display with custom step labels
    return (
      <ScoreDistributionGraph
        distribution={mergedDistribution}
        totalAttempts={isFirstPlayer ? 1 : mergedTotal}
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
  const { distribution: mergedDistribution, totalAttempts: mergedTotal } =
    mergeUserAttemptOptimistically(distribution, totalAttempts, userScore, bucketSize);

  return (
    <ScoreDistributionGraph
      distribution={mergedDistribution}
      totalAttempts={isFirstPlayer ? 1 : mergedTotal}
      userScore={userScore}
      maxScore={getMaxScoreForMode(gameMode)}
      bucketSize={bucketSize}
      scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
      isFirstPlayer={isFirstPlayer}
      testID={testID}
    />
  );
}
