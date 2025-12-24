/**
 * Score Display for Transfer Guess
 *
 * Generates emoji grids for sharing game results.
 *
 * Emoji Legend:
 * Hints:
 * - ⚫ (black) = Hint not revealed
 * - 🟡 (yellow) = Hint revealed
 *
 * Guesses:
 * - ❌ = Incorrect guess
 * - ✅ = Correct guess (won)
 * - 💀 = Gave up or lost
 */

import { TransferGuessScore } from './transferScoring';

/** Emoji constants for score display */
const EMOJI = {
  /** Hint not revealed */
  hintHidden: '⚫',
  /** Hint revealed */
  hintRevealed: '🟡',
  /** Incorrect guess */
  wrongGuess: '❌',
  /** Correct guess (won) */
  won: '✅',
  /** Lost or gave up */
  lost: '💀',
} as const;

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
 * @returns Formatted share text with header, score, and emoji grid
 *
 * @example
 * // Win with 1 hint and 2 wrong guesses:
 * generateTransferScoreDisplay(score, { puzzleDate: '2025-01-15' })
 * // Returns:
 * // Football IQ - Guess the Transfer
 * // 2025-01-15
 * //
 * // Score: 6/10
 * // 🟡⚫⚫ ❌❌✅
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

  // Emoji grid
  const grid = generateTransferEmojiGrid(score);
  lines.push(grid);

  return lines.join('\n');
}

/**
 * Generate the emoji grid for the game result.
 *
 * Format: [hints section] [guesses section][result]
 *
 * @param score - Transfer guess score data
 * @returns String of emojis representing the game
 *
 * @example
 * // Win with 2 hints and 1 wrong guess
 * generateTransferEmojiGrid({ hintsRevealed: 2, incorrectGuesses: 1, won: true, ... })
 * // Returns: "🟡🟡⚫ ❌✅"
 *
 * // Loss with 1 hint and 5 wrong guesses
 * generateTransferEmojiGrid({ hintsRevealed: 1, incorrectGuesses: 5, won: false, ... })
 * // Returns: "🟡⚫⚫ ❌❌❌❌❌💀"
 */
export function generateTransferEmojiGrid(score: TransferGuessScore): string {
  // Hints section (3 slots)
  const hintEmojis: string[] = [];
  for (let i = 0; i < 3; i++) {
    hintEmojis.push(i < score.hintsRevealed ? EMOJI.hintRevealed : EMOJI.hintHidden);
  }

  // Guesses section + result
  const guessEmojis: string[] = [];
  for (let i = 0; i < score.incorrectGuesses; i++) {
    guessEmojis.push(EMOJI.wrongGuess);
  }
  guessEmojis.push(score.won ? EMOJI.won : EMOJI.lost);

  return `${hintEmojis.join('')} ${guessEmojis.join('')}`;
}
