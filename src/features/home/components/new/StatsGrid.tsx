import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { HOME_COLORS, HOME_FONTS, HOME_GRADIENTS } from '@/theme/home-design';
import { IQRankTitle } from '../../hooks/useIQRank';
import { LinearGradient } from 'expo-linear-gradient';

interface StatsGridProps {
  gamesCompleted: number;
  totalGames: number;
  iqTitle: IQRankTitle;
  onPressGames?: () => void;
  onPressIQ?: () => void;
}

export function StatsGrid({ 
  gamesCompleted, 
  totalGames, 
  iqTitle,
  onPressGames,
  onPressIQ
}: StatsGridProps) {
  return (
    <View style={styles.container}>
      {/* Games Completed Card */}
      <Pressable 
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        onPress={onPressGames}
      >
        <LinearGradient
            colors={[HOME_COLORS.glassBg, "rgba(255,255,255,0.02)"]}
            style={styles.cardGradient}
        >
            <Text style={styles.label}>GAMES COMPLETED</Text>
            <Text style={styles.value}>{gamesCompleted} / {totalGames}</Text>
        </LinearGradient>
      </Pressable>

      {/* IQ Level Card */}
      <Pressable 
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        onPress={onPressIQ}
      >
         <LinearGradient
            colors={[HOME_COLORS.glassBg, "rgba(255,255,255,0.02)"]}
             style={styles.cardGradient}
        >
            <Text style={styles.label}>IQ LEVEL</Text>
            <Text style={styles.value}>{iqTitle}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HOME_COLORS.glassBorder,
    overflow: 'hidden',
    height: 80,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  label: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    color: HOME_COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 24,
    color: HOME_COLORS.textMain,
  }
});
