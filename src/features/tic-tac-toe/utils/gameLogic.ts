/**
 * Game Logic Utilities for Tic Tac Toe
 *
 * Handles win condition detection, AI moves, and game state checks.
 */

import type {
  CellIndex,
  CellOwner,
  CellArray,
  TicTacToeContent,
  TicTacToeScore,
} from '../types/ticTacToe.types';
import { POINTS_WIN, POINTS_DRAW, POINTS_LOSS } from '../types/ticTacToe.types';

// Re-export WINNING_LINES for use in other files
export { WINNING_LINES } from '../types/ticTacToe.types';

// All 8 winning combinations
const WINNING_COMBINATIONS: ReadonlyArray<[CellIndex, CellIndex, CellIndex]> = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Check if a player has won the game.
 *
 * @param cells - Current cell states
 * @param owner - The player to check ('player' or 'ai')
 * @returns The winning line indices if won, null otherwise
 */
export function checkWin(
  cells: CellArray,
  owner: 'player' | 'ai'
): [CellIndex, CellIndex, CellIndex] | null {
  for (const line of WINNING_COMBINATIONS) {
    const [a, b, c] = line;
    if (
      cells[a].owner === owner &&
      cells[b].owner === owner &&
      cells[c].owner === owner
    ) {
      return line;
    }
  }
  return null;
}

/**
 * Check if the game is a draw (all cells filled, no winner).
 *
 * @param cells - Current cell states
 * @returns True if the game is a draw
 */
export function checkDraw(cells: CellArray): boolean {
  // A draw occurs when all cells are filled and no one has won
  const allFilled = cells.every((cell) => cell.owner !== null);
  if (!allFilled) return false;

  // Make sure neither player has won
  const playerWon = checkWin(cells, 'player');
  const aiWon = checkWin(cells, 'ai');

  return !playerWon && !aiWon;
}

/**
 * Get all empty cell indices.
 *
 * @param cells - Current cell states
 * @returns Array of empty cell indices
 */
export function getEmptyCells(cells: CellArray): CellIndex[] {
  const emptyCells: CellIndex[] = [];
  cells.forEach((cell, index) => {
    if (cell.owner === null) {
      emptyCells.push(index as CellIndex);
    }
  });
  return emptyCells;
}

/**
 * Pick a random cell for AI to claim.
 *
 * @param cells - Current cell states
 * @returns A random empty cell index, or null if no empty cells
 */
export function pickRandomEmptyCell(cells: CellArray): CellIndex | null {
  const emptyCells = getEmptyCells(cells);
  if (emptyCells.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

/**
 * Pick a random valid player name for a cell.
 *
 * @param cellIndex - The cell to get a player for
 * @param puzzleContent - The puzzle data
 * @returns A random valid player name for that cell
 */
export function pickRandomPlayerForCell(
  cellIndex: CellIndex,
  puzzleContent: TicTacToeContent
): string {
  const validAnswers = puzzleContent.valid_answers[cellIndex.toString()];
  if (!validAnswers || validAnswers.length === 0) {
    return 'AI Player'; // Fallback (shouldn't happen with valid puzzle data)
  }

  const randomIndex = Math.floor(Math.random() * validAnswers.length);
  return validAnswers[randomIndex];
}

/**
 * Count cells owned by a specific player.
 *
 * @param cells - Current cell states
 * @param owner - The player to count for
 * @returns Number of cells owned
 */
export function countCells(cells: CellArray, owner: CellOwner): number {
  return cells.filter((cell) => cell.owner === owner).length;
}

/**
 * Calculate the score based on game result.
 *
 * @param result - 'win', 'draw', or 'loss'
 * @param cells - Cell states at game end
 * @returns Score object
 */
export function calculateScore(
  result: 'win' | 'draw' | 'loss',
  cells: CellArray
): TicTacToeScore {
  const playerCells = countCells(cells, 'player');
  const aiCells = countCells(cells, 'ai');

  let points: number;
  switch (result) {
    case 'win':
      points = POINTS_WIN;
      break;
    case 'draw':
      points = POINTS_DRAW;
      break;
    case 'loss':
      points = POINTS_LOSS;
      break;
  }

  return {
    points,
    maxPoints: 10,
    result,
    playerCells,
    aiCells,
  };
}

/**
 * Create initial empty cells array.
 */
export function createEmptyCells(): CellArray {
  return Array(9).fill(null).map(() => ({
    owner: null,
    playerName: null,
  })) as CellArray;
}
