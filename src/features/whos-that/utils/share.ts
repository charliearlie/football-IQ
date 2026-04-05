/**
 * Share utilities for Balldle game results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BalldeScore } from './scoring';
import { GuessFeedback } from '../types/balldle.types';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Generate emoji grid summary for a Balldle result.
 *
 * Each row: club + league + nationality + position + age squares.
 * green  = 🟩, yellow = 🟨, red = 🟥
 */
export function generateBalldeEmojiGrid(guesses: GuessFeedback[]): string {
  const colorToEmoji: Record<string, string> = {
    green: '🟩',
    yellow: '🟨',
    red: '🟥',
  };

  return guesses
    .map((g) =>
      [g.club, g.league, g.nationality, g.position, g.age]
        .map((attr) => colorToEmoji[attr.color] ?? '⬜')
        .join('')
    )
    .join('\n');
}

/**
 * Generate share text for a Balldle result.
 */
export function generateBalldeShareText(
  score: BalldeScore,
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

  const emojiGrid = generateBalldeEmojiGrid(guesses);

  const firstLine = score.won
    ? score.guessCount === 1
      ? 'Got it in one!'
      : `Got it in ${score.guessCount}/${score.maxPoints} guesses`
    : `Couldn't crack it in ${score.maxPoints} tries`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/balldle?ref=share&mode=balldle&date=${puzzleDate}`
    : 'https://football-iq.app/play/balldle?ref=share&mode=balldle';

  const lines = [
    `Football IQ — Balldle`,
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
 * Share Balldle result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareBalldeResult(
  score: BalldeScore,
  guesses: GuessFeedback[],
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateBalldeShareText(score, guesses, puzzleDate);

  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      }
      return { success: false, method: 'share' };
    } catch (error) {
      console.warn('[Balldle] Native share failed, falling back to clipboard:', error);
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
