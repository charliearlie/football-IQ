/**
 * Action Zone component for Goalscorer Recall.
 *
 * Contains:
 * - Text input for entering guesses
 * - Submit button
 * - Give Up button
 */

import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { ElevatedButton } from '@/components';

interface RecallActionZoneProps {
  currentGuess: string;
  onGuessChange: (text: string) => void;
  onSubmit: () => void;
  onGiveUp: () => void;
  isPlaying: boolean;
  showError: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function RecallActionZone({
  currentGuess,
  onGuessChange,
  onSubmit,
  onGiveUp,
  isPlaying,
  showError,
}: RecallActionZoneProps) {
  const shakeX = useSharedValue(0);

  // Shake animation when incorrect
  useEffect(() => {
    if (showError) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [showError, shakeX]);

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleSubmitEditing = () => {
    if (currentGuess.trim()) {
      onSubmit();
    }
  };

  return (
    <View style={styles.container}>
      {/* Input Row */}
      <View style={styles.inputRow}>
        <AnimatedTextInput
          style={[
            styles.input,
            showError && styles.inputError,
            animatedInputStyle,
          ]}
          value={currentGuess}
          onChangeText={onGuessChange}
          onSubmitEditing={handleSubmitEditing}
          placeholder="Enter scorer name..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          autoCapitalize="words"
          autoCorrect={false}
          editable={isPlaying}
          returnKeyType="done"
        />
        <ElevatedButton
          title="Guess"
          onPress={onSubmit}
          variant="primary"
          disabled={!isPlaying || !currentGuess.trim()}
          style={styles.submitButton}
        />
      </View>

      {/* Give Up Button */}
      <Pressable
        onPress={onGiveUp}
        disabled={!isPlaying}
        style={({ pressed }) => [
          styles.giveUpButton,
          pressed && styles.giveUpButtonPressed,
          !isPlaying && styles.giveUpButtonDisabled,
        ]}
      >
        <Text style={[styles.giveUpText, !isPlaying && styles.giveUpTextDisabled]}>
          Give Up
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.floodlightWhite,
  },
  inputError: {
    borderColor: colors.redCard,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  submitButton: {
    minWidth: 80,
  },
  giveUpButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  giveUpButtonPressed: {
    opacity: 0.7,
  },
  giveUpButtonDisabled: {
    opacity: 0.3,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.floodlightWhite,
    opacity: 0.6,
  },
  giveUpTextDisabled: {
    opacity: 0.3,
  },
});
