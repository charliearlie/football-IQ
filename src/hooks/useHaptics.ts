import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback hook for tactile interactions.
 *
 * Provides consistent haptic feedback across the app.
 * Falls back gracefully on platforms without haptic support.
 */
export function useHaptics() {
  const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  /**
   * Light impact - for button presses, toggles
   */
  const triggerLight = async () => {
    if (!isHapticsSupported) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * Medium impact - for confirmations, selections
   */
  const triggerMedium = async () => {
    if (!isHapticsSupported) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  /**
   * Heavy impact - for errors, important actions
   */
  const triggerHeavy = async () => {
    if (!isHapticsSupported) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  /**
   * Selection feedback - for UI element selection (buttons, tabs)
   */
  const triggerSelection = async () => {
    if (!isHapticsSupported) return;
    await Haptics.selectionAsync();
  };

  /**
   * Notification feedback - success, warning, or error
   */
  const triggerNotification = async (
    type: 'success' | 'warning' | 'error' = 'success'
  ) => {
    if (!isHapticsSupported) return;

    const feedbackType = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    }[type];

    await Haptics.notificationAsync(feedbackType);
  };

  return {
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSelection,
    triggerNotification,
  };
}
