/**
 * ModeMastery - Per-mode accuracy breakdown with colored progress bars.
 *
 * Sorted by accuracy descending. Each row shows:
 * - mode name (white, 14px)
 * - accuracy % (mode primary color, Space Grotesk)
 * - games played (textSecondary, 12px)
 * - horizontal bar with mode color fill
 */

import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { getGameModeColor } from '@/theme/gameModeColors';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

export interface ModeMasteryProps {
  modes: {
    gameMode: GameMode;
    displayName: string;
    accuracyPercent: number;
    gamesPlayed: number;
  }[];
}

export const ModeMastery = memo(function ModeMastery({ modes }: ModeMasteryProps) {
  const sorted = [...modes].sort((a, b) => b.accuracyPercent - a.accuracyPercent);

  return (
    <Animated.View entering={FadeInDown.springify().damping(15).stiffness(300).mass(0.5)}>
      <View style={styles.card}>
        <Text style={styles.title}>MODE MASTERY</Text>

        <View style={styles.modeList}>
          {sorted.map(({ gameMode, displayName, accuracyPercent, gamesPlayed }) => {
            const palette = getGameModeColor(gameMode);
            const clampedAccuracy = Math.max(0, Math.min(100, accuracyPercent));

            return (
              <View key={gameMode} style={styles.modeRow}>
                {/* Text row */}
                <View style={styles.modeTextRow}>
                  <Text style={styles.modeName}>{displayName}</Text>
                  <Text style={[styles.modeAccuracy, { color: palette.primary }]}>
                    {clampedAccuracy}%
                  </Text>
                  <Text style={styles.gamesPlayed}>
                    {gamesPlayed} {gamesPlayed === 1 ? 'game' : 'games'}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${clampedAccuracy}%`,
                        backgroundColor: palette.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
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
    marginBottom: spacing.md,
  },
  modeList: {
    gap: 12,
  },
  modeRow: {
    gap: spacing.xs,
  },
  modeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
  modeAccuracy: {
    fontFamily: fonts.stats,
    fontSize: 14,
    marginRight: spacing.sm,
  },
  gamesPlayed: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 56,
    textAlign: 'right',
  },
  barTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: borderRadius.full,
  },
});
