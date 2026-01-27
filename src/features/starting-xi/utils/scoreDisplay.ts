/**
 * Score display utilities for Starting XI game mode.
 *
 * Generates text-based descriptions for sharing results.
 */

import type {
  StartingXIScore,
  PlayerSlotState,
  FormationName,
} from '../types/startingXI.types';

/**
 * Generate a text description of the result for share cards.
 *
 * @param score - StartingXIScore object
 * @returns Text description like "7 of 11 found"
 */
export function generateStartingXIScoreDescription(score: StartingXIScore): string {
  return `${score.foundCount} of 11 found`;
}

/**
 * @deprecated Use generateStartingXIScoreDescription instead. Kept for backwards compatibility.
 */
export function generateStartingXIEmojiGrid(
  slots: PlayerSlotState[],
  formation: FormationName
): string {
  // Calculate found count from slots
  const foundCount = slots.filter((s) => s.isHidden && s.isFound).length;
  return `${foundCount} of 11 found`;
}

/**
 * @deprecated Use generateStartingXIScoreDescription instead.
 */
export function generateLinearEmojiDisplay(slots: PlayerSlotState[]): string {
  const foundCount = slots.filter((s) => s.isHidden && s.isFound).length;
  return `${foundCount} of 11 found`;
}

/**
 * Format score for display in UI.
 *
 * @param score - StartingXIScore object
 * @returns Formatted string (e.g., "Found: 9/11")
 */
export function formatScoreDisplay(score: StartingXIScore): string {
  return `Found: ${score.foundCount}/${score.totalHidden}`;
}

/**
 * Generate the score_display string for database storage.
 * Used in puzzle_attempts.score_display column.
 *
 * @param slots - Array of PlayerSlotState
 * @returns Text description
 */
export function generateScoreDisplayString(slots: PlayerSlotState[]): string {
  const foundCount = slots.filter((s) => s.isHidden && s.isFound).length;
  return `${foundCount} of 11 found`;
}
