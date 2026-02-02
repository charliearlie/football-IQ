/**
 * CategoryHeader Component
 *
 * Displays a category icon and label for grid headers.
 * Uses ClubShield for club categories with colors,
 * FlagIcon for nation categories, and Lucide icons as fallbacks.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, TrendingUp, Trophy, Flag, LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/theme';
import { ClubShield } from '@/components/ClubShield';
import { FlagIcon } from '@/components/FlagIcon';
import { GridCategory, CategoryType } from '../types/theGrid.types';
import { COUNTRY_NAME_TO_CODE } from '../utils/countryMapping';

/**
 * Fallback icon mapping for category types.
 */
const FALLBACK_ICONS: Record<CategoryType, LucideIcon> = {
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
 * Render the appropriate icon for a category.
 */
function renderCategoryIcon(category: GridCategory, testID?: string) {
  // Club with colors → Vector Shield
  if (category.type === 'club' && category.primaryColor && category.secondaryColor) {
    return (
      <ClubShield
        primaryColor={category.primaryColor}
        secondaryColor={category.secondaryColor}
        size={18}
        testID={testID}
      />
    );
  }

  // Nation → SVG Flag (try to resolve country name to code)
  if (category.type === 'nation') {
    const code = COUNTRY_NAME_TO_CODE[category.value.toLowerCase()];
    if (code) {
      return <FlagIcon code={code} size={14} testID={testID} />;
    }
  }

  // Fallback → Lucide icon
  const FallbackIcon = FALLBACK_ICONS[category.type];
  const iconColor = CATEGORY_COLORS[category.type];
  return <FallbackIcon size={16} color={iconColor} />;
}

/**
 * CategoryHeader - Displays icon + label for a grid category.
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
      <View testID={testID ? `${testID}-icon` : undefined}>
        {renderCategoryIcon(category, testID ? `${testID}-icon-inner` : undefined)}
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
