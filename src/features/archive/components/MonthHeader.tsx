/**
 * MonthHeader Component
 *
 * Sticky section header for month/year grouping in the Archive list.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '@/theme';

interface MonthHeaderProps {
  /** Month title (e.g., "December 2024") */
  title: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Section header for archive list.
 *
 * Displays month/year in headline style with Card Yellow color.
 * Designed to be sticky at top during scroll.
 */
export function MonthHeader({ title, testID }: MonthHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.stadiumNavy,
  },
  title: {
    ...textStyles.h2,
    color: colors.cardYellow,
  },
});
