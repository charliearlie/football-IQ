import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import {
  LocalPuzzle,
  LocalAttempt,
  SyncQueueItem,
  ParsedLocalPuzzle,
  ParsedLocalAttempt,
  LocalCatalogEntry,
  UnlockedPuzzle,
  LocalPlayer,
  ParsedPlayer,
} from '@/types/database';

// Re-export types for convenience
export type { LocalCatalogEntry } from '@/types/database';

const DATABASE_NAME = 'football_iq.db';
const SCHEMA_VERSION = 13;

/**
 * SQLite database instance for Football IQ local storage.
 *
 * Provides offline-first data persistence with sync queue
 * for eventual consistency with Supabase backend.
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and run migrations.
 * Must be called before any other database operations.
 * Safe to call multiple times - will only initialize once.
 *
 * @returns The initialized database instance
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  console.log('[Database] initDatabase called');
  if (db) {
    console.log('[Database] Already initialized, returning existing instance');
    return db;
  }

  // expo-sqlite doesn't work on web
  if (Platform.OS === 'web') {
    console.warn('[Database] SQLite not available on web platform');
    return null;
  }

  console.log('[Database] Opening database...');
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.getAllAsync('PRAGMA journal_mode = WAL');
  await db.runAsync('PRAGMA busy_timeout = 5000');
  await runMigrations(db);
  console.log('[Database] Initialization complete');
  return db;
}

/**
 * Get the database instance.
 * Throws if initDatabase() hasn't been called.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Check if the database has been initialized.
 * Use this to guard operations that require the database.
 */
export function isDatabaseReady(): boolean {
  return db !== null;
}

/**
 * Run schema migrations based on user_version pragma.
 * Uses incremental versioning for future schema changes.
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  console.log(`[Database] Current schema version: ${currentVersion}, target: ${SCHEMA_VERSION}`);

  if (currentVersion < 1) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS puzzles (
        id TEXT PRIMARY KEY NOT NULL,
        game_mode TEXT NOT NULL,
        puzzle_date TEXT NOT NULL,
        content TEXT NOT NULL,
        difficulty TEXT,
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY NOT NULL,
        puzzle_id TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        score INTEGER,
        score_display TEXT,
        metadata TEXT,
        started_at TEXT,
        completed_at TEXT,
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_puzzles_date ON puzzles(puzzle_date);
      CREATE INDEX IF NOT EXISTS idx_puzzles_game_mode ON puzzles(game_mode);
      CREATE INDEX IF NOT EXISTS idx_attempts_puzzle_id ON attempts(puzzle_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_synced ON attempts(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);

      PRAGMA user_version = 1;
    `);
  }

  // Migration v2: Add puzzle_catalog table for Archive screen
  if (currentVersion < 2) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS puzzle_catalog (
        id TEXT PRIMARY KEY NOT NULL,
        game_mode TEXT NOT NULL,
        puzzle_date TEXT NOT NULL,
        difficulty TEXT,
        synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_catalog_date ON puzzle_catalog(puzzle_date);
      CREATE INDEX IF NOT EXISTS idx_catalog_game_mode ON puzzle_catalog(game_mode);

      PRAGMA user_version = 2;
    `);
  }

  // Migration v3: Add unlocked_puzzles table for ad-to-unlock feature
  // Unlocks are permanent (one ad = one puzzle forever)
  if (currentVersion < 3) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS unlocked_puzzles (
        puzzle_id TEXT PRIMARY KEY NOT NULL,
        unlocked_at TEXT NOT NULL
      );

      PRAGMA user_version = 3;
    `);
  }

  // Migration v4: Add player_database table for centralized player validation
  // Powers "The Grid" and "Goalscorer Recall" with local-first search
  if (currentVersion < 4) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS player_database (
        id TEXT PRIMARY KEY NOT NULL,
        external_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        search_name TEXT NOT NULL,
        clubs TEXT NOT NULL,
        nationalities TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_player_search_name ON player_database(search_name);
      CREATE INDEX IF NOT EXISTS idx_player_external_id ON player_database(external_id);

      PRAGMA user_version = 4;
    `);
  }

  // Migration v5: Add updated_at column to puzzles table for staleness detection
  // Enables version-aware sync to detect CMS edits and refresh stale cached puzzles
  // NOTE: We intentionally leave updated_at as NULL - light sync handles NULL by
  // treating all such puzzles as potentially stale, triggering a refresh.
  if (currentVersion < 5) {
    await database.execAsync(`
      ALTER TABLE puzzles ADD COLUMN updated_at TEXT;
      PRAGMA user_version = 5;
    `);
  }

  // Migration v6: Reset updated_at to NULL to fix bad v5 migration
  // The original v5 incorrectly set updated_at = synced_at, but synced_at is a
  // LOCAL timestamp (when app synced), not the server's updated_at. This caused
  // staleness detection to fail when users synced AFTER a CMS edit.
  // Setting to NULL forces light sync to re-check all puzzles against the server.
  if (currentVersion < 6) {
    console.log('[Database] Running migration v6: Resetting updated_at to NULL');
    await database.execAsync(`
      UPDATE puzzles SET updated_at = NULL;
      PRAGMA user_version = 6;
    `);
    console.log('[Database] Migration v6 complete');
  }

  // Migration v7: Add player_search_cache table for Oracle autocomplete
  // Mirrors Supabase `players` table for offline-first search
  if (currentVersion < 7) {
    console.log('[Database] Running migration v7: Player search cache');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS player_search_cache (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        search_name TEXT NOT NULL,
        scout_rank INTEGER NOT NULL DEFAULT 0,
        birth_year INTEGER,
        position_category TEXT,
        nationality_code TEXT,
        synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_player_cache_search
        ON player_search_cache (search_name);

      PRAGMA user_version = 7;
    `);
    console.log('[Database] Migration v7 complete');
  }

  // Migration v8: Seed Elite Index from bundled JSON asset
  // Pre-populates player_search_cache with ~4,900 elite players for instant autocomplete.
  // Uses _metadata table to track version for future delta syncs.
  if (currentVersion < 8) {
    console.log('[Database] Running migration v8: Seed Elite Index');

    // Create metadata table for version tracking
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS _metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Only seed if not already seeded (idempotency guard for partial migration recovery)
    const seeded = await database.getFirstAsync<{ value: string }>(
      "SELECT value FROM _metadata WHERE key = 'elite_index_version'"
    );

    if (!seeded) {
      const eliteIndex = require('../../assets/data/elite-index.json');
      await seedEliteIndex(database, eliteIndex.players);

      await database.runAsync(
        "INSERT INTO _metadata (key, value) VALUES ('elite_index_version', $version)",
        { $version: String(eliteIndex.version) }
      );
      console.log(`[Database] Seeded ${eliteIndex.players.length} elite players`);
    }

    await database.execAsync('PRAGMA user_version = 8');
    console.log('[Database] Migration v8 complete');
  }

  // Migration v9: Re-seed Elite Index with corrected nationality codes
  // Fixes 3-letter ISO codes → 2-letter, and GB home nation subdivision codes (GB-ENG, GB-SCT, etc.)
  if (currentVersion < 9) {
    console.log('[Database] Running migration v9: Re-seed Elite Index (nationality fix)');

    const eliteIndex = require('../../assets/data/elite-index.json');
    await seedEliteIndex(database, eliteIndex.players);

    await database.runAsync(
      "INSERT OR REPLACE INTO _metadata (key, value, updated_at) VALUES ('elite_index_version', $version, datetime('now'))",
      { $version: String(eliteIndex.version) }
    );
    console.log(`[Database] Re-seeded ${eliteIndex.players.length} elite players with corrected nationalities`);

    await database.execAsync('PRAGMA user_version = 9');
    console.log('[Database] Migration v9 complete');
  }

  // Migration v10: Add stats_cache column for pre-calculated achievement totals
  // Enables instant Grid validation for trophy/stat categories without graph queries
  if (currentVersion < 10) {
    console.log('[Database] Running migration v10: Add stats_cache to player_search_cache');
    await database.execAsync(`
      ALTER TABLE player_search_cache ADD COLUMN stats_cache TEXT DEFAULT '{}';
      PRAGMA user_version = 10;
    `);
    console.log('[Database] Migration v10 complete');
  }

  // Migration v11: Add is_elite column for tiered on-device storage
  // Top 5,000 players by scout_rank keep full stats_cache; others keep only name + qid to save space
  if (currentVersion < 11) {
    console.log('[Database] Running migration v11: Add is_elite to player_search_cache');
    await database.execAsync(`
      ALTER TABLE player_search_cache ADD COLUMN is_elite INTEGER DEFAULT 0;
    `);

    // Mark top 5000 by scout_rank as elite
    await database.execAsync(`
      UPDATE player_search_cache SET is_elite = 1
      WHERE id IN (
        SELECT id FROM player_search_cache
        ORDER BY scout_rank DESC
        LIMIT 5000
      );
    `);

    // Clear stats_cache for non-elite players to save space
    await database.execAsync(`
      UPDATE player_search_cache SET stats_cache = '{}'
      WHERE is_elite = 0;
    `);

    await database.execAsync('PRAGMA user_version = 11');
    console.log('[Database] Migration v11 complete');
  }

  // Migration v12: Club colors cache for Vector Shield rendering
  if (currentVersion < 12) {
    console.log('[Database] Running migration v12: Club colors cache');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS club_colors (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        primary_color TEXT NOT NULL,
        secondary_color TEXT NOT NULL,
        synced_at TEXT
      );
    `);

    // Seed from bundled elite-index.json if it contains club_colors
    try {
      const eliteIndex = require('../../assets/data/elite-index.json');
      if (Array.isArray(eliteIndex.club_colors) && eliteIndex.club_colors.length > 0) {
        for (const club of eliteIndex.club_colors) {
          await database.runAsync(
            `INSERT OR REPLACE INTO club_colors (id, name, primary_color, secondary_color, synced_at)
             VALUES ($id, $name, $primary, $secondary, datetime('now'))`,
            {
              $id: club.id,
              $name: club.name,
              $primary: club.primary_color,
              $secondary: club.secondary_color,
            }
          );
        }
        console.log(`[Database] Seeded ${eliteIndex.club_colors.length} club colors from bundle`);
      }
    } catch {
      console.log('[Database] No bundled club colors to seed');
    }

    await database.execAsync('PRAGMA user_version = 12');
    console.log('[Database] Migration v12 complete');
  }

  // Migration v13: Special Event support
  // Adds is_special flag and event banner fields to puzzles and catalog tables
  if (currentVersion < 13) {
    console.log('[Database] Running migration v13: Special Event columns');
    await database.execAsync(`
      ALTER TABLE puzzles ADD COLUMN is_special INTEGER DEFAULT 0;
    `);
    await database.execAsync(`
      ALTER TABLE puzzles ADD COLUMN event_title TEXT;
    `);
    await database.execAsync(`
      ALTER TABLE puzzles ADD COLUMN event_subtitle TEXT;
    `);
    await database.execAsync(`
      ALTER TABLE puzzles ADD COLUMN event_tag TEXT;
    `);
    await database.execAsync(`
      ALTER TABLE puzzles ADD COLUMN event_theme TEXT;
    `);
    await database.execAsync(`
      ALTER TABLE puzzle_catalog ADD COLUMN is_special INTEGER DEFAULT 0;
    `);

    await database.execAsync('PRAGMA user_version = 13');
    console.log('[Database] Migration v13 complete');
  }
}

// ============ PUZZLE OPERATIONS ============

/**
 * Save a puzzle to local storage.
 * Uses INSERT OR REPLACE to handle both insert and update.
 */
