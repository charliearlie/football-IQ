/**
 * Scoring System for Who's That?
 *
 * Score based on how few guesses were needed to identify the player.
 * 6 guesses total — fewer guesses = higher score.
 *
 * Scoring:
 * - Guess on attempt 1: 6 points (perfect)
 * - Guess on attempt 2: 5 points
 * - Guess on attempt 3: 4 points
 * - Guess on attempt 4: 3 points
 * - Guess on attempt 5: 2 points
 * - Guess on attempt 6: 1 point
 * - Lost (all 6 attempts used): 0 points
 */

/**
 * Score data for a completed Who's That? game.
 */
export interface WhosThatScore {
  /** Points earned (0-6) */
  points: number;
  /** Maximum possible points (6) */
  maxPoints: number;
  /** Number of guesses used */
  guessCount: number;
  /** Whether the player guessed correctly */
  won: boolean;
}

/**
 * Calculate the final score for a Who's That? game.
 *
 * @param guessCount - Number of guesses used when game ended
 * @param won - Whether the player guessed correctly
 * @returns WhosThatScore object
 */
export function calculateWhosThatScore(guessCount: number, won: boolean): WhosThatScore {
  const maxPoints = 6;
  const points = won ? maxPoints - (guessCount - 1) : 0;

  return {
    points,
    maxPoints,
    guessCount,
    won,
  };
}

/**
 * Format score for display as "X/Y" string.
 */
export function formatWhosThatScore(score: WhosThatScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Normalize score to 0-100 for distribution charts.
 */
export function normalizeWhosThatScore(score: WhosThatScore): number {
  if (score.maxPoints === 0) return 0;
  return Math.round((score.points / score.maxPoints) * 100);
}
