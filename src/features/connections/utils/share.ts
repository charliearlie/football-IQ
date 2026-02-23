/**
 * Share utilities for Connections game results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  ConnectionsGuess,
  ConnectionsGroup,
  ConnectionsScore,
  ConnectionsDifficulty,
} from '../types/connections.types';
import { getConnectionsScoreLabel } from './scoring';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Difficulty color emoji map.
 */
const DIFFICULTY_EMOJI: Record<ConnectionsDifficulty, string> = {
  yellow: '🟨',
  green: '🟩',
  blue: '🟦',
  purple: '🟪',
};

/**
 * Generate emoji grid for Connections result.
 * Each row represents a guess attempt, showing which groups the selected players belong to.
 *
 * @param guesses - All guess attempts made
 * @param allGroups - All 4 groups in the puzzle
 * @returns Multi-line emoji grid string
 */
export function generateConnectionsEmojiGrid(
  guesses: ConnectionsGuess[],
  allGroups: ConnectionsGroup[]
): string {
  const rows: string[] = [];

  for (const guess of guesses) {
    // Map each player to their group's emoji
    const emojis = guess.players.map((playerName) => {
      // Find which group this player belongs to
      const group = allGroups.find((g) => g.players.includes(playerName));
      return group ? DIFFICULTY_EMOJI[group.difficulty] : '⬜';
    });

    rows.push(emojis.join(''));
  }

  return rows.join('\n');
}

/**
 * Generate share text for Connections result.
 *
 * @param guesses - All guess attempts
 * @param solvedGroups - Groups that were solved
 * @param allGroups - All 4 groups
 * @param mistakes - Number of mistakes made
 * @param score - Final score
 * @param puzzleDate - Optional puzzle date
 * @returns Share text
 */
export function generateConnectionsShareText(
  guesses: ConnectionsGuess[],
  solvedGroups: ConnectionsGroup[],
  allGroups: ConnectionsGroup[],
  mistakes: number,
  score: ConnectionsScore,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const emojiGrid = generateConnectionsEmojiGrid(guesses, allGroups);
  const scoreLabel = getConnectionsScoreLabel(solvedGroups.length);

  // Format:
  // "Football IQ - Connections"
  // "14 Feb 2026"
  // ""
  // "🟨🟨🟨🟨"
  // "🟩🟦🟩🟩"
  // "🟩🟩🟩🟩"
  // "🟦🟦🟦🟦"
  // "🟪🟪🟪🟪"
  // ""
  // "1 mistake - 8 IQ"
  // "https://football-iq.app"

  const mistakeText = mistakes === 1 ? '1 mistake' : `${mistakes} mistakes`;

  const firstLine =
    mistakes === 0
      ? 'Can you find all 4 groups? I had zero mistakes!'
      : `Can you find all 4 groups? I had ${mistakes} mistake${mistakes === 1 ? '' : 's'}`;

  const lines = [
    firstLine,
    dateStr,
    '',
    emojiGrid,
    '',
    `${mistakeText} - ${score.points} IQ`,
    'https://football-iq.app',
  ];

  return lines.join('\n');
}

/**
 * Share Connections result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareConnectionsResult(
  guesses: ConnectionsGuess[],
  solvedGroups: ConnectionsGroup[],
  allGroups: ConnectionsGroup[],
  mistakes: number,
  score: ConnectionsScore,
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateConnectionsShareText(
    guesses,
    solvedGroups,
    allGroups,
    mistakes,
    score,
    puzzleDate
  );

  // Try native share first (not available on web)
  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({
        message: shareText,
      });

      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      } else if (result.action === Share.dismissedAction) {
        // User dismissed, not an error
        return { success: false, method: 'share' };
      }
    } catch (error) {
      console.warn('[Connections] Native share failed, falling back to clipboard:', error);
    }
  }

  // Fallback to clipboard
  try {
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    return {
      success: false,
      method: 'clipboard',
      error: error instanceof Error ? error : new Error('Clipboard copy failed'),
    };
  }
}