export async function savePuzzle(puzzle: LocalPuzzle): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO puzzles (id, game_mode, puzzle_date, content, difficulty, synced_at, updated_at, is_special, event_title, event_subtitle, event_tag, event_theme)
     VALUES ($id, $game_mode, $puzzle_date, $content, $difficulty, $synced_at, $updated_at, $is_special, $event_title, $event_subtitle, $event_tag, $event_theme)`,
    {
      $id: puzzle.id,
      $game_mode: puzzle.game_mode,
      $puzzle_date: puzzle.puzzle_date,
      $content: puzzle.content,
      $difficulty: puzzle.difficulty,
      $synced_at: puzzle.synced_at,
      $updated_at: puzzle.updated_at,
      $is_special: puzzle.is_special ?? 0,
      $event_title: puzzle.event_title ?? null,
      $event_subtitle: puzzle.event_subtitle ?? null,
      $event_tag: puzzle.event_tag ?? null,
      $event_theme: puzzle.event_theme ?? null,
    }
  );
}

/**
 * Get a puzzle by ID.
 * Returns parsed puzzle with content as JSON object.
 */
export async function getPuzzle(
  id: string
): Promise<ParsedLocalPuzzle | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalPuzzle>(
    'SELECT * FROM puzzles WHERE id = $id',
    { $id: id }
  );
  return row ? parsePuzzle(row) : null;
}

/**
 * Get a puzzle by date and game mode.
 * Returns parsed puzzle with content as JSON object.
 */
export async function getPuzzleByDateAndMode(
  puzzleDate: string,
  gameMode: string
): Promise<ParsedLocalPuzzle | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalPuzzle>(
    'SELECT * FROM puzzles WHERE puzzle_date = $date AND game_mode = $mode',
    { $date: puzzleDate, $mode: gameMode }
  );
  return row ? parsePuzzle(row) : null;
}

/**
 * Get all puzzles from local storage.
 * Returns parsed puzzles ordered by date descending.
 */
export async function getAllPuzzles(): Promise<ParsedLocalPuzzle[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<LocalPuzzle>(
    'SELECT * FROM puzzles ORDER BY puzzle_date DESC'
  );
  return rows.map(parsePuzzle);
}

/**
 * Get the total number of puzzles in the local database.
 */
export async function getPuzzleCount(): Promise<number> {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM puzzles WHERE is_special = 0'
  );
  return result?.count ?? 0;
}

/**
 * Lightweight timestamp query for staleness detection.
 * Returns only id and updated_at for puzzles in the given date range.
 * Used by light sync to minimize memory usage during foreground checks.
 */
export async function getPuzzleTimestampsForDateRange(
  startDate: string,
  endDate: string
): Promise<{ id: string; updated_at: string | null }[]> {
  const database = getDatabase();
  return database.getAllAsync<{ id: string; updated_at: string | null }>(
    `SELECT id, updated_at FROM puzzles
     WHERE puzzle_date >= $startDate AND puzzle_date <= $endDate`,
    { $startDate: startDate, $endDate: endDate }
  );
}

/**
 * Get all local puzzle IDs.
 * Used for orphan detection during sync.
 */
export async function getAllLocalPuzzleIds(): Promise<string[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<{ id: string }>('SELECT id FROM puzzles');
  return rows.map((r) => r.id);
}

/**
 * Delete puzzles by their IDs.
 * Used to remove orphaned puzzles that no longer exist on server.
 */
export async function deletePuzzlesByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const database = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  const result = await database.runAsync(
    `DELETE FROM puzzles WHERE id IN (${placeholders})`,
    ids
  );
  return result.changes;
}

// ============ ATTEMPT OPERATIONS ============

/**
 * Save an attempt to local storage.
 * Uses INSERT OR REPLACE to handle both insert and update.
 */
export async function saveAttempt(attempt: LocalAttempt): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO attempts
     (id, puzzle_id, completed, score, score_display, metadata, started_at, completed_at, synced)
     VALUES ($id, $puzzle_id, $completed, $score, $score_display, $metadata, $started_at, $completed_at, $synced)`,
    {
      $id: attempt.id,
      $puzzle_id: attempt.puzzle_id,
      $completed: attempt.completed,
      $score: attempt.score,
      $score_display: attempt.score_display,
      $metadata: attempt.metadata,
      $started_at: attempt.started_at,
      $completed_at: attempt.completed_at,
      $synced: attempt.synced,
    }
  );
}

