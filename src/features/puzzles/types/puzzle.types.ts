/**
 * Type definitions for the Puzzle feature.
 *
 * These types support the sync engine that bridges Supabase (cloud)
 * and SQLite (local) for offline-first puzzle data.
 */

import { Tables, TablesInsert } from '@/types/supabase';
import { ParsedLocalPuzzle, ParsedLocalAttempt, LocalPuzzle } from '@/types/database';

/**
 * Supabase puzzle row type (from RLS-filtered query)
 */
export type SupabasePuzzle = Tables<'daily_puzzles'>;

/**
 * Supabase attempt row type
 */
export type SupabaseAttempt = Tables<'puzzle_attempts'>;

/**
 * Supabase attempt insert type
 */
export type SupabaseAttemptInsert = TablesInsert<'puzzle_attempts'>;

/**
 * Sync status for UI feedback
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Game mode types (matches Supabase game_mode values)
 */
export type GameMode =
  | 'career_path'
  | 'career_path_pro'
  | 'tic_tac_toe'
  | 'the_grid'
  | 'guess_the_transfer'
  | 'guess_the_goalscorers'
  | 'topical_quiz'
  | 'top_tens'
  | 'starting_xi';

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  error?: Error;
  syncedCount?: number;
}

/**
 * Options for puzzle sync from Supabase
 */
export interface PuzzleSyncOptions {
  /** User ID (from auth) */
  userId: string | null;
  /** Whether user is premium (affects incremental sync) */
  isPremium: boolean;
  /** Last successful sync timestamp (for incremental sync) */
  lastSyncedAt: string | null;
}

/**
 * Puzzle state managed by context
 */
export interface PuzzleState {
  puzzles: ParsedLocalPuzzle[];
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  error: Error | null;
  /** Whether local puzzles have been loaded from SQLite at least once */
  hasHydrated: boolean;
}

/**
 * Puzzle context value with state and actions
 */
export interface PuzzleContextValue extends PuzzleState {
  /** Fetch puzzles from Supabase and store locally */
  syncPuzzles: () => Promise<SyncResult>;
  /** Sync local attempts to Supabase */
  syncAttempts: () => Promise<SyncResult>;
  /** Refresh puzzle list from local SQLite */
  refreshLocalPuzzles: () => Promise<void>;
}

/**
 * Return type for usePuzzle hook
 */
export interface UsePuzzleResult {
  puzzle: ParsedLocalPuzzle | null;
  isLoading: boolean;
  refetch: () => Promise<SyncResult>;
}

// Re-export commonly used types
export type { ParsedLocalPuzzle, ParsedLocalAttempt, LocalPuzzle };
