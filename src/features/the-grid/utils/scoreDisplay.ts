/**
 * Score display utilities for The Grid game mode.
 *
 * Generates emoji grids and shareable text for completed games.
 */

import { FilledCell, TheGridScore } from '../types/theGrid.types';

/**
 * Generate an emoji grid showing filled vs empty cells.
 *
 * - 🟢 = Filled cell
 * - ⬜ = Empty cell
 *
 * @param cells - Array of cell states
 * @returns 3x3 emoji grid string
 *
 * @example
 * // All filled
 * generateGridEmojiDisplay(allFilled)
 * // "🟢🟢🟢\n🟢🟢🟢\n🟢🟢🟢"
 *
 * // Partial
 * generateGridEmojiDisplay(partial)
 * // "🟢⬜🟢\n⬜🟢⬜\n🟢⬜🟢"
 */
export function generateGridEmojiDisplay(cells: (FilledCell | null)[]): string {
  const rows: string[] = [];

  for (let row = 0; row < 3; row++) {
    let rowString = '';
    for (let col = 0; col < 3; col++) {
      const cellIndex = row * 3 + col;
      rowString += cells[cellIndex] !== null ? '🟢' : '⬜';
    }
    rows.push(rowString);
  }

  return rows.join('\n');
}

/**
 * Get result emoji based on completion.
 *
 * @param cellsFilled - Number of cells filled
 * @returns Emoji string
 */
export function getResultEmoji(cellsFilled: number): string {
  if (cellsFilled === 9) return '🏆';
  if (cellsFilled >= 7) return '⭐';
  if (cellsFilled >= 5) return '👍';
  return '💪';
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
 * 🏆 Perfect Grid!
 * 🟢🟢🟢
 * 🟢🟢🟢
 * 🟢🟢🟢
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
    lines.push('Football IQ - The Grid');
    if (date) {
      lines.push(date);
    }
    lines.push('');
  }

  // Result emoji and message
  const resultEmoji = getResultEmoji(score.cellsFilled);
  const resultMessage = getResultMessage(score.cellsFilled);
  lines.push(`${resultEmoji} ${resultMessage}`);

  // Emoji grid
  lines.push(generateGridEmojiDisplay(cells));
  lines.push('');

  // Score
  lines.push(`Score: ${score.points}/${score.maxPoints}`);

  return lines.join('\n');
}
