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
 * DossierGrid - The Scouting Report 3-column hint grid.
 *
 * Layout (matching transfer-guess.html prototype):
 * ┌──────────┬──────────┬──────────┐
 * │   YEAR   │ POSITION │  NATION  │
 * └──────────┴──────────┴──────────┘
 *
 * All three hints displayed side-by-side in equal-width columns.
 */
export function DossierGrid({
  hints,
  hintsRevealed,
  isReviewMode = false,
  testID,
}: DossierGridProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.row}>
        <DossierSlot
          label="Year"
          hint={hints[0]}
          isRevealed={hintsRevealed >= 1}
          isReviewMode={isReviewMode}
          style={styles.slot}
          testID={`${testID}-slot-year`}
        />
        <DossierSlot
          label="Position"
          hint={hints[1]}
          isRevealed={hintsRevealed >= 2}
          isReviewMode={isReviewMode}
          style={styles.slot}
          testID={`${testID}-slot-position`}
        />
        <DossierSlot
          label="Nation"
          hint={hints[2]}
          isRevealed={hintsRevealed >= 3}
          isReviewMode={isReviewMode}
          style={styles.slot}
          testID={`${testID}-slot-nation`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  slot: {
    flex: 1,
  },
});
