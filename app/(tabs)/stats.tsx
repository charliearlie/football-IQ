import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';
import { BarChart3, Flame, Trophy } from 'lucide-react-native';

/**
 * Stats Screen
 *
 * User statistics, streaks, and achievements.
 */
export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, styles.title]}>Your Stats</Text>

      <View style={styles.statsGrid}>
        <GlassCard style={styles.statCard}>
          <Flame color={colors.redCard} size={32} strokeWidth={2} />
          <Text style={[textStyles.h2, styles.statValue]}>0</Text>
          <Text style={[textStyles.caption, styles.statLabel]}>
            Current Streak
          </Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Trophy color={colors.cardYellow} size={32} strokeWidth={2} />
          <Text style={[textStyles.h2, styles.statValue]}>0</Text>
          <Text style={[textStyles.caption, styles.statLabel]}>
            Best Streak
          </Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <BarChart3 color={colors.pitchGreen} size={32} strokeWidth={2} />
          <Text style={[textStyles.h2, styles.statValue]}>0</Text>
          <Text style={[textStyles.caption, styles.statLabel]}>
            Games Played
          </Text>
        </GlassCard>
      </View>

      <GlassCard style={styles.infoCard}>
        <Text style={[textStyles.body, styles.infoText]}>
          Play daily puzzles to build your streak and track your progress!
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.stadiumNavy,
  },
  title: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: spacing.lg,
  },
  statValue: {
    marginTop: spacing.sm,
    color: colors.floodlightWhite,
  },
  statLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  infoCard: {
    marginTop: spacing.md,
  },
  infoText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
