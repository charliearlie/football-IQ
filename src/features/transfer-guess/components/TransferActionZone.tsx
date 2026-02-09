import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { PlayerAutocomplete } from '@/components';
import { colors, spacing, fonts, textStyles } from '@/theme';
import { UnifiedPlayer } from '@/services/oracle/types';
import { MAX_GUESSES } from '../types/transferGuess.types';

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
 * TransferActionZone - Floating action bar with life balls and input.
 *
 * Layout:
 * - Game status row: "X GUESSES LEFT" text + life balls
 * - PlayerAutocomplete (inline input + submit button with dropdown)
 * - "Reveal a hint" / "Give up" text links
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
  const guessesUsed = MAX_GUESSES - guessesRemaining;

  return (
    <View style={styles.container} testID={testID}>
      {/* Game Status Row: text + life balls */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          {guessesRemaining} {guessesRemaining === 1 ? 'GUESS' : 'GUESSES'} LEFT
        </Text>
        <View style={styles.lifeBalls}>
          {Array.from({ length: MAX_GUESSES }, (_, i) => (
            <View
              key={i}
              style={[
                styles.lifeBall,
                i < guessesUsed && styles.lifeBallLost,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Autocomplete input (handles shake + error flash internally) */}
      <PlayerAutocomplete
        onSelect={onPlayerSelect}
        onSubmitText={onTextSubmit}
        shouldShake={shouldShake}
        isGameOver={isGameOver}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />

      {/* Hint / Give Up Links */}
      {canRevealHint && !isGameOver && (
        <Pressable
          onPress={onRevealHint}
          style={({ pressed }) => [
            styles.hintLink,
            pressed && styles.hintLinkPressed,
          ]}
          testID={`${testID}-reveal`}
        >
          <Lightbulb size={14} color={colors.cardYellow} />
          <Text style={styles.hintText}>Need a bigger hint? (Cost: 1 Guess)</Text>
        </Pressable>
      )}

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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  statusText: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  lifeBalls: {
    flexDirection: 'row',
    gap: 4,
  },
  lifeBall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.pitchGreen,
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  lifeBallLost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  hintLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  hintLinkPressed: {
    opacity: 0.7,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cardYellow,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
});
