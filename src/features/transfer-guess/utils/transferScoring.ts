/**
 * Scoring System for Transfer Guess
 *
 * Simple hint-based scoring system.
 *
 * Points by hints revealed:
 * - 0 hints: 5 points (perfect)
 * - 1 hint:  3 points
 * - 2 hints: 2 points
 * - 3 hints: 1 point (minimum winning score)
 * - Loss/Give up: 0 points
 *
 * Incorrect guesses do not affect the score.
 */

/**
 * Score data for a completed Transfer Guess game.
 */
export interface TransferGuessScore {
  /** Points earned (0-5) */
  points: number;
  /** Maximum possible points (always 5) */
  maxPoints: 5;
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** Number of incorrect guesses made */
  incorrectGuesses: number;
  /** Whether the player won */
  won: boolean;
}

/** Maximum points for a perfect game */
export const MAX_POINTS = 5;

/** Maximum incorrect guesses before losing */
export const MAX_GUESSES = 5;

/** Maximum hints available */
export const MAX_HINTS = 3;

/**
 * Score lookup by number of hints revealed.
 * Incorrect guesses do not affect score.
 */
const HINT_SCORE_MAP: Record<number, number> = {
  0: 5, // No hints = perfect score
  1: 3, // One hint
  2: 2, // Two hints
  3: 1, // All hints = minimum winning score
};

/**
 * Calculate the final score for a Transfer Guess game.
 *
 * @param hintsRevealed - Number of hints revealed (0-3)
 * @param incorrectGuesses - Number of incorrect guesses made
 * @param won - Whether the player guessed correctly
 * @returns TransferGuessScore object with points and metadata
 *
 * @example
 * // Perfect score (no hints)
 * calculateTransferScore(0, 0, true) // { points: 5, ... }
 *
 * // With 2 hints revealed
 * calculateTransferScore(2, 3, true) // { points: 2, ... }
 *
 * // Lost or gave up
 * calculateTransferScore(2, 5, false) // { points: 0, ... }
 */
export function calculateTransferScore(
  hintsRevealed: number,
  incorrectGuesses: number,
  won: boolean
): TransferGuessScore {
  const points = won ? (HINT_SCORE_MAP[hintsRevealed] ?? 1) : 0;

  return {
    points,
    maxPoints: MAX_POINTS,
    hintsRevealed,
    incorrectGuesses,
    won,
  };
}

/**
 * Format score for display as "X/Y" string.
 *
 * @param score - TransferGuessScore object
 * @returns Formatted string like "3/5"
 *
 * @example
 * formatTransferScore({ points: 3, maxPoints: 5, ... }) // "3/5"
 */
export function formatTransferScore(score: TransferGuessScore): string {
  return `${score.points}/${score.maxPoints}`;
}
