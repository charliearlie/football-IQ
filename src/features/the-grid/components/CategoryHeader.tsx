/**
 * CategoryHeader Component
 *
 * Stadium Broadcast Edition - clean text-only headers.
 * Displays category value as uppercase text with broadcast styling.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme';
import { GridCategory } from '../types/theGrid.types';

export interface CategoryHeaderProps {
  category: GridCategory;
  /** Orientation affects layout */
  orientation?: 'horizontal' | 'vertical';
  testID?: string;
}

/**
 * CategoryHeader - Text-only label for grid categories.
 * Clean broadcast style with no icons.
 */
export function CategoryHeader({
  category,
  orientation = 'vertical',
  testID,
}: CategoryHeaderProps) {
  const containerStyle = orientation === 'horizontal'
    ? styles.containerHorizontal
    : styles.containerVertical;

  return (
    <View style={containerStyle} testID={testID}>
      <Text
        style={styles.label}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {category.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  containerVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    minWidth: 60,
    maxWidth: 80,
  },
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 4,
    minWidth: 80,
    maxWidth: 100,
  },
  label: {
    fontFamily: fonts.headline,
    fontSize: 12, // Slightly larger for readability
    color: colors.textSecondary, // Muted white for broadcast look
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1, // More spacing for broadcast look
  },
});
