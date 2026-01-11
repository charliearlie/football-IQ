/**
 * TopTensActionZone - Input and action buttons for Top Tens.
 *
 * Layout:
 * - Input field + Submit button (inline row)
 * - Feedback messages (duplicate/incorrect)
 * - Give Up text link (red, subtle)
 */

import { useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Platform, Pressable } from 'react-native';
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
      {/* Input + Submit inline row */}
      <View style={styles.inputRow}>
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
        <ElevatedButton
          title="Submit"
          onPress={handleSubmit}
          disabled={isGameOver || !currentGuess.trim()}
          size="medium"
          testID={`${testID}-submit`}
        />
      </View>

      {/* Feedback messages */}
      {showDuplicate && (
        <Text style={styles.duplicateText}>Already found!</Text>
      )}
      {shouldShake && !showDuplicate && (
        <Text style={styles.incorrectText}>Incorrect!</Text>
      )}

      {/* Give Up - red text link */}
      {!isGameOver && (
        <Pressable
          onPress={onGiveUp}
          style={({ pressed }) => [
            styles.giveUpLink,
            pressed && styles.giveUpLinkPressed,
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
  giveUpLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  giveUpLinkPressed: {
    opacity: 0.7,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
});
