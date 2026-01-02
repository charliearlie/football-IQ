/**
 * Share IQ Card Utilities
 *
 * Functions for capturing and sharing the IQ Card as an image.
 */

import { Share, Platform } from 'react-native';
import { RefObject } from 'react';
import ViewShot from 'react-native-view-shot';

export interface ShareIQResult {
  success: boolean;
  method: 'share' | 'error';
  error?: string;
}

export interface IQCardData {
  /** Global IQ score (0-100) */
  globalIQ: number;
  /** Current streak */
  currentStreak: number;
  /** User's current rank on the global leaderboard */
  rank: number | null;
  /** Total users on the leaderboard */
  totalUsers: number | null;
  /** Top badge name */
  topBadgeName: string | null;
  /** User's display name */
  displayName: string;
}

/**
 * Capture the IQ Card view as an image.
 *
 * @param viewRef - Reference to the ViewShot component
 * @returns URI of the captured image
 */
export async function captureIQCard(
  viewRef: RefObject<ViewShot>
): Promise<string | null> {
  try {
    if (!viewRef.current || !viewRef.current.capture) {
      console.error('ViewShot ref is not available');
      return null;
    }

    const uri = await viewRef.current.capture();
    return uri;
  } catch (error) {
    console.error('Error capturing IQ card:', error);
    return null;
  }
}

/**
 * Share the IQ Card image using native share sheet.
 *
 * @param imageUri - URI of the captured image
 * @param iqCardData - IQ card data for fallback text
 * @returns Share result
 */
export async function shareIQCard(
  imageUri: string,
  iqCardData: IQCardData
): Promise<ShareIQResult> {
  try {
    // Create share text as fallback/complement
    const shareText = generateShareText(iqCardData);

    if (Platform.OS === 'web') {
      // Web doesn't support image sharing well, just share text
      await Share.share({ message: shareText });
      return { success: true, method: 'share' };
    }

    // Mobile: Share image with text
    const result = await Share.share({
      url: imageUri,
      message: shareText,
      title: 'My Football IQ',
    });

    if (result.action === Share.sharedAction) {
      return { success: true, method: 'share' };
    }

    // User dismissed but no error
    return { success: true, method: 'share' };
  } catch (error) {
    console.error('Error sharing IQ card:', error);
    return {
      success: false,
      method: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate shareable text for the IQ card.
 *
 * @param data - IQ card data
 * @returns Formatted share text
 */
function generateShareText(data: IQCardData): string {
  const lines = [
    `Football IQ - ${data.displayName}`,
    '',
    `IQ Score: ${data.globalIQ}`,
  ];

  if (data.rank && data.totalUsers) {
    lines.push(`Rank: #${data.rank} of ${data.totalUsers}`);
  }

  if (data.currentStreak > 0) {
    lines.push(`Streak: ${data.currentStreak} days`);
  }

  if (data.topBadgeName) {
    lines.push(`Top Badge: ${data.topBadgeName}`);
  }

  lines.push('');
  lines.push('Download Football IQ and test your knowledge!');

  return lines.join('\n');
}

/**
 * Capture and share the IQ card in one operation.
 *
 * @param viewRef - Reference to the ViewShot component
 * @param iqCardData - IQ card data
 * @returns Share result
 */
export async function captureAndShareIQCard(
  viewRef: RefObject<ViewShot>,
  iqCardData: IQCardData
): Promise<ShareIQResult> {
  const imageUri = await captureIQCard(viewRef);

  if (!imageUri) {
    return {
      success: false,
      method: 'error',
      error: 'Failed to capture IQ card',
    };
  }

  return shareIQCard(imageUri, iqCardData);
}
