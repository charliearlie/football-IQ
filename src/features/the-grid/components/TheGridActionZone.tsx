/**
 * TheGridActionZone Component
 *
 * Input form for guessing players. Shows when a cell is selected.
 * Displays the row and column criteria for the selected cell.
 */

import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { GridCategory } from '../types/theGrid.types';
import { CategoryHeader } from './CategoryHeader';

export interface TheGridActionZoneProps {
  rowCategory: GridCategory;
  colCategory: GridCategory;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isIncorrect?: boolean;
  testID?: string;
}

/**
 * TheGridActionZone - Input form for player guesses.
 *
 * Shows:
 * - Row and column criteria
 * - Text input for player name
 * - Cancel and Submit buttons
 * - Shake animation on incorrect guess
 */
export function TheGridActionZone({
  rowCategory,
  colCategory,
  value,
  onChangeText,
  onSubmit,
  onCancel,
  isIncorrect = false,
  testID,
}: TheGridActionZoneProps) {
  const shakeX = useSharedValue(0);

  // Shake animation on incorrect guess
  useEffect(() => {
    if (isIncorrect) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isIncorrect, shakeX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleSubmit = () => {
    if (value.trim()) {
      Keyboard.dismiss();
      onSubmit();
    }
  };

  const isSubmitDisabled = !value.trim();

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={animatedStyle}
      testID={testID}
    >
      <GlassCard style={styles.container}>
        {/* Criteria display */}
        <View style={styles.criteriaContainer}>
          <Text style={styles.criteriaLabel}>Find a player who matches:</Text>
          <View style={styles.criteriaRow}>
            <View style={styles.criteriaItem}>
              <CategoryHeader category={rowCategory} orientation="horizontal" />
            </View>
            <Text style={styles.criteriaAnd}>&</Text>
            <View style={styles.criteriaItem}>
              <CategoryHeader category={colCategory} orientation="horizontal" />
            </View>
          </View>
        </View>

        {/* Input field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="Enter player name..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            testID={`${testID}-input`}
          />
          {value.length > 0 && (
            <View style={styles.clearButton}>
              <X
                size={18}
                color={colors.textSecondary}
                onPress={() => onChangeText('')}
              />
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <ElevatedButton
            title="Cancel"
            onPress={onCancel}
            size="small"
            topColor={colors.textSecondary}
            shadowColor={colors.stadiumNavy}
            testID={`${testID}-cancel`}
          />
          <ElevatedButton
            title="Submit"
            onPress={handleSubmit}
            size="small"
            topColor={isSubmitDisabled ? colors.textSecondary : colors.pitchGreen}
            shadowColor={isSubmitDisabled ? colors.stadiumNavy : colors.grassShadow}
            disabled={isSubmitDisabled}
            testID={`${testID}-submit`}
          />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  criteriaContainer: {
    marginBottom: spacing.md,
  },
  criteriaLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaItem: {
    flex: 1,
    alignItems: 'center',
  },
  criteriaAnd: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.cardYellow,
    marginHorizontal: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.floodlightWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
