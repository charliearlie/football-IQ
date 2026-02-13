import { useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback hook for tactile interactions.
 *
 * Provides consistent haptic feedback across the app.
 * Falls back gracefully on platforms without haptic support.
 * Respects user's haptic feedback preference stored in AsyncStorage.
 *
 * All functions are wrapped in useCallback to maintain stable references
 * and prevent infinite render loops when used in useEffect dependencies.
 */
export function useHaptics() {
  const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@haptics_enabled').then((value) => {
      if (value !== null) {
        setHapticsEnabled(value === 'true');
      }
    });
  }, []);

  /**
   * Light impact - for button presses, toggles
   */
  const triggerLight = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Medium impact - for confirmations, selections
   */
  const triggerMedium = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Heavy impact - for errors, important actions
   */
  const triggerHeavy = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Selection feedback - for UI element selection (buttons, tabs)
   */
  const triggerSelection = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.selectionAsync();
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Notification feedback - success, warning, or error
   */
  const triggerNotification = useCallback(
    async (type: 'success' | 'warning' | 'error' = 'success') => {
      if (!isHapticsSupported || !hapticsEnabled) return;

      const feedbackType = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      }[type];

      await Haptics.notificationAsync(feedbackType);
    },
    [isHapticsSupported, hapticsEnabled]
  );

  // ============================================================
  // SEMANTIC HAPTICS - Game-oriented feedback patterns
  // ============================================================

  /**
   * Success feedback - Correct answers, achievements
   */
  const triggerSuccess = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Error feedback - Wrong answers (double-tap pattern)
   */
  const triggerError = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Completion feedback - Finishing puzzle (double success)
   */
  const triggerCompletion = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Incomplete action feedback - Tapping filled cell
   */
  const triggerIncomplete = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Perfect Day celebration - Triumphant flourish for completing all daily puzzles
   * Uses: Success -> Success -> Heavy (escalating celebration)
   */
  const triggerPerfectDay = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [isHapticsSupported, hapticsEnabled]);

  /**
   * Rare find celebration - Special haptic for ultra-rare player picks (<1% rarity)
   * Uses: Heavy -> Heavy -> Success (impactful double-thump + celebration)
   */
  const triggerRareFind = useCallback(async () => {
    if (!isHapticsSupported || !hapticsEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isHapticsSupported, hapticsEnabled]);

  return {
    // Primitives (keep for backward compatibility)
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSelection,
    triggerNotification,
    // Semantic (new)
    triggerSuccess,
    triggerError,
    triggerCompletion,
    triggerIncomplete,
    triggerPerfectDay,
    triggerRareFind,
  };
}
