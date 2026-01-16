/**
 * Score display utilities for Starting XI game mode.
 *
 * Generates emoji grids and formatted strings for sharing results.
 */

import type {
  StartingXIScore,
  PlayerSlotState,
  FormationName,
} from '../types/startingXI.types';

/**
 * Generate an emoji grid representing the found/missed players.
 *
 * Uses formation-aware layout to approximate the pitch positioning:
 * - Found players: green square
 * - Missed hidden players: red X
 * - Pre-revealed players: white square
 *
 * @param slots - Array of 11 PlayerSlotState objects
 * @param formation - Formation name for layout hints
 * @returns Multi-line emoji string
 *
 * @example
 * // For a 4-3-3 with 9/11 found:
 * "     🟩\n  🟩🟩🟩\n   🟩🟩🟩\n 🟩❌🟩🟩"
 */
export function generateStartingXIEmojiGrid(
  slots: PlayerSlotState[],
  formation: FormationName
): string {
  // Sort slots by y-coordinate (top to bottom, attackers first)
  const sortedSlots = [...slots].sort((a, b) => a.coords.y - b.coords.y);

  // Group slots by approximate y-position (defensive lines)
  const rows: PlayerSlotState[][] = [];
  let currentRow: PlayerSlotState[] = [];
  let lastY = -100;

  for (const slot of sortedSlots) {
    // Start new row if y difference is significant (>15 units)
    if (slot.coords.y - lastY > 15 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(slot);
    lastY = slot.coords.y;
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Convert each row to emojis, sorted by x-position
  const emojiRows = rows.map((row) => {
    const sorted = [...row].sort((a, b) => a.coords.x - b.coords.x);
    const emojis = sorted.map((slot) => {
      if (!slot.isHidden) {
        return '\u2B1C'; // White square for pre-revealed
      }
      return slot.isFound ? '\uD83D\uDFE9' : '\u274C'; // Green or red X
    });

    // Add spacing based on position to approximate formation shape
    const spacing = ' '.repeat(Math.max(0, Math.floor((5 - row.length) / 2)));
    return spacing + emojis.join('');
  });

  return emojiRows.join('\n');
}

/**
 * Generate a simple linear emoji display (fallback/alternative).
 *
 * @param slots - Array of PlayerSlotState
 * @returns Single line of emojis (e.g., "🟩🟩🟩🟩🟩🟩🟩🟩❌❌🟩")
 */
export function generateLinearEmojiDisplay(slots: PlayerSlotState[]): string {
  return slots
    .map((slot) => {
      if (!slot.isHidden) return '\u2B1C'; // White square
      return slot.isFound ? '\uD83D\uDFE9' : '\u274C'; // Green or red X
    })
    .join('');
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
 * @returns Compact emoji string
 */
export function generateScoreDisplayString(slots: PlayerSlotState[]): string {
  return generateLinearEmojiDisplay(slots);
}
