import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { DossierSlot } from './DossierSlot';

export interface DossierGridProps {
  /** Array of 3 hints: [year, position, nationality] */
  hints: [string, string, string];
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** Whether in review mode (shows different styling for unrevealed) */
  isReviewMode?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * DossierGrid - The Intel Dossier 2-column grid layout.
 *
 * Layout:
 * ┌─────────────┬─────────────┐
 * │  [📅] Year  │ [⚽] Position│
 * │    2019     │     ATT     │
 * ├─────────────┴─────────────┤
 * │       [🏴] Nationality     │
 * │           Brazil           │
 * └───────────────────────────┘
 *
 * Year + Position side-by-side on top row
 * Nationality spans full width on bottom row (the "big reveal")
 */
export function DossierGrid({
  hints,
  hintsRevealed,
  isReviewMode = false,
  testID,
}: DossierGridProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Top row: Year + Position (side-by-side) */}
      <View style={styles.topRow}>
        <DossierSlot
          label="Year"
          hint={hints[0]}
          isRevealed={hintsRevealed >= 1}
          isReviewMode={isReviewMode}
          style={styles.halfSlot}
          testID={`${testID}-slot-year`}
        />
        <DossierSlot
          label="Position"
          hint={hints[1]}
          isRevealed={hintsRevealed >= 2}
          isReviewMode={isReviewMode}
          style={styles.halfSlot}
          testID={`${testID}-slot-position`}
        />
      </View>

      {/* Bottom row: Nationality (full width, the "big reveal") */}
      <DossierSlot
        label="Nation"
        hint={hints[2]}
        isRevealed={hintsRevealed >= 3}
        isReviewMode={isReviewMode}
        testID={`${testID}-slot-nation`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfSlot: {
    flex: 1,
  },
});