/**
 * Get an attempt by ID.
 * Returns parsed attempt with booleans and JSON metadata.
 */
export async function getAttempt(
  id: string
): Promise<ParsedLocalAttempt | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalAttempt>(
    'SELECT * FROM attempts WHERE id = $id',
    { $id: id }
  );
  return row ? parseAttempt(row) : null;
}

/**
 * Get all attempts for a puzzle.
 * Returns parsed attempts ordered by started_at descending.
 */
export async function getAttemptsByPuzzle(
  puzzleId: string
): Promise<ParsedLocalAttempt[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<LocalAttempt>(
    'SELECT * FROM attempts WHERE puzzle_id = $puzzleId ORDER BY started_at DESC',
    { $puzzleId: puzzleId }
  );
  return rows.map(parseAttempt);
}

/**
 * Get total count of attempts in local database.
 * Used to detect if SQLite is empty (fresh install/reinstall scenario).
 *
 * @returns Total number of attempts stored locally
 */
export async function getAttemptCount(): Promise<number> {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM attempts'
  );
  return result?.count ?? 0;
}

/**
 * Get all attempts that haven't been synced to Supabase.
 */
export async function getUnsyncedAttempts(): Promise<ParsedLocalAttempt[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<LocalAttempt>(
    'SELECT * FROM attempts WHERE synced = 0'
  );
  return rows.map(parseAttempt);
}

/**
 * Get total IQ earned from local unsynced completed attempts.
 * Used to show offline IQ accumulation before sync.
 * This allows the UI to display accumulated IQ immediately after
 * completing a puzzle, even before it syncs to Supabase.
 *
 * @returns Total IQ points from unsynced completed attempts
 */
export async function getUnsyncedIQ(): Promise<number> {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(score), 0) as total
     FROM attempts
     WHERE synced = 0 AND completed = 1 AND score > 0`
  );
  return result?.total ?? 0;
}

/**
 * Get the most recent attempt for a specific puzzle.
 * Used to determine card status (play/resume/done) on Home Screen.
 */
export async function getAttemptByPuzzleId(
  puzzleId: string
): Promise<ParsedLocalAttempt | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalAttempt>(
    'SELECT * FROM attempts WHERE puzzle_id = $puzzleId ORDER BY started_at DESC LIMIT 1',
    { $puzzleId: puzzleId }
  );
  return row ? parseAttempt(row) : null;
}

/**
 * Delete all attempts for a specific puzzle.
 * Used when a puzzle is updated (stale puzzle refresh) to clear
 * any existing progress so the user can play the updated puzzle fresh.
 *
 * @param puzzleId - The puzzle ID to delete attempts for
 * @returns Number of deleted attempts
 */
export async function deleteAttemptsByPuzzleId(puzzleId: string): Promise<number> {
  const database = getDatabase();
  const result = await database.runAsync(
    'DELETE FROM attempts WHERE puzzle_id = $puzzleId',
    { $puzzleId: puzzleId }
  );
  return result.changes;
}

/**
 * Attempt with puzzle date for streak calculation.
 */
export interface AttemptWithPuzzleDate extends ParsedLocalAttempt {
  puzzle_date: string;
}

/**
 * Get all completed attempts with their associated puzzle dates.
 * Used for streak calculation - joins attempts with puzzles to get dates.
 * Only returns completed attempts, ordered by puzzle_date descending.
 */
export async function getAllCompletedAttemptsWithDates(): Promise<
  AttemptWithPuzzleDate[]
> {
  const database = getDatabase();
  const rows = await database.getAllAsync<LocalAttempt & { puzzle_date: string }>(
    `SELECT a.*, p.puzzle_date
     FROM attempts a
     JOIN puzzles p ON a.puzzle_id = p.id
     WHERE a.completed = 1 AND p.is_special = 0
     ORDER BY p.puzzle_date DESC`
  );
  return rows.map((row) => ({
    ...parseAttempt(row),
    puzzle_date: row.puzzle_date,
  }));
}

/**
 * Attempt with puzzle date and game mode for performance stats.
 */
export interface AttemptWithGameMode extends ParsedLocalAttempt {
  puzzle_date: string;
  game_mode: string;
}

/**
 * Get all completed attempts with game mode and puzzle date.
 * Used for My IQ profile stats calculation.
 * Only returns completed attempts, ordered by puzzle_date descending.
 */
export async function getAllCompletedAttemptsWithGameMode(): Promise<
  AttemptWithGameMode[]
> {
  const database = getDatabase();
  const rows = await database.getAllAsync<
    LocalAttempt & { puzzle_date: string; game_mode: string }
  >(
    `SELECT a.*, p.puzzle_date, p.game_mode
     FROM attempts a
     JOIN puzzles p ON a.puzzle_id = p.id
     WHERE a.completed = 1
     ORDER BY p.puzzle_date DESC`
  );
  return rows.map((row) => ({
    ...parseAttempt(row),
    puzzle_date: row.puzzle_date,
    game_mode: row.game_mode,
  }));
}

/**
 * Raw calendar attempt data from SQLite query.
 * Lightweight version for calendar display - only essential fields.
 */
export interface CalendarAttemptRow {
  puzzle_date: string;
  game_mode: string;
  score: number | null;
  metadata: string | null;
}

/**
 * Get completed attempts for calendar display.
 * Returns lightweight data (date, mode, score, metadata) for aggregation.
 * Used by the Streak Calendar component to show daily completion history.
 */
export async function getCalendarAttempts(): Promise<CalendarAttemptRow[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<CalendarAttemptRow>(
    `SELECT p.puzzle_date, p.game_mode, a.score, a.metadata
     FROM attempts a
     JOIN puzzles p ON a.puzzle_id = p.id
     WHERE a.completed = 1
     ORDER BY p.puzzle_date DESC`
  );
  return rows;
}

/**
 * Save an attempt to local storage ONLY if it doesn't already exist.
 * Uses INSERT OR IGNORE to prevent overwriting existing local data.
 *
 * Used during rehydration to avoid overwriting newer local data
 * with potentially stale Supabase data.
 *
 * @param attempt - The attempt to save
 * @returns true if inserted, false if already existed
 */
export async function saveAttemptIfNotExists(attempt: LocalAttempt): Promise<boolean> {
  const database = getDatabase();
  const result = await database.runAsync(
    `INSERT OR IGNORE INTO attempts
     (id, puzzle_id, completed, score, score_display, metadata, started_at, completed_at, synced)
     VALUES ($id, $puzzle_id, $completed, $score, $score_display, $metadata, $started_at, $completed_at, $synced)`,
    {
      $id: attempt.id,
      $puzzle_id: attempt.puzzle_id,
      $completed: attempt.completed,
      $score: attempt.score,
      $score_display: attempt.score_display,
      $metadata: attempt.metadata,
      $started_at: attempt.started_at,
      $completed_at: attempt.completed_at,
      $synced: attempt.synced,
    }
  );
  return result.changes > 0;
}

/**
 * Mark an attempt as synced to Supabase.
 */
export async function markAttemptSynced(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync('UPDATE attempts SET synced = 1 WHERE id = $id', {
    $id: id,
  });
}

/**
 * Delete all attempts for a specific game mode.
 * Useful for clearing stale data after scoring system changes.
 *
 * @param gameMode - The game mode to delete attempts for
 * @returns Number of deleted attempts
 */
export async function deleteAttemptsByGameMode(gameMode: string): Promise<number> {
  const database = getDatabase();

  // First count how many will be deleted
  const countResult = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM attempts a
     JOIN puzzles p ON a.puzzle_id = p.id
     WHERE p.game_mode = $gameMode`,
    { $gameMode: gameMode }
  );
  const count = countResult?.count ?? 0;

  // Delete the attempts
  await database.runAsync(
    `DELETE FROM attempts WHERE puzzle_id IN (
      SELECT id FROM puzzles WHERE game_mode = $gameMode
    )`,
    { $gameMode: gameMode }
  );

  return count;
}

