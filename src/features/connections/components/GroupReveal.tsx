/**
 * GroupReveal Component
 *
 * Displays a solved group with colored banner and player names.
 * Animates in with spring-based merge animation and shimmer effect.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ConnectionsGroup, ConnectionsDifficulty } from '../types/connections.types';
import { colors, fonts, borderRadius, spacing } from '@/theme';

export interface GroupRevealProps {
  group: ConnectionsGroup;
  testID?: string;
}

/**
 * Color map for difficulty levels.
 * Football-themed palette distinct from NYT Connections.
 */
const DIFFICULTY_COLORS: Record<ConnectionsDifficulty, string> = {
  yellow: '#F59E0B',  // Trophy gold
  green: '#14B8A6',   // Teal / VAR tech
  blue: '#F97316',    // Matchday orange
  purple: '#6366F1',  // Night match indigo
};

/**
 * Text color map - orange and indigo need white text for contrast.
 */
const TEXT_COLORS: Record<ConnectionsDifficulty, string> = {
  yellow: colors.stadiumNavy,
  green: colors.stadiumNavy,
  blue: colors.floodlightWhite,
  purple: colors.floodlightWhite,
};

/**
 * GroupReveal - Shows a solved group with difficulty color.
 */
export function GroupReveal({ group, testID }: GroupRevealProps) {
  const backgroundColor = DIFFICULTY_COLORS[group.difficulty];
  const textColor = TEXT_COLORS[group.difficulty];

  // Merge animation
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  const mergeStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [20, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  // Shimmer animation
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    // Start shimmer after merge animation settles
    const timer = setTimeout(() => {
      shimmerX.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1, // infinite
        false
      );
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerX.value, [-1, 1], [-200, 200]) },
    ],
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor }, mergeStyle]}
      testID={testID}
    >
      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      {/* Bottom stripe */}
      <View style={styles.bottomStripe} />

      {/* Content */}
      <Text style={[styles.category, { color: textColor }]}>{group.category}</Text>
      <Text style={[styles.players, { color: textColor }]}>
        {group.players.join(', ')}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  category: {
    fontFamily: fonts.headline,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  players: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    width: 200,
    height: '100%',
  },
  bottomStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
