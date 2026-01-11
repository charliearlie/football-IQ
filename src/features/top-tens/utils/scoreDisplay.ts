/**
 * Top Tens Score Display
 *
 * Generates emoji grids and display text for sharing results.
 */

import { RankSlotState, TopTensScore } from '../types/topTens.types';
import { formatTopTensScore } from './scoring';

/**
 * Options for generating score display.
 */
export interface ScoreDisplayOptions {
  /** Puzzle date for display */
  date?: string;
  /** Include header text */
  includeHeader?: boolean;
}

/**
 * Generate emoji grid for Top Tens result.
 *
 * Shows found (checkmark) vs missed (X) for each rank.
 *
 * @param rankSlots - Array of 10 rank slot states
 * @param score - Final score
 * @returns Emoji string like "✅✅✅❌❌❌❌❌❌❌"
 */
export function generateTopTensEmojiGrid(
  rankSlots: RankSlotState[],
  score: TopTensScore
): string {
  // For a completed game (won or lost), show based on original found state
  // Note: When giving up, all slots are revealed, but we track via score.foundCount
  if (score.won) {
    // All found
    return rankSlots.map(() => '✅').join('');
  }

  // Lost - show which were found before giving up
  // Use foundCount since all slots are now revealed
  return rankSlots
    .map((slot, i) => {
      // If we found this one before giving up, show check
      // Since rankSlots are all revealed on give up, we need to use foundCount
      return i < score.foundCount ? '✅' : '❌';
    })
    .join('');
}

/**
 * Generate full score display text for sharing.
 *
 * Format:
 * Football IQ - Top Tens
 * [date if provided]
 * 7/10
 * ✅✅✅✅✅✅✅❌❌❌
 *
 * @param rankSlots - Array of 10 rank slot states
 * @param score - Final score
 * @param options - Display options
 * @returns Formatted string for sharing
 */
export function generateTopTensScoreDisplay(
  rankSlots: RankSlotState[],
  score: TopTensScore,
  options: ScoreDisplayOptions = {}
): string {
  const lines: string[] = [];

  if (options.includeHeader !== false) {
    lines.push('Football IQ - Top Tens');
  }

  if (options.date) {
    lines.push(options.date);
  }

  lines.push(formatTopTensScore(score));
  lines.push(generateTopTensEmojiGrid(rankSlots, score));

  return lines.join('\n');
}

/**
 * Generate a two-row emoji grid (5 per row) for compact display.
 *
 * @param rankSlots - Array of 10 rank slot states
 * @param score - Final score
 * @returns Two-line emoji grid
 */
export function generateTopTensTwoRowGrid(
  rankSlots: RankSlotState[],
  score: TopTensScore
): string {
  const fullGrid = generateTopTensEmojiGrid(rankSlots, score);
  const row1 = fullGrid.slice(0, 5);
  const row2 = fullGrid.slice(5, 10);
  return `${row1}\n${row2}`;
}
