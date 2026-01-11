/**
 * Standalone haptic feedback utilities.
 *
 * These functions can be called from anywhere, including
 * inside setInterval callbacks and non-React code.
 *
 * For hook-based usage with stable callbacks, use `useHaptics` from `@/hooks`.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Light impact - for button presses, toggles, scrolling through items
 */
export async function triggerLight(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium impact - for confirmations, selections
 */
export async function triggerMedium(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy impact - for errors, important actions
 */
export async function triggerHeavy(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Selection feedback - for UI element selection (buttons, tabs)
 */
export async function triggerSelection(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.selectionAsync();
}

/**
 * Notification feedback - success, warning, or error
 */
export async function triggerNotification(
  type: 'success' | 'warning' | 'error' = 'success'
): Promise<void> {
  if (!isHapticsSupported) return;

  const feedbackType = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  }[type];

  await Haptics.notificationAsync(feedbackType);
}
