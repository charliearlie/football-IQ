/**
 * MistakeIndicator Component
 *
 * Shows 4 circles representing lives remaining.
 * Filled green circles for lives remaining, empty for lives lost.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '@/theme';

export interface MistakeIndicatorProps {
  mistakes: number;
  maxMistakes?: number;
  testID?: string;
}

/**
 * MistakeIndicator - Visual indicator of lives remaining.
 */
export function MistakeIndicator({
  mistakes,
  maxMistakes = 4,
  testID,
}: MistakeIndicatorProps) {
  const livesRemaining = maxMistakes - mistakes;

  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: maxMistakes }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.circle,
            index < livesRemaining ? styles.circleFilled : styles.circleEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  circleEmpty: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    borderWidth: 1,
    transform: [{ scale: 0.75 }],
  },
  circleFilled: {
    borderColor: colors.pitchGreen,
    backgroundColor: colors.pitchGreen,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#58CC02',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 3,
    }),
  },
});
