import { useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ElevatedButton } from '@/components';
import { colors, spacing, fonts, borderRadius, textStyles } from '@/theme';

/** Spring configuration for shake recovery */
const SHAKE_SPRING = {
  damping: 8,
  stiffness: 400,
  mass: 0.3,
};

export interface TransferActionZoneProps {
  /** Current guess text */
  currentGuess: string;
  /** Handler for guess text changes */
  onGuessChange: (text: string) => void;
  /** Handler for submitting a guess */
  onSubmit: () => void;
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
  /** Number of incorrect guesses made */
  incorrectGuesses: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TransferActionZone - The input and action buttons area.
 *
 * Contains:
 * - Text input for player name guesses (shakes on incorrect)
 * - Guesses remaining indicator
 * - "Submit Guess" button (primary green)
 * - "Reveal Hint" button (warning orange, hidden when all hints revealed)
 * - "Give Up" button (red, shown after 2+ incorrect guesses)
 */
export function TransferActionZone({
  currentGuess,
  onGuessChange,
  onSubmit,
  onRevealHint,
  onGiveUp,
  canRevealHint,
  guessesRemaining,
  shouldShake,
  isGameOver,
  incorrectGuesses,
  testID,
}: TransferActionZoneProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (shouldShake) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withSpring(0, SHAKE_SPRING)
      );
    }
  }, [shouldShake, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleSubmit = () => {
    if (currentGuess.trim() && !isGameOver) {
      onSubmit();
    }
  };

  // Show Give Up button after 2+ incorrect guesses
  const showGiveUp = incorrectGuesses >= 2 && !isGameOver;

  return (
    <View style={styles.container} testID={testID}>
      {/* Guesses remaining indicator */}
      <View style={styles.guessesIndicator}>
        <Text style={styles.guessesText}>
          {guessesRemaining} {guessesRemaining === 1 ? 'guess' : 'guesses'} left
        </Text>
      </View>

      {/* Input field */}
      <Animated.View style={[styles.inputContainer, shakeStyle]}>
        <TextInput
          style={styles.input}
          value={currentGuess}
          onChangeText={onGuessChange}
          placeholder="Enter player name..."
          placeholderTextColor={colors.textSecondary}
          editable={!isGameOver}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          testID={`${testID}-input`}
        />
      </Animated.View>

      {/* Primary action buttons */}
      <View style={styles.buttonRow}>
        <ElevatedButton
          title="Submit Guess"
          onPress={handleSubmit}
          disabled={isGameOver || !currentGuess.trim()}
          size="medium"
          testID={`${testID}-submit`}
        />

        {canRevealHint && !isGameOver && (
          <ElevatedButton
            title="Reveal Hint"
            onPress={onRevealHint}
            topColor={colors.warningOrange}
            shadowColor={colors.warningOrangeShadow}
            size="medium"
            testID={`${testID}-reveal`}
          />
        )}
      </View>

      {/* Give Up button (shown after 2+ wrong guesses) */}
      {showGiveUp && (
        <View style={styles.giveUpRow}>
          <ElevatedButton
            title="Give Up"
            onPress={onGiveUp}
            topColor={colors.redCard}
            shadowColor="#B91C1C"
            size="small"
            testID={`${testID}-giveup`}
          />
        </View>
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
  inputContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBackground,
    overflow: 'hidden',
  },
  input: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  giveUpRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
