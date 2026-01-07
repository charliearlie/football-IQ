/**
 * Shared Share Status Hook
 *
 * Manages share button state and behavior for result modals.
 * Handles:
 * - Share status tracking (idle → shared → idle)
 * - Platform-aware button text
 * - Haptic feedback integration
 */

import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useHaptics } from '@/hooks/useHaptics';

export interface ShareResult {
  success: boolean;
  method?: 'share' | 'clipboard';
  error?: Error;
}

export type ShareStatus = 'idle' | 'shared';

export interface UseShareStatusResult {
  /** Current share status */
  status: ShareStatus;
  /** Handler to call onShare and manage status */
  handleShare: () => Promise<void>;
  /** Platform-aware button title */
  buttonTitle: string;
  /** Button colors based on status */
  buttonColors: {
    topColor: string;
    shadowColor: string;
  };
}

/**
 * Hook to manage share button state in result modals.
 *
 * @param onShare - Async function to perform the share action
 * @param colors - Theme colors for button styling
 * @returns Share status, handler, and button configuration
 *
 * @example
 * ```tsx
 * const { status, handleShare, buttonTitle, buttonColors } = useShareStatus(onShare);
 *
 * <ElevatedButton
 *   title={buttonTitle}
 *   onPress={handleShare}
 *   topColor={buttonColors.topColor}
 *   shadowColor={buttonColors.shadowColor}
 * />
 * ```
 */
export function useShareStatus(
  onShare?: () => Promise<ShareResult>,
  colors: {
    activeTopColor: string;
    activeShadowColor: string;
    sharedTopColor: string;
    sharedShadowColor: string;
  } = {
    activeTopColor: '#4CAF50', // pitchGreen
    activeShadowColor: '#2E7D32', // grassShadow
    sharedTopColor: 'rgba(255, 255, 255, 0.1)', // glassBackground
    sharedShadowColor: 'rgba(255, 255, 255, 0.2)', // glassBorder
  }
): UseShareStatusResult {
  const [status, setStatus] = useState<ShareStatus>('idle');
  const { triggerNotification, triggerSelection } = useHaptics();

  const handleShare = useCallback(async () => {
    if (!onShare) return;

    triggerSelection();
    const result = await onShare();

    if (result.success) {
      setStatus('shared');
      triggerNotification('success');

      // Reset after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }
  }, [onShare, triggerSelection, triggerNotification]);

  const buttonTitle =
    status === 'shared'
      ? Platform.OS === 'web'
        ? 'Copied!'
        : 'Shared!'
      : 'Share Result';

  const buttonColors = {
    topColor: status === 'shared' ? colors.sharedTopColor : colors.activeTopColor,
    shadowColor: status === 'shared' ? colors.sharedShadowColor : colors.activeShadowColor,
  };

  return {
    status,
    handleShare,
    buttonTitle,
    buttonColors,
  };
}

/**
 * Reset share status when modal visibility changes.
 *
 * @param visible - Whether the modal is visible
 * @param won - Whether the player won (for haptic feedback)
 */
export function useResetShareStatus(
  visible: boolean,
  won: boolean,
  setStatus?: (status: ShareStatus) => void
) {
  const { triggerNotification } = useHaptics();

  useEffect(() => {
    if (visible) {
      setStatus?.('idle');
      triggerNotification(won ? 'success' : 'error');
    }
  }, [visible, won, triggerNotification, setStatus]);
}
