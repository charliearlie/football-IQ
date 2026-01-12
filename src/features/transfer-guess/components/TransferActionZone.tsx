import { useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Lightbulb } from 'lucide-react-native';
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
 * Layout:
 * - Guesses remaining indicator (caption)
 * - Input field + Submit button (inline row)
 * - "Reveal Hint" text link with lightbulb icon (amber, subtle)
 * - "Give Up" button (red, shown when all hints revealed)
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

      {/* Input + Submit inline row */}
      <View style={styles.inputRow}>
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
        <ElevatedButton
          title="Submit"
          onPress={handleSubmit}
          disabled={isGameOver || !currentGuess.trim()}
          size="medium"
          testID={`${testID}-submit`}
        />
      </View>

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
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBackground,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    letterSpacing: 0.5,
    textAlignVertical: 'center',
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
