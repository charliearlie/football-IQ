/**
 * TopTensActionZone - Input and action buttons for Top Tens.
 *
 * Contains a text input for guesses and submit/give-up buttons.
 * Shows shake animation on incorrect guesses.
 */

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
import { colors, spacing, fonts, borderRadius } from '@/theme';

/** Spring configuration for shake recovery */
const SHAKE_SPRING = {
  damping: 8,
  stiffness: 400,
  mass: 0.3,
};

export interface TopTensActionZoneProps {
  /** Current guess text */
  currentGuess: string;
  /** Handler for guess text changes */
  onGuessChange: (text: string) => void;
  /** Handler for submitting a guess */
  onSubmit: () => void;
  /** Handler for giving up */
  onGiveUp: () => void;
  /** Number of answers found (0-10) */
  foundCount: number;
  /** Whether to trigger shake animation (incorrect guess) */
  shouldShake: boolean;
  /** Whether to show duplicate feedback */
  showDuplicate: boolean;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TopTensActionZone - Input and action area for Top Tens.
 *
 * Features:
 * - Text input for guessing answers
 * - Submit button (primary green)
 * - Give Up button (warning orange)
 * - Shake animation on incorrect guess
 * - Duplicate feedback message
 * - Progress display (X/10 found)
 */
export function TopTensActionZone({
  currentGuess,
  onGuessChange,
  onSubmit,
  onGiveUp,
  foundCount,
  shouldShake,
  showDuplicate,
  isGameOver,
  testID,
}: TopTensActionZoneProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (shouldShake) {
      // Shake sequence: quick oscillation left-right
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

  return (
    <View style={styles.container} testID={testID}>
      {/* Input with shake animation */}
      <Animated.View style={[styles.inputContainer, shakeStyle]}>
        <TextInput
          style={styles.input}
          value={currentGuess}
          onChangeText={onGuessChange}
          placeholder="Enter your guess..."
          placeholderTextColor={colors.textSecondary}
          editable={!isGameOver}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          testID={`${testID}-input`}
        />
      </Animated.View>

      {/* Feedback messages */}
      {showDuplicate && (
        <Text style={styles.duplicateText}>Already found!</Text>
      )}
      {shouldShake && !showDuplicate && (
        <Text style={styles.incorrectText}>Incorrect!</Text>
      )}

      {/* Buttons - Give Up on left, Submit (primary) on right */}
      <View style={styles.buttonRow}>
        {!isGameOver && (
          <ElevatedButton
            title="Give Up"
            onPress={onGiveUp}
            topColor={colors.warningOrange}
            shadowColor={colors.warningOrangeShadow}
            size="medium"
            testID={`${testID}-giveup`}
          />
        )}

        <ElevatedButton
          title="Submit"
          onPress={handleSubmit}
          disabled={isGameOver || !currentGuess.trim()}
          size="medium"
          testID={`${testID}-submit`}
        />
      </View>
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
  duplicateText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  incorrectText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
