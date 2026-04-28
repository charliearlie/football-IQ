/**
 * FloatingPlayCTA
 *
 * Floating bottom bar shown on engagement dead-end screens (Stats, Leaderboard)
 * when the user still has unplayed puzzles for today.
 *
 * Renders an absolutely-positioned bar with an ElevatedButton that takes the
 * user straight to the home tab.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors, spacing, layout } from '@/theme';

interface FloatingPlayCTAProps {
  /** Number of unplayed puzzles today. Bar is hidden when this is 0. */
  unplayedCount: number;
  /** Called when the button is pressed */
  onPress: () => void;
  /** When true, adds tabBarHeight to bottom offset so the CTA clears the tab bar */
  insideTabBar?: boolean;
}

/**
 * Floating "Play Today's Puzzles" CTA bar.
 *
 * Fades in with a simple entrance animation whenever unplayedCount > 0.
 * Uses absolute positioning so it floats over the screen's ScrollView.
 */
export function FloatingPlayCTA({ unplayedCount, onPress, insideTabBar = false }: FloatingPlayCTAProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unplayedCount > 0) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [unplayedCount, opacity]);

  if (unplayedCount <= 0) {
    return null;
  }

  const buttonTitle = `PLAY TODAY'S GAMES  ·  ${unplayedCount} LEFT`;

  return (
    <Animated.View style={[styles.container, { opacity }, insideTabBar && { bottom: layout.tabBarHeight }]} pointerEvents="box-none">
      <View style={styles.inner}>
        <ElevatedButton
          title={buttonTitle}
          onPress={onPress}
          variant="primary"
          size="medium"
          fullWidth
          hapticType="medium"
          testID="floating-play-cta"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 5, 10, 0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  inner: {
    paddingHorizontal: spacing.xl,
  },
});
