/**
 * Validation utilities for The Grid game mode.
 *
 * Uses shared fuzzy matching from @/lib/validation and
 * database lookups for player-club/nationality validation.
 */

import { validateGuess } from '@/lib/validation';
import { TheGridContent, GridCategory, CellIndex } from '../types/theGrid.types';
import { didPlayerPlayFor, hasNationality, getPlayerById } from '@/services/player';
import { getPlayerStatsCache } from '@/lib/database';
import { checkTrophyMatch, checkStatMatch } from './achievementMapping';

/**
 * Mapping of country names to ISO 3166-1 alpha-2 codes.
 * Used to convert Grid category values to database nationality codes.
 */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'Brazil': 'BR',
  'France': 'FR',
  'Argentina': 'AR',
  'Germany': 'DE',
  'Spain': 'ES',
  'England': 'GB',
  'Italy': 'IT',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Croatia': 'HR',
  'Uruguay': 'UY',
  'Colombia': 'CO',
  'Chile': 'CL',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Denmark': 'DK',
  'Norway': 'NO',
  'Wales': 'WL',
  'Scotland': 'SC',
  'Ireland': 'IE',
  'Serbia': 'RS',
  'Senegal': 'SN',
  'Morocco': 'MA',
  'Nigeria': 'NG',
  'Egypt': 'EG',
  'Ivory Coast': 'CI',
  'Cameroon': 'CM',
  'Ghana': 'GH',
  'Algeria': 'DZ',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Australia': 'AU',
  'Mexico': 'MX',
  'USA': 'US',
  'Canada': 'CA',
};

/**
 * Result of validating a cell guess.
 */
export interface CellGuessResult {
  isValid: boolean;
  matchedPlayer?: string;
}

/**
 * Validate a player guess for a specific cell.
 *
 * Checks the guess against all valid answers for that cell
 * using fuzzy matching (accents, typos, partial names).
 *
 * @param guess - User's player name guess
 * @param cellIndex - Cell index (0-8)
 * @param content - The Grid puzzle content
 * @returns Validation result with matched player name if valid
 *
 * @example
 * validateCellGuess('Messi', 4, content)
 * // { isValid: true, matchedPlayer: 'Lionel Messi' }
 *
 * validateCellGuess('Harry Kane', 4, content)
 * // { isValid: false }
 */
export function validateCellGuess(
  guess: string,
  cellIndex: CellIndex,
  content: TheGridContent
): CellGuessResult {
  // Get valid answers for this cell
  const validAnswers = content.valid_answers[String(cellIndex)] || [];

  // Trim whitespace
  const trimmedGuess = guess.trim();

  // Empty guess is invalid
  if (!trimmedGuess) {
    return { isValid: false };
  }

  // Check against each valid answer using fuzzy matching
  for (const answer of validAnswers) {
    const result = validateGuess(trimmedGuess, answer);
    if (result.isMatch) {
      return { isValid: true, matchedPlayer: answer };
    }
  }

  return { isValid: false };
}

/**
 * Get the row and column categories for a cell.
 *
 * Cell layout:
 * ```
 *      | Col0 | Col1 | Col2 |
 * -----|------|------|------|
 * Row0 |  0   |  1   |  2   |
 * Row1 |  3   |  4   |  5   |
 * Row2 |  6   |  7   |  8   |
 * ```
 *
 * @param cellIndex - Cell index (0-8)
 * @param content - The Grid puzzle content
 * @returns Object with row and column categories
 *
 * @example
 * getCellCategories(0, content)
 * // { row: { type: 'nation', value: 'Brazil' }, col: { type: 'club', value: 'Real Madrid' } }
 *
 * getCellCategories(4, content)
 * // { row: { type: 'trophy', value: 'Champions League' }, col: { type: 'club', value: 'Barcelona' } }
 */
