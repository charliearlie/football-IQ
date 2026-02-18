/**
 * Share utilities for Timeline game results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { TimelineEvent, TimelineScore } from '../types/timeline.types';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Generate emoji row for Timeline result.
 * Shows correct/incorrect for each position in chronological order.
 *
 * @param firstAttemptResults - Boolean array indicating which positions were correct on first attempt
 * @returns Emoji string (e.g., "✅❌✅✅❌✅")
 */
export function generateTimelineEmojiRow(firstAttemptResults: boolean[]): string {
  return firstAttemptResults.map((correct) => (correct ? '✅' : '❌')).join('');
}

/**
 * Generate share text for Timeline result.
 */
export function generateTimelineShareText(
  subject: string,
  firstAttemptResults: boolean[],
  score: TimelineScore,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const emojiRow = generateTimelineEmojiRow(firstAttemptResults);

  const lines = [
    'Football IQ - Timeline',
    dateStr,
    '',
    `⏱️ ${subject}`,
    emojiRow,
    '',
    `${score.firstAttemptCorrect}/6 correct - ${score.points} IQ`,
    'footballiq.app',
  ];

  return lines.join('\n');
}

/**
 * Share Timeline result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareTimelineResult(
  subject: string,
  firstAttemptResults: boolean[],
  score: TimelineScore,
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateTimelineShareText(
    subject,
    firstAttemptResults,
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
        return { success: false, method: 'share' };
      }
    } catch (error) {
      console.warn('[Timeline] Native share failed, falling back to clipboard:', error);
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