// ============ SYNC QUEUE OPERATIONS ============

/**
 * Add an item to the sync queue.
 * Used to track changes that need to be synced to Supabase.
 */
export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id'>
): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO sync_queue (table_name, record_id, action, payload, created_at)
     VALUES ($table_name, $record_id, $action, $payload, $created_at)`,
    {
      $table_name: item.table_name,
      $record_id: item.record_id,
      $action: item.action,
      $payload: item.payload,
      $created_at: item.created_at,
    }
  );
}

/**
 * Get all items in the sync queue, ordered by creation time.
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = getDatabase();
  return database.getAllAsync<SyncQueueItem>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC'
  );
}

/**
 * Remove an item from the sync queue after successful sync.
 */
export async function removeSyncQueueItem(id: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM sync_queue WHERE id = $id', { $id: id });
}

/**
 * Clear the entire sync queue.
 */
export async function clearSyncQueue(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM sync_queue');
}

// ============ CATALOG OPERATIONS ============

/** Maximum entries per batch to avoid SQLite parameter limits */
const CATALOG_BATCH_SIZE = 50;

/**
 * Save multiple catalog entries to local storage.
 * Uses batched INSERT OR REPLACE for performance.
 *
 * Performance: Batching reduces 365 individual INSERT statements (one year of archive)
 * to just 8 batch statements, significantly reducing SQLite roundtrip overhead.
 *
 * Note: Does not use a transaction to avoid "transaction within transaction"
 * errors when called concurrently from multiple sources (PuzzleContext +
 * Archive hooks). Each INSERT OR REPLACE is atomic and idempotent.
 */
export async function saveCatalogEntries(
  entries: LocalCatalogEntry[]
): Promise<void> {
  if (entries.length === 0) return;

  const database = getDatabase();
  const syncedAt = new Date().toISOString();

  // Batch entries to reduce SQLite roundtrips while staying under parameter limits
  for (let i = 0; i < entries.length; i += CATALOG_BATCH_SIZE) {
    const batch = entries.slice(i, i + CATALOG_BATCH_SIZE);

    // Build parameterized multi-row INSERT
    const placeholders = batch.map((_, idx) => {
      const base = idx * 6; // 6 params per entry
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    }).join(', ');

    // Flatten parameters into positional array
    const params: Record<string, string | number | null> = {};
    batch.forEach((entry, idx) => {
      const base = idx * 6;
      params[`$${base + 1}`] = entry.id;
      params[`$${base + 2}`] = entry.game_mode;
      params[`$${base + 3}`] = entry.puzzle_date;
      params[`$${base + 4}`] = entry.difficulty;
      params[`$${base + 5}`] = syncedAt;
      params[`$${base + 6}`] = entry.is_special ?? 0;
    });

    await database.runAsync(
      `INSERT OR REPLACE INTO puzzle_catalog (id, game_mode, puzzle_date, difficulty, synced_at, is_special)
       VALUES ${placeholders}`,
      params
    );
  }
}

/**
 * Get all catalog entries from local storage.
 * Returns entries ordered by date descending.
 */
export async function getAllCatalogEntries(): Promise<LocalCatalogEntry[]> {
  const database = getDatabase();
  return database.getAllAsync<LocalCatalogEntry>(
    'SELECT * FROM puzzle_catalog ORDER BY puzzle_date DESC'
  );
}

/**
 * Get all catalog entries (available puzzles) for a specific date.
 * Used by Streak Calendar to show available games per day.
 *
 * @param puzzleDate - Date in YYYY-MM-DD format
 * @returns Array of catalog entries for that date
 */
export async function getCatalogEntriesForDate(
  puzzleDate: string
): Promise<LocalCatalogEntry[]> {
  const database = getDatabase();
  return database.getAllAsync<LocalCatalogEntry>(
    `SELECT * FROM puzzle_catalog
     WHERE puzzle_date = $date
     ORDER BY game_mode ASC`,
    { $date: puzzleDate }
  );
}

/**
 * Get catalog entries with pagination and optional game mode filter.
 * Used for Archive screen infinite scroll.
 *
 * @param offset - Number of entries to skip
 * @param limit - Maximum number of entries to return
 * @param gameMode - Optional game mode filter (null for all modes)
 */
export async function getCatalogEntriesPaginated(
  offset: number,
  limit: number,
  gameMode?: string | null
): Promise<LocalCatalogEntry[]> {
  const database = getDatabase();

  // Filter out future-dated puzzles at SQL level to ensure page 0 returns valid data
  if (gameMode) {
    return database.getAllAsync<LocalCatalogEntry>(
      `SELECT * FROM puzzle_catalog
       WHERE game_mode = $gameMode AND puzzle_date <= date('now', 'localtime') AND is_special = 0
       ORDER BY puzzle_date DESC
       LIMIT $limit OFFSET $offset`,
      { $gameMode: gameMode, $limit: limit, $offset: offset }
    );
  }

  return database.getAllAsync<LocalCatalogEntry>(
    `SELECT * FROM puzzle_catalog
     WHERE puzzle_date <= date('now', 'localtime') AND is_special = 0
     ORDER BY puzzle_date DESC
     LIMIT $limit OFFSET $offset`,
    { $limit: limit, $offset: offset }
  );
}

/**
 * Get the total count of catalog entries, with optional game mode filter.
 * Used for pagination calculations. Excludes future-dated puzzles.
 */
export async function getCatalogEntryCount(
  gameMode?: string | null
): Promise<number> {
  const database = getDatabase();

  // Filter out future-dated puzzles to match getCatalogEntriesPaginated
  if (gameMode) {
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM puzzle_catalog
       WHERE game_mode = $gameMode AND puzzle_date <= date('now', 'localtime') AND is_special = 0`,
      { $gameMode: gameMode }
    );
    return result?.count ?? 0;
  }

  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM puzzle_catalog
     WHERE puzzle_date <= date('now', 'localtime') AND is_special = 0`
  );
  return result?.count ?? 0;
}

/**
 * Get catalog entries for incomplete filter.
 * Returns puzzles where:
 * - No attempt exists, OR
 * - Attempt exists with completed=0
 *
 * Excludes future-dated puzzles.
 * Uses LEFT JOIN to include puzzles without attempts.
 *
 * @param offset - Number of entries to skip
 * @param limit - Maximum number of entries to return
 * @returns Array of catalog entries for incomplete puzzles
 */
export async function getCatalogEntriesIncomplete(
  offset: number,
  limit: number
): Promise<LocalCatalogEntry[]> {
  const database = getDatabase();

  return database.getAllAsync<LocalCatalogEntry>(
    `SELECT pc.* FROM puzzle_catalog pc
     LEFT JOIN attempts a ON pc.id = a.puzzle_id
     WHERE pc.puzzle_date <= date('now', 'localtime')
       AND pc.is_special = 0
       AND (a.id IS NULL OR a.completed = 0)
     GROUP BY pc.id
     ORDER BY pc.puzzle_date DESC
     LIMIT $limit OFFSET $offset`,
    { $limit: limit, $offset: offset }
  );
}

/**
 * Get count of incomplete catalog entries.
 * Used for pagination with incomplete filter.
 *
 * @returns Total number of incomplete puzzles
 */
export async function getCatalogEntryCountIncomplete(): Promise<number> {
  const database = getDatabase();

  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT pc.id) as count FROM puzzle_catalog pc
     LEFT JOIN attempts a ON pc.id = a.puzzle_id
     WHERE pc.puzzle_date <= date('now', 'localtime')
       AND pc.is_special = 0
       AND (a.id IS NULL OR a.completed = 0)`
  );
  return result?.count ?? 0;
}

