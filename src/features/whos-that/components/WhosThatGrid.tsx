/**
 * WhosThatGrid Component
 *
 * Renders the 6-row guess grid. Filled rows show colour feedback.
 * Empty rows show placeholder cells for remaining attempts.
 */

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing } from '@/theme';
import { GuessFeedback } from '../types/whosThat.types';
import { WhosThatGuessRow } from './WhosThatGuessRow';

const ATTRIBUTE_LABELS = ['Club', 'League', 'Nat.', 'Pos.', 'Born'];
const MAX_GUESSES = 6;

export interface WhosThatGridProps {
  guesses: GuessFeedback[];
  testID?: string;
}

function EmptyRow({ isCurrent, testID }: { isCurrent: boolean; testID?: string }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isCurrent) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isCurrent, pulse]);

  const pulseStyle = useAnimatedStyle(() => {
    if (!isCurrent) return {};
    return { opacity: pulse.value };
  });

  return (
    <View
      style={[styles.emptyRow]}
      testID={testID}
    >
      {ATTRIBUTE_LABELS.map((label) => (
        <Animated.View
          key={label}
          style={[
            styles.emptyCell,
            isCurrent && styles.emptyCellCurrent,
            isCurrent && pulseStyle,
          ]}
        />
      ))}
    </View>
  );
}

export function WhosThatGrid({ guesses, testID }: WhosThatGridProps) {
  const filledCount = guesses.length;
  const emptyCount = MAX_GUESSES - filledCount;

  return (
    <View style={styles.container} testID={testID}>
      {/* Filled rows */}
      {guesses.map((guess, index) => (
        <WhosThatGuessRow
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
  emptyCell: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyCellCurrent: {
    backgroundColor: 'rgba(46, 252, 93, 0.08)',
    borderColor: 'rgba(46, 252, 93, 0.25)',
  },
});
