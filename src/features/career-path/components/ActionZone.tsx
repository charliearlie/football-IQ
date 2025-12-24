import { useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
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

export interface ActionZoneProps {
  /** Current guess text */
  currentGuess: string;
  /** Handler for guess text changes */
  onGuessChange: (text: string) => void;
  /** Handler for submitting a guess */
  onSubmit: () => void;
  /** Handler for revealing next step */
  onRevealNext: () => void;
  /** Whether more steps can be revealed */
  canRevealMore: boolean;
  /** Whether to trigger shake animation */
  shouldShake: boolean;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ActionZone - The input and action buttons area.
 *
 * Contains a text input for player name guesses and two buttons:
 * - "Submit Guess" (primary green)
 * - "Reveal Next" (warning orange, only shown when more steps available)
 *
 * The input field shakes on incorrect guesses for visual feedback.
 */
export function ActionZone({
  currentGuess,
  onGuessChange,
  onSubmit,
  onRevealNext,
  canRevealMore,
  shouldShake,
  isGameOver,
  testID,
}: ActionZoneProps) {
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

      <View style={styles.buttonRow}>
        <ElevatedButton
          title="Submit Guess"
          onPress={handleSubmit}
          disabled={isGameOver || !currentGuess.trim()}
          size="medium"
          testID={`${testID}-submit`}
        />

        {canRevealMore && !isGameOver && (
          <ElevatedButton
            title="Reveal Next"
            onPress={onRevealNext}
            topColor={colors.warningOrange}
            shadowColor={colors.warningOrangeShadow}
            size="medium"
            testID={`${testID}-reveal`}
          />
        )}
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
