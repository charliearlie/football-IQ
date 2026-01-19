/**
 * Top Tens Scoring
 *
 * Progressive tier scoring system for Top Tens game mode.
 * Points increase as you find more answers!
 *
 * Tiers:
 * - 1st-2nd correct: 1 point each
 * - 3rd-4th correct: 2 points each
 * - 5th-6th correct: 3 points each
 * - 7th-8th correct: 4 points each
 * - 9th-10th correct: 5 points each
 *
 * Score progression: 1 → 2 → 4 → 6 → 9 → 12 → 16 → 20 → 25 → 30
 */

/**
 * Points awarded for each answer found (index = foundCount - 1)
 * [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, 10th]
 */
const TIER_POINTS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5] as const;

/** Maximum possible points (sum of all tiers) */
export const MAX_POINTS = 30;

/**
 * Score structure for Top Tens.
 */
export interface TopTensScore {
  /** Points earned (0-30, progressive tier scoring) */
  points: number;
  /** Maximum possible points (always 30) */
  maxPoints: 30;
  /** Number of answers found (0-10) */
  foundCount: number;
  /** Number of incorrect guesses made */
  wrongGuessCount: number;
  /** Whether player found all answers (won) */
  won: boolean;
}

/**
 * Calculate points for a given number of answers found.
 *
 * @param foundCount - Number of answers found (0-10)
 * @returns Total points based on tier system
 *
 * @example
 * calculatePoints(1)  // 1 (1st tier)
 * calculatePoints(2)  // 2 (1+1)
 * calculatePoints(5)  // 9 (1+1+2+2+3)
 * calculatePoints(10) // 30 (all tiers + jackpot)
 */
export function calculatePoints(foundCount: number): number {
  let points = 0;
  const count = Math.min(foundCount, 10); // Cap at 10

  for (let i = 0; i < count; i++) {
    points += TIER_POINTS[i];
  }

  return points;
}

/**
 * Calculate the final score.
 *
 * Progressive tier scoring - earlier answers worth less, later answers worth more.
 * Finding all 10 answers earns the maximum 30 points.
 *
 * @param foundCount - Number of answers found (0-10)
 * @param wrongGuessCount - Number of incorrect guesses made
 * @param won - Whether player found all 10 answers
 * @returns Score object with all metrics
 *
 * @example
 * // Found all 10 - max score
 * calculateTopTensScore(10, 5, true)
 * // { points: 30, maxPoints: 30, foundCount: 10, ... }
 *
 * @example
 * // Found 5 answers
 * calculateTopTensScore(5, 3, false)
 * // { points: 9, maxPoints: 30, foundCount: 5, ... }
 *
 * @example
 * // Found 7 answers
 * calculateTopTensScore(7, 2, false)
 * // { points: 16, maxPoints: 30, foundCount: 7, ... }
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
 * @returns Formatted string like "16/30"
 */
export function formatTopTensScore(score: TopTensScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Get the cumulative score for each answer count.
 * Useful for displaying score progression in UI.
 *
 * @returns Array of cumulative scores for 1-10 answers found
 */
export function getScoreProgression(): number[] {
  return [1, 2, 4, 6, 9, 12, 16, 20, 25, 30];
}

/**
 * Get the points value for finding the Nth answer.
 *
 * @param n - Which answer (1-10)
 * @returns Points for that answer
 */
export function getPointsForAnswer(n: number): number {
  if (n < 1 || n > 10) return 0;
  return TIER_POINTS[n - 1];
}
