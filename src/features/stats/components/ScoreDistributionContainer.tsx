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

  // For Career Path, transform distribution and scores to club counts
  if (gameMode === 'career_path' && maxSteps) {
    const transformedDistribution = transformCareerPathDistribution(distribution, maxSteps);
    // userScore for Career Path should be stepsRevealed (passed as userScore)
    // We use club count directly, with maxScore = maxSteps, minScore = 1, and bucketSize = 1
    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        totalAttempts={isFirstPlayer ? 1 : totalAttempts}
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
    const transformedDistribution = transformGoalscorerDistribution(distribution, maxSteps);
    // userScore is raw scorer count (0 to totalScorers)
    return (
      <ScoreDistributionGraph
        distribution={transformedDistribution}
        totalAttempts={isFirstPlayer ? 1 : totalAttempts}
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

  return (
    <ScoreDistributionGraph
      distribution={distribution}
      totalAttempts={isFirstPlayer ? 1 : totalAttempts}
      userScore={userScore}
      maxScore={getMaxScoreForMode(gameMode)}
      bucketSize={getBucketSizeForMode(gameMode, maxSteps)}
      scoreLabels={getScoreLabelsForMode(gameMode, maxSteps)}
      isFirstPlayer={isFirstPlayer}
      testID={testID}
    />
  );
}
