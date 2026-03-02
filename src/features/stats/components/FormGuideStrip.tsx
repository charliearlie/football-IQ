/**
 * FormGuideStrip - Horizontal row of coloured circles showing recent game results.
 *
 * Displays up to 10 results in a football-style form guide (W/D/L).
 * Most recent result appears on the left.
 *
 * Result colours:
 *   perfect   → Gold (#FFD700)
 *   completed → Pitch Green
 *   failed    → Red Card
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontWeights, spacing } from '@/theme';
import { FormGuideEntry, FormGuideResult } from '../types/scoutReport.types';

const CIRCLE_SIZE = 24;
const CIRCLE_GAP = 6;

const RESULT_COLOR: Record<FormGuideResult, string> = {
  perfect: colors.goldPrimary,
  completed: colors.pitchGreen,
  failed: colors.redCard,
};

export interface FormGuideStripProps {
  formGuide: FormGuideEntry[];
  testID?: string;
}

export function FormGuideStrip({ formGuide, testID }: FormGuideStripProps) {
  if (formGuide.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>FORM</Text>
      <View style={styles.strip}>
        {formGuide.map((entry, index) => (
          <View
            key={`${entry.completedAt}-${index}`}
            style={[
              styles.circle,
              { backgroundColor: RESULT_COLOR[entry.result] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    alignSelf: 'center',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CIRCLE_GAP,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
});
