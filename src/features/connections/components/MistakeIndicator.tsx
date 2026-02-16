/**
 * MistakeIndicator Component
 *
 * Shows 4 circles representing mistake count.
 * Filled circles for mistakes used, empty for remaining.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export interface MistakeIndicatorProps {
  mistakes: number;
  maxMistakes?: number;
  testID?: string;
}

/**
 * MistakeIndicator - Visual indicator of mistakes remaining.
 */
export function MistakeIndicator({
  mistakes,
  maxMistakes = 4,
  testID,
}: MistakeIndicatorProps) {
  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length: maxMistakes }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.circle,
            index < mistakes ? styles.circleFilled : styles.circleEmpty,
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
    gap: spacing.sm,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  circleEmpty: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  circleFilled: {
    borderColor: colors.redCard,
    backgroundColor: colors.redCard,
  },
});
