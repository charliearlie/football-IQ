import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { ProBadge } from '@/components/ProBadge/ProBadge';
import { textStyles } from '@/theme/typography';

interface HomeHeaderProps {
  streak: number;
  isPremium: boolean;
  onProPress: () => void;
}

export function HomeHeader({ streak, isPremium, onProPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left: Brand */}
      <View>
        <Text style={styles.brand}>FOOTBALL IQ</Text>
      </View>

      {/* Right: Status Cluster */}
      <View style={styles.rightCluster}>
        {/* Pro Badge (only if free, or maybe always? Design says "Pro Badge: Yellow pill". Usually for upsell or status) */}
        {/* If premium, show Gold PRO badge. If free, maybe show "Go Pro" button? Spec says "Active: Opens PremiumModal". */}
        <Pressable onPress={onProPress} style={({ pressed }) => [styles.proPill, pressed && { opacity: 0.8 }]}>
           <ProBadge size={16} color={HOME_COLORS.stadiumNavy} /> 
           <Text style={styles.proText}>{isPremium ? 'PRO' : 'GO PRO'}</Text>
        </Pressable>

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
  brand: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 28,
    color: HOME_COLORS.textMain,
    letterSpacing: 1,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proPill: {
    backgroundColor: HOME_COLORS.cardYellow, // Solid Yellow
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999, // 'badge' usually full rounded
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Add bottom shadow
    borderBottomWidth: 2,
    borderBottomColor: '#cda412', // var(--card-yellow-shadow)
  },
  proText: {
    fontFamily: HOME_FONTS.heading,
    color: HOME_COLORS.stadiumNavy, // Contrast text
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
  }
});
