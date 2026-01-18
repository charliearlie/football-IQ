/**
 * Confetti Animation Component
 *
 * Lightweight confetti effect using react-native-reanimated.
 * Displays colorful falling pieces to celebrate a win.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Number of confetti pieces */
const CONFETTI_COUNT = 30;

/** Colors for confetti pieces */
const CONFETTI_COLORS = [
  colors.pitchGreen,
  colors.cardYellow,
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  colors.floodlightWhite,
  '#9B59B6', // purple
];

/** Duration for fall animation in ms */
const FALL_DURATION = 3000;

interface ConfettiPieceProps {
  index: number;
  startX: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
}

/**
 * Single animated confetti piece.
 */
function ConfettiPiece({
  startX,
  delay,
  color,
  size,
  rotation,
}: ConfettiPieceProps) {
  const progress = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Fall animation
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: FALL_DURATION,
        easing: Easing.out(Easing.quad),
      })
    );

    // Continuous rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1, // infinite
        false
      )
    );

    // Cleanup: Cancel animations on unmount to prevent UI freeze
    return () => {
      cancelAnimation(progress);
      cancelAnimation(rotate);
    };
  }, [delay, progress, rotate]);

  const animatedStyle = useAnimatedStyle(() => {
    // Vertical fall with slight horizontal drift
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [-50, SCREEN_HEIGHT + 50]
    );

    // Horizontal sway (sine wave pattern)
    const swayAmount = Math.sin(progress.value * Math.PI * 3) * 30;
    const translateX = startX + swayAmount;

    // Fade out near the bottom
    const opacity = interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]);

    // Scale down slightly as it falls
    const scale = interpolate(progress.value, [0, 1], [1, 0.6]);

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate.value + rotation}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: size * 0.6, // Rectangular shape
          backgroundColor: color,
          borderRadius: size * 0.1,
        },
        animatedStyle,
      ]}
    />
  );
}

export interface ConfettiProps {
  /** Whether to show confetti */
  active: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Confetti animation overlay.
 *
 * Renders multiple falling confetti pieces when active.
 * Automatically animates and fades out.
 *
 * @example
 * <Confetti active={gameWon} />
 */
export function Confetti({ active, testID }: ConfettiProps) {
  // Generate random confetti pieces
  const pieces = useMemo(() => {
    if (!active) return [];

    return Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
      index,
      startX: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 500, // Stagger start times
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8, // 8-16px
      rotation: Math.random() * 360, // Initial rotation
    }));
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none" testID={testID}>
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.index} {...piece} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
});
