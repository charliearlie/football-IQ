/**
 * Stats Grid Component
 *
 * 2x2 grid of bold stat cards matching the prototype design.
 * White numbers for neutral stats, green for performance stats.
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';

interface StatsGridProps {
  matchesPlayed: number;
  accuracyPercent: number;
  bestScore: number;
  perfectGames: number;
  testID?: string;
}

interface StatCardProps {
  value: number | string;
  label: string;
  accentColor: string;
}

function StatCard({ value, label, accentColor }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatsGrid({
  matchesPlayed,
  accuracyPercent,
  bestScore,
  perfectGames,
  testID,
}: StatsGridProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.row}>
        <StatCard
          value={matchesPlayed}
          label="MATCHES PLAYED"
          accentColor={colors.floodlightWhite}
        />
        <StatCard
          value={`${accuracyPercent}%`}
          label="AVG SCORE"
          accentColor={colors.pitchGreen}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          value={bestScore}
          label="BEST SCORE"
          accentColor={colors.floodlightWhite}
        />
        <StatCard
          value={perfectGames}
          label="PERFECT GAMES"
          accentColor={colors.pitchGreen}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
