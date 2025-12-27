/**
 * ArchiveList Component
 *
 * SectionList for displaying archive puzzles grouped by month.
 * Supports pagination, pull-to-refresh, and sticky section headers.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  SectionListRenderItem,
} from 'react-native';
import { colors, textStyles, spacing } from '@/theme';
import { ArchivePuzzle, ArchiveSection } from '../types/archive.types';
import { ArchivePuzzleCard } from './ArchivePuzzleCard';
import { LockedArchiveCard } from './LockedArchiveCard';
import { MonthHeader } from './MonthHeader';

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
export function ArchiveList({
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
}: ArchiveListProps) {
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
   * Render individual puzzle card.
   */
  const renderPuzzleItem = useCallback(
    ({ item, index }: { item: ArchivePuzzle; index: number }) => {
      if (item.isLocked) {
        return (
          <LockedArchiveCard
            puzzle={item}
            onPress={() => onLockedPress(item)}
            testID={`${testID}-locked-${item.id}`}
          />
        );
      }

      return (
        <ArchivePuzzleCard
          puzzle={item}
          onPress={() => onPuzzlePress(item)}
          testID={`${testID}-puzzle-${item.id}`}
        />
      );
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

  // Show loading state
  if (isLoading && sections.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        {ListHeaderComponent}
        <ActivityIndicator
          color={colors.pitchGreen}
          size="large"
          style={styles.loadingIndicator}
        />
      </View>
    );
  }

  return (
    <SectionList
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
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingIndicator: {
    marginTop: spacing['2xl'],
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
