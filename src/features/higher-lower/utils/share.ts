/**
 * Share utilities for Higher/Lower game results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { HigherLowerScore } from './scoring';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Generate emoji representation of results.
 * ✅ for correct, ❌ for wrong.
 */
export function generateHigherLowerEmojiGrid(results: boolean[]): string {
  return results.map((r) => (r ? '✅' : '❌')).join('');
}

/**
 * Generate share text for Higher/Lower result.
 */
export function generateHigherLowerShareText(
  score: HigherLowerScore,
  results: boolean[],
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const emojiGrid = generateHigherLowerEmojiGrid(results);

  const firstLine = score.won
    ? 'I got a perfect 10 in Higher/Lower!'
    : `I scored ${score.points}/10 in Higher/Lower!`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/higher-lower?ref=share&date=${puzzleDate}`
    : 'https://football-iq.app?ref=share';

  const lines = [
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
 * Share Higher/Lower result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareHigherLowerResult(
  score: HigherLowerScore,
  results: boolean[],
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateHigherLowerShareText(score, results, puzzleDate);

  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      }
      return { success: false, method: 'share' };
    } catch (error) {
      console.warn('[HigherLower] Native share failed, falling back to clipboard:', error);
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
