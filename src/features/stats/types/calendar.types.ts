/**
 * Type definitions for the Streak Calendar feature.
 *
 * Displays daily completion history with 3D depth cells,
 * organized by month with premium gating for historical data.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Completion status for a single game mode on a specific day.
 */
export interface GameModeCompletion {
  /** The game mode identifier */
  gameMode: GameMode;
  /** Whether this mode was completed on the day */
  completed: boolean;
  /** IQ earned from this mode (extracted from score metadata) */
  iqEarned: number;
}

/**
 * Single day in the calendar with completion data.
 */
export interface CalendarDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Number of games completed (0-6) */
  count: number;
  /** Total IQ earned this day */
  totalIQ: number;
  /** Breakdown by game mode */
  gameModes: GameModeCompletion[];
}

/**
 * Month container with aggregated data and streak info.
 */
export interface CalendarMonth {
  /** Month key for identification (e.g., "2026-01") */
  monthKey: string;
  /** Display name (e.g., "January 2026") */
  monthName: string;
  /** Year (for sorting/grouping) */
  year: number;
  /** Month number 1-12 */
  month: number;
  /** Days in this month with data (sparse - only days with attempts) */
  days: CalendarDay[];
  /** Longest streak within this month (for flame icon) */
  longestStreak: number;
  /** Total IQ earned this month */
  totalIQ: number;
  /** Week indices (0-based) that are "perfect" (Mon-Sun all have completions) */
  perfectWeeks: number[];
}

/**
 * Calendar data returned by useStreakCalendar hook.
 */
export interface CalendarData {
  /** Months ordered by recency (current month first) */
  months: CalendarMonth[];
  /** Overall longest streak across all time */
  overallLongestStreak: number;
  /** Overall total IQ earned */
  overallTotalIQ: number;
}

/**
 * Position of a cell for tooltip placement.
 */
export interface CellPosition {
  /** X coordinate relative to calendar container */
  x: number;
  /** Y coordinate relative to calendar container */
  y: number;
  /** Cell width */
  width: number;
  /** Cell height */
  height: number;
}

/**
 * Cell intensity level based on game count.
 * Determines visual styling (color opacity).
 */
export type CellIntensity = 'empty' | 'low' | 'high';

/**
 * Return type for useStreakCalendar hook.
 */
export interface UseStreakCalendarResult {
  /** Calendar data or null if loading */
  data: CalendarData | null;
  /** Whether data is being fetched */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refresh data from database */
  refresh: () => Promise<void>;
}

/**
 * Raw attempt data from SQLite query for calendar aggregation.
 */
export interface CalendarAttempt {
  /** Date of the puzzle (YYYY-MM-DD) */
  puzzle_date: string;
  /** Game mode identifier */
  game_mode: string;
  /** Score achieved (may be null) */
  score: number | null;
  /** JSON metadata containing detailed score info */
  metadata: string | null;
}
