/**
 * DayHeader Component
 *
 * Lightweight header for day sub-grouping within month sections.
 * Smaller and less prominent than MonthHeader.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '@/theme';

interface DayHeaderProps {
  /** Day title (e.g., "Tuesday, Dec 24") */
  title: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Day sub-header for archive list.
 *
 * Displays day name and date in a compact inline style.
 * Not sticky - scrolls with content.
 */
export function DayHeader({ title, testID }: DayHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
});
