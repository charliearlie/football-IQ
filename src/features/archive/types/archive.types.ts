
/**
 * Type definitions for the Archive feature.
 *
 * The Archive screen displays historical puzzles with premium gating.
 * Free users see 7 days of playable puzzles + locked placeholders for older content.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { ParsedLocalAttempt } from '@/types/database';

/**
 * Archive puzzle item - combines catalog metadata with full puzzle data.
 * Represents a puzzle in the archive list.
 */
export interface ArchivePuzzle {
  /** Puzzle ID (matches daily_puzzles.id) */
  id: string;
  /** Game mode type */
  gameMode: GameMode;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Difficulty level if available */
  difficulty: string | null;
  /** Whether the puzzle is locked (premium only, >7 days old for free users) */
  isLocked: boolean;
  /** Whether this puzzle has been permanently unlocked via ad */
  isAdUnlocked?: boolean;
  /** Play status based on attempt data */
  status: 'play' | 'resume' | 'done';
  /** Score display emoji grid if completed */
  scoreDisplay?: string;
  /** Score value if completed */
  score?: number;
  /** Full attempt data for completed games (needed for result modal) */
  attempt?: ParsedLocalAttempt;
}

/**
 * Day group - represents a single day within a month.
 * Used for sub-grouping puzzles by day within month sections.
 */
export interface DayGroup {
  /** Day key in YYYY-MM-DD format */
  dayKey: string;
  /** Display title (e.g., "Tuesday, Dec 24") */
  dayTitle: string;
  /** Puzzles on this day */
  puzzles: ArchivePuzzle[];
}

/**
 * Section for SectionList grouping - represents a month of puzzles.
 */
export interface ArchiveSection {
  /** Display title (e.g., "December 2024") */
  title: string;
  /** Sort key in YYYY-MM format */
  monthKey: string;
  /** Puzzles in this month */
  data: ArchivePuzzle[];
  /** Days within this month (for day sub-headers) */
  days?: DayGroup[];
}

/**
 * Game mode filter for archive browsing.
 * 'all' shows all game modes, 'incomplete' shows unfinished puzzles,
 * or filter by specific mode.
 */
export type GameModeFilter = 'all' | 'incomplete' | GameMode;

/**
 * Filter option for the horizontal filter bar.
 */
export interface FilterOption {
  /** Filter value */
  value: GameModeFilter;
  /** Display label */
  label: string;
  /** Icon name from lucide-react-native */
  icon: string;
}

/**
 * Result of the useArchivePuzzles hook.
 */
export interface UseArchivePuzzlesResult {
  /** Grouped sections for SectionList (legacy) */
  sections: ArchiveSection[];
  /** Date groups for Match Calendar accordion */
  dateGroups: ArchiveDateGroup[];
  /** Total number of available puzzles (from DB, not paginated) */
  totalCount: number;
  /** Number of completed puzzles (from DB, not paginated) */
  completedCount: number;
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Load the next page of puzzles */
  loadMore: () => void;
  /** Pull-to-refresh handler */
  refresh: () => Promise<void>;
}

/**
 * Catalog sync result from Supabase RPC.
 */
export interface CatalogSyncResult {
  success: boolean;
  error?: Error;
  syncedCount?: number;
}

// Re-export GameMode for convenience
export type { GameMode };

// ============================================================================
// Match Calendar Types (Accordion-style Archive)
// ============================================================================

/**
 * Date-grouped archive data for accordion display.
 * Each group represents a single day with all its puzzles.
 */
export interface ArchiveDateGroup {
  /** Date key in YYYY-MM-DD format */
  dateKey: string;
  /** Alias for dateKey, used by some components (MatchdayCard) */
  dateString: string;
  /** Short formatted date for display (e.g., "JAN 19") */
  dateLabel: string;
  /** Full date for display (e.g., "Sunday, January 19") */
  dateFullLabel: string;
  /** Puzzles on this date */
  puzzles: ArchivePuzzle[];
  /** Number of completed puzzles */
  completedCount: number;
  /** Total puzzles for this day */
  totalCount: number;
  /** Whether all games are complete (perfect day) */
  isPerfectDay: boolean;
}

/**
 * Item type for FlashList - either a date row or expanded content.
 * This discriminated union allows FlashList to render different item types.
 */
export type ArchiveListItem =
  | { type: 'date-row'; data: ArchiveDateGroup }
  | { type: 'expanded-content'; data: ArchiveDateGroup };

/**
 * Status filter options for the advanced filter bar.
 */
export type StatusFilter = 'all' | 'incomplete' | 'perfect';

/**
 * Filter state for advanced filtering in Match Calendar.
 */
export interface ArchiveFilterState {
  /** Status filter: all, incomplete, or perfect */
  status: StatusFilter;
  /** Game mode filter: null for all modes, or specific mode */
  gameMode: GameMode | null;
  /** Date range filter (optional, for future use) */
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Mini card data for compact display in expanded accordion.
 */
export interface MiniCardData {
  id: string;
  gameMode: GameMode;
  title: string;
  iqEarned: number | null;
  status: 'play' | 'resume' | 'done';
  isLocked: boolean;
  isPremiumOnly: boolean;
  isAdUnlocked: boolean;
}

/**
 * Result of the useArchiveCalendar hook.
 */
export interface UseArchiveCalendarResult {
  /** Date groups for accordion display */
  dateGroups: ArchiveDateGroup[];
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Load the next page of puzzles */
  loadMore: () => void;
  /** Pull-to-refresh handler */
  refresh: () => Promise<void>;
}
