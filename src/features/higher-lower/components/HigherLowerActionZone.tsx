/**
 * HigherLowerActionZone Component
 *
 * Two tall buttons for Higher and Lower answers that fill available space,
 * plus round progress indicator.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { colors, spacing, fonts } from '@/theme';

export interface HigherLowerActionZoneProps {
  onHigher: () => void;
  onLower: () => void;
  /** Buttons are disabled during reveal animation or when game is over */
  disabled: boolean;
  currentRound: number;
  totalRounds: number;
  testID?: string;
}

export function HigherLowerActionZone({
  onHigher,
  onLower,
  disabled,
  currentRound,
  totalRounds,
  testID,
}: HigherLowerActionZoneProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.roundLabel} testID={testID ? `${testID}-round` : undefined}>
        Round {currentRound + 1}/{totalRounds}
      </Text>

      <View style={styles.buttonsRow}>
        {/* Higher button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.higherButton,
            (disabled || pressed) && styles.buttonDisabled,
          ]}
          onPress={onHigher}
          disabled={disabled}
          testID={testID ? `${testID}-higher` : undefined}
          accessibilityLabel="Higher"
          accessibilityRole="button"
        >
          <ArrowUp size={32} color={colors.stadiumNavy} strokeWidth={2.5} />
          <Text style={styles.higherButtonText}>HIGHER</Text>
        </Pressable>

        {/* Lower button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.lowerButton,
            (disabled || pressed) && styles.buttonDisabled,
          ]}
          onPress={onLower}
          disabled={disabled}
          testID={testID ? `${testID}-lower` : undefined}
          accessibilityLabel="Lower"
          accessibilityRole="button"
        >
          <ArrowDown size={36} color={colors.floodlightWhite} strokeWidth={2.5} />
          <Text style={styles.lowerButtonText}>LOWER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  roundLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  higherButton: {
    backgroundColor: colors.pitchGreen,
  },
  higherButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.stadiumNavy,
    letterSpacing: 1.5,
  },
  lowerButton: {
    backgroundColor: colors.redCard,
  },
  lowerButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
  },
});
