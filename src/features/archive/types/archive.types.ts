/**
 * Type definitions for the Archive feature.
 *
 * The Archive screen displays historical puzzles with premium gating.
 * Free users see 7 days of playable puzzles + locked placeholders for older content.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

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
  /** Play status based on attempt data */
  status: 'play' | 'resume' | 'done';
  /** Score display emoji grid if completed */
  scoreDisplay?: string;
  /** Score value if completed */
  score?: number;
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
 * 'all' shows all game modes, or filter by specific mode.
 */
export type GameModeFilter = 'all' | GameMode;

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
  /** Grouped sections for SectionList */
  sections: ArchiveSection[];
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
