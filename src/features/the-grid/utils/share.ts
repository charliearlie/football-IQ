/**
 * Share utilities for The Grid game mode.
 *
 * Handles native sharing and clipboard fallback.
 */

import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FilledCell, TheGridScore } from '../types/theGrid.types';
import { generateTheGridScoreDisplay } from './scoreDisplay';

/**
 * Result of a share operation.
 */
export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Share The Grid game result.
 *
 * On iOS/Android: Opens native share sheet.
 * On web: Copies to clipboard.
 *
 * @param cells - Array of cell states
 * @param score - Score object
 * @param date - Puzzle date in YYYY-MM-DD format
 * @returns Promise resolving to ShareResult
 */
export async function shareTheGridResult(
  cells: (FilledCell | null)[],
  score: TheGridScore,
  date?: string
): Promise<ShareResult> {
  const shareText = generateTheGridScoreDisplay(cells, score, {
    date,
    includeTitle: true,
  });

  // On web, use clipboard
  if (Platform.OS === 'web') {
    return copyToClipboard(shareText);
  }

  // On native, use share sheet
  try {
    await Share.share({
      message: shareText,
    });

    return {
      success: true,
      method: 'share',
    };
  } catch (error) {
    // Fallback to clipboard on share failure
    return copyToClipboard(shareText);
  }
}

/**
 * Copy text to clipboard.
 *
 * @param text - Text to copy
 * @returns ShareResult
 */
async function copyToClipboard(text: string): Promise<ShareResult> {
  try {
    await Clipboard.setStringAsync(text);
    return {
      success: true,
      method: 'clipboard',
    };
  } catch (error) {
    return {
      success: false,
      method: 'clipboard',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
