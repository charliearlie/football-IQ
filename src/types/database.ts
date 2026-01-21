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
  updated_at: string | null; // Server's updated_at timestamp for staleness detection
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

/**
 * Ad-unlocked puzzle entry.
 * Tracks puzzles permanently unlocked by watching rewarded ads.
 * Once unlocked, always unlocked (one ad = one puzzle forever).
 */
export interface UnlockedPuzzle {
  puzzle_id: string;
  unlocked_at: string; // ISO timestamp
}

// ============ PLAYER DATABASE TYPES ============

/**
 * Raw player row as stored in SQLite player_database table.
 * Clubs and nationalities are JSON stringified arrays.
 */
export interface LocalPlayer {
  id: string;
  external_id: number | null; // API-Football ID for deduplication
  name: string; // Full display name (e.g., "Zlatan Ibrahimović")
  search_name: string; // Normalized for search (e.g., "zlatan ibrahimovic")
  clubs: string; // JSON array: ["AC Milan", "Inter Milan", "Barcelona"]
  nationalities: string; // JSON array of ISO codes: ["SE", "BA"]
  is_active: number; // SQLite boolean: 0 = inactive, 1 = active
  last_synced_at: string | null;
}

/**
 * Parsed player with proper TypeScript types.
 * Used throughout the app after retrieval from SQLite.
 */
export interface ParsedPlayer {
  id: string;
  externalId: number | null;
  name: string;
  searchName: string;
  clubs: string[];
  nationalities: string[]; // ISO country codes (e.g., "BR", "FR")
  isActive: boolean;
  lastSyncedAt: string | null;
}

/**
 * Search result with relevance ranking.
 * Higher relevanceScore indicates closer match to search query.
 */
export interface PlayerSearchResult {
  player: ParsedPlayer;
  relevanceScore: number; // 0-1, higher is better match
}
