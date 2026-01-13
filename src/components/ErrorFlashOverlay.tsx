/**
 * ErrorFlashOverlay Component
 *
 * Red flash overlay that fades in/out on error.
 * Designed to overlay input containers or cards for visual feedback.
 * Synchronizes with shake animation timing.
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme';

const FLASH_DURATION = 150; // ms for fade in
const HOLD_DURATION = 100; // ms to hold
const FADE_DURATION = 200; // ms for fade out
const MAX_OPACITY = 0.3;

export interface ErrorFlashOverlayProps {
  /** Whether to trigger the flash animation */
  active: boolean;
  /** Additional styles (e.g., borderRadius to match parent) */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ErrorFlashOverlay - Visual error feedback overlay
 *
 * Shows a brief red flash when active changes to true.
 * Automatically fades in and out over ~450ms total.
 */
export function ErrorFlashOverlay({
  active,
  style,
  testID,
}: ErrorFlashOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      // Flash sequence: fade in -> hold -> fade out
      opacity.value = withSequence(
        withTiming(MAX_OPACITY, { duration: FLASH_DURATION }),
        withTiming(MAX_OPACITY, { duration: HOLD_DURATION }),
        withTiming(0, { duration: FADE_DURATION })
      );
    }
  }, [active, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.overlay, style, animatedStyle]}
      pointerEvents="none"
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.redCard,
  },
});
