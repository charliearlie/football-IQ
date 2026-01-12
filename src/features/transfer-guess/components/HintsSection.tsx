import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { HintSlot } from './HintSlot';
import { HINT_LABELS } from '../types/transferGuess.types';

export interface HintsSectionProps {
  /** Array of 3 hints */
  hints: [string, string, string];
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** Whether in review mode (shows different styling for unrevealed) */
  isReviewMode?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * HintsSection - Container for the 3 hint slots.
 *
 * Displays hints in a horizontal row: Number | Position | Nation
 */
export function HintsSection({
  hints,
  hintsRevealed,
  isReviewMode = false,
  testID,
}: HintsSectionProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.hintsRow}>
        {HINT_LABELS.map((label, index) => (
          <HintSlot
            key={label}
            label={label}
            hint={hints[index]}
            isRevealed={index < hintsRevealed}
            slotNumber={index + 1}
            isReviewMode={isReviewMode}
            testID={`${testID}-slot-${index + 1}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  hintsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
