/**
 * GameModeFilter Component
 *
 * Horizontal scroll filter chips for selecting game modes in the Archive.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  LayoutGrid,
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  CircleDashed,
} from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius, shadows } from '@/theme';
import { GameModeFilter as FilterType } from '../types/archive.types';

interface GameModeFilterProps {
  /** Currently selected filter */
  selected: FilterType;
  /** Callback when filter is selected */
  onSelect: (filter: FilterType) => void;
  /** Test ID for testing */
  testID?: string;
}

interface FilterOption {
  value: FilterType;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
}

/**
 * Available filter options with icons.
 */
const FILTER_OPTIONS: FilterOption[] = [
  {
    value: 'all',
    label: 'All',
    icon: <LayoutGrid size={18} />,
    iconColor: colors.floodlightWhite,
  },
  {
    value: 'incomplete',
    label: 'Incomplete',
    icon: <CircleDashed size={18} />,
    iconColor: colors.cardYellow,
  },
  {
    value: 'career_path',
    label: 'Career Path',
    icon: <Briefcase size={18} />,
    iconColor: colors.cardYellow,
  },
  {
    value: 'guess_the_transfer',
    label: 'Transfer',
    icon: <ArrowRightLeft size={18} />,
    iconColor: colors.pitchGreen,
  },
  {
    value: 'guess_the_goalscorers',
    label: 'Recall',
    icon: <Target size={18} />,
    iconColor: colors.redCard,
  },
  {
    value: 'the_grid',
    label: 'The Grid (beta)',
    icon: <Grid3X3 size={18} />,
    iconColor: colors.pitchGreen,
  },
];

/**
 * Individual filter chip component.
 */
function FilterChip({
  option,
  isSelected,
  onPress,
  testID,
}: {
  option: FilterOption;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const Icon = React.cloneElement(option.icon as React.ReactElement, {
    color: isSelected ? colors.stadiumNavy : option.iconColor,
  });

  return (
    <Pressable
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      testID={testID}
    >
      {Icon}
      <Text
        style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

/**
 * Horizontal scrolling filter for game modes.
 *
 * Displays filter chips for "All" and each game mode.
 * Selected chip gets a highlighted background.
 */
export function GameModeFilter({
  selected,
  onSelect,
  testID,
}: GameModeFilterProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            option={option}
            isSelected={selected === option.value}
            onPress={() => onSelect(option.value)}
            testID={`${testID}-${option.value}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.xl, // Extend to screen edge
  },
  scrollContent: {
    paddingHorizontal: spacing.xl, // Match Archive content padding
    paddingVertical: spacing.xs, // Allow shadow to render
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.stadiumNavy,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.md,
  },
  chipSelected: {
    backgroundColor: colors.pitchGreen,
    borderColor: colors.pitchGreen,
    ...shadows.md,
  },
  chipLabel: {
    ...textStyles.caption,
    color: colors.floodlightWhite,
  },
  chipLabelSelected: {
    color: colors.stadiumNavy,
    fontWeight: '600',
  },
});
