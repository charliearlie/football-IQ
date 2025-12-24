/**
 * Scoring System for Career Path
 *
 * Dynamic scoring based on how many career steps were revealed
 * before the player guessed correctly.
 *
 * Formula: Score = Total Steps - (Revealed Steps - 1)
 *
 * Examples:
 * - 10 steps, guessed on step 1: 10 points (perfect)
 * - 10 steps, guessed on step 3: 8 points
 * - 10 steps, lost (all revealed): 0 points
 */

/**
 * Score data for a completed Career Path game.
 */
export interface GameScore {
  /** Points earned (0 to maxPoints) */
  points: number;
  /** Maximum possible points (equals totalSteps) */
  maxPoints: number;
  /** Number of steps revealed when game ended */
  stepsRevealed: number;
  /** Whether the player won */
  won: boolean;
}

/**
 * Calculate the final score for a Career Path game.
 *
 * @param totalSteps - Total career steps in the puzzle
 * @param revealedCount - Number of steps revealed when game ended
 * @param won - Whether the player guessed correctly
 * @returns GameScore object with points and metadata
 *
 * @example
 * // Perfect score
 * calculateScore(10, 1, true) // { points: 10, maxPoints: 10, ... }
 *
 * // Guessed on 3rd step
 * calculateScore(10, 3, true) // { points: 8, maxPoints: 10, ... }
 *
 * // Lost
 * calculateScore(10, 10, false) // { points: 0, maxPoints: 10, ... }
 */
export function calculateScore(
  totalSteps: number,
  revealedCount: number,
  won: boolean
): GameScore {
  // Winners get points based on how quickly they guessed
  // Losers get 0 points
  const points = won ? totalSteps - (revealedCount - 1) : 0;

  return {
    points,
    maxPoints: totalSteps,
    stepsRevealed: revealedCount,
    won,
  };
}

/**
 * Format score for display as "X/Y" string.
 *
 * @param score - GameScore object
 * @returns Formatted string like "8/10"
 *
 * @example
 * formatScore({ points: 8, maxPoints: 10, ... }) // "8/10"
 */
export function formatScore(score: GameScore): string {
  return `${score.points}/${score.maxPoints}`;
}
