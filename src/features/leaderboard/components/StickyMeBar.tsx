/**
 * StickyMeBar Component
 *
 * Fixed bottom bar showing the current user's rank when their row has
 * scrolled out of view. Styled to look like a pinned leaderboard row
 * rather than a floating pill — near-solid navy background, flush edges,
 * and layout that mirrors LeaderboardEntry column widths.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, fontWeights, spacing } from '@/theme';
import { LeaderboardType, UserRank } from '../types/leaderboard.types';

interface StickyMeBarProps {
  /** Current user's rank info */
  userRank: UserRank | null;
  /** User's display name */
  displayName: string;
  /** Whether to show the bar */
  shouldShow: boolean;
  /** Leaderboard type for score formatting */
  leaderboardType?: LeaderboardType;
  /**
   * Point gap between the user and the next rank above them.
   * null means the user is already rank 1 (or gap unknown).
   */
  gapToNext?: number | null;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Format score for display based on leaderboard type.
 */
function formatScore(score: number, leaderboardType: LeaderboardType): string {
  if (leaderboardType === 'global') {
    return score.toLocaleString();
  }
  return String(score);
}

/**
 * Sticky bar showing current user's rank.
 *
 * Appears at the bottom of the screen when the user's position
 * in the leaderboard is scrolled out of view.
 *
 * Shows:
 * - "YOU" badge
 * - Display name
 * - Rank number (#N) right-aligned in pitchGreen
 * - Score below rank
 * - Optional "N pts behind #M" gap text
 */
export function StickyMeBar({
  userRank,
  displayName,
  shouldShow,
  leaderboardType = 'daily',
  gapToNext,
  testID,
}: StickyMeBarProps) {
  // Animation for show/hide — always render so the spring can animate out
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

  // Don't render at all if there's no rank data or the bar shouldn't show
  if (!userRank || !shouldShow) {
    return null;
  }

  const scoreText = formatScore(userRank.score, leaderboardType);
  const scoreLabel = leaderboardType === 'global' ? 'IQ' : 'pts';
  const nextRank = userRank.rank - 1;
  const showGap = typeof gapToNext === 'number' && gapToNext > 0 && nextRank >= 1;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      testID={`${testID}-container`}
    >
      {/* Left accent bar matching current-user row style */}
      <View style={styles.accentBar} />

      {/* Name / YOU badge section */}
      <View style={styles.leftSection}>
        <View style={styles.youBadge}>
          <Text style={styles.youBadgeText}>YOU</Text>
        </View>
        <Text style={styles.displayName} numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      {/* Rank + score section */}
      <View style={styles.rightSection}>
        <Text style={styles.rank}>#{userRank.rank}</Text>
        <Text style={styles.score}>{scoreText}</Text>
        <Text style={styles.scoreLabel}>{scoreLabel}</Text>
        {showGap && (
          <Text style={styles.gapText}>
            {gapToNext} pts behind #{nextRank}
          </Text>
        )}
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
    backgroundColor: 'rgba(5, 5, 10, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: spacing.xl, // Safe area clearance
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.pitchGreen,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.lg,
    marginRight: spacing.sm,
  },
  youBadge: {
    backgroundColor: colors.pitchGreen,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  youBadgeText: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: colors.stadiumNavy,
    letterSpacing: 0.5,
  },
  displayName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 15,
    color: colors.pitchGreen,
    flexShrink: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginRight: spacing.lg,
  },
  rank: {
    fontFamily: fonts.headline,
    fontSize: 22,
    color: colors.pitchGreen,
    lineHeight: 24,
  },
  score: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  scoreLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    color: 'rgba(248, 250, 252, 0.40)',
  },
  gapText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
