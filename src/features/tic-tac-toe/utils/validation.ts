/**
 * Grid Validation for Tic Tac Toe
 *
 * Validates if a player name is valid for a specific cell
 * by checking against the valid_answers list for that cell.
 */

import { validateGuess } from '@/features/career-path/utils/validation';
import type { CellIndex, TicTacToeContent } from '../types/ticTacToe.types';

export interface CellValidationResult {
  isValid: boolean;
  matchedPlayer: string | null; // The canonical player name that was matched
  score: number; // Similarity score (for debugging/stats)
}

/**
 * Validate if a guess is valid for a specific cell.
 *
 * Checks the guess against all valid answers for that cell using fuzzy matching.
 * Returns the canonical player name if a match is found.
 *
 * @param guess - User's guess (e.g., "Vini Jr")
 * @param cellIndex - The cell being guessed (0-8)
 * @param puzzleContent - The puzzle data with valid_answers
 * @returns Validation result with matched player name if valid
 *
 * @example
 * // Valid guess for Real Madrid x Brazil cell
 * validateCellGuess("Vinícius Júnior", 0, puzzle)
 * // { isValid: true, matchedPlayer: "Vinícius Júnior", score: 1.0 }
 *
 * // Invalid guess (Messi is not Brazilian and not Real Madrid)
 * validateCellGuess("Messi", 0, puzzle)
 * // { isValid: false, matchedPlayer: null, score: 0 }
 */
export function validateCellGuess(
  guess: string,
  cellIndex: CellIndex,
  puzzleContent: TicTacToeContent
): CellValidationResult {
  const trimmedGuess = guess.trim();

  if (!trimmedGuess) {
    return { isValid: false, matchedPlayer: null, score: 0 };
  }

  // Get valid answers for this cell
  const validAnswers = puzzleContent.valid_answers[cellIndex.toString()];

  if (!validAnswers || validAnswers.length === 0) {
    return { isValid: false, matchedPlayer: null, score: 0 };
  }

  // Check against each valid answer using fuzzy matching
  let bestMatch: { player: string; score: number } | null = null;

  for (const validPlayer of validAnswers) {
    const result = validateGuess(trimmedGuess, validPlayer);

    if (result.isMatch) {
      // If we find a match, check if it's better than previous
      if (!bestMatch || result.score > bestMatch.score) {
        bestMatch = { player: validPlayer, score: result.score };
      }

      // Perfect match - no need to check further
      if (result.score === 1.0) {
        break;
      }
    }
  }

  if (bestMatch) {
    return {
      isValid: true,
      matchedPlayer: bestMatch.player,
      score: bestMatch.score,
    };
  }

  return { isValid: false, matchedPlayer: null, score: 0 };
}

/**
 * Get the category labels for a specific cell.
 *
 * @param cellIndex - Cell index (0-8)
 * @param puzzleContent - The puzzle data
 * @returns Object with row and column category names
 */
export function getCellCategories(
  cellIndex: CellIndex,
  puzzleContent: TicTacToeContent
): { row: string; column: string } {
  const rowIndex = Math.floor(cellIndex / 3);
  const colIndex = cellIndex % 3;

  return {
    row: puzzleContent.rows[rowIndex],
    column: puzzleContent.columns[colIndex],
  };
}
