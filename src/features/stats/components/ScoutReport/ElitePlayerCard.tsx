/**
 * ElitePlayerCard - FIFA/EAFC Ultimate Team-style player card
 *
 * A visually striking header component that showcases the user's
 * Football IQ with FUT card aesthetics. Features:
 * - Tier crest badge as hero element
 * - Progress bar to next tier
 * - Pulsing glow effect during win streaks
 * - Share button for social export
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { User, Share2 } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { TierCrest } from './TierCrest';
import {
  getTierForPoints,
  getTierColor as getTierColorFromTier,
  getProgressToNextTier,
  getNextTier,
} from '../../utils/tierProgression';


export interface ElitePlayerCardProps {
  displayName: string;
  memberSince: string | null;
  /** Cumulative IQ points (0-20,000+) for the 10-tier progression system */
  totalIQ: number;
  /** @deprecated Use totalIQ instead. Kept for backward compatibility during transition. */
  globalIQ?: number;
  currentStreak: number;
  userRank: { rank: number; totalUsers: number } | null;
  onSharePress: () => void;
  testID?: string;
}

export function ElitePlayerCard({
  displayName,
  memberSince,
  totalIQ,
  globalIQ,
  currentStreak,
  userRank,
  onSharePress,
  testID,
}: ElitePlayerCardProps) {
  // Use totalIQ (new system) or fallback to globalIQ (deprecated) for backward compat
  const iqValue = totalIQ ?? globalIQ ?? 0;
  const tier = getTierForPoints(iqValue);
  const tierColor = getTierColorFromTier(tier.tier);
  const tierLabel = tier.name;

  // Progress tracking
  const progress = getProgressToNextTier(iqValue);
  const nextTier = getNextTier(tier);
  const isMaxLevel = tier.tier === 10;

  // Glow effect when streak >= 3
  const showGlow = currentStreak >= 3;
  const glowIntensity = Math.min(currentStreak / 10, 1); // Max at 10-day streak
  const glowOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // Format member since date
  const formatMemberSince = (dateStr: string | null): string => {
    if (!dateStr) return 'New Player';
    const date = new Date(dateStr);
    return `Member since ${date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })}`;
  };

  // Glow pulse animation
  useEffect(() => {
    if (showGlow) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4 + glowIntensity * 0.3, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.15, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [showGlow, glowIntensity, glowOpacity]);

  // Progress bar animation
  useEffect(() => {
    progressWidth.value = withDelay(
      300,
      withSpring(progress, { damping: 15, stiffness: 100 })
    );
  }, [progress, progressWidth]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: 20 + glowIntensity * 10,
    elevation: showGlow ? 10 : 0,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[styles.container, glowStyle]}
      testID={testID}
    >
      {/* Glow background layer */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glowBackground,
            {
              backgroundColor: colors.pitchGreen,
              opacity: glowOpacity.value * 0.15,
            },
          ]}
        />
      )}

      {/* Header row: Share button only */}
      <View style={styles.headerRow}>
        <View style={styles.spacer} />
        <Pressable
          onPress={onSharePress}
          style={styles.shareButton}
          hitSlop={12}
          accessibilityLabel="Share Report"
          accessibilityRole="button"
        >
          <Share2 size={20} color={colors.floodlightWhite} />
        </Pressable>
      </View>

      {/* Tier Crest - Hero element */}
      <View style={styles.crestSection}>
        <TierCrest
          tierName={tierLabel}
          tierColor={tierColor}
          tierLevel={tier.tier}
          testID={`${testID}-crest`}
        />
      </View>

      {/* Player identity */}
      <View style={styles.identitySection}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { borderColor: tierColor }]}>
            <User size={32} color={tierColor} strokeWidth={1.5} />
          </View>
        </View>

        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.memberSince}>{formatMemberSince(memberSince)}</Text>
      </View>

      {/* Progress to next tier */}
      <View style={styles.progressFooter}>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.pitchGreen },
                progressBarStyle,
              ]}
            />
          </View>
          {!isMaxLevel && nextTier && (
            <Text style={styles.nextTierLabel}>{nextTier.name}</Text>
          )}
        </View>
        {isMaxLevel && (
          <Text style={styles.maxLevelText}>Maximum Level Achieved</Text>
        )}
      </View>

      {/* Streak indicator (when active) */}
      {currentStreak > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakText}>
            🔥 {currentStreak} day streak
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  crestSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
    letterSpacing: 1,
    textAlign: 'center',
  },
  memberSince: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextTierLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  maxLevelText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.pitchGreen,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  streakRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  streakText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
});
