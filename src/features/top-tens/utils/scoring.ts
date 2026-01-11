/**
 * Top Tens Scoring
 *
 * Scoring system for Top Tens game mode.
 * Simple scoring: 1 point per answer found, max 10 points.
 */

/**
 * Score structure for Top Tens.
 */
export interface TopTensScore {
  /** Points earned (0-10, one per answer found) */
  points: number;
  /** Maximum possible points (always 10) */
  maxPoints: 10;
  /** Number of answers found (0-10) */
  foundCount: number;
  /** Number of incorrect guesses made */
  wrongGuessCount: number;
  /** Whether player found all answers (won) */
  won: boolean;
}

/**
 * Calculate the final score.
 *
 * Simple scoring: points = foundCount (0-10)
 *
 * @param foundCount - Number of answers found (0-10)
 * @param wrongGuessCount - Number of incorrect guesses made
 * @param won - Whether player found all 10 answers
 * @returns Score object with all metrics
 */
export function calculateTopTensScore(
  foundCount: number,
  wrongGuessCount: number,
  won: boolean
): TopTensScore {
  return {
    points: foundCount,
    maxPoints: 10,
    foundCount,
    wrongGuessCount,
    won,
  };
}

/**
 * Format score for display.
 *
 * @param score - Score object
 * @returns Formatted string like "7/10"
 */
export function formatTopTensScore(score: TopTensScore): string {
  return `${score.points}/${score.maxPoints}`;
}
