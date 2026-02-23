/**
 * Score Display Utilities for Tic Tac Toe
 *
 * Generates shareable emoji grids and score displays.
 */

import type { CellArray, TicTacToeScore } from '../types/ticTacToe.types';

export interface ScoreDisplayOptions {
  title?: string;
  includeDate?: boolean;
  puzzleDate?: string;
}

/**
 * Generate an emoji grid representing the final board state.
 *
 * Emoji Legend:
 * - 🟢 = Player's cell (green circle)
 * - 🔴 = AI's cell (red circle)
 * - ⬜ = Empty cell
 *
 * @param cells - Final cell states
 * @returns 3x3 emoji grid string
 *
 * @example
 * // Win with diagonal
 * generateTicTacToeEmojiGrid(cells)
 * // 🟢🔴⬜
 * // 🔴🟢⬜
 * // ⬜⬜🟢
 */
export function generateTicTacToeEmojiGrid(cells: CellArray): string {
  const emojis = cells.map((cell) => {
    switch (cell.owner) {
      case 'player':
        return '🟢';
      case 'ai':
        return '🔴';
      default:
        return '⬜';
    }
  });

  // Format as 3x3 grid
  const rows = [
    emojis.slice(0, 3).join(''),
    emojis.slice(3, 6).join(''),
    emojis.slice(6, 9).join(''),
  ];

  return rows.join('\n');
}

/**
 * Get result emoji based on game outcome.
 */
export function getResultEmoji(result: 'win' | 'draw' | 'loss'): string {
  switch (result) {
    case 'win':
      return '🏆';
    case 'draw':
      return '🤝';
    case 'loss':
      return '😞';
  }
}

/**
 * Get result message based on game outcome.
 */
export function getResultMessage(result: 'win' | 'draw' | 'loss'): string {
  switch (result) {
    case 'win':
      return 'Victory! You beat the AI!';
    case 'draw':
      return "It's a draw!";
    case 'loss':
      return 'The AI wins this time...';
  }
}

/**
 * Generate the full score display for sharing.
 *
 * @param cells - Final cell states
 * @param score - Game score
 * @param options - Display options
 * @returns Formatted share text
 *
 * @example
 * // Output:
 * // Football IQ - Tic Tac Toe
 * // 2025-01-15
 * //
 * // 🏆 Victory!
 * // 🟢🔴⬜
 * // 🔴🟢⬜
 * // ⬜⬜🟢
 * //
 * // Score: 10/10
 */
export function generateTicTacToeScoreDisplay(
  cells: CellArray,
  score: TicTacToeScore,
  options: ScoreDisplayOptions = {}
): string {
  const {
    title,
    includeDate = true,
    puzzleDate,
  } = options;

  const defaultTitle =
    score.result === 'win'
      ? 'I beat the AI at football tic tac toe!'
      : score.result === 'draw'
        ? "Can you beat the AI? I drew"
        : "Can you beat the AI? I couldn't";

  const lines: string[] = [];

  // Title
  lines.push(title ?? defaultTitle);

  // Date
  if (includeDate && puzzleDate) {
    lines.push(puzzleDate);
  }

  lines.push('');

  // Result emoji and message
  const resultEmoji = getResultEmoji(score.result);
  const resultText =
    score.result === 'win'
      ? 'Victory!'
      : score.result === 'draw'
        ? 'Draw!'
        : 'Defeat';
  lines.push(`${resultEmoji} ${resultText}`);

  // Emoji grid
  lines.push(generateTicTacToeEmojiGrid(cells));

  lines.push('');

  // Score
  lines.push(`Score: ${score.points}/${score.maxPoints}`);

  lines.push('https://football-iq.app');

  return lines.join('\n');
}
