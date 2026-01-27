/**
 * useResultShare Hook
 *
 * Provides image-based sharing functionality for result modals.
 * Uses ViewShot to capture ResultShareCard and shares via native APIs.
 */

import { RefObject, useCallback, useState } from 'react';
import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { GAME_MODE_DISPLAY } from '@/features/stats/types/stats.types';
import { getTierForPoints } from '@/features/stats/utils/tierProgression';

export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

export interface ResultShareData {
  gameMode: GameMode;
  scoreDisplay: string;
  puzzleDate: string;
  displayName: string;
  totalIQ: number;
  won: boolean;
  isPerfectScore?: boolean;
}

/**
 * Generate share text for the result.
 */
export function generateResultShareText(data: ResultShareData): string {
  const gameModeName = GAME_MODE_DISPLAY[data.gameMode].displayName;
  const tier = getTierForPoints(data.totalIQ);

  const lines = [
    `Football IQ - ${gameModeName}`,
    '',
    data.scoreDisplay,
    '',
    data.isPerfectScore ? '⭐ Perfect Score!' : data.won ? '✅ Complete!' : '❌ Game Over',
    '',
    `${tier.name} | ${data.totalIQ.toLocaleString()} IQ`,
    '',
    'Test your football knowledge at football-iq.app',
  ];

  return lines.join('\n');
}

/**
 * Capture result card as image.
 */
export async function captureResultCard(
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
    console.error('Failed to capture result card:', error);
    return null;
  }
}

/**
 * Share result card image or text.
 */
export async function shareResultCard(
  imageUri: string | null,
  data: ResultShareData
): Promise<ShareResult> {
  const shareText = generateResultShareText(data);

  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const shareOptions: { message: string; url?: string } = {
        message: shareText,
      };

      if (imageUri) {
        shareOptions.url = imageUri;
      }

      const result = await Share.share(shareOptions);

      if (result.action === Share.dismissedAction) {
        return { success: false, method: 'share' };
      }

      return { success: true, method: 'share' };
    }

    // Web fallback
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    console.error('Failed to share result:', error);

    // Fallback to clipboard
    try {
      await Clipboard.setStringAsync(shareText);
      return { success: true, method: 'clipboard' };
    } catch (clipboardError) {
      return {
        success: false,
        method: 'clipboard',
        error: clipboardError instanceof Error
          ? clipboardError
          : new Error('Failed to share'),
      };
    }
  }
}

/**
 * Hook for result sharing with image capture.
 *
 * @example
 * ```tsx
 * function ResultModal() {
 *   const viewShotRef = useRef<ViewShot>(null);
 *   const { handleShare, isSharing } = useResultShare(viewShotRef, {
 *     gameMode: 'career_path',
 *     scoreDisplay: '✅✅✅❌❌',
 *     puzzleDate: '2026-01-15',
 *     displayName: 'Player',
 *     totalIQ: 1234,
 *     won: true,
 *   });
 *
 *   return (
 *     <ViewShot ref={viewShotRef}>
 *       <ResultShareCard {...props} />
 *     </ViewShot>
 *   );
 * }
 * ```
 */
export function useResultShare(
  viewShotRef: RefObject<ViewShot>,
  data: ResultShareData
) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'error'>('idle');

  const handleShare = useCallback(async (): Promise<ShareResult> => {
    setIsSharing(true);
    setShareStatus('idle');

    const imageUri = await captureResultCard(viewShotRef);
    const result = await shareResultCard(imageUri, data);

    setIsSharing(false);

    if (result.success) {
      setShareStatus('shared');
      setTimeout(() => setShareStatus('idle'), 2000);
    } else {
      setShareStatus('error');
    }

    return result;
  }, [viewShotRef, data]);

  return {
    handleShare,
    isSharing,
    shareStatus,
  };
}
