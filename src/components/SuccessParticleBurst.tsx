/**
 * SuccessParticleBurst Component
 *
 * Short, punchy burst of green particles radiating from origin point.
 * Uses react-native-reanimated for 60fps performance.
 * Inspired by the Confetti component pattern but with radial outward movement.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/theme';

const PARTICLE_COUNT = 12;
const BURST_DURATION = 600;
const BURST_RADIUS = 80;

interface ParticleProps {
  angle: number;
  delay: number;
  size: number;
}

function Particle({ angle, delay, size }: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: BURST_DURATION - delay,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Radial movement outward from center
    const distance = interpolate(progress.value, [0, 1], [0, BURST_RADIUS]);
    const translateX = Math.cos(angle) * distance;
    const translateY = Math.sin(angle) * distance;

    // Fade out during last 30% of animation
    const opacity = interpolate(progress.value, [0, 0.7, 1], [1, 0.8, 0]);

    // Scale down as particle moves outward
    const scale = interpolate(progress.value, [0, 1], [1, 0.3]);

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

export interface SuccessParticleBurstProps {
  /** Whether the burst is active */
  active: boolean;
  /** X coordinate of burst origin (relative to container) */
  originX?: number;
  /** Y coordinate of burst origin (relative to container) */
  originY?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * SuccessParticleBurst - Celebratory particle effect
 *
 * Shows a burst of green particles radiating outward from a point.
 * Typically triggered on correct answers or achievements.
 */
export function SuccessParticleBurst({
  active,
  originX = 0,
  originY = 0,
  onComplete,
  testID,
}: SuccessParticleBurstProps) {
  // Generate particles with random properties when activated
  const particles = useMemo(() => {
    if (!active) return [];

    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      key: `particle-${i}-${Date.now()}`,
      // Even angular distribution around the circle
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      // Slight stagger for organic feel
      delay: Math.random() * 50,
      // Random size between 6-12px
      size: 6 + Math.random() * 6,
    }));
  }, [active]);

  // Trigger onComplete callback after animation duration
  useEffect(() => {
    if (active && onComplete) {
      const timer = setTimeout(onComplete, BURST_DURATION + 100);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <View
      style={[styles.container, { left: originX, top: originY }]}
      pointerEvents="none"
      testID={testID}
    >
      {particles.map((p) => (
        <Particle key={p.key} angle={p.angle} delay={p.delay} size={p.size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.pitchGreen,
  },
});
