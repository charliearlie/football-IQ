/**
 * AdvancedFilterBar Component
 *
 * Multi-filter bar for the Match Calendar.
 * Provides Status, Game Mode, and optional Date Range filtering.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  ChevronDown,
  Filter,
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
  Trophy,
  ListOrdered,
  Users,
} from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { triggerLight } from '@/lib/haptics';
import { ArchiveFilterState, StatusFilter } from '../types/archive.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

interface AdvancedFilterBarProps {
  /** Current filter state */
  filters: ArchiveFilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: ArchiveFilterState) => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Status filter options.
 */
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'perfect', label: 'Perfect' },
];

/**
 * Game mode filter options with icons.
 */
const GAME_MODE_OPTIONS: { value: GameMode | null; label: string; icon: React.ReactNode }[] = [
  { value: null, label: 'All Games', icon: <Filter size={14} color={colors.textSecondary} /> },
  { value: 'career_path', label: 'Career Path', icon: <Briefcase size={14} color={colors.cardYellow} /> },
  { value: 'career_path_pro', label: 'Career Pro', icon: <Briefcase size={14} color={colors.cardYellow} /> },
  { value: 'guess_the_transfer', label: 'Transfer', icon: <ArrowRightLeft size={14} color={colors.pitchGreen} /> },
  { value: 'guess_the_goalscorers', label: 'Recall', icon: <Target size={14} color={colors.redCard} /> },
  { value: 'the_grid', label: 'The Grid', icon: <Grid3X3 size={14} color={colors.pitchGreen} /> },
  { value: 'topical_quiz', label: 'Quiz', icon: <HelpCircle size={14} color={colors.cardYellow} /> },
  { value: 'top_tens', label: 'Top Tens', icon: <ListOrdered size={14} color={colors.pitchGreen} /> },
  { value: 'starting_xi', label: 'Starting XI', icon: <Users size={14} color={colors.cardYellow} /> },
];

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

/**
 * Status segment button.
 */
function StatusSegment({
  value,
  label,
  isSelected,
  onPress,
}: {
  value: StatusFilter;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePress = () => {
    triggerLight();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.statusButton, isSelected && styles.statusButtonSelected]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text
          style={[
            styles.statusButtonText,
            isSelected && styles.statusButtonTextSelected,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * AdvancedFilterBar - Multi-filter interface for Match Calendar.
 *
 * Layout:
 * - Status segment (All | Incomplete | Perfect)
 * - Game mode dropdown
 */
export function AdvancedFilterBar({
  filters,
  onFiltersChange,
  testID,
}: AdvancedFilterBarProps) {
  const [showGameModeDropdown, setShowGameModeDropdown] = useState(false);

  // Handle status filter change
  const handleStatusChange = (status: StatusFilter) => {
    onFiltersChange({ ...filters, status });
  };

  // Handle game mode filter change
  const handleGameModeChange = (gameMode: GameMode | null) => {
    onFiltersChange({ ...filters, gameMode });
    setShowGameModeDropdown(false);
  };

  // Get current game mode label
  const currentGameMode = GAME_MODE_OPTIONS.find(
    (opt) => opt.value === filters.gameMode
  );

  return (
    <View style={styles.container} testID={testID}>
      {/* Status Segment Control */}
      <View style={styles.statusRow}>
        <View style={styles.statusSegment}>
          {STATUS_OPTIONS.map((option) => (
            <StatusSegment
              key={option.value}
              value={option.value}
              label={option.label}
              isSelected={filters.status === option.value}
              onPress={() => handleStatusChange(option.value)}
            />
          ))}
        </View>
      </View>

      {/* Game Mode Dropdown */}
      <View style={styles.dropdownRow}>
        <Pressable
          style={styles.dropdown}
          onPress={() => {
            triggerLight();
            setShowGameModeDropdown(true);
          }}
          testID={`${testID}-game-mode-dropdown`}
        >
          <View style={styles.dropdownContent}>
            {currentGameMode?.icon}
            <Text style={styles.dropdownText}>
              {currentGameMode?.label || 'All Games'}
            </Text>
          </View>
          <ChevronDown size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Game Mode Selection Modal */}
      <Modal
        visible={showGameModeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGameModeDropdown(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGameModeDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Game Mode</Text>
            <ScrollView style={styles.modalScroll}>
              {GAME_MODE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value ?? 'all'}
                  style={[
                    styles.modalOption,
                    filters.gameMode === option.value &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleGameModeChange(option.value)}
                >
                  {option.icon}
                  <Text
                    style={[
                      styles.modalOptionText,
                      filters.gameMode === option.value &&
                        styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statusRow: {
    alignItems: 'center',
  },
  statusSegment: {
    flexDirection: 'row',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 4,
    gap: 4,
  },
  statusButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  statusButtonSelected: {
    backgroundColor: colors.pitchGreen,
  },
  statusButtonText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusButtonTextSelected: {
    color: colors.stadiumNavy,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropdownText: {
    ...textStyles.bodySmall,
    color: colors.floodlightWhite,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    width: '80%',
    maxHeight: '60%',
    padding: spacing.lg,
  },
  modalTitle: {
    ...textStyles.h3,
    color: colors.floodlightWhite,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(88, 204, 2, 0.2)',
  },
  modalOptionText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
  },
  modalOptionTextSelected: {
    color: colors.pitchGreen,
    fontWeight: '600',
  },
});
