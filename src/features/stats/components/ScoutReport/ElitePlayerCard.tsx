/**
 * ElitePlayerCard - FIFA/EAFC Ultimate Team-style player card
 *
 * A visually striking header component that showcases the user's
 * Football IQ with FUT card aesthetics. Features:
 * - Dynamic player grade badge
 * - Large IQ score with tier-based coloring
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
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { User, Share2 } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius, depthOffset, getDepthColor } from '@/theme';
import { PlayerGrade } from './PlayerGrade';

/**
 * Get IQ tier color based on score.
 */
function getTierColor(score: number): string {
  if (score >= 90) return '#FFD700'; // Gold for Elite
  if (score >= 70) return colors.pitchGreen;
  if (score >= 40) return colors.cardYellow;
  return colors.warningOrange;
}

/**
 * Get IQ tier label based on score.
 */
function getTierLabel(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 70) return 'Expert';
  if (score >= 50) return 'Intermediate';
  if (score >= 30) return 'Apprentice';
  return 'Rookie';
}

export interface ElitePlayerCardProps {
  displayName: string;
  memberSince: string | null;
  globalIQ: number;
  currentStreak: number;
  userRank: { rank: number; totalUsers: number } | null;
  onSharePress: () => void;
  testID?: string;
}

export function ElitePlayerCard({
  displayName,
  memberSince,
  globalIQ,
  currentStreak,
  userRank,
  onSharePress,
  testID,
}: ElitePlayerCardProps) {
  const tierColor = getTierColor(globalIQ);
  const tierLabel = getTierLabel(globalIQ);

  // Calculate rank percentile for grade
  const rankPercentile = userRank
    ? Math.round((userRank.rank / userRank.totalUsers) * 100)
    : null;

  // Glow effect when streak >= 3
  const showGlow = currentStreak >= 3;
  const glowIntensity = Math.min(currentStreak / 10, 1); // Max at 10-day streak
  const glowOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);

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

  // Score entrance animation
  useEffect(() => {
    scoreScale.value = withDelay(
      200,
      withSpring(1, { damping: 12, stiffness: 100 })
    );
  }, [scoreScale]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: 20 + glowIntensity * 10,
    elevation: showGlow ? 10 : 0,
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    opacity: scoreScale.value,
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

      {/* Header row: Grade + Share button */}
      <View style={styles.headerRow}>
        <PlayerGrade
          globalIQ={globalIQ}
          rankPercentile={rankPercentile}
          testID={`${testID}-grade`}
        />
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

      {/* IQ Score Display */}
      <Animated.View style={[styles.scoreSection, scoreAnimatedStyle]}>
        <View style={[styles.scoreContainer, { borderColor: tierColor }]}>
          <Text style={[styles.iqLabel, { color: tierColor }]}>
            FOOTBALL IQ
          </Text>
          <Text style={[styles.iqScore, { color: tierColor }]}>
            {globalIQ}
          </Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{tierLabel}</Text>
          </View>
        </View>
      </Animated.View>

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
    marginBottom: spacing.lg,
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
  identitySection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
  scoreSection: {
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  iqLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  iqScore: {
    fontFamily: fonts.headline,
    fontSize: 96,
    lineHeight: 100,
    letterSpacing: 2,
  },
  tierBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  tierText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  streakText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
});