/**
 * Get a random unplayed puzzle respecting premium gating.
 *
 * For non-premium users:
 * - Only puzzles within last 7 days OR with valid ad unlock
 * - Excludes premium-only game modes (career_path_pro, top_tens)
 *
 * For premium users:
 * - Full backlog access, all game modes
 *
 * @param isPremium - Whether user has premium subscription
 * @param freeWindowStartDate - Start of 7-day free window (YYYY-MM-DD)
 * @returns Random unplayed puzzle catalog entry, or null if none available
 */
export async function getRandomUnplayedPuzzle(
  isPremium: boolean,
  freeWindowStartDate: string
): Promise<LocalCatalogEntry | null> {
  const database = getDatabase();

  if (isPremium) {
    // Premium: full backlog, all modes, only incomplete
    return database.getFirstAsync<LocalCatalogEntry>(
      `SELECT pc.* FROM puzzle_catalog pc
       LEFT JOIN attempts a ON pc.id = a.puzzle_id AND a.completed = 1
       WHERE pc.puzzle_date <= date('now', 'localtime')
         AND pc.is_special = 0
         AND a.id IS NULL
       ORDER BY RANDOM()
       LIMIT 1`
    );
  }

  // Non-premium: 7-day window OR ad-unlocked, exclude premium modes
  return database.getFirstAsync<LocalCatalogEntry>(
    `SELECT pc.* FROM puzzle_catalog pc
     LEFT JOIN attempts a ON pc.id = a.puzzle_id AND a.completed = 1
     LEFT JOIN unlocked_puzzles up ON pc.id = up.puzzle_id
     WHERE pc.puzzle_date <= date('now', 'localtime')
       AND a.id IS NULL
       AND pc.is_special = 0
       AND pc.game_mode NOT IN ('career_path_pro', 'top_tens')
       AND (pc.puzzle_date >= $freeWindowStart OR up.puzzle_id IS NOT NULL)
     ORDER BY RANDOM()
     LIMIT 1`,
    { $freeWindowStart: freeWindowStartDate }
  );
}

/**
 * Clear all catalog entries.
 * Used for full resync scenarios.
 */
export async function clearCatalog(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM puzzle_catalog');
}

/**
 * Get all local catalog entry IDs.
 * Used for orphan detection during catalog sync.
 */
export async function getAllLocalCatalogIds(): Promise<string[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<{ id: string }>('SELECT id FROM puzzle_catalog');
  return rows.map((r) => r.id);
}

/**
 * Delete catalog entries by their IDs.
 * Used to remove orphaned entries that no longer exist on server.
 */
export async function deleteCatalogByIds(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const database = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  const result = await database.runAsync(
    `DELETE FROM puzzle_catalog WHERE id IN (${placeholders})`,
    ids
  );
  return result.changes;
}

// ============ AD UNLOCK OPERATIONS ============

/**
 * Save an ad unlock for a puzzle.
 * Grants permanent access to the puzzle after watching a rewarded ad.
 * Uses INSERT OR REPLACE to handle re-unlocking (idempotent).
 *
 * @param puzzleId - The ID of the puzzle to unlock
 */
export async function saveAdUnlock(puzzleId: string): Promise<void> {
  const database = getDatabase();
  const now = new Date();

  await database.runAsync(
    `INSERT OR REPLACE INTO unlocked_puzzles (puzzle_id, unlocked_at)
     VALUES ($puzzle_id, $unlocked_at)`,
    {
      $puzzle_id: puzzleId,
      $unlocked_at: now.toISOString(),
    }
  );
}

