/**
 * IQ Score Display Component
 *
 * Large central Football IQ score with color-coded tier.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Brain } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { GlassCard } from '@/components';

interface IQScoreDisplayProps {
  score: number;
}

/**
 * Get color based on IQ tier.
 * Green: 70+, Yellow: 40-69, Orange: <40
 */
function getTierColor(score: number): string {
  if (score >= 70) return colors.pitchGreen;
  if (score >= 40) return colors.cardYellow;
  return colors.warningOrange;
}

/**
 * Get tier label based on score.
 */
function getTierLabel(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 70) return 'Expert';
  if (score >= 50) return 'Intermediate';
  if (score >= 30) return 'Apprentice';
  return 'Rookie';
}

export function IQScoreDisplay({ score }: IQScoreDisplayProps) {
  const tierColor = getTierColor(score);
  const tierLabel = getTierLabel(score);

  return (
    <GlassCard style={styles.container}>
      <View style={styles.iconRow}>
        <Brain color={tierColor} size={28} strokeWidth={2} />
        <Text style={[textStyles.caption, styles.label]}>FOOTBALL IQ</Text>
      </View>
      <Text style={[styles.score, { color: tierColor }]}>{score}</Text>
      <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
        <Text style={[textStyles.caption, styles.tierText]}>{tierLabel}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  score: {
    fontFamily: fonts.headline,
    fontSize: 96,
    lineHeight: 100,
    letterSpacing: 2,
  },
  tierBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  tierText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
