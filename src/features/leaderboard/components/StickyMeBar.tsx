/**
 * StickyMeBar Component
 *
 * Fixed bottom bar showing current user's rank when scrolled out of view.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { User } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { UserRank } from '../types/leaderboard.types';

interface StickyMeBarProps {
  /** Current user's rank info */
  userRank: UserRank | null;
  /** User's display name */
  displayName: string;
  /** Whether to show the bar */
  shouldShow: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Sticky bar showing current user's rank.
 *
 * Appears at the bottom of the screen when the user's position
 * in the leaderboard is scrolled out of view.
 *
 * Shows:
 * - "You" label
 * - Rank position
 * - Score
 */
export function StickyMeBar({
  userRank,
  displayName,
  shouldShow,
  testID,
}: StickyMeBarProps) {
  // Animation for show/hide
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(shouldShow ? 0 : 100, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
      opacity: withTiming(shouldShow ? 1 : 0, { duration: 200 }),
    };
  }, [shouldShow]);

  // Don't render if no rank data
  if (!userRank) {
    return null;
  }

  // Don't render if shouldn't show (but keep for animation)
  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID={`${testID}-container`}
    >
      <View style={styles.content}>
        {/* Left: "You" label and avatar */}
        <View style={styles.leftSection}>
          <View style={styles.avatar}>
            <User size={20} color={colors.stadiumNavy} />
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.youLabel}>You</Text>
            <Text style={styles.totalUsers} numberOfLines={1}>
              of {userRank.totalUsers} players
            </Text>
          </View>
        </View>

        {/* Right: Rank and Score */}
        <View style={styles.rightSection}>
          <Text style={styles.rank}>#{userRank.rank}</Text>
          <Text style={styles.score}>{userRank.score}</Text>
        </View>
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
    backgroundColor: colors.pitchGreen,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl, // Extra padding for safe area
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.floodlightWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    marginLeft: spacing.md,
  },
  youLabel: {
    ...textStyles.body,
    color: colors.stadiumNavy,
    fontWeight: '700',
  },
  totalUsers: {
    ...textStyles.caption,
    color: colors.stadiumNavy,
    opacity: 0.7,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  rank: {
    ...textStyles.h2,
    color: colors.stadiumNavy,
  },
  score: {
    ...textStyles.body,
    color: colors.stadiumNavy,
    opacity: 0.8,
  },
});
