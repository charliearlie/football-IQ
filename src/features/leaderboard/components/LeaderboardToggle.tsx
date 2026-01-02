/**
 * LeaderboardToggle Component
 *
 * Toggle between Daily and All-Time leaderboard views.
 * Adapts the GameModeFilter pattern from the archive feature.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Calendar, TrendingUp } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { LeaderboardType } from '../types/leaderboard.types';

interface LeaderboardToggleProps {
  /** Currently selected leaderboard type */
  selected: LeaderboardType;
  /** Callback when selection changes */
  onSelect: (type: LeaderboardType) => void;
  /** Test ID for testing */
  testID?: string;
}

interface ToggleOption {
  value: LeaderboardType;
  label: string;
  icon: React.ReactNode;
}

const TOGGLE_OPTIONS: ToggleOption[] = [
  {
    value: 'daily',
    label: 'Daily',
    icon: <Calendar size={18} />,
  },
  {
    value: 'global',
    label: 'All-Time',
    icon: <TrendingUp size={18} />,
  },
];

/**
 * Individual toggle chip component.
 */
function ToggleChip({
  option,
  isSelected,
  onPress,
  testID,
}: {
  option: ToggleOption;
  isSelected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const Icon = React.cloneElement(option.icon as React.ReactElement, {
    color: isSelected ? colors.stadiumNavy : colors.floodlightWhite,
  });

  return (
    <Pressable
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      testID={testID}
      accessibilityState={{ selected: isSelected }}
      accessibilityRole="button"
      accessibilityLabel={`${option.label} leaderboard`}
    >
      {Icon}
      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

/**
 * Toggle between Daily and All-Time leaderboards.
 *
 * Daily shows total points from today's 5 puzzles (0-500).
 * All-Time shows global IQ ranking (0-100).
 */
export function LeaderboardToggle({
  selected,
  onSelect,
  testID,
}: LeaderboardToggleProps) {
  return (
    <View style={styles.container} testID={testID}>
      {TOGGLE_OPTIONS.map((option) => (
        <ToggleChip
          key={option.value}
          option={option}
          isSelected={selected === option.value}
          onPress={() => onSelect(option.value)}
          testID={`${testID}-${option.value}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    ...textStyles.body,
    color: colors.floodlightWhite,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: colors.stadiumNavy,
    fontWeight: '600',
  },
});
