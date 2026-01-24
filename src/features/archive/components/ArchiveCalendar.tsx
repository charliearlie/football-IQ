/**
 * ArchiveCalendar Component
 *
 * Main FlashList container for the accordion-style Match Calendar.
 * Replaces the old SectionList-based ArchiveList with a high-density
 * date-grouped accordion interface.
 *
 * IMPORTANT: FlashList requires a native rebuild after installation:
 *   npx expo prebuild && npx expo run:ios
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, textStyles, spacing } from '@/theme';
import {
  ArchiveDateGroup,
  ArchiveListItem,
  ArchivePuzzle,
} from '../types/archive.types';
import { buildListItems, getItemKey, getItemType } from '../utils/calendarTransformers';
import { useAccordionState } from '../hooks/useAccordionState';
import { DateAccordionRow } from './DateAccordionRow';
import { ExpandedDateContent } from './ExpandedDateContent';
import { ArchiveCalendarSkeleton } from './ArchiveCalendarSkeleton';

interface ArchiveCalendarProps {
  /** Date groups to display */
  dateGroups: ArchiveDateGroup[];
  /** Callback when a puzzle is pressed (handles both locked and unlocked) */
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
  /** Callback when end of list is reached (pagination) */
  onEndReached: () => void;
  /** Pull-to-refresh handler */
  onRefresh: () => void;
  /** Whether a refresh is in progress */
  refreshing: boolean;
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Component to render at top of list (filter) */
  ListHeaderComponent?: React.ReactElement;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Empty state when no puzzles available.
 */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Puzzles Yet</Text>
      <Text style={styles.emptyText}>
        Check back later for more puzzles to play!
      </Text>
    </View>
  );
}

/**
 * Estimated item sizes for FlashList optimization.
 * Date rows are ~64px, expanded content varies based on puzzle count.
 */
const DATE_ROW_HEIGHT = 64;
const ESTIMATED_ITEM_SIZE = 80; // Weighted average

/**
 * ArchiveCalendar - High-density accordion calendar for archive browsing.
 *
 * Features:
 * - FlashList for performant rendering of many date rows
 * - Single-expand accordion behavior
 * - Memoized date rows to prevent re-renders
 * - Pull-to-refresh and infinite scroll pagination
 */
export function ArchiveCalendar({
  dateGroups,
  onPuzzlePress,
  onEndReached,
  onRefresh,
  refreshing,
  isLoading,
  hasMore,
  ListHeaderComponent,
  testID,
}: ArchiveCalendarProps) {
  // Accordion state management
  const { expandedDateKey, toggleExpanded } = useAccordionState();

  // Build list items with expansion state
  const listItems = useMemo(
    () => buildListItems(dateGroups, expandedDateKey),
    [dateGroups, expandedDateKey]
  );

  /**
   * Render item based on type (date-row or expanded-content).
   */
  const renderItem = useCallback(
    ({ item }: { item: ArchiveListItem }) => {
      if (item.type === 'date-row') {
        return (
          <DateAccordionRow
            group={item.data}
            isExpanded={expandedDateKey === item.data.dateKey}
            onToggle={() => toggleExpanded(item.data.dateKey)}
            testID={`${testID}-row-${item.data.dateKey}`}
          />
        );
      }

      // Expanded content
      return (
        <ExpandedDateContent
          group={item.data}
          onPuzzlePress={onPuzzlePress}
          testID={`${testID}-expanded-${item.data.dateKey}`}
        />
      );
    },
    [expandedDateKey, toggleExpanded, onPuzzlePress, testID]
  );

  /**
   * Override item layout for better FlashList performance.
   */
  const overrideItemLayout = useCallback(
    (
      layout: { span?: number; size?: number },
      item: ArchiveListItem
    ) => {
      if (item.type === 'date-row') {
        layout.size = DATE_ROW_HEIGHT;
      } else {
        // Calculate expanded content height based on puzzle count (1 column layout)
        const puzzleCount = item.data.puzzles.length;
        const cardHeight = 72;
        const gap = 8;
        const padding = 24; // Top + bottom padding
        layout.size = puzzleCount * cardHeight + (puzzleCount - 1) * gap + padding;
      }
    },
    []
  );

  // Show loading skeleton
  if (isLoading && dateGroups.length === 0) {
    return (
      <View style={styles.container}>
        {ListHeaderComponent}
        <ArchiveCalendarSkeleton testID={`${testID}-skeleton`} />
      </View>
    );
  }

  // Show empty state
  if (!isLoading && dateGroups.length === 0) {
    return (
      <View style={styles.container}>
        {ListHeaderComponent}
        <EmptyState />
      </View>
    );
  }

  return (
    <FlashList
      data={listItems}
      renderItem={renderItem}
      keyExtractor={getItemKey}
      getItemType={getItemType}
      estimatedItemSize={ESTIMATED_ITEM_SIZE}
      overrideItemLayout={overrideItemLayout}
      ListHeaderComponent={ListHeaderComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.pitchGreen}
          colors={[colors.pitchGreen]}
        />
      }
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing['2xl'] + 60, // Extra padding for ad banner
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  emptyTitle: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
