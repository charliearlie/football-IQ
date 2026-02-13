/**
 * Top Tens Scoring
 *
 * Flat tier scoring system for Top Tens game mode.
 * Score is determined by how many answers you find, with a bonus for finding all 10.
 *
 * Tiers:
 * - 1-2 answers: 1 IQ point
 * - 3-4 answers: 2 IQ points
 * - 5-6 answers: 3 IQ points
 * - 7-8 answers: 4 IQ points
 * - 9 answers: 5 IQ points
 * - 10 answers: 8 IQ points (Jackpot!)
 *
 * Score progression: 1 → 1 → 2 → 2 → 3 → 3 → 4 → 4 → 5 → 8
 */

import type { TopTensScore } from '../types/topTens.types';

/** Maximum possible points */
export const MAX_POINTS = 8;

// Re-export for consumers that import from scoring
export type { TopTensScore };

/**
 * Get the score for a given number of answers found.
 * Uses flat tier system rather than cumulative.
 */
function getScoreForFoundCount(foundCount: number): number {
  if (foundCount <= 0) return 0;
  if (foundCount <= 2) return 1;
  if (foundCount <= 4) return 2;
  if (foundCount <= 6) return 3;
  if (foundCount <= 8) return 4;
  if (foundCount === 9) return 5;
  return 8; // foundCount >= 10 (Jackpot!)
}

/**
 * Calculate points for a given number of answers found.
 *
 * @param foundCount - Number of answers found (0-10)
 * @returns Total points based on flat tier system
 *
 * @example
 * calculatePoints(1)  // 1 (tier 1)
 * calculatePoints(2)  // 1 (tier 1)
 * calculatePoints(5)  // 3 (tier 3)
 * calculatePoints(10) // 8 (jackpot!)
 */
export function calculatePoints(foundCount: number): number {
  return getScoreForFoundCount(foundCount);
}

/**
 * Calculate the final score.
 *
 * Flat tier scoring - score determined by tier bracket, not cumulative.
 * Finding all 10 answers earns the maximum 8 points (Jackpot!).
 *
 * @param foundCount - Number of answers found (0-10)
 * @param wrongGuessCount - Number of incorrect guesses made
 * @param won - Whether player found all 10 answers
 * @returns Score object with all metrics
 *
 * @example
 * // Found all 10 - max score
 * calculateTopTensScore(10, 5, true)
 * // { points: 8, maxPoints: 8, foundCount: 10, ... }
 *
 * @example
 * // Found 5 answers
 * calculateTopTensScore(5, 3, false)
 * // { points: 3, maxPoints: 8, foundCount: 5, ... }
 *
 * @example
 * // Found 7 answers
 * calculateTopTensScore(7, 2, false)
 * // { points: 4, maxPoints: 8, foundCount: 7, ... }
 */
export function calculateTopTensScore(
  foundCount: number,
  wrongGuessCount: number,
  won: boolean
): TopTensScore {
  return {
    points: calculatePoints(foundCount),
    maxPoints: MAX_POINTS,
    foundCount,
    wrongGuessCount,
    won,
  };
}

/**
 * Format score for display.
 *
 * @param score - Score object
 * @returns Formatted string like "4/8"
 */
export function formatTopTensScore(score: TopTensScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Get the score for each answer count.
 * Useful for displaying score progression in UI.
 *
 * @returns Array of scores for 1-10 answers found
 */
export function getScoreProgression(): number[] {
  return [1, 1, 2, 2, 3, 3, 4, 4, 5, 8];
}

/**
 * Get the score for finding exactly N answers.
 *
 * @param n - Number of answers found (1-10)
 * @returns Score for that number of answers
 */
export function getPointsForAnswer(n: number): number {
  if (n < 1 || n > 10) return 0;
  return getScoreForFoundCount(n);
}
