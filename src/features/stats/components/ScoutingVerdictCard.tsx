/**
 * ScoutingVerdictCard - GlassCard container displaying the scouting verdict paragraph.
 *
 * Styled to resemble a hand-written scouting note:
 *   - "SCOUTING VERDICT" header in pitchGreen, uppercase with letter-spacing
 *   - Italic paragraph in floodlightWhite at 15px / 24px line-height
 *   - Glass border + dark background to match the design system card language
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';

export interface ScoutingVerdictCardProps {
  verdict: string;
  testID?: string;
}

export function ScoutingVerdictCard({ verdict, testID }: ScoutingVerdictCardProps) {
  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.sectionHeader}>Scouting Verdict</Text>
      <Text style={styles.verdictText}>{verdict}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 10,
    color: colors.pitchGreen,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  verdictText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 15,
    color: colors.floodlightWhite,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
