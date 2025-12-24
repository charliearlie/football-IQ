/**
 * Score Display for Career Path
 *
 * Generates Wordle-style emoji grids for sharing game results.
 *
 * Emoji Legend:
 * - ⬛ (black) = Hidden step (never revealed)
 * - ⬜ (white) = Revealed step
 * - 🟩 (green) = Winning step (correct guess made here)
 * - 🟥 (red) = Final step on loss
 */

import { GameScore } from './scoring';

/** Emoji constants for score display */
const EMOJI = {
  /** Hidden step (never revealed) */
  hidden: '⬛',
  /** Revealed step (seen but not final) */
  revealed: '⬜',
  /** Winning step (correct guess) */
  won: '🟩',
  /** Final step on loss */
  lost: '🟥',
} as const;

/**
 * Options for generating score display text.
 */
export interface ScoreDisplayOptions {
  /** Game title/header (default: "Football IQ - Career Path") */
  title?: string;
  /** Whether to include date in display (default: true) */
  includeDate?: boolean;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate?: string;
}

/**
 * Generate a Wordle-style emoji grid for sharing.
 *
 * @param score - Game score data
 * @param totalSteps - Total steps in the puzzle
 * @param options - Display options
 * @returns Formatted share text with header, score, and emoji grid
 *
 * @example
 * // Win on step 3 of 10:
 * generateScoreDisplay(score, 10, { puzzleDate: '2025-01-15' })
 * // Returns:
 * // Football IQ - Career Path
 * // 2025-01-15
 * //
 * // Score: 8/10
 * // ⬜⬜🟩⬛⬛⬛⬛⬛⬛⬛
 */
export function generateScoreDisplay(
  score: GameScore,
  totalSteps: number,
  options: ScoreDisplayOptions = {}
): string {
  const {
    title = 'Football IQ - Career Path',
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
  const grid = generateEmojiGrid(score, totalSteps);
  lines.push(grid);

  return lines.join('\n');
}

/**
 * Generate just the emoji grid row.
 *
 * Grid logic:
 * - Steps before the final revealed step: ⬜ (white - revealed)
 * - The final step where game ended:
 *   - Won: 🟩 (green)
 *   - Lost: 🟥 (red)
 * - Steps after the revealed count: ⬛ (black - hidden)
 *
 * @param score - Game score with stepsRevealed and won status
 * @param totalSteps - Total number of steps in puzzle
 * @returns String of emojis representing the game
 *
 * @example
 * // Win on step 3 of 5
 * generateEmojiGrid({ stepsRevealed: 3, won: true, ... }, 5)
 * // Returns: "⬜⬜🟩⬛⬛"
 *
 * // Loss at step 5 of 5
 * generateEmojiGrid({ stepsRevealed: 5, won: false, ... }, 5)
 * // Returns: "⬜⬜⬜⬜🟥"
 */
export function generateEmojiGrid(score: GameScore, totalSteps: number): string {
  const emojis: string[] = [];

  for (let i = 1; i <= totalSteps; i++) {
    if (i < score.stepsRevealed) {
      // Previously revealed step (not the final one)
      emojis.push(EMOJI.revealed);
    } else if (i === score.stepsRevealed) {
      // The step where the game ended
      emojis.push(score.won ? EMOJI.won : EMOJI.lost);
    } else {
      // Hidden step (never revealed)
      emojis.push(EMOJI.hidden);
    }
  }

  return emojis.join('');
}
