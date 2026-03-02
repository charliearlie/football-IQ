/**
 * FormationLabel - Pill badge showing the player's formation classification.
 *
 * Style:
 *   - Transparent background with pitchGreen border (pill shape)
 *   - Label in pitchGreen, 12px, uppercase, bold
 *   - Description in textSecondary, 12px, below the pill
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { FormationClassificationResult } from '../types/scoutReport.types';

export interface FormationLabelProps {
  classification: FormationClassificationResult;
  testID?: string;
}

export function FormationLabel({ classification, testID }: FormationLabelProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{classification.label}</Text>
      </View>
      <Text style={styles.description}>{classification.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.pitchGreen,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'transparent',
  },
  pillText: {
    fontFamily: fonts.bodyBold,
    fontWeight: fontWeights.bold,
    fontSize: 12,
    color: colors.pitchGreen,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
