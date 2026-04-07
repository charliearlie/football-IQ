/**
 * Share utilities for Who's That? game results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WhosThatScore } from './scoring';
import { GuessFeedback } from '../types/whosThat.types';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Generate emoji grid summary for a Who's That? result.
 *
 * Each row: club + league + nationality + position + age squares.
 * green  = 🟩, yellow = 🟨, red = 🟥
 */
export function generateWhosThatEmojiGrid(guesses: GuessFeedback[]): string {
  const colorToEmoji: Record<string, string> = {
    green: '🟩',
    yellow: '🟨',
    red: '🟥',
  };

  return guesses
    .map((g) =>
      [g.club, g.league, g.nationality, g.position, g.birthYear]
        .map((attr) => colorToEmoji[attr.color] ?? '⬜')
        .join('')
    )
    .join('\n');
}

/**
 * Generate share text for a Who's That? result.
 */
export function generateWhosThatShareText(
  score: WhosThatScore,
  guesses: GuessFeedback[],
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const emojiGrid = generateWhosThatEmojiGrid(guesses);

  const firstLine = score.won
    ? score.guessCount === 1
      ? 'Got it in one!'
      : `Got it in ${score.guessCount}/${score.maxPoints} guesses`
    : `Couldn't crack it in ${score.maxPoints} tries`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/whos-that?ref=share&mode=whos-that&date=${puzzleDate}`
    : 'https://football-iq.app/play/whos-that?ref=share&mode=whos-that';

  const lines = [
    `Football IQ — Who's That?`,
    firstLine,
    dateStr,
    '',
    emojiGrid,
    '',
    `${score.points}/${score.maxPoints} IQ`,
    playUrl,
  ];

  return lines.join('\n');
}

/**
 * Share Who's That? result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareWhosThatResult(
  score: WhosThatScore,
  guesses: GuessFeedback[],
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateWhosThatShareText(score, guesses, puzzleDate);

  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      }
      return { success: false, method: 'share' };
    } catch (error) {
      console.warn('[WhosThat] Native share failed, falling back to clipboard:', error);
    }
  }

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
