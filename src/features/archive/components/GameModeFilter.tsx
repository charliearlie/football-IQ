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
} from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { GameModeFilter as FilterType, GameMode } from '../types/archive.types';

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
    value: 'tic_tac_toe',
    label: 'Tic Tac Toe',
    icon: <Grid3X3 size={18} />,
    iconColor: colors.floodlightWhite,
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
  },
  scrollContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipSelected: {
    backgroundColor: colors.pitchGreen,
    borderColor: colors.pitchGreen,
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
