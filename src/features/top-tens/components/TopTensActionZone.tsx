/**
 * TopTensActionZone - Input and action buttons for Top Tens.
 *
 * Stadium Night layout:
 * - Playing: Stats row, input + guess button, feedback, give up link
 * - Game Over: Stats row, "See how you scored" button
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
  /** Handler to view score breakdown */
  onSeeScore: () => void;
  /** Number of answers found by user (0-10) */
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
  onSeeScore,
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
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statsLeft}>
          <View style={styles.greenDot} />
          <Text style={styles.statsText}>{foundCount}/10 FOUND</Text>
        </View>
      </View>

      {isGameOver ? (
        /* Game Over: "See how you scored" button */
        <ElevatedButton
          title="See how you scored"
          onPress={onSeeScore}
          fullWidth
          testID={`${testID}-score-button`}
        />
      ) : (
        <>
          {/* Input + Guess inline row */}
          <View style={styles.inputRow}>
            <Animated.View style={[styles.inputContainer, shakeStyle]}>
              <TextInput
                style={styles.input}
                value={currentGuess}
                onChangeText={onGuessChange}
                placeholder="ENTER PLAYER NAME..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                testID={`${testID}-input`}
              />
            </Animated.View>
            <ElevatedButton
              title="GUESS"
              onPress={handleSubmit}
              disabled={!currentGuess.trim()}
              size="medium"
              borderRadius={borderRadius.lg}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pitchGreen,
  },
  statsText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    paddingHorizontal: spacing.lg,
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
