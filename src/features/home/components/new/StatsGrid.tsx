import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { LinearGradient } from 'expo-linear-gradient';

interface StatsGridProps {
  gamesCompleted: number;
  totalGames: number;
  iqTitle: string;
  iqProgress: number;
  iqPointsToNext: number;
  iqNextTierName: string | null;
  iqTierColor: string;
  onPressGames?: () => void;
  onPressIQ?: () => void;
}

export function StatsGrid({
  gamesCompleted,
  totalGames,
  iqTitle,
  iqProgress,
  iqPointsToNext,
  iqNextTierName,
  iqTierColor,
  onPressGames,
  onPressIQ
}: StatsGridProps) {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withDelay(
      300,
      withSpring(iqProgress, { damping: 15, stiffness: 100 })
    );
  }, [iqProgress, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const isMaxLevel = iqNextTierName === null;
  const progressText = isMaxLevel
    ? 'Max Level'
    : `${iqPointsToNext >= 1000 ? iqPointsToNext.toLocaleString() : iqPointsToNext} pts to ${iqNextTierName}`;

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
             style={styles.iqCardGradient}
        >
            <Text style={styles.label}>IQ LEVEL</Text>
            <Text style={styles.iqValue}>{iqTitle}</Text>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: HOME_COLORS.pitchGreen },
                  progressBarStyle,
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progressText}</Text>
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
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  iqCardGradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  iqValue: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 20,
    color: HOME_COLORS.textMain,
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 11,
    color: HOME_COLORS.textSecondary,
    marginTop: 4,
  },
});
