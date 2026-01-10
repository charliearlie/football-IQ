/**
 * CategoryHeader Component
 *
 * Displays a category icon and label for grid headers.
 * Uses Bebas Neue font for labels.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, Flag, TrendingUp, Trophy, LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/theme';
import { GridCategory, CategoryType } from '../types/theGrid.types';

/**
 * Icon mapping for category types.
 */
const CATEGORY_ICONS: Record<CategoryType, LucideIcon> = {
  club: Shield,
  nation: Flag,
  stat: TrendingUp,
  trophy: Trophy,
};

/**
 * Color mapping for category types.
 */
const CATEGORY_COLORS: Record<CategoryType, string> = {
  club: colors.cardYellow,
  nation: colors.pitchGreen,
  stat: colors.redCard,
  trophy: colors.cardYellow,
};

export interface CategoryHeaderProps {
  category: GridCategory;
  /** Orientation affects layout */
  orientation?: 'horizontal' | 'vertical';
  testID?: string;
}

/**
 * CategoryHeader - Displays icon + label for a grid category.
 */
export function CategoryHeader({
  category,
  orientation = 'vertical',
  testID,
}: CategoryHeaderProps) {
  const IconComponent = CATEGORY_ICONS[category.type];
  const iconColor = CATEGORY_COLORS[category.type];

  const containerStyle = orientation === 'horizontal'
    ? styles.containerHorizontal
    : styles.containerVertical;

  return (
    <View style={containerStyle} testID={testID}>
      <View testID={`${testID}-icon`}>
        <IconComponent size={16} color={iconColor} />
      </View>
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
    fontSize: 10,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
