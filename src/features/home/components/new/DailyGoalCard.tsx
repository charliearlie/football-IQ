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
import { DailyProgressRing } from './DailyProgressRing';

interface DailyGoalCardProps {
  // Ring props
  percent: number;
  countString: string;
  isComplete: boolean;
  // Stats props
  gamesCompleted: number;
  totalGames: number;
  iqTitle: string;
  iqProgress: number;
  iqPointsToNext: number;
  iqNextTierName: string | null;
  iqTierColor: string;
  // Rank props
  userRank?: number | null;
  totalUsers?: number | null;
  // Navigation
  onPressGames?: () => void;
  onPressIQ?: () => void;
  onPressRank?: () => void;
}

export function DailyGoalCard({
  percent,
  countString,
  isComplete,
  gamesCompleted,
  totalGames,
  iqTitle,
  iqProgress,
  iqPointsToNext,
  iqNextTierName,
  iqTierColor,
  userRank,
  totalUsers,
  onPressGames,
  onPressIQ,
  onPressRank,
}: DailyGoalCardProps) {
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
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[HOME_COLORS.glassBg, 'rgba(255,255,255,0.02)']}
        style={styles.card}
      >
        <View style={styles.row}>
          {/* Left: Ring */}
          <View style={styles.ringContainer}>
            <DailyProgressRing
              percent={percent}
              countString={countString}
              isComplete={isComplete}
              size={110}
            />
          </View>

          {/* Right: Stats Column */}
          <View style={styles.statsColumn}>
            {/* Games Completed */}
            <Pressable
              onPress={onPressGames}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Text style={styles.label}>GAMES COMPLETED</Text>
              <Text style={styles.gamesValue}>{gamesCompleted} / {totalGames}</Text>
              <View style={styles.archiveProgressBackground}>
                <View
                  style={[
                    styles.archiveProgressFill,
                    { width: `${totalGames > 0 ? Math.round((gamesCompleted / totalGames) * 100) : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.archivePercentText}>
                {totalGames > 0 ? Math.round((gamesCompleted / totalGames) * 100) : 0}% of archive complete
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.divider} />

            {/* IQ Level */}
            <Pressable
              onPress={onPressIQ}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
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
            </Pressable>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Your Rank */}
            <Pressable
              onPress={onPressRank}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Text style={styles.label}>YOUR RANK</Text>
              <View style={styles.rankRow}>
                <Text style={styles.rankValue}>
                  {userRank != null ? `#${userRank.toLocaleString()}` : '---'}
                </Text>
                <Text style={styles.rankContext}>
                  {userRank != null && totalUsers != null
                    ? `of ${totalUsers.toLocaleString()} players`
                    : 'Play to rank up'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HOME_COLORS.glassBorder,
    overflow: 'hidden',
  },
  card: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    marginRight: 16,
  },
  statsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    color: HOME_COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  gamesValue: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 22,
    color: HOME_COLORS.textMain,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  iqValue: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 18,
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
  archiveProgressBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  archiveProgressFill: {
    height: '100%',
    backgroundColor: HOME_COLORS.pitchGreen,
    borderRadius: 3,
  },
  archivePercentText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 11,
    color: HOME_COLORS.textSecondary,
    marginTop: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  rankValue: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 22,
    color: HOME_COLORS.cardYellow,
  },
  rankContext: {
    fontFamily: HOME_FONTS.body,
    fontSize: 11,
    color: HOME_COLORS.textSecondary,
  },
});
