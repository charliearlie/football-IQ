/**
 * Scoring Section Component
 *
 * Displays the "Tactical Briefing" box with scoring information.
 * Shows description, optional tiers, and IQ potential label.
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GameRules } from '../../constants/rules';
import { GlassCard } from '@/components';
import { colors, textStyles, spacing, fonts, fontWeights, borderRadius } from '@/theme';

interface ScoringSectionProps {
  /** Game rules containing scoring configuration */
  rules: GameRules;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Tactical Briefing box showing scoring structure
 */
export function ScoringSection({ rules, testID }: ScoringSectionProps) {
  const { scoring } = rules;

  return (
    <Animated.View
      entering={FadeInUp.delay(600).duration(400)}
      style={styles.container}
      testID={testID}
    >
      <GlassCard style={styles.card}>
        {/* Header badge */}
        <View style={styles.header}>
          <Text style={styles.headerText}>TACTICAL BRIEFING</Text>
        </View>

        {/* Scoring description */}
        <Text style={styles.description}>{scoring.description}</Text>

        {/* Scoring tiers (if applicable) */}
        {scoring.tiers && scoring.tiers.length > 0 && (
          <View style={styles.tiersContainer}>
            {scoring.tiers.map((tier, index) => (
              <View key={index} style={styles.tierRow}>
                <Text style={styles.tierRange}>{tier.range}</Text>
                <View style={styles.tierDots} />
                <Text style={styles.tierLabel}>{tier.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* IQ Growth potential badge (if defined) */}
        {scoring.potentialLabel && (
          <View style={styles.potentialBadge}>
            <Text style={styles.potentialText}>
              IQ GROWTH: {scoring.potentialLabel}
            </Text>
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  card: {
    padding: spacing.lg,
  },
  header: {
    backgroundColor: colors.pitchGreen,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  headerText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.stadiumNavy,
    letterSpacing: 1,
  },
  description: {
    ...textStyles.body,
    color: colors.floodlightWhite,
  },
  tiersContainer: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierRange: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.textSecondary,
    minWidth: 100,
  },
  tierDots: {
    flex: 1,
    height: 1,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginHorizontal: spacing.sm,
  },
  tierLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.cardYellow,
  },
  potentialBadge: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.pitchGreen,
  },
  potentialText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: colors.pitchGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
