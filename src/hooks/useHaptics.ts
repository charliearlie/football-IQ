import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback hook for tactile interactions.
 *
 * Provides consistent haptic feedback across the app.
 * Falls back gracefully on platforms without haptic support.
 *
 * All functions are wrapped in useCallback to maintain stable references
 * and prevent infinite render loops when used in useEffect dependencies.
 */
export function useHaptics() {
  const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  /**
   * Light impact - for button presses, toggles
   */
  const triggerLight = useCallback(async () => {
    if (!isHapticsSupported) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isHapticsSupported]);

  /**
   * Medium impact - for confirmations, selections
   */
  const triggerMedium = useCallback(async () => {
    if (!isHapticsSupported) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isHapticsSupported]);

  /**
   * Heavy impact - for errors, important actions
   */
  const triggerHeavy = useCallback(async () => {
    if (!isHapticsSupported) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [isHapticsSupported]);

  /**
   * Selection feedback - for UI element selection (buttons, tabs)
   */
  const triggerSelection = useCallback(async () => {
    if (!isHapticsSupported) return;
    await Haptics.selectionAsync();
  }, [isHapticsSupported]);

  /**
   * Notification feedback - success, warning, or error
   */
  const triggerNotification = useCallback(
    async (type: 'success' | 'warning' | 'error' = 'success') => {
      if (!isHapticsSupported) return;

      const feedbackType = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      }[type];

      await Haptics.notificationAsync(feedbackType);
    },
    [isHapticsSupported]
  );

  return {
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSelection,
    triggerNotification,
  };
}
