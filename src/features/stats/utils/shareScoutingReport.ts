/**
 * Scouting Report Share Utilities
 *
 * Provides capture and share functionality for Scouting Report cards.
 * Uses ViewShot for image generation and native sharing APIs.
 */

import { RefObject } from 'react';
import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import { ScoutingReportData } from '../components/ScoutingReportCard';
import { getTierForPoints } from './tierProgression';

/**
 * Generate web URL for sharing Scout Reports.
 * This URL will show OG image previews on social platforms.
 */
export function generateWebShareUrl(userId?: string): string {
  return `https://football-iq-phi.vercel.app/scout/${userId || 'anonymous'}`;
}

/**
 * Result from a share operation.
 */
export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Capture the Scouting Report card as a PNG image.
 *
 * @param viewRef - Reference to the ViewShot component
 * @returns URI of the captured image, or null on failure
 */
export async function captureScoutingReport(
  viewRef: RefObject<ViewShot>
): Promise<string | null> {
  try {
    if (!viewRef.current?.capture) {
      console.warn('ViewShot ref not available for capture');
      return null;
    }

    const uri = await viewRef.current.capture();
    return uri;
  } catch (error) {
    console.error('Failed to capture Scouting Report:', error);
    return null;
  }
}

/**
 * Generate fallback share text for platforms without image support.
 * Includes web URL for social media link previews.
 */
export function generateShareText(data: ScoutingReportData): string {
  const tier = getTierForPoints(data.totalIQ);
  const webUrl = generateWebShareUrl(data.userId);

  const lines = [
    `${data.displayName}'s Football IQ Scout Report`,
    '',
    `${tier.name} | ${data.totalIQ.toLocaleString()} IQ`,
    `Field Experience: ${data.totalAppearances} Reports`,
  ];

  if (data.currentStreak > 0) {
    lines.push(`Current Streak: ${data.currentStreak} Days`);
  }

  lines.push('', 'Test your football knowledge:', webUrl);

  return lines.join('\n');
}

/**
 * Share the Scouting Report image or text.
 *
 * @param imageUri - URI of the captured image
 * @param data - Scouting report data for text fallback
 * @returns Result indicating success and method used
 */
export async function shareScoutingReport(
  imageUri: string | null,
  data: ScoutingReportData
): Promise<ShareResult> {
  const shareText = generateShareText(data);

  try {
    // Mobile platforms: use native share
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const shareOptions: { message: string; url?: string } = {
        message: shareText,
      };

      // Include image if available (iOS and Android support this)
      if (imageUri) {
        shareOptions.url = imageUri;
      }

      const result = await Share.share(shareOptions);

      if (result.action === Share.dismissedAction) {
        return { success: false, method: 'share' };
      }

      return { success: true, method: 'share' };
    }

    // Web/other: fallback to clipboard
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    console.error('Failed to share Scouting Report:', error);

    // Fallback to clipboard on error
    try {
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: 'clipboard' };
    } catch (clipboardError) {
      return {
        success: false,
        method: 'clipboard',
        error:
          clipboardError instanceof Error
            ? clipboardError
            : new Error('Failed to copy to clipboard'),
      };
    }
  }
}

/**
 * Capture and share the Scouting Report in one operation.
 *
 * @param viewRef - Reference to the ViewShot component
 * @param data - Scouting report data
 * @returns Result indicating success and method used
 */
export async function captureAndShareScoutingReport(
  viewRef: RefObject<ViewShot>,
  data: ScoutingReportData
): Promise<ShareResult> {
  const imageUri = await captureScoutingReport(viewRef);
  return shareScoutingReport(imageUri, data);
}
