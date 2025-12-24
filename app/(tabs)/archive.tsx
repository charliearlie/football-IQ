import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';
import { Archive as ArchiveIcon } from 'lucide-react-native';

/**
 * Archive Screen
 *
 * Access to past puzzles (gated by subscription tier).
 */
export default function ArchiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, styles.title]}>Archive</Text>

      <GlassCard style={styles.card}>
        <View style={styles.iconContainer}>
          <ArchiveIcon
            color={colors.cardYellow}
            size={48}
            strokeWidth={1.5}
          />
        </View>
        <Text style={[textStyles.subtitle, styles.cardTitle]}>
          Puzzle Archive
        </Text>
        <Text style={[textStyles.body, styles.cardText]}>
          Access your puzzle history based on your account tier:
        </Text>
        <View style={styles.tiers}>
          <Text style={[textStyles.bodySmall, styles.tier]}>
            Anonymous: Today only
          </Text>
          <Text style={[textStyles.bodySmall, styles.tier]}>
            Free account: Last 7 days
          </Text>
          <Text style={[textStyles.bodySmall, styles.tierPremium]}>
            Premium: Full archive
          </Text>
        </View>
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
  card: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cardText: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tiers: {
    gap: spacing.sm,
    width: '100%',
  },
  tier: {
    textAlign: 'center',
  },
  tierPremium: {
    textAlign: 'center',
    color: colors.cardYellow,
  },
});
