/**
 * Puzzles Feature
 *
 * Provides offline-first puzzle data management with sync between
 * Supabase (cloud) and SQLite (local).
 */

// Context and Provider
export { PuzzleProvider, usePuzzleContext } from './context/PuzzleContext';

// Hooks
export { usePuzzle } from './hooks/usePuzzle';

// Services (for direct use if needed)
export { syncPuzzlesFromSupabase } from './services/puzzleSyncService';
export { syncAttemptsToSupabase } from './services/attemptSyncService';

// Types
export type {
  SyncStatus,
  GameMode,
  SyncResult,
  PuzzleContextValue,
  UsePuzzleResult,
  PuzzleSyncOptions,
  SupabasePuzzle,
  SupabaseAttempt,
} from './types/puzzle.types';
