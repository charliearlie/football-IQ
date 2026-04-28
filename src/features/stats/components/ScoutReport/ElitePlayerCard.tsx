/**
 * ElitePlayerCard - FIFA/EAFC Ultimate Team-style player card
 *
 * A visually striking header component that showcases the user's
 * Football IQ with FUT card aesthetics. Features:
 * - Tier-aware gradient background with SVG radial glow
 * - Dark tier crest badge
 * - Progress bar with current → next tier labels
 * - Always-on border glow, amplified during win streaks
 * - Share button for social export
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
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

/**
 * Tier-aware gradient and glow colors per tier level.
 * Diagonal gradient from dark navy to a tier-tinted dark color,
 * plus a matching glow color for radial SVG overlay and shadow.
 */
const TIER_GRADIENT_COLORS: Record<number, { gradient: [string, string]; glow: string }> = {
  1: { gradient: ['#0A0A0F', '#1A1A1F'], glow: 'rgba(255,255,255,0.10)' },
  2: { gradient: ['#0A0A0F', '#1A1A1F'], glow: 'rgba(255,255,255,0.10)' },
  3: { gradient: ['#111116', '#172554'], glow: '#3B82F6' },
  4: { gradient: ['#1e293b', '#14332a'], glow: '#22C55E' },
  5: { gradient: ['#1e293b', '#14332a'], glow: '#22C55E' },
  6: { gradient: ['#1e293b', '#14332a'], glow: '#22C55E' },
  7: { gradient: ['#1e293b', '#422006'], glow: '#E5B413' },
  8: { gradient: ['#1e293b', '#422006'], glow: '#F59E0B' },
  9: { gradient: ['#1e293b', '#431407'], glow: '#F97316' },
  10: { gradient: ['#1e293b', '#422006'], glow: '#FFD700' },
};

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
  const iqValue = totalIQ ?? globalIQ ?? 0;
  const tier = getTierForPoints(iqValue);
  const tierColor = getTierColorFromTier(tier.tier);
  const tierLabel = tier.name;
  const gradientColors = TIER_GRADIENT_COLORS[tier.tier] ?? TIER_GRADIENT_COLORS[1];

  // Progress tracking
  const progress = getProgressToNextTier(iqValue);
  const nextTier = getNextTier(tier);
  const isMaxLevel = tier.tier === 10;

  // Always-on base glow, amplified when streak >= 3
  const showStreakGlow = currentStreak >= 3;
  const glowIntensity = Math.min(currentStreak / 10, 1);
  const glowOpacity = useSharedValue(0.35);
  const progressWidth = useSharedValue(0);

  const formatMemberSince = (dateStr: string | null): string => {
    if (!dateStr) return 'New Player';
    const date = new Date(dateStr);
    return `Member since ${date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })}`;
  };

  // Glow pulse for streaks; base glow for everyone
  useEffect(() => {
    if (showStreakGlow) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5 + glowIntensity * 0.3, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.25, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0.35, { duration: 300 });
    }
  }, [showStreakGlow, glowIntensity, glowOpacity]);

  // Progress bar spring animation
  useEffect(() => {
    progressWidth.value = withDelay(
      300,
      withSpring(progress, { damping: 15, stiffness: 100 })
    );
  }, [progress, progressWidth]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: gradientColors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: showStreakGlow ? 20 + glowIntensity * 10 : 16,
    elevation: 8,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={[
        styles.outerContainer,
        { borderColor: gradientColors.glow, backgroundColor: gradientColors.gradient[0] },
        glowStyle,
      ]}
      testID={testID}
    >
      <LinearGradient
        colors={gradientColors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* SVG Radial Glow overlay — only for tiers with visible color */}
        {tier.tier >= 3 && (
          <Svg style={styles.radialGlow} width="100%" height="100%">
            <Defs>
              <RadialGradient id="cardGlow" cx="70%" cy="25%" rx="60%" ry="60%">
                <Stop offset="0" stopColor={gradientColors.glow} stopOpacity="0.15" />
                <Stop offset="0.6" stopColor={gradientColors.glow} stopOpacity="0.04" />
                <Stop offset="1" stopColor={gradientColors.glow} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#cardGlow)" />
          </Svg>
        )}

        {/* Compact header: Avatar + Name + Share */}
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { borderColor: tierColor }]}>
            <User size={20} color={tierColor} strokeWidth={1.5} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.displayName}>{displayName}</Text>
            <View style={styles.tierRow}>
              <TierCrest
                tierName={tierLabel}
                tierColor={tierColor}
                tierLevel={tier.tier}
                variant="dark"
                testID={`${testID}-crest`}
              />
              {currentStreak > 0 && (
                <Text style={styles.streakInline}>🔥 {currentStreak}</Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={onSharePress}
            style={styles.shareButton}
            hitSlop={12}
            accessibilityLabel="Share Report"
            accessibilityRole="button"
          >
            <Share2 size={18} color={colors.floodlightWhite} />
          </Pressable>
        </View>

        {/* Progress to next tier */}
        <View style={styles.progressFooter}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.currentTierLabel}>{tierLabel}</Text>
            {!isMaxLevel && nextTier && (
              <Text style={styles.nextTierLabel}>{nextTier.name}</Text>
            )}
          </View>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.pitchGreen },
                progressBarStyle,
              ]}
            />
          </View>
          {isMaxLevel && (
            <Text style={styles.maxLevelText}>Maximum Level Achieved</Text>
          )}
        </View>

        {/* Member since (compact) */}
        <Text style={styles.memberSince}>{formatMemberSince(memberSince)}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderWidth: 1,
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  container: {
    padding: spacing.lg,
  },
  radialGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  streakInline: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 13,
    color: colors.floodlightWhite,
  },
  shareButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  displayName: {
    fontFamily: fonts.headline,
    fontSize: 22,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },
  memberSince: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  progressFooter: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  currentTierLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextTierLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  maxLevelText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.pitchGreen,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
