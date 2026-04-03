/**
 * BalldeActionZone Component
 *
 * Input area for player guesses.
 * Uses the shared PlayerAutocomplete for player search.
 */

import { View, StyleSheet, Text } from 'react-native';
import { colors, spacing, fonts } from '@/theme';
import { PlayerAutocomplete } from '@/components';
import { UnifiedPlayer } from '@/services/oracle/types';

export interface BalldeActionZoneProps {
  onPlayerSelect: (player: UnifiedPlayer) => void;
  onTextSubmit: (text: string) => void;
  shouldShake: boolean;
  isGameOver: boolean;
  remainingGuesses: number;
  maxGuesses: number;
  testID?: string;
}

export function BalldeActionZone({
  onPlayerSelect,
  onTextSubmit,
  shouldShake,
  isGameOver,
  remainingGuesses,
  maxGuesses,
  testID,
}: BalldeActionZoneProps) {
  if (isGameOver) return null;

  return (
    <View style={styles.container} testID={testID}>
      <PlayerAutocomplete
        onSelect={onPlayerSelect}
        onSubmitText={onTextSubmit}
        shouldShake={shouldShake}
        isGameOver={isGameOver}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />

      <View style={styles.footer}>
        <Text style={styles.guessCounter}>
          {remainingGuesses} of {maxGuesses} guesses remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  guessCounter: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
