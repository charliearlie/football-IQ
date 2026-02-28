/**
 * DetailedModeStatsSection Component
 *
 * Displays per-mode stat cards in the MODE BREAKDOWN section of the
 * Scout Report screen. Shows accuracy, best score, and perfect scores
 * for each game mode the user has played.
 *
 * Uses the "Digital Pitch" neubrutalist style:
 * - Glass card backgrounds
 * - Pitch Green accent for skill names
 * - Bebas Neue (headline) for values
 * - Montserrat (body) for labels
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { DetailedModeStats } from '../types/stats.types';

export interface DetailedModeStatsSectionProps {
  /** Array of detailed per-mode stats to display */
  stats: DetailedModeStats[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * A single stat item in the 2x2 grid.
 */
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * Card for a single game mode showing name, skill, and a 2x2 stats grid.
 */
function ModeStatCard({ mode }: { mode: DetailedModeStats }) {
  return (
    <View style={styles.card}>
      {/* Mode name header */}
      <View style={styles.cardHeader}>
        <Text style={styles.modeName}>{mode.displayName}</Text>
        <Text style={styles.skillName}>{mode.skillName}</Text>
      </View>

      {/* Stats grid: 2x2 */}
      <View style={styles.statsGrid}>
        <StatItem label="Played" value={mode.gamesPlayed.toString()} />
        <StatItem label="Accuracy" value={`${mode.accuracyPercent}%`} />
        <StatItem label="Best Score" value={mode.bestScore.toString()} />
        <StatItem label="Perfect" value={mode.perfectScores.toString()} />
      </View>
    </View>
  );
}

/**
 * Section rendering a list of ModeStatCards for each played game mode.
 */
export function DetailedModeStatsSection({
  stats,
  testID,
}: DetailedModeStatsSectionProps) {
  if (stats.length === 0) return null;

  return (
    <View testID={testID} style={styles.container}>
      {stats.map((mode) => (
        <ModeStatCard key={mode.gameMode} mode={mode} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  modeName: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  skillName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.pitchGreen,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.headline,
    fontSize: 22,
    color: colors.floodlightWhite,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
