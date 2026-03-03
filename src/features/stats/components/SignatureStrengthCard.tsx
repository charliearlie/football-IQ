/**
 * SignatureStrengthCard - Side-by-side strength and weakness display.
 *
 * Layout:
 *   - Top row: green-tinted background, TrendingUp icon, flavourText, accuracy %
 *   - Thin divider
 *   - Bottom row: red-tinted background, TrendingDown icon, flavourText, accuracy %
 *
 * Returns null when analysis is not yet available.
 */

import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { StrengthWeaknessAnalysis } from '../types/scoutReport.types';

export interface SignatureStrengthCardProps {
  analysis: StrengthWeaknessAnalysis | null;
  testID?: string;
}

export function SignatureStrengthCard({ analysis, testID }: SignatureStrengthCardProps) {
  if (analysis === null) {
    return null;
  }

  const { strength, weakness } = analysis;

  return (
    <View style={styles.card} testID={testID}>
      {/* Strength row */}
      <View style={styles.strengthRow}>
        <View style={styles.iconWrapStrength}>
          <TrendingUp size={16} color={colors.pitchGreen} strokeWidth={2} />
        </View>
        <Text style={styles.flavourText} numberOfLines={2}>
          {strength.flavourText}
        </Text>
        <Text style={styles.accuracyStrength}>{strength.accuracy}%</Text>
      </View>

      <View style={styles.divider} />

      {/* Weakness row */}
      <View style={styles.weaknessRow}>
        <View style={styles.iconWrapWeakness}>
          <TrendingDown size={16} color={colors.redCard} strokeWidth={2} />
        </View>
        <Text style={styles.flavourText} numberOfLines={2}>
          {weakness.flavourText}
        </Text>
        <Text style={styles.accuracyWeakness}>{weakness.accuracy}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(46, 252, 93, 0.06)',
  },
  weaknessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  iconWrapStrength: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 252, 93, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapWeakness: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flavourText: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 13,
    color: colors.floodlightWhite,
    lineHeight: 18,
  },
  accuracyStrength: {
    fontFamily: fonts.stats,
    fontSize: 14,
    color: colors.pitchGreen,
  },
  accuracyWeakness: {
    fontFamily: fonts.stats,
    fontSize: 14,
    color: colors.redCard,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
  },
});
