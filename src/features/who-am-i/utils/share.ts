/**
 * Share utilities for Who Am I? game results.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { WhoAmIScore } from './scoring';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Generate clue emoji representation.
 * Shows which clues were revealed before guessing.
 * Green = revealed, gray = not needed.
 */
export function generateWhoAmIEmojiGrid(score: WhoAmIScore): string {
  const emojis: string[] = [];
  for (let i = 1; i <= score.maxPoints; i++) {
    if (i <= score.cluesRevealed) {
      emojis.push(i === score.cluesRevealed && score.won ? '🟩' : '🟨');
    } else {
      emojis.push('⬜');
    }
  }
  return emojis.join('');
}

/**
 * Generate share text for Who Am I? result.
 */
export function generateWhoAmIShareText(
  score: WhoAmIScore,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const emojiGrid = generateWhoAmIEmojiGrid(score);

  const firstLine = score.won
    ? `I knew who it was after just ${score.cluesRevealed} clue${score.cluesRevealed === 1 ? '' : 's'}!`
    : 'This one stumped me completely';

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i&date=${puzzleDate}`
    : 'https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i';

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
 * Share Who Am I? result.
 * Uses native share on mobile, clipboard fallback on web.
 */
export async function shareWhoAmIResult(
  score: WhoAmIScore,
  puzzleDate?: string
): Promise<ShareResult> {
  const shareText = generateWhoAmIShareText(score, puzzleDate);

  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      }
      return { success: false, method: 'share' };
    } catch (error) {
      console.warn('[WhoAmI] Native share failed, falling back to clipboard:', error);
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
