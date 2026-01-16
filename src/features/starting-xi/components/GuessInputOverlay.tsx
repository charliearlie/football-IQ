/**
 * GuessInputOverlay Component
 *
 * Simple modal overlay for entering player name guesses in Starting XI.
 * Features:
 * - Text input with submit button
 * - Shake animation on incorrect guess
 * - Auto-focus when opened
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  SlideInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { X, Send } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import type { GuessResult } from '../types/startingXI.types';

/** Spring configuration for shake recovery */
const SHAKE_SPRING = {
  damping: 8,
  stiffness: 400,
  mass: 0.3,
};

/** Amber color for wrong position warning */
const AMBER_WARNING = '#F59E0B';

export interface GuessInputOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback when a guess is submitted */
  onSubmit: (guess: string) => boolean;
  /** Callback when overlay is closed */
  onClose: () => void;
  /** Optional title for the overlay */
  title?: string;
  /** Whether last guess was incorrect (triggers shake) */
  lastGuessIncorrect?: boolean;
  /** Result of last guess for determining flash color */
  lastGuessResult?: GuessResult;
  /** Test ID for testing */
  testID?: string;
}

/**
 * GuessInputOverlay
 *
 * A modal overlay for entering free-text player name guesses.
 * Uses fuzzy matching in the parent component's submitGuess handler.
 */
export function GuessInputOverlay({
  visible,
  onSubmit,
  onClose,
  title = 'Who is this player?',
  lastGuessIncorrect = false,
  lastGuessResult,
  testID,
}: GuessInputOverlayProps) {
  const [guess, setGuess] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);
  const borderFlash = useSharedValue(0);
  // Flash color type: 0 = red (error), 1 = amber (wrong position)
  const flashColorType = useSharedValue(0);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setGuess('');
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  // Shake animation + border flash on incorrect/wrong_position guess
  useEffect(() => {
    const isIncorrect = lastGuessResult === 'incorrect';
    const isWrongPosition = lastGuessResult === 'wrong_position';

    if (isIncorrect || isWrongPosition) {
      // Set flash color: red for incorrect, amber for wrong position
      flashColorType.value = isWrongPosition ? 1 : 0;

      // Shake the input row (lighter shake for wrong position)
      if (isIncorrect) {
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withSpring(0, SHAKE_SPRING)
        );
      }

      // Flash the input border
      borderFlash.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(isWrongPosition ? 1 : 0, { duration: isWrongPosition ? 200 : 0 }), // Hold longer for amber
        withTiming(0, { duration: 300 })
      );
    }
  }, [lastGuessResult, shakeX, borderFlash, flashColorType]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Animated border color for error/warning flash (red or amber)
  const borderFlashStyle = useAnimatedStyle(() => {
    // Get flash color based on type
    const flashColor = interpolateColor(
      flashColorType.value,
      [0, 1],
      [colors.redCard, AMBER_WARNING] // Red → Amber
    );

    // Interpolate from default to flash color
    const borderColor = interpolateColor(
      borderFlash.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.15)', flashColor]
    );

    return { borderColor };
  });

  const handleSubmit = () => {
    const trimmedGuess = guess.trim();
    if (!trimmedGuess) return;

    const isCorrect = onSubmit(trimmedGuess);
    if (isCorrect) {
      // Reset and close handled by parent
      setGuess('');
    }
    // If incorrect, shake animation triggers via lastGuessIncorrect prop
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdrop}
        >
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(300)}
          style={styles.contentContainer}
        >
          <GlassCard style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={16}
                testID={`${testID}-close`}
              >
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Input row */}
            <Animated.View style={[styles.inputRow, shakeStyle]}>
              <Animated.View style={[styles.inputWrapper, borderFlashStyle]}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={guess}
                  onChangeText={setGuess}
                  placeholder="Enter player name..."
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  testID={`${testID}-input`}
                />
              </Animated.View>
              <ElevatedButton
                title="Guess"
                onPress={handleSubmit}
                size="small"
                disabled={!guess.trim()}
                icon={<Send size={16} color={colors.stadiumNavy} />}
                testID={`${testID}-submit`}
              />
            </Animated.View>

            {/* Hint */}
            <Text style={styles.hint}>
              You can enter full name or surname only
            </Text>
          </GlassCard>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdropPressable: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.floodlightWhite,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
