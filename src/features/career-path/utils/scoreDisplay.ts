/**
 * Score Display for Career Path
 *
 * Generates text-based descriptions for sharing game results.
 */

import { GameScore } from './scoring';

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
 * Generate share text for the game result.
 *
 * @param score - Game score data
 * @param totalSteps - Total steps in the puzzle
 * @param options - Display options
 * @returns Formatted share text with header, score, and description
 *
 * @example
 * // Win on step 3 of 8:
 * generateScoreDisplay(score, 8, { puzzleDate: '2025-01-15' })
 * // Returns:
 * // Football IQ - Career Path
 * // 2025-01-15
 * //
 * // Score: 6/8
 * // 3 of 8 clubs revealed
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

  // Text description
  const description = generateScoreDescription(score, totalSteps);
  lines.push(description);

  return lines.join('\n');
}

/**
 * Generate a text description of the game result for share cards.
 *
 * @param score - Game score with stepsRevealed and won status
 * @param totalSteps - Total number of steps in puzzle
 * @returns Text description like "3 of 8 clubs revealed"
 *
 * @example
 * // Win on step 3 of 8
 * generateScoreDescription({ stepsRevealed: 3, won: true, ... }, 8)
 * // Returns: "3 of 8 clubs revealed"
 */
export function generateScoreDescription(score: GameScore, totalSteps: number): string {
  return `${score.stepsRevealed} of ${totalSteps} clubs revealed`;
}

/**
 * @deprecated Use generateScoreDescription instead. Kept for backwards compatibility.
 */
export function generateEmojiGrid(score: GameScore, totalSteps: number): string {
  return generateScoreDescription(score, totalSteps);
}
