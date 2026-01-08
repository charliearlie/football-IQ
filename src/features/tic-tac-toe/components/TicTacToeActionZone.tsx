/**
 * TicTacToeActionZone Component
 *
 * Input area for guessing players when a cell is selected.
 * Shows the selected cell's categories and accepts player name input.
 */

import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors, spacing, borderRadius, textStyles, fonts } from '@/theme';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useEffect } from 'react';

export interface TicTacToeActionZoneProps {
  /** Current guess input value */
  currentGuess: string;
  /** Callback when guess text changes */
  onGuessChange: (text: string) => void;
  /** Callback to submit the guess */
  onSubmit: () => void;
  /** Callback to cancel/deselect */
  onCancel: () => void;
  /** Whether to show shake animation */
  shouldShake: boolean;
  /** Row category for selected cell */
  rowCategory: string;
  /** Column category for selected cell */
  columnCategory: string;
  /** Whether the action zone is active (cell selected) */
  isActive: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const SHAKE_CONFIG = {
  duration: 50,
};

/**
 * TicTacToeActionZone - Guess input for selected cell
 */
export function TicTacToeActionZone({
  currentGuess,
  onGuessChange,
  onSubmit,
  onCancel,
  shouldShake,
  rowCategory,
  columnCategory,
  isActive,
}: TicTacToeActionZoneProps) {
  const shakeOffset = useSharedValue(0);
  const slideIn = useSharedValue(isActive ? 0 : 100);
  const opacity = useSharedValue(isActive ? 1 : 0);

  // Slide animation when active state changes
  useEffect(() => {
    if (isActive) {
      slideIn.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      slideIn.value = withTiming(100, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isActive]);

  // Shake animation
  useEffect(() => {
    if (shouldShake) {
      shakeOffset.value = withSequence(
        withTiming(-10, SHAKE_CONFIG),
        withTiming(10, SHAKE_CONFIG),
        withTiming(-10, SHAKE_CONFIG),
        withTiming(10, SHAKE_CONFIG),
        withSpring(0, { damping: 8, stiffness: 400, mass: 0.3 })
      );
    }
  }, [shouldShake]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeOffset.value },
      { translateY: slideIn.value },
    ],
    opacity: opacity.value,
  }));

  if (!isActive) {
    return null;
  }

  return (
    <AnimatedView style={[styles.container, animatedContainerStyle]}>
      {/* Category hint */}
      <View style={styles.categoryHint}>
        <Text style={styles.categoryLabel}>Find a player who played for:</Text>
        <View style={styles.categories}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{rowCategory}</Text>
          </View>
          <Text style={styles.andText}>&</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{columnCategory}</Text>
          </View>
        </View>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={currentGuess}
            onChangeText={onGuessChange}
            placeholder="Enter player name..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            testID="guess-input"
          />
          {currentGuess.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => onGuessChange('')}
              hitSlop={8}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <ElevatedButton
          title="Cancel"
          onPress={onCancel}
          topColor={colors.glassBackground}
          shadowColor="rgba(255, 255, 255, 0.03)"
          size="small"
          testID="cancel-button"
        />
        <ElevatedButton
          title="Submit Guess"
          onPress={onSubmit}
          disabled={currentGuess.trim().length === 0}
          size="medium"
          testID="submit-button"
        />
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  categoryHint: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  categories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.stadiumNavy,
    letterSpacing: 1,
  },
  andText: {
    ...textStyles.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: 40,
    color: colors.floodlightWhite,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
