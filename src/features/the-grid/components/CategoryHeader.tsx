/**
 * CategoryHeader Component
 *
 * Displays a category label for grid headers.
 * Nation categories show an SVG flag instead of text.
 * Club categories show only the name (no icon).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Trophy, Flag, LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/theme';
import { FlagIcon } from '@/components/FlagIcon';
import { GridCategory, CategoryType } from '../types/theGrid.types';
import { COUNTRY_NAME_TO_CODE } from '../utils/countryMapping';

/**
 * Fallback icon mapping for category types (used when no special rendering applies).
 */
const FALLBACK_ICONS: Partial<Record<CategoryType, LucideIcon>> = {
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
 * Club: name only (no icon). Nation: flag only (no name). Others: icon + name.
 */
export function CategoryHeader({
  category,
  orientation = 'vertical',
  testID,
}: CategoryHeaderProps) {
  const containerStyle = orientation === 'horizontal'
    ? styles.containerHorizontal
    : styles.containerVertical;

  // Nation → try to resolve to a flag code
  const nationCode =
    category.type === 'nation'
      ? COUNTRY_NAME_TO_CODE[category.value.toLowerCase()]
      : undefined;

  // Determine what to render
  const showFlagOnly = category.type === 'nation' && !!nationCode;
  const showIcon = category.type !== 'club' && !showFlagOnly;
  const showLabel = !showFlagOnly;

  return (
    <View style={containerStyle} testID={testID}>
      {showFlagOnly && (
        <FlagIcon code={nationCode!} size={24} testID={testID ? `${testID}-flag` : undefined} />
      )}
      {showIcon && (() => {
        const FallbackIcon = FALLBACK_ICONS[category.type];
        if (!FallbackIcon) return null;
        return <FallbackIcon size={16} color={CATEGORY_COLORS[category.type]} />;
      })()}
      {showLabel && (
        <Text
          style={styles.label}
          numberOfLines={category.type === 'club' ? 1 : 2}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {category.value}
        </Text>
      )}
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
    fontSize: 11,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
