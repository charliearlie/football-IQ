/**
 * PuzzleUpdateToast
 *
 * Non-blocking notification shown when puzzles are updated mid-session
 * (e.g., CMS edit detected on app foreground return).
 * Auto-dismisses after 5 seconds with slide-down animation.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

interface PuzzleUpdateToastProps {
  /** Whether the toast should be visible */
  visible: boolean;
  /** Number of puzzles that were updated */
  count: number;
  /** Callback when toast should be dismissed */
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;
const ANIMATION_DURATION = 300;

export function PuzzleUpdateToast({
  visible,
  count,
  onDismiss,
}: PuzzleUpdateToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      // Slide in from top
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION });

      // Auto-dismiss after delay
      translateY.value = withDelay(
        AUTO_DISMISS_MS,
        withTiming(-100, { duration: ANIMATION_DURATION }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        })
      );
    } else {
      // Reset to hidden position
      translateY.value = -100;
    }
  }, [visible, onDismiss, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const message = count === 1 ? 'Puzzle updated' : `${count} puzzles updated`;

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + spacing.sm }, animatedStyle]}
    >
      <View style={styles.toast}>
        <RefreshCw size={16} color={colors.stadiumNavy} style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardYellow,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: colors.stadiumNavy,
  },
});
