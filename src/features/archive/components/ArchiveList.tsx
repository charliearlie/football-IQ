/**
 * ArchiveList Component
 *
 * SectionList for displaying archive puzzles grouped by month.
 * Supports pagination, pull-to-refresh, and sticky section headers.
 */

import React, { useCallback, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  SectionListRenderItem,
} from 'react-native';
import type { SectionList as SectionListType } from 'react-native';
import { colors, textStyles, spacing } from '@/theme';
import { triggerHeavy } from '@/lib/haptics';
import { UniversalGameCard } from '@/components';
import { ArchivePuzzle, ArchiveSection } from '../types/archive.types';
import { MonthHeader } from './MonthHeader';
import { DayHeader } from './DayHeader';
import { ArchiveSkeletonList } from '@/components/ui/Skeletons';
import { formatPuzzleDate } from '../utils/dateGrouping';

interface ArchiveListProps {
  /** Grouped sections of puzzles */
  sections: ArchiveSection[];
  /** Callback when a puzzle is pressed */
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
  /** Callback when locked puzzle is pressed */
  onLockedPress: (puzzle: ArchivePuzzle) => void;
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
 * Render a puzzle item (locked or unlocked).
 */
const renderItem: SectionListRenderItem<ArchivePuzzle, ArchiveSection> = ({
  item,
  section,
  index,
}) => {
  // This is a workaround - we'll use the context from the parent
  return null;
};

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
 * Loading footer for pagination.
 */
function LoadingFooter() {
  return (
    <View style={styles.footerContainer}>
      <ActivityIndicator color={colors.pitchGreen} size="small" />
    </View>
  );
}

/**
 * Main archive list component.
 *
 * Uses SectionList for efficient rendering with sticky month headers.
 */
export const ArchiveList = forwardRef<
  SectionListType<ArchivePuzzle, ArchiveSection>,
  ArchiveListProps
>(function ArchiveList(
  {
    sections,
    onPuzzlePress,
    onLockedPress,
    onEndReached,
    onRefresh,
    refreshing,
    isLoading,
    hasMore,
    ListHeaderComponent,
    testID,
  },
  ref
) {
  /**
   * Render section header (month/year).
   */
  const renderSectionHeader = useCallback(
    ({ section }: { section: ArchiveSection }) => (
      <MonthHeader
        title={section.title}
        testID={`${testID}-header-${section.monthKey}`}
      />
    ),
    [testID]
  );

  /**
   * Render individual puzzle card with day header when needed.
   */
  const renderPuzzleItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: ArchivePuzzle;
      index: number;
      section: ArchiveSection;
    }) => {
      // Check if this is the first puzzle of a new day
      const prevItem = index > 0 ? section.data[index - 1] : null;
      const isFirstOfDay = !prevItem || prevItem.puzzleDate !== item.puzzleDate;

      // Handle locked press with heavy haptic for "Velvet Rope" feedback
      const handlePress = () => {
        if (item.isLocked) {
          triggerHeavy(); // Heavy haptic = "hitting a gate"
          onLockedPress(item);
        } else {
          onPuzzlePress(item);
        }
      };

      // Check if this is a premium-only game mode
      const isPremiumOnly = item.gameMode === 'career_path_pro' || item.gameMode === 'top_tens';

      // Use UniversalGameCard for both locked and unlocked states
      // Note: date is NOT passed - DayHeader provides date context
      const card = (
        <UniversalGameCard
          gameMode={item.gameMode}
          status={item.status}
          onPress={handlePress}
          variant="archive"
          isLocked={item.isLocked}
          isPremiumOnly={isPremiumOnly}
          isAdUnlocked={item.isAdUnlocked}
          testID={`${testID}-puzzle-${item.id}`}
        />
      );

      // Render day header before first puzzle of each day
      if (isFirstOfDay) {
        return (
          <View>
            <DayHeader
              title={formatPuzzleDate(item.puzzleDate)}
              testID={`${testID}-day-${item.puzzleDate}`}
            />
            {card}
          </View>
        );
      }

      return card;
    },
    [onPuzzlePress, onLockedPress, testID]
  );

  /**
   * Render footer (loading indicator during pagination).
   */
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return <LoadingFooter />;
  }, [hasMore]);

  /**
   * Key extractor for list items.
   */
  const keyExtractor = useCallback(
    (item: ArchivePuzzle) => item.id,
    []
  );

  // Show loading state with skeletons
  if (isLoading && sections.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        {ListHeaderComponent}
        <View style={styles.skeletonContainer}>
          <ArchiveSkeletonList
            sections={2}
            cardsPerSection={3}
            testID={`${testID}-skeleton`}
          />
        </View>
      </View>
    );
  }

  return (
    <SectionList
      ref={ref}
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderPuzzleItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={EmptyState}
      ListFooterComponent={renderFooter}
      stickySectionHeadersEnabled
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
});

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'] + 60, // Extra padding for ad banner
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
  footerContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
