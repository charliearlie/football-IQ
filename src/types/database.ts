/**
 * Local SQLite schema types for offline storage.
 *
 * These types represent the local SQLite tables used for offline-first
 * data persistence. Content and metadata fields are JSON stringified
 * for storage and parsed upon retrieval.
 */

/**
 * Raw puzzle row as stored in SQLite.
 * Content is JSON stringified.
 */
export interface LocalPuzzle {
  id: string;
  game_mode: string;
  puzzle_date: string;
  content: string; // JSON stringified puzzle content
  difficulty: string | null;
  synced_at: string | null;
}

/**
 * Raw attempt row as stored in SQLite.
 * Uses INTEGER (0/1) for booleans, JSON string for metadata.
 */
export interface LocalAttempt {
  id: string;
  puzzle_id: string;
  completed: number; // SQLite boolean: 0 = false, 1 = true
  score: number | null;
  score_display: string | null;
  metadata: string | null; // JSON stringified
  started_at: string | null;
  completed_at: string | null;
  synced: number; // SQLite boolean: 0 = not synced, 1 = synced
}

/**
 * Sync queue item for tracking changes to sync back to Supabase.
 */
export interface SyncQueueItem {
  id?: number; // AUTOINCREMENT
  table_name: 'puzzles' | 'attempts';
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string; // JSON stringified
  created_at: string;
}

/**
 * Parsed puzzle with content as actual JSON object.
 */
export interface ParsedLocalPuzzle extends Omit<LocalPuzzle, 'content'> {
  content: unknown;
}

/**
 * Parsed attempt with booleans and metadata properly typed.
 */
export interface ParsedLocalAttempt
  extends Omit<LocalAttempt, 'metadata' | 'completed' | 'synced'> {
  metadata: unknown | null;
  completed: boolean;
  synced: boolean;
}

/**
 * Catalog entry for puzzle metadata (used for Archive screen).
 * Lightweight metadata without content, synced separately from full puzzles.
 * Allows showing "locked" placeholders for premium puzzles.
 */
export interface LocalCatalogEntry {
  id: string;
  game_mode: string;
  puzzle_date: string;
  difficulty: string | null;
  synced_at: string | null;
}
