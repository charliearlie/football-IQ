/**
 * Stats Grid Component
 *
 * 2x2 grid of stat cards showing key metrics.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Puzzle, Star, Zap, Flame } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';

interface StatsGridProps {
  puzzlesSolved: number;
  perfectScores: number;
  totalPoints: number;
  currentStreak: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <GlassCard style={styles.statCard}>
      {icon}
      <Text style={[textStyles.h2, styles.statValue, { color }]}>{value}</Text>
      <Text style={[textStyles.caption, styles.statLabel]}>{label}</Text>
    </GlassCard>
  );
}

export function StatsGrid({
  puzzlesSolved,
  perfectScores,
  totalPoints,
  currentStreak,
}: StatsGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          icon={<Puzzle color={colors.pitchGreen} size={28} strokeWidth={2} />}
          value={puzzlesSolved}
          label="Puzzles Solved"
          color={colors.pitchGreen}
        />
        <StatCard
          icon={<Star color={colors.cardYellow} size={28} strokeWidth={2} />}
          value={perfectScores}
          label="Perfect Scores"
          color={colors.cardYellow}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          icon={<Zap color={colors.floodlightWhite} size={28} strokeWidth={2} />}
          value={totalPoints.toLocaleString()}
          label="Total Points"
          color={colors.floodlightWhite}
        />
        <StatCard
          icon={<Flame color={colors.redCard} size={28} strokeWidth={2} />}
          value={currentStreak}
          label="Current Streak"
          color={colors.redCard}
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
    alignItems: 'center',
    padding: spacing.lg,
  },
  statValue: {
    marginTop: spacing.sm,
  },
  statLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
