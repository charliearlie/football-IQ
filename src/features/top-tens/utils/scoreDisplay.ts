/**
 * Top Tens Score Display
 *
 * Generates text-based descriptions for sharing results.
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
 * Generate text description for Top Tens result.
 *
 * @param rankSlots - Array of 10 rank slot states
 * @param score - Final score
 * @returns Text description like "7 of 10 found"
 */
export function generateTopTensScoreDescription(
  rankSlots: RankSlotState[],
  score: TopTensScore
): string {
  return `${score.foundCount} of 10 found`;
}

/**
 * @deprecated Use generateTopTensScoreDescription instead. Kept for backwards compatibility.
 */
export function generateTopTensEmojiGrid(
  rankSlots: RankSlotState[],
  score: TopTensScore
): string {
  return generateTopTensScoreDescription(rankSlots, score);
}

/**
 * Generate full score display text for sharing.
 *
 * Format:
 * Football IQ - Top Tens
 * [date if provided]
 * 7/10
 * 7 of 10 found
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
  lines.push(generateTopTensScoreDescription(rankSlots, score));

  return lines.join('\n');
}

/**
 * @deprecated Use generateTopTensScoreDescription instead.
 */
export function generateTopTensTwoRowGrid(
  rankSlots: RankSlotState[],
  score: TopTensScore
): string {
  return generateTopTensScoreDescription(rankSlots, score);
}
