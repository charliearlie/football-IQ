import { useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { ElevatedButton, ErrorFlashOverlay } from '@/components';
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
  /** Callback when input gains focus (for scroll-to-latest behavior) */
  onFocus?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ActionZone - The input and action buttons area.
 *
 * Layout:
 * - Input field + Submit button (inline row)
 * - "Reveal next step" text link (amber, only shown when more steps available)
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
  onFocus,
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
            onFocus={onFocus}
            testID={`${testID}-input`}
          />
          <ErrorFlashOverlay
            active={shouldShake}
            style={{ borderRadius: borderRadius.xl }}
            testID={`${testID}-error-flash`}
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

      {/* Reveal Next - subtle text link (costly action) */}
      {canRevealMore && !isGameOver && (
        <Pressable
          onPress={onRevealNext}
          style={({ pressed }) => [
            styles.revealLink,
            pressed && styles.revealLinkPressed,
          ]}
          testID={`${testID}-reveal`}
        >
          <ChevronRight size={18} color={colors.amber} />
          <Text style={styles.revealText}>Reveal next step</Text>
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
  revealLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  revealLinkPressed: {
    opacity: 0.7,
  },
  revealText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.amber,
  },
});
