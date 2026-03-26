import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame, ShieldCheck } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { ProBadge } from '@/components/ProBadge/ProBadge';
import { useStreakAtRisk } from '@/features/home/hooks/useStreakAtRisk';

interface HomeHeaderProps {
  streak: number;
  isPremium: boolean;
  onProPress: () => void;
  gamesPlayedToday?: number;
  availableFreezes?: number;
}

export function HomeHeader({
  streak,
  isPremium,
  onProPress,
  gamesPlayedToday = 0,
  availableFreezes = 0,
}: HomeHeaderProps) {
  const { isAtRisk, hoursLeft } = useStreakAtRisk(streak, gamesPlayedToday);

  // Pulsing animation for at-risk state
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (isAtRisk) {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1, // infinite
        true // reverse
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isAtRisk, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Check if protected by freeze
  const hasFreeze = availableFreezes > 0 || isPremium;
  const isProtected = isAtRisk && hasFreeze;

  return (
    <View style={styles.container}>
      {/* Left: Brand */}
      <View style={styles.brandRow}>
        <Text style={styles.brand}>FOOTBALL IQ</Text>
        {isPremium && (
          <View style={styles.proBrandBadge}>
            <Text style={styles.proBrandText}>PRO</Text>
            <ProBadge size={18} color={HOME_COLORS.cardYellow} />
          </View>
        )}
      </View>

      {/* Right: Status Cluster */}
      <View style={styles.rightCluster}>
        {/* Go Pro upsell pill - hidden for premium users */}
        {!isPremium && (
          <Pressable onPress={onProPress} style={({ pressed }) => [styles.proPill, pressed && { opacity: 0.8 }]}>
            <ProBadge size={16} color={HOME_COLORS.stadiumNavy} />
            <Text style={styles.proText}>GO PRO</Text>
          </Pressable>
        )}

        {/* Streak - with at-risk or protected states */}
        {isProtected ? (
          // Protected by freeze state
          <View style={[styles.streakPill, styles.protectedPill]}>
            <ShieldCheck size={16} color={HOME_COLORS.pitchGreen} fill={HOME_COLORS.pitchGreen} />
            <Text style={styles.protectedText}>Protected</Text>
          </View>
        ) : isAtRisk ? (
          // At-risk state
          <Animated.View style={[styles.streakPill, styles.atRiskPill, animatedStyle]}>
            <Flame size={16} color={HOME_COLORS.redCard} fill={HOME_COLORS.redCard} />
            <Text style={styles.atRiskText} numberOfLines={1}>
              {streak} day streak at risk! {hoursLeft}h left
            </Text>
          </Animated.View>
        ) : (
          // Normal state
          <View style={styles.streakPill}>
            <Flame size={16} color={HOME_COLORS.cardYellow} fill={streak > 0 ? HOME_COLORS.cardYellow : 'transparent'} />
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 28,
    color: HOME_COLORS.textMain,
    letterSpacing: 1,
  },
  proBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  proBrandText: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 28,
    color: HOME_COLORS.cardYellow,
    letterSpacing: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  proPill: {
    backgroundColor: HOME_COLORS.cardYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: HOME_COLORS.cardYellowShadow,
    flexShrink: 0,
  },
  proText: {
    fontFamily: 'Outfit-ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: HOME_COLORS.stadiumNavy,
    fontSize: 13,
  },
  streakPill: {
    backgroundColor: HOME_COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    flexShrink: 1,
  },
  streakCount: {
    fontFamily: HOME_FONTS.stats,
    color: HOME_COLORS.textMain,
    fontSize: 15,
  },
  atRiskPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: HOME_COLORS.redCard,
  },
  atRiskText: {
    fontFamily: 'Outfit-Bold',
    color: HOME_COLORS.redCard,
    fontSize: 14,
  },
  protectedPill: {
    backgroundColor: 'rgba(46, 252, 93, 0.15)',
    borderColor: HOME_COLORS.pitchGreen,
  },
  protectedText: {
    fontFamily: 'Outfit-Bold',
    color: HOME_COLORS.pitchGreen,
    fontSize: 14,
  },
});
