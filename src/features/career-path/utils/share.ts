/**
 * Share Functionality for Career Path
 *
 * Handles sharing game results via native share sheet (mobile)
 * or clipboard (web).
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { GameScore } from './scoring';
import { generateScoreDisplay } from './scoreDisplay';

/**
 * Result of a share attempt.
 */
export interface ShareResult {
  /** Whether the share was successful */
  success: boolean;
  /** Method used: native share sheet or clipboard */
  method: 'share' | 'clipboard';
  /** Error if share failed */
  error?: Error;
}

/**
 * Options for sharing game results.
 */
export interface ShareOptions {
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Custom title for share text (default: "Football IQ - Career Path") */
  title?: string;
}

/**
 * Share game results.
 *
 * Behavior by platform:
 * - iOS/Android: Opens native share sheet
 * - Web: Copies to clipboard
 *
 * @param score - Game score data
 * @param totalSteps - Total puzzle steps
 * @param options - Share options including puzzleDate and optional title
 * @returns ShareResult with success status and method used
 *
 * @example
 * const result = await shareGameResult(score, 10, { puzzleDate: '2025-01-15' });
 * if (result.success && result.method === 'clipboard') {
 *   showToast('Copied to clipboard!');
 * }
 *
 * // With custom title for Career Path Pro:
 * await shareGameResult(score, 10, {
 *   puzzleDate: '2025-01-15',
 *   title: 'Football IQ - Career Path Pro'
 * });
 */
export async function shareGameResult(
  score: GameScore,
  totalSteps: number,
  options: ShareOptions | string // Support legacy string puzzleDate for backwards compatibility
): Promise<ShareResult> {
  // Handle legacy call signature (just puzzleDate string)
  const { puzzleDate, title } = typeof options === 'string'
    ? { puzzleDate: options, title: undefined }
    : options;

  const shareText = generateScoreDisplay(score, totalSteps, {
    includeDate: true,
    puzzleDate,
    title,
  });

  try {
    if (Platform.OS === 'web') {
      // Web: Copy to clipboard
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: 'clipboard' };
    }

    // Mobile: Use native share sheet
    const result = await Share.share({
      message: shareText,
    });

    if (result.action === Share.sharedAction) {
      return { success: true, method: 'share' };
    } else {
      // User dismissed the share sheet
      return { success: false, method: 'share' };
    }
  } catch (error) {
    return {
      success: false,
      method: Platform.OS === 'web' ? 'clipboard' : 'share',
      error: error as Error,
    };
  }
}

/**
 * Copy text directly to clipboard.
 * Useful for the "Copy" button alternative to share.
 *
 * @param text - Text to copy
 * @returns Whether copy succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