/**
 * Check if a puzzle has been unlocked via ad.
 * Unlocks are permanent - once unlocked, always unlocked.
 *
 * @param puzzleId - The ID of the puzzle to check
 * @returns true if the puzzle has been unlocked
 */
export async function isAdUnlocked(puzzleId: string): Promise<boolean> {
  const database = getDatabase();

  const row = await database.getFirstAsync<UnlockedPuzzle>(
    `SELECT * FROM unlocked_puzzles WHERE puzzle_id = $puzzle_id`,
    { $puzzle_id: puzzleId }
  );
  return row !== null;
}

/**
 * Get all ad unlocks.
 * Unlocks are permanent so all entries are valid.
 * Used for reactive state management in AdContext.
 *
 * @returns Array of all unlocked puzzles
 */
export async function getValidAdUnlocks(): Promise<UnlockedPuzzle[]> {
  const database = getDatabase();

  return database.getAllAsync<UnlockedPuzzle>(
    `SELECT * FROM unlocked_puzzles ORDER BY unlocked_at DESC`
  );
}

/**
 * @deprecated No-op function. Unlocks are now permanent and never expire.
 * Kept for backward compatibility with existing code that may call this.
 */
export async function clearExpiredUnlocks(): Promise<void> {
  // No-op: Unlocks are permanent and never expire
}

/**
 * Remove a specific ad unlock.
 * Useful for testing or manual cleanup.
 *
 * @param puzzleId - The ID of the puzzle to remove unlock for
 */
export async function removeAdUnlock(puzzleId: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `DELETE FROM unlocked_puzzles WHERE puzzle_id = $puzzle_id`,
    { $puzzle_id: puzzleId }
  );
}

/**
 * Clear all ad unlocks.
 * Primarily used for testing cleanup.
 */
export async function clearAllAdUnlocks(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM unlocked_puzzles');
}

// ============ PLAYER DATABASE OPERATIONS ============

/**
 * Save a player to local storage.
 * Uses INSERT OR REPLACE to handle both insert and update.
 *
 * @param player - LocalPlayer with clubs and nationalities as JSON strings
 */
export async function savePlayer(player: LocalPlayer): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO player_database
     (id, external_id, name, search_name, clubs, nationalities, is_active, last_synced_at)
     VALUES ($id, $external_id, $name, $search_name, $clubs, $nationalities, $is_active, $last_synced_at)`,
    {
      $id: player.id,
      $external_id: player.external_id,
      $name: player.name,
      $search_name: player.search_name,
      $clubs: player.clubs,
      $nationalities: player.nationalities,
      $is_active: player.is_active,
      $last_synced_at: player.last_synced_at,
    }
  );
}

/** Maximum players per batch to avoid SQLite parameter limits */
const PLAYER_BATCH_SIZE = 50;

/**
 * Save multiple players to local storage in batches.
 * Uses batched INSERT OR REPLACE for performance.
 *
 * @param players - Array of LocalPlayer objects to save
 */
export async function savePlayers(players: LocalPlayer[]): Promise<void> {
  if (players.length === 0) return;

  const database = getDatabase();

  // Batch players to reduce SQLite roundtrips while staying under parameter limits
  for (let i = 0; i < players.length; i += PLAYER_BATCH_SIZE) {
    const batch = players.slice(i, i + PLAYER_BATCH_SIZE);

    // Build parameterized multi-row INSERT
    const placeholders = batch
      .map((_, idx) => {
        const base = idx * 8; // 8 params per player
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
      })
      .join(', ');

    // Flatten parameters into positional object
    const params: Record<string, string | number | null> = {};
    batch.forEach((player, idx) => {
      const base = idx * 8;
      params[`$${base + 1}`] = player.id;
      params[`$${base + 2}`] = player.external_id;
      params[`$${base + 3}`] = player.name;
      params[`$${base + 4}`] = player.search_name;
      params[`$${base + 5}`] = player.clubs;
      params[`$${base + 6}`] = player.nationalities;
      params[`$${base + 7}`] = player.is_active;
      params[`$${base + 8}`] = player.last_synced_at;
    });

    await database.runAsync(
      `INSERT OR REPLACE INTO player_database
       (id, external_id, name, search_name, clubs, nationalities, is_active, last_synced_at)
       VALUES ${placeholders}`,
      params
    );
  }
}

/**
 * Get a player by their database ID.
 *
 * @param id - Player database ID
 * @returns Parsed player or null if not found
 */
export async function getPlayerById(id: string): Promise<ParsedPlayer | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalPlayer>(
    'SELECT * FROM player_database WHERE id = $id',
    { $id: id }
  );
  return row ? parsePlayer(row) : null;
}

/**
 * Get a player by their external API ID.
 * Used to prevent duplicates during sync.
 *
 * @param externalId - API-Football player ID
 * @returns Parsed player or null if not found
 */
export async function getPlayerByExternalId(
  externalId: number
): Promise<ParsedPlayer | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync<LocalPlayer>(
    'SELECT * FROM player_database WHERE external_id = $external_id',
    { $external_id: externalId }
  );
  return row ? parsePlayer(row) : null;
}

/**
 * Get all players from local storage.
 * Primarily used for debugging and testing.
 *
 * @returns Array of all parsed players
 */
export async function getAllPlayers(): Promise<ParsedPlayer[]> {
  const database = getDatabase();
  const rows = await database.getAllAsync<LocalPlayer>(
    'SELECT * FROM player_database ORDER BY name ASC'
  );
  return rows.map(parsePlayer);
}

/**
 * Get the total count of players in the database.
 * Used for debugging and stats.
 *
 * @returns Total number of players
 */
export async function getPlayerCount(): Promise<number> {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM player_database'
  );
  return result?.count ?? 0;
}

/**
 * Delete a player from the database.
 *
 * @param id - Player database ID
 */
export async function deletePlayer(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM player_database WHERE id = $id', {
    $id: id,
  });
}

/**
 * Clear all players from the database.
 * Primarily used for testing cleanup.
 */
export async function clearAllPlayers(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM player_database');
}

/**
 * Parse a player row from SQLite, converting JSON strings to arrays
 * and integers to booleans.
 */
function parsePlayer(row: LocalPlayer): ParsedPlayer {
  let clubs: string[] = [];
  let nationalities: string[] = [];

  try {
    clubs = JSON.parse(row.clubs);
  } catch (error) {
    console.error('Failed to parse player clubs:', row.id, error);
  }

  try {
    nationalities = JSON.parse(row.nationalities);
  } catch (error) {
    console.error('Failed to parse player nationalities:', row.id, error);
  }

  return {
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    searchName: row.search_name,
    clubs,
    nationalities,
    isActive: row.is_active === 1,
    lastSyncedAt: row.last_synced_at,
  };
}

// ============ ELITE INDEX OPERATIONS ============

/** Row shape returned by searchPlayerCache */
export interface CachedPlayer {
  id: string;
  name: string;
  scout_rank: number;
  birth_year: number | null;
  position_category: string | null;
  nationality_code: string | null;
  stats_cache?: string | null;
}

/**
 * Search player_search_cache by name.
 * Returns players sorted by scout_rank (popularity).
 * Used by HybridSearchEngine for local-first search.
 *
 * @param query - Search query (minimum 3 characters)
 * @param limit - Maximum results (default: 10)
 */
export async function searchPlayerCache(
  query: string,
  limit: number = 10
): Promise<CachedPlayer[]> {
  if (!query || query.length < 3) return [];

  const database = getDatabase();
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return database.getAllAsync<CachedPlayer>(
    `SELECT id, name, scout_rank, birth_year, position_category, nationality_code
     FROM player_search_cache
     WHERE search_name LIKE $pattern
     ORDER BY scout_rank DESC, name ASC
     LIMIT $limit`,
    {
      $pattern: `%${normalizedQuery}%`,
      $limit: limit * 2, // Fetch extra for better ranking after client-side sort
    }
  );
}

/**
 * Get pre-calculated achievement stats for a player.
 * Returns the parsed stats_cache JSONB from player_search_cache.
 * Used by Grid validation to check trophy/stat categories instantly.
 *
 * @param playerId - Wikidata QID (e.g., "Q615")
 * @returns Flat map of achievement counts, or empty object if not found
 */
export async function getPlayerStatsCache(
  playerId: string
): Promise<Record<string, number>> {
  try {
    const database = getDatabase();
    const row = await database.getFirstAsync<{ stats_cache: string | null }>(
      'SELECT stats_cache FROM player_search_cache WHERE id = $id',
      { $id: playerId }
    );

    if (!row?.stats_cache) return {};

    const parsed = JSON.parse(row.stats_cache);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Get player nationality code from search cache.
 * Used by Grid validation to check nationality criteria.
 *
 * @param playerId - Wikidata QID (e.g., "Q615")
 * @returns ISO 3166-1 alpha-2 code (e.g., "FR"), or null if not found
 */
export async function getPlayerNationalityFromCache(
  playerId: string
): Promise<string | null> {
  try {
    const database = getDatabase();
    const row = await database.getFirstAsync<{ nationality_code: string | null }>(
      'SELECT nationality_code FROM player_search_cache WHERE id = $id',
      { $id: playerId }
    );
    return row?.nationality_code ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if a player exists in the search cache.
 * Used by Grid validation to verify player QID is valid.
 *
 * @param playerId - Wikidata QID (e.g., "Q615")
 * @returns true if player exists in cache
 */
export async function playerExistsInCache(playerId: string): Promise<boolean> {
  try {
    const database = getDatabase();
    const row = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM player_search_cache WHERE id = $id',
      { $id: playerId }
    );
    return row !== null;
  } catch {
    return false;
  }
}

/**
 * Get elite index version from _metadata.
 * Used by SyncService to check for updates.
 *
 * @returns Current local elite index version, or 0 if not seeded
 */
export async function getEliteIndexVersion(): Promise<number> {
  try {
    const database = getDatabase();
    const result = await database.getFirstAsync<{ value: string }>(
      "SELECT value FROM _metadata WHERE key = 'elite_index_version'"
    );
    return result ? parseInt(result.value, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Update the local elite index version in _metadata.
 * Called by SyncService after a successful delta sync.
 */
export async function setEliteIndexVersion(version: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO _metadata (key, value, updated_at)
     VALUES ('elite_index_version', $version, datetime('now'))`,
    { $version: String(version) }
  );
}

