/**
 * BalldeGrid Component
 *
 * Renders the 6-row guess grid. Filled rows show colour feedback.
 * Empty rows show placeholder cells for remaining attempts.
 */

import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';
import { GuessFeedback } from '../types/balldle.types';
import { BalldeGuessRow } from './BalldeGuessRow';

const ATTRIBUTE_LABELS = ['Club', 'League', 'Nat.', 'Pos.', 'Age'];
const MAX_GUESSES = 6;

export interface BalldeGridProps {
  guesses: GuessFeedback[];
  testID?: string;
}

function EmptyRow({ isCurrent, testID }: { isCurrent: boolean; testID?: string }) {
  return (
    <View
      style={[styles.emptyRow, isCurrent && styles.emptyRowCurrent]}
      testID={testID}
    >
      {ATTRIBUTE_LABELS.map((label) => (
        <View key={label} style={styles.emptyCell} />
      ))}
    </View>
  );
}

export function BalldeGrid({ guesses, testID }: BalldeGridProps) {
  const filledCount = guesses.length;
  const emptyCount = MAX_GUESSES - filledCount;

  return (
    <View style={styles.container} testID={testID}>
      {/* Filled rows */}
      {guesses.map((guess, index) => (
        <BalldeGuessRow
          key={`guess-${index}`}
          guess={guess}
          testID={testID ? `${testID}-row-${index}` : undefined}
        />
      ))}

      {/* Empty rows */}
      {Array.from({ length: emptyCount }).map((_, index) => (
        <EmptyRow
          key={`empty-${index}`}
          isCurrent={index === 0}
          testID={testID ? `${testID}-empty-${index}` : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  emptyRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.xs,
  },
  emptyRowCurrent: {
    opacity: 0.6,
  },
  emptyCell: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
