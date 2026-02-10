import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { ProBadge } from '@/components/ProBadge/ProBadge';

interface HomeHeaderProps {
  streak: number;
  isPremium: boolean;
  onProPress: () => void;
}

export function HomeHeader({ streak, isPremium, onProPress }: HomeHeaderProps) {
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

        {/* Streak */}
        <View style={styles.streakPill}>
          <Flame size={16} color={HOME_COLORS.cardYellow} fill={streak > 0 ? HOME_COLORS.cardYellow : 'transparent'} />
          <Text style={styles.streakCount}>{streak}</Text>
        </View>
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
    gap: 12,
  },
  proPill: {
    backgroundColor: HOME_COLORS.cardYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#cda412',
  },
  proText: {
    fontFamily: HOME_FONTS.heading,
    color: HOME_COLORS.stadiumNavy,
    fontSize: 14,
    marginTop: 2,
  },
  streakPill: {
    backgroundColor: HOME_COLORS.glassBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: HOME_COLORS.glassBorder,
  },
  streakCount: {
    fontFamily: HOME_FONTS.heading,
    color: HOME_COLORS.textMain,
    fontSize: 16,
    marginTop: 2,
  },
});