/** Maximum players per batch for elite index seeding */
const ELITE_BATCH_SIZE = 50;

/**
 * Seed elite players into player_search_cache.
 * Uses batched INSERT for performance (~100 batches for 4,900 players).
 */
async function seedEliteIndex(
  database: SQLite.SQLiteDatabase,
  players: Array<{
    id: string;
    name: string;
    search_name: string;
    scout_rank: number;
    birth_year: number | null;
    position_category: string | null;
    nationality_code: string | null;
  }>
): Promise<void> {
  const syncedAt = new Date().toISOString();

  for (let i = 0; i < players.length; i += ELITE_BATCH_SIZE) {
    const batch = players.slice(i, i + ELITE_BATCH_SIZE);

    const placeholders = batch
      .map((_, idx) => {
        const base = idx * 8;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
      })
      .join(', ');

    const params: Record<string, string | number | null> = {};
    batch.forEach((player, idx) => {
      const base = idx * 8;
      params[`$${base + 1}`] = player.id;
      params[`$${base + 2}`] = player.name;
      params[`$${base + 3}`] = player.search_name;
      params[`$${base + 4}`] = player.scout_rank;
      params[`$${base + 5}`] = player.birth_year;
      params[`$${base + 6}`] = player.position_category;
      params[`$${base + 7}`] = player.nationality_code;
      params[`$${base + 8}`] = syncedAt;
    });

    await database.runAsync(
      `INSERT OR REPLACE INTO player_search_cache
       (id, name, search_name, scout_rank, birth_year, position_category, nationality_code, synced_at)
       VALUES ${placeholders}`,
      params
    );
  }
}

/**
 * Batch upsert players into player_search_cache.
 * Used by SyncService for delta updates.
 * Supports optional stats_cache for pre-calculated achievement totals.
 */
/**
 * Update is_elite for recently synced players using a threshold approach.
 * Queries the 5000th-highest scout_rank once, then sets is_elite and
 * clears stats_cache only for the provided player IDs — no full-table scan.
 *
 * @param playerIds - QIDs of players that were just upserted in this sync delta
 */
export async function recalculateEliteStatus(playerIds?: string[]): Promise<void> {
  const database = getDatabase();

  // Find the scout_rank at position 5000 (the elite cutoff)
  const threshold = await database.getFirstAsync<{ scout_rank: number }>(
    `SELECT scout_rank FROM player_search_cache
     ORDER BY scout_rank DESC
     LIMIT 1 OFFSET 4999`
  );

  // If fewer than 5000 players exist, everyone is elite
  // Coerce to number to ensure it's safe for parameterized queries
  const cutoff = Number(threshold?.scout_rank ?? 0);

  if (playerIds && playerIds.length > 0) {
    // Only update the delta rows — avoids touching the whole table
    for (let i = 0; i < playerIds.length; i += ELITE_BATCH_SIZE) {
      const batch = playerIds.slice(i, i + ELITE_BATCH_SIZE);
      const cutoffParamIdx = batch.length + 1;
      const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(', ');
      const params: Record<string, string | number> = {};
      batch.forEach((id, idx) => { params[`$${idx + 1}`] = id; });
      params[`$${cutoffParamIdx}`] = cutoff;

      // Mark elite/non-elite based on threshold
      await database.runAsync(
        `UPDATE player_search_cache
         SET is_elite = CASE WHEN scout_rank >= $${cutoffParamIdx} THEN 1 ELSE 0 END
         WHERE id IN (${placeholders})`,
        params
      );

      // Clear stats_cache for newly non-elite players in this batch
      await database.runAsync(
        `UPDATE player_search_cache
         SET stats_cache = '{}'
         WHERE id IN (${placeholders}) AND is_elite = 0`,
        params
      );
    }
  } else {
    // Full recalc fallback (migration or manual trigger)
    await database.runAsync(
      `UPDATE player_search_cache
       SET is_elite = CASE WHEN scout_rank >= $1 THEN 1 ELSE 0 END`,
      { $1: cutoff }
    );
    await database.runAsync(
      `UPDATE player_search_cache SET stats_cache = '{}' WHERE is_elite = 0`,
      {}
    );
  }
}

