
/**
 * Calendar Transformers
 *
 * Utility functions for transforming archive puzzle data into
 * the accordion-style Match Calendar format.
 */

import {
  ArchivePuzzle,
  ArchiveDateGroup,
  ArchiveListItem,
  ArchiveFilterState,
} from '../types/archive.types';

/**
 * Format a date string to short format (e.g., "JAN 19").
 */
export function formatDateShort(dateString: string): string {
  // Parse date at noon to avoid timezone issues
  const date = new Date(`${dateString}T12:00:00`);
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Format a date string to full format (e.g., "Sunday, January 19").
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Groups puzzles by date for accordion display.
 * Returns dates sorted descending (newest first).
 */
export function groupByDate(puzzles: ArchivePuzzle[]): ArchiveDateGroup[] {
  const dateMap = new Map<string, ArchivePuzzle[]>();

  // Group puzzles by date
  for (const puzzle of puzzles) {
    const existing = dateMap.get(puzzle.puzzleDate);
    if (existing) {
      existing.push(puzzle);
    } else {
      dateMap.set(puzzle.puzzleDate, [puzzle]);
    }
  }

  // Transform to ArchiveDateGroup array
  const groups: ArchiveDateGroup[] = [];
  for (const [dateKey, dayPuzzles] of dateMap) {
    const completedCount = dayPuzzles.filter((p) => p.status === 'done').length;
    groups.push({
      dateKey,
      dateString: dateKey, // Alias for dateKey
      dateLabel: formatDateShort(dateKey),
      dateFullLabel: formatDateFull(dateKey),
      puzzles: dayPuzzles,
      completedCount,
      totalCount: dayPuzzles.length,
      isPerfectDay: completedCount === dayPuzzles.length && dayPuzzles.length > 0,
    });
  }

  // Sort by date descending (newest first)
  groups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return groups;
}

/**
 * Transforms date groups into FlashList items, inserting expanded content
 * after the currently expanded date row.
 */
export function buildListItems(
  dateGroups: ArchiveDateGroup[],
  expandedDateKey: string | null
): ArchiveListItem[] {
  const items: ArchiveListItem[] = [];

  for (const group of dateGroups) {
    // Always add the date row
    items.push({ type: 'date-row', data: group });

    // Add expanded content if this date is expanded
    if (group.dateKey === expandedDateKey) {
      items.push({ type: 'expanded-content', data: group });
    }
  }

  return items;
}

/**
 * Apply filters to puzzles before grouping.
 */
export function applyFilters(
  puzzles: ArchivePuzzle[],
  filters: ArchiveFilterState
): ArchivePuzzle[] {
  let filtered = [...puzzles];

  // Apply status filter
  switch (filters.status) {
    case 'incomplete':
      filtered = filtered.filter((p) => p.status !== 'done');
      break;
    case 'perfect':
      // Perfect means completed with max score - for now, just filter completed
      // TODO: Add score comparison when score metadata is available
      filtered = filtered.filter((p) => p.status === 'done');
      break;
    case 'all':
    default:
      // No filtering
      break;
  }

  // Apply game mode filter
  if (filters.gameMode) {
    filtered = filtered.filter((p) => p.gameMode === filters.gameMode);
  }

  // Apply date range filter (if set)
  if (filters.dateRange.start) {
    filtered = filtered.filter((p) => p.puzzleDate >= filters.dateRange.start!);
  }
  if (filters.dateRange.end) {
    filtered = filtered.filter((p) => p.puzzleDate <= filters.dateRange.end!);
  }

  return filtered;
}

/**
 * Get the item key for FlashList.
 */
export function getItemKey(item: ArchiveListItem): string {
  return item.type === 'date-row'
    ? `date-${item.data.dateKey}`
    : `expanded-${item.data.dateKey}`;
}

/**
 * Get the item type for FlashList (used for recycling optimization).
 */
export function getItemType(item: ArchiveListItem): string {
  return item.type;
}

/**
 * Calculate estimated item size for FlashList.
 * Date rows are ~56px, expanded content varies based on puzzle count.
 */
export function getEstimatedItemSize(item: ArchiveListItem): number {
  if (item.type === 'date-row') {
    return 56;
  }

  // Expanded content: 1-column vertical list
  // Each card is 72px + 8px gap
  const puzzleCount = item.data.puzzles.length;
  const contentHeight = puzzleCount * 72 + (puzzleCount - 1) * 8 + 16; // Cards + gaps + padding
  return contentHeight;
}
