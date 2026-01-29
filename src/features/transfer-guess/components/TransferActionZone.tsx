import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { PlayerAutocomplete } from '@/components';
import { colors, spacing, fonts, textStyles } from '@/theme';
import { UnifiedPlayer } from '@/services/oracle/types';

export interface TransferActionZoneProps {
  /** Called when user selects a player from autocomplete dropdown */
  onPlayerSelect: (player: UnifiedPlayer) => void;
  /** Called when user submits typed text without selecting */
  onTextSubmit: (text: string) => void;
  /** Handler for revealing a hint */
  onRevealHint: () => void;
  /** Handler for giving up */
  onGiveUp: () => void;
  /** Whether more hints can be revealed */
  canRevealHint: boolean;
  /** Number of guesses remaining */
  guessesRemaining: number;
  /** Whether to trigger shake animation */
  shouldShake: boolean;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TransferActionZone - The input and action buttons area.
 *
 * Layout:
 * - Guesses remaining indicator (caption)
 * - PlayerAutocomplete (inline input + submit button with dropdown)
 * - "Reveal Hint" text link with lightbulb icon (amber, subtle)
 * - "Give Up" button (red, shown when all hints revealed)
 */
export function TransferActionZone({
  onPlayerSelect,
  onTextSubmit,
  onRevealHint,
  onGiveUp,
  canRevealHint,
  guessesRemaining,
  shouldShake,
  isGameOver,
  testID,
}: TransferActionZoneProps) {
  // Show Give Up button when all hints are revealed (replaces hint link)
  const showGiveUp = !canRevealHint && !isGameOver;

  return (
    <View style={styles.container} testID={testID}>
      {/* Guesses remaining indicator */}
      <View style={styles.guessesIndicator}>
        <Text style={styles.guessesText}>
          {guessesRemaining} {guessesRemaining === 1 ? 'guess' : 'guesses'} left
        </Text>
      </View>

      {/* Autocomplete input (handles shake + error flash internally) */}
      <PlayerAutocomplete
        onSelect={onPlayerSelect}
        onSubmitText={onTextSubmit}
        shouldShake={shouldShake}
        isGameOver={isGameOver}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />

      {/* Reveal Hint - subtle text link (costly action) */}
      {canRevealHint && !isGameOver && (
        <Pressable
          onPress={onRevealHint}
          style={({ pressed }) => [
            styles.hintLink,
            pressed && styles.hintLinkPressed,
          ]}
          testID={`${testID}-reveal`}
        >
          <Lightbulb size={18} color={colors.amber} />
          <Text style={styles.hintText}>Reveal a hint</Text>
        </Pressable>
      )}

      {/* Give Up link (shown when all hints revealed) */}
      {showGiveUp && (
        <Pressable
          onPress={onGiveUp}
          style={({ pressed }) => [
            styles.hintLink,
            pressed && styles.hintLinkPressed,
          ]}
          testID={`${testID}-giveup`}
        >
          <Text style={styles.giveUpText}>Give up</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
    backgroundColor: colors.stadiumNavy,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.md,
  },
  guessesIndicator: {
    alignItems: 'center',
  },
  guessesText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hintLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  hintLinkPressed: {
    opacity: 0.7,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.amber,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
});
