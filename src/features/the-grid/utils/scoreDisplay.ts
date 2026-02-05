/**
 * Score display utilities for The Grid game mode.
 *
 * Generates text-based descriptions for sharing results.
 */

import { FilledCell, TheGridScore } from '../types/theGrid.types';

/**
 * Generate a text description showing filled cells.
 *
 * @param cells - Array of cell states
 * @param score - Score object
 * @returns Text description like "5 of 9 cells"
 */
export function generateGridScoreDescription(
  cells: (FilledCell | null)[],
  score: TheGridScore
): string {
  return `${score.cellsFilled} of 9 cells`;
}

/**
 * @deprecated Use generateGridScoreDescription instead. Kept for backwards compatibility.
 */
export function generateGridEmojiDisplay(cells: (FilledCell | null)[]): string {
  const filledCount = cells.filter((c) => c !== null).length;
  return `${filledCount} of 9 cells`;
}

/**
 * Get result message based on completion.
 *
 * @param cellsFilled - Number of cells filled
 * @returns Message string
 */
export function getResultMessage(cellsFilled: number): string {
  if (cellsFilled === 9) return 'Perfect Grid!';
  if (cellsFilled >= 7) return 'Great job!';
  if (cellsFilled >= 5) return 'Good effort!';
  if (cellsFilled >= 3) return 'Keep practicing!';
  return 'Better luck next time!';
}

/**
 * Options for generating score display text.
 */
export interface GridScoreDisplayOptions {
  /** Puzzle date in YYYY-MM-DD format */
  date?: string;
  /** Include full title header */
  includeTitle?: boolean;
}

/**
 * Generate the full shareable score display.
 *
 * Format:
 * ```
 * Football IQ - The Grid
 * 2025-01-15
 *
 * Perfect Grid!
 * 9 of 9 cells
 *
 * Score: 100/100
 * ```
 *
 * @param cells - Array of cell states
 * @param score - Score object
 * @param options - Display options
 * @returns Formatted string for sharing
 */
export function generateTheGridScoreDisplay(
  cells: (FilledCell | null)[],
  score: TheGridScore,
  options: GridScoreDisplayOptions = {}
): string {
  const { date, includeTitle = true } = options;

  const lines: string[] = [];

  // Title
  if (includeTitle) {
    lines.push('Football IQ - The Grid (beta)');
    if (date) {
      lines.push(date);
    }
    lines.push('');
  }

  // Result message
  const resultMessage = getResultMessage(score.cellsFilled);
  lines.push(resultMessage);

  // Text description
  lines.push(generateGridScoreDescription(cells, score));
  lines.push('');

  // Score
  lines.push(`Score: ${score.cellsFilled}/9`);

  return lines.join('\n');
}
