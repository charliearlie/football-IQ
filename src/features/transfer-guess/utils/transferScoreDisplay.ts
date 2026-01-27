/**
 * Score Display for Transfer Guess
 *
 * Generates text-based descriptions for sharing game results.
 */

import { TransferGuessScore } from './transferScoring';

/**
 * Options for generating score display text.
 */
export interface ScoreDisplayOptions {
  /** Game title/header (default: "Football IQ - Guess the Transfer") */
  title?: string;
  /** Whether to include date in display (default: true) */
  includeDate?: boolean;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate?: string;
}

/**
 * Generate a shareable text display for the game result.
 *
 * @param score - Transfer guess score data
 * @param options - Display options
 * @returns Formatted share text with header, score, and description
 *
 * @example
 * // Win with 1 hint and 2 wrong guesses:
 * generateTransferScoreDisplay(score, { puzzleDate: '2025-01-15' })
 * // Returns:
 * // Football IQ - Guess the Transfer
 * // 2025-01-15
 * //
 * // Score: 3/5
 * // Hints: 1 | Guesses: 2
 */
export function generateTransferScoreDisplay(
  score: TransferGuessScore,
  options: ScoreDisplayOptions = {}
): string {
  const {
    title = 'Football IQ - Guess the Transfer',
    includeDate = true,
    puzzleDate,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push(title);

  // Date (if provided and enabled)
  if (includeDate && puzzleDate) {
    lines.push(puzzleDate);
  }

  // Empty line for spacing
  lines.push('');

  // Score line
  lines.push(`Score: ${score.points}/${score.maxPoints}`);

  // Text description
  const description = generateTransferScoreDescription(score);
  lines.push(description);

  return lines.join('\n');
}

/**
 * Generate a text description of the game result for share cards.
 *
 * @param score - Transfer guess score data
 * @returns Text description like "Hints: 1 | Guesses: 2"
 *
 * @example
 * // Win with 2 hints and 1 wrong guess
 * generateTransferScoreDescription({ hintsRevealed: 2, incorrectGuesses: 1, won: true, ... })
 * // Returns: "Hints: 2 | Guesses: 2"
 */
export function generateTransferScoreDescription(score: TransferGuessScore): string {
  // Total guesses = incorrect + 1 (the final guess, whether won or lost)
  const totalGuesses = score.incorrectGuesses + 1;
  return `Hints: ${score.hintsRevealed} | Guesses: ${totalGuesses}`;
}

/**
 * @deprecated Use generateTransferScoreDescription instead. Kept for backwards compatibility.
 */
export function generateTransferEmojiGrid(score: TransferGuessScore): string {
  return generateTransferScoreDescription(score);
}