export function getCellCategories(
  cellIndex: CellIndex,
  content: TheGridContent
): { row: GridCategory; col: GridCategory } {
  const rowIndex = Math.floor(cellIndex / 3);
  const colIndex = cellIndex % 3;

  return {
    row: content.yAxis[rowIndex],
    col: content.xAxis[colIndex],
  };
}

/**
 * Check if a cell index is valid (0-8).
 *
 * @param index - Number to check
 * @returns True if valid cell index
 */
export function isValidCellIndex(index: number): index is CellIndex {
  return Number.isInteger(index) && index >= 0 && index <= 8;
}

/**
 * Get all empty cell indices.
 *
 * @param cells - Current cell states
 * @returns Array of empty cell indices
 */
export function getEmptyCells(cells: (unknown | null)[]): CellIndex[] {
  const emptyCells: CellIndex[] = [];
  for (let i = 0; i < 9; i++) {
    if (cells[i] === null) {
      emptyCells.push(i as CellIndex);
    }
  }
  return emptyCells;
}

/**
 * Count filled cells.
 *
 * @param cells - Current cell states
 * @returns Number of filled cells
 */
export function countFilledCells(cells: (unknown | null)[]): number {
  return cells.filter((cell) => cell !== null).length;
}

/**
 * Result of database-based cell validation.
 */
export interface DBValidationResult {
  /** Whether the player is valid for this cell */
  isValid: boolean;
  /** Which criteria were matched (if player exists) */
  matchedCriteria?: {
    row: boolean;
    col: boolean;
  };
}

/**
 * Validate a player selection for a cell using the local database.
 *
 * Checks if the player satisfies both row and column criteria:
 * - For 'club' type: checks didPlayerPlayFor()
 * - For 'nation' type: checks hasNationality()
 * - For 'stat'/'trophy' types: not yet supported (returns false)
 *
 * @param playerId - Player database ID from selection
 * @param cellIndex - Cell index (0-8)
 * @param content - The Grid puzzle content
 * @returns Validation result with matched criteria details
 *
 * @example
 * // Player who played for Real Madrid and is Brazilian
 * await validateCellWithDB('player-1', 0, content)
 * // { isValid: true, matchedCriteria: { row: true, col: true } }
 *
 * // Player who only played for Real Madrid (not Brazilian)
 * await validateCellWithDB('player-2', 0, content)
 * // { isValid: false, matchedCriteria: { row: false, col: true } }
 */
export async function validateCellWithDB(
  playerId: string,
  cellIndex: CellIndex,
  content: TheGridContent
): Promise<DBValidationResult> {
  // Check if player exists
  const player = await getPlayerById(playerId);
  if (!player) {
    return { isValid: false };
  }

  // Get row and column categories for this cell
  const { row, col } = getCellCategories(cellIndex, content);

  // Check row criterion
  const rowMatch = await checkCategoryMatch(playerId, row);

  // Check column criterion
  const colMatch = await checkCategoryMatch(playerId, col);

  // Player must match BOTH criteria
  const isValid = rowMatch && colMatch;

  return {
    isValid,
    matchedCriteria: {
      row: rowMatch,
      col: colMatch,
    },
  };
}

/**
 * Check if a player matches a single category criterion.
 *
 * @param playerId - Player database ID
 * @param category - Grid category to check
 * @returns true if player matches the category
 */
async function checkCategoryMatch(
  playerId: string,
  category: GridCategory
): Promise<boolean> {
  switch (category.type) {
    case 'club':
      return didPlayerPlayFor(playerId, category.value);

    case 'nation': {
      const code = COUNTRY_NAME_TO_CODE[category.value];
      if (!code) {
        console.warn(`Unknown country name: ${category.value}`);
        return false;
      }
      return hasNationality(playerId, code);
    }

    case 'trophy': {
      const trophyStats = await getPlayerStatsCache(playerId);
      return checkTrophyMatch(category.value, trophyStats);
    }

    case 'stat': {
      const statStats = await getPlayerStatsCache(playerId);
      return checkStatMatch(category.value, statStats);
    }

    default:
      return false;
  }
}