export async function upsertPlayerCache(
  players: Array<{
    id: string;
    name: string;
    search_name: string;
    scout_rank: number;
    birth_year: number | null;
    position_category: string | null;
    nationality_code: string | null;
    stats_cache?: Record<string, number> | string | null;
  }>
): Promise<void> {
  if (players.length === 0) return;

  const database = getDatabase();
  const syncedAt = new Date().toISOString();

  for (let i = 0; i < players.length; i += ELITE_BATCH_SIZE) {
    const batch = players.slice(i, i + ELITE_BATCH_SIZE);

    const placeholders = batch
      .map((_, idx) => {
        const base = idx * 9;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
      })
      .join(', ');

    const params: Record<string, string | number | null> = {};
    batch.forEach((player, idx) => {
      const base = idx * 9;
      params[`$${base + 1}`] = player.id;
      params[`$${base + 2}`] = player.name;
      params[`$${base + 3}`] = player.search_name;
      params[`$${base + 4}`] = player.scout_rank;
      params[`$${base + 5}`] = player.birth_year;
      params[`$${base + 6}`] = player.position_category;
      params[`$${base + 7}`] = player.nationality_code;
      params[`$${base + 8}`] = syncedAt;
      // stats_cache: serialize object to JSON string, pass through strings, default to '{}'
      const sc = player.stats_cache;
      params[`$${base + 9}`] =
        sc == null ? '{}' : typeof sc === 'string' ? sc : JSON.stringify(sc);
    });

    await database.runAsync(
      `INSERT OR REPLACE INTO player_search_cache
       (id, name, search_name, scout_rank, birth_year, position_category, nationality_code, synced_at, stats_cache)
       VALUES ${placeholders}`,
      params
    );
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Parse a puzzle row from SQLite, converting JSON string to object.
 */
function parsePuzzle(row: LocalPuzzle): ParsedLocalPuzzle {
  try {
    return {
      ...row,
      content: JSON.parse(row.content),
    };
  } catch (error) {
    console.error('Failed to parse puzzle content:', row.id, error);
    return {
      ...row,
      content: {}, // Return empty object as fallback
    };
  }
}

/**
 * Parse an attempt row from SQLite, converting integers to booleans
 * and JSON string to object.
 */
function parseAttempt(row: LocalAttempt): ParsedLocalAttempt {
  let parsedMetadata: unknown | null = null;
  if (row.metadata) {
    try {
      parsedMetadata = JSON.parse(row.metadata);
    } catch (error) {
      console.error('Failed to parse attempt metadata:', row.id, error);
    }
  }

  return {
    ...row,
    metadata: parsedMetadata,
    completed: row.completed === 1,
    synced: row.synced === 1,
  };
}

/**
 * Stringify helper for saving JSON fields.
 */
export function stringifyContent(content: unknown): string {
  return JSON.stringify(content);
}

// ============ CLUB COLORS ============

export interface ClubColor {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
}

/**
 * Upsert club colors into local cache.
 */
export async function upsertClubColors(
  clubs: ClubColor[]
): Promise<void> {
  if (clubs.length === 0) return;
  const database = getDatabase();
  const syncedAt = new Date().toISOString();

  for (const club of clubs) {
    await database.runAsync(
      `INSERT OR REPLACE INTO club_colors (id, name, primary_color, secondary_color, synced_at)
       VALUES ($id, $name, $primary, $secondary, $synced)`,
      {
        $id: club.id,
        $name: club.name,
        $primary: club.primary_color,
        $secondary: club.secondary_color,
        $synced: syncedAt,
      }
    );
  }
}

/**
 * Get all club colors from local cache.
 */
export async function getClubColors(): Promise<ClubColor[]> {
  const database = getDatabase();
  return database.getAllAsync<ClubColor>(
    'SELECT id, name, primary_color, secondary_color FROM club_colors'
  );
}

/**
 * Get club colors by club name (case-insensitive LIKE match).
 * Used by Grid CategoryHeader to enrich club categories with shield colors.
 */
export async function getClubColorByName(
  clubName: string
): Promise<ClubColor | null> {
  const database = getDatabase();
  const result = await database.getFirstAsync<ClubColor>(
    'SELECT id, name, primary_color, secondary_color FROM club_colors WHERE name LIKE $pattern',
    { $pattern: `%${clubName}%` }
  );
  return result ?? null;
}

/**
 * Get club color by Wikidata ID.
 * Used by ClubSearchEngine for nickname lookups.
 */
export async function getClubColorById(
  clubId: string
): Promise<ClubColor | null> {
  const database = getDatabase();
  const result = await database.getFirstAsync<ClubColor>(
    'SELECT id, name, primary_color, secondary_color FROM club_colors WHERE id = $id',
    { $id: clubId }
  );
  return result ?? null;
}

/**
 * Search club colors by name (fuzzy match).
 * Used by ClubSearchEngine for local search.
 *
 * @param query - Search query (minimum 2 characters)
 * @param limit - Maximum results to return
 * @returns Clubs sorted by name match quality (prefix matches first)
 */
export async function searchClubColors(
  query: string,
  limit: number = 10
): Promise<ClubColor[]> {
  if (!query || query.length < 2) return [];

  const database = getDatabase();
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Search with prefix priority ordering
  return database.getAllAsync<ClubColor>(
    `SELECT id, name, primary_color, secondary_color
     FROM club_colors
     WHERE LOWER(name) LIKE $pattern
        OR LOWER(
             REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, 'ü', 'u'), 'ö', 'o'), 'ä', 'a'), 'é', 'e'), 'ñ', 'n')
           ) LIKE $pattern
     ORDER BY
       CASE WHEN LOWER(name) LIKE $prefix THEN 0 ELSE 1 END,
       LENGTH(name) ASC
     LIMIT $limit`,
    {
      $pattern: `%${normalizedQuery}%`,
      $prefix: `${normalizedQuery}%`,
      $limit: limit,
    }
  );
}

/**
 * Close the database connection.
 * Primarily used for testing cleanup.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

/**
 * Clear all user data from the local database.
 * Used when user requests to delete their data.
 */
export async function clearAllLocalData(): Promise<void> {
  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM attempts;
    DELETE FROM puzzles;
    DELETE FROM puzzle_catalog;
    DELETE FROM unlocked_puzzles;
    DELETE FROM player_database;
    DELETE FROM player_search_cache;
    DELETE FROM sync_queue;
  `);
}
