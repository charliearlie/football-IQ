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

// ============================================================
// SEMANTIC HAPTICS - Game-oriented feedback patterns
// ============================================================

/**
 * Success feedback - Correct answers, achievements
 * Uses: Notification Success pattern (satisfying "ding")
 */
export async function triggerSuccess(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Error feedback - Wrong answers, invalid actions
 * Uses: Heavy impact + delay + Medium impact (double-tap "thud")
 * Synchronized with visual shake animation timing (~100ms between taps)
 */
export async function triggerError(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Completion feedback - Finishing a puzzle, game over (win)
 * Uses: Double Notification Success with stagger (celebration)
 */
export async function triggerCompletion(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise((resolve) => setTimeout(resolve, 150));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Incomplete action feedback - Tapping already-filled cell, invalid state
 * Uses: Light impact (gentle reminder)
 */
export async function triggerIncomplete(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Perfect Day celebration - Triumphant flourish for completing all daily puzzles
 * Uses: Success -> Success -> Heavy (escalating celebration)
 */
export async function triggerPerfectDay(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise((resolve) => setTimeout(resolve, 150));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await new Promise((resolve) => setTimeout(resolve, 150));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Rare find celebration - Special haptic for ultra-rare player picks (<1% rarity)
 * Uses: Heavy -> Heavy -> Success (impactful double-thump + celebration)
 * More intense than triggerSuccess to signify the exceptional nature of the pick
 */
export async function triggerRareFind(): Promise<void> {
  if (!isHapticsSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((resolve) => setTimeout(resolve, 80));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
