/**
 * SpeedProfile - Displays average answer speed and per-mode breakdown.
 *
 * Shows archetype label, formatted average time, and the top 3 fastest
 * game modes as small pills with a mode-color dot.
 */

import { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { getGameModeColor } from '@/theme/gameModeColors';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

export interface SpeedProfileProps {
  avgSeconds: number;
  archetype: string;
  perMode: { gameMode: GameMode; avgSeconds: number }[];
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s avg`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s avg`;
}

function formatTimeShort(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

/** Human-readable display names for each mode */
const MODE_DISPLAY_NAMES: Record<GameMode, string> = {
  career_path: 'Career Path',
  career_path_pro: 'Career Pro',
  guess_the_transfer: 'Transfers',
  connections: 'Connections',
  timeline: 'Timeline',
  'whos-that': "Who's That",
  higher_lower: 'Higher/Lower',
  starting_xi: 'Starting XI',
  the_grid: 'The Grid',
  guess_the_goalscorers: 'Goalscorers',
  top_tens: 'Top Tens',
  last_tens: 'Last 10',
  topical_quiz: 'Topical Quiz',
  who_am_i: 'Who Am I',
  the_chain: 'The Chain',
  the_thread: 'The Thread',
};

export const SpeedProfile = memo(function SpeedProfile({
  avgSeconds,
  archetype,
  perMode,
}: SpeedProfileProps) {
  const top3 = useMemo(
    () =>
      [...perMode]
        .sort((a, b) => a.avgSeconds - b.avgSeconds)
        .slice(0, 3),
    [perMode]
  );

  return (
    <Animated.View entering={FadeInDown.springify().damping(15).stiffness(300).mass(0.5)}>
      <View style={styles.card}>
        <Text style={styles.title}>SPEED PROFILE</Text>

        {/* Archetype */}
        <Text style={styles.archetype}>{archetype}</Text>

        {/* Average time */}
        <Text style={styles.avgTime}>{formatTime(avgSeconds)}</Text>

        {/* Top 3 fastest mode pills */}
        {top3.length > 0 && (
          <View style={styles.pillsRow}>
            {top3.map(({ gameMode, avgSeconds: modeAvg }) => {
              const palette = getGameModeColor(gameMode);
              return (
                <View key={gameMode} style={styles.pill}>
                  <View
                    style={[styles.modeDot, { backgroundColor: palette.primary }]}
                  />
                  <Text style={styles.pillName}>
                    {MODE_DISPLAY_NAMES[gameMode] ?? gameMode}
                  </Text>
                  <Text style={[styles.pillTime, { color: palette.primary }]}>
                    {formatTimeShort(modeAvg)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  archetype: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  avgTime: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.floodlightWhite,
  },
  pillTime: {
    fontFamily: fonts.stats,
    fontSize: 12,
  },
});
