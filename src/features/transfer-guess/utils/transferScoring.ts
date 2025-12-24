/**
 * Scoring System for Transfer Guess
 *
 * Dynamic scoring based on hints revealed and incorrect guesses.
 *
 * Formula: Score = 10 - (hintsRevealed × 2) - (incorrectGuesses × 1)
 *
 * Constraints:
 * - Base: 10 points
 * - -2 per hint revealed (max -6 for all 3 hints)
 * - -1 per incorrect guess (max -4 before 5th guess loses)
 * - Minimum: 1 point if eventually correct
 * - Loss: 0 points
 *
 * Examples:
 * - Perfect (0 hints, 0 wrong): 10 points
 * - 2 hints, 0 wrong: 6 points
 * - 0 hints, 4 wrong: 6 points
 * - 3 hints, 4 wrong: 1 point (minimum)
 * - 5 wrong guesses: 0 points (lost)
 */

/**
 * Score data for a completed Transfer Guess game.
 */
export interface TransferGuessScore {
  /** Points earned (0-10) */
  points: number;
  /** Maximum possible points (always 10) */
  maxPoints: 10;
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** Number of incorrect guesses made */
  incorrectGuesses: number;
  /** Whether the player won */
  won: boolean;
}

/** Maximum points for a perfect game */
export const MAX_POINTS = 10;

/** Points deducted per hint revealed */
export const HINT_PENALTY = 2;

/** Points deducted per incorrect guess */
export const GUESS_PENALTY = 1;

/** Maximum incorrect guesses before losing */
export const MAX_GUESSES = 5;

/** Maximum hints available */
export const MAX_HINTS = 3;

/**
 * Calculate the final score for a Transfer Guess game.
 *
 * @param hintsRevealed - Number of hints revealed (0-3)
 * @param incorrectGuesses - Number of incorrect guesses made
 * @param won - Whether the player guessed correctly
 * @returns TransferGuessScore object with points and metadata
 *
 * @example
 * // Perfect score
 * calculateTransferScore(0, 0, true) // { points: 10, ... }
 *
 * // With 2 hints revealed
 * calculateTransferScore(2, 0, true) // { points: 6, ... }
 *
 * // Lost after 5 wrong guesses
 * calculateTransferScore(2, 5, false) // { points: 0, ... }
 */
export function calculateTransferScore(
  hintsRevealed: number,
  incorrectGuesses: number,
  won: boolean
): TransferGuessScore {
  if (!won) {
    return {
      points: 0,
      maxPoints: MAX_POINTS,
      hintsRevealed,
      incorrectGuesses,
      won: false,
    };
  }

  // Calculate penalties
  const hintPenalty = hintsRevealed * HINT_PENALTY;
  const guessPenalty = incorrectGuesses * GUESS_PENALTY;

  // Calculate score with minimum of 1 for winners
  const rawScore = MAX_POINTS - hintPenalty - guessPenalty;
  const points = Math.max(1, rawScore);

  return {
    points,
    maxPoints: MAX_POINTS,
    hintsRevealed,
    incorrectGuesses,
    won: true,
  };
}

/**
 * Format score for display as "X/Y" string.
 *
 * @param score - TransferGuessScore object
 * @returns Formatted string like "6/10"
 *
 * @example
 * formatTransferScore({ points: 6, maxPoints: 10, ... }) // "6/10"
 */
export function formatTransferScore(score: TransferGuessScore): string {
  return `${score.points}/${score.maxPoints}`;
}
