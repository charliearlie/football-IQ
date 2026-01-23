/**
 * ScoutingDisclaimer Component
 *
 * Footer showing AI-scouted data provenance date and a "Report Error" button.
 * Displays when career path data has been scouted from Wikipedia.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flag } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/theme';

export interface ScoutingDisclaimerProps {
  /** ISO timestamp when the career data was scouted */
  scoutedAt?: string | null;
  /** Callback when user taps "Report Error" */
  onReportError: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Format date for display.
 * Returns "Jan 2026" format for brevity.
 */
function formatScoutedDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * ScoutingDisclaimer - Shows career data provenance info.
 *
 * Placed above the AdBanner on the CareerPathScreen to inform users
 * that the career data was AI-scouted and may contain inaccuracies.
 */
export function ScoutingDisclaimer({
  scoutedAt,
  onReportError,
  testID,
}: ScoutingDisclaimerProps) {
  // Don't render if no scouted date available
  if (!scoutedAt) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.disclaimer}>
        Scouting Intelligence: Records as of {formatScoutedDate(scoutedAt)}
      </Text>
      <Pressable
        onPress={onReportError}
        style={styles.reportButton}
        hitSlop={8}
        accessibilityLabel="Report an error"
        accessibilityRole="button"
      >
        <Flag size={12} color={colors.textSecondary} />
        <Text style={styles.reportText}>Report Error</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  reportText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
