/**
 * Scoring utilities for The Grid game mode.
 *
 * Uses completion-based scoring: ~11 points per cell filled, max 100.
 */

import { TheGridScore, FilledCell } from '../types/theGrid.types';

/**
 * Calculate the score for The Grid game.
 *
 * Scoring formula:
 * - 9 cells filled = 100 points (perfect)
 * - Otherwise, proportional: round((cellsFilled / 9) * 100)
 *
 * @param cellsFilled - Number of cells filled (0-9)
 * @returns TheGridScore object
 *
 * @example
 * calculateGridScore(9)  // { points: 100, maxPoints: 100, cellsFilled: 9 }
 * calculateGridScore(5)  // { points: 56, maxPoints: 100, cellsFilled: 5 }
 * calculateGridScore(0)  // { points: 0, maxPoints: 100, cellsFilled: 0 }
 */
export function calculateGridScore(cellsFilled: number): TheGridScore {
  // Clamp to valid range
  const clampedCells = Math.max(0, Math.min(9, Math.floor(cellsFilled)));

  // Perfect score for completing the grid
  if (clampedCells === 9) {
    return {
      points: 100,
      maxPoints: 100,
      cellsFilled: 9,
    };
  }

  // Proportional score for partial completion
  const points = Math.round((clampedCells / 9) * 100);

  return {
    points,
    maxPoints: 100,
    cellsFilled: clampedCells,
  };
}

/**
 * Calculate score from cells array.
 *
 * @param cells - Array of cell states
 * @returns TheGridScore object
 */
export function calculateScoreFromCells(cells: (FilledCell | null)[]): TheGridScore {
  const cellsFilled = cells.filter((cell) => cell !== null).length;
  return calculateGridScore(cellsFilled);
}

/**
 * Check if the grid is complete (all 9 cells filled).
 *
 * @param cells - Array of cell states
 * @returns True if all cells are filled
 */
export function isGridComplete(cells: (FilledCell | null)[]): boolean {
  return cells.every((cell) => cell !== null);
}

/**
 * Normalize a Grid score to 0-100 for IQ calculation.
 *
 * @param metadata - Attempt metadata with cellsFilled
 * @returns Normalized score (0-100)
 */
export function normalizeGridScore(metadata: { cellsFilled: number }): number {
  const cellsFilled = metadata.cellsFilled ?? 0;
  return Math.round((cellsFilled / 9) * 100);
}

/**
 * Check if the score is perfect (all 9 cells filled).
 *
 * @param metadata - Attempt metadata with cellsFilled
 * @returns True if perfect score
 */
export function isPerfectGridScore(metadata: { cellsFilled: number }): boolean {
  return metadata.cellsFilled === 9;
}
