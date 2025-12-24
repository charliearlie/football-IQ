import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textStyles } from '@/theme';
import { HintSlot } from './HintSlot';
import { HINT_LABELS } from '../types/transferGuess.types';

export interface HintsSectionProps {
  /** Array of 3 hints */
  hints: [string, string, string];
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * HintsSection - Container for the 3 hint slots.
 *
 * Displays all hints in a vertical stack, with unrevealed
 * hints shown as locked cards.
 */
export function HintsSection({
  hints,
  hintsRevealed,
  testID,
}: HintsSectionProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.header}>Hints</Text>

      <View style={styles.hintsContainer}>
        {HINT_LABELS.map((label, index) => (
          <HintSlot
            key={label}
            label={label}
            hint={hints[index]}
            isRevealed={index < hintsRevealed}
            slotNumber={index + 1}
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
    marginTop: spacing.xl,
  },
  header: {
    ...textStyles.h3,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hintsContainer: {
    gap: spacing.md,
  },
});
