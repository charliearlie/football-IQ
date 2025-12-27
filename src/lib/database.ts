import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import {
  LocalPuzzle,
  LocalAttempt,
  SyncQueueItem,
  ParsedLocalPuzzle,
  ParsedLocalAttempt,
} from '@/types/database';

const DATABASE_NAME = 'football_iq.db';
const SCHEMA_VERSION = 1;

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
  if (db) return db;

  // expo-sqlite doesn't work on web
  if (Platform.OS === 'web') {
    console.warn('SQLite not available on web platform');
    return null;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await runMigrations(db);
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
 * Run schema migrations based on user_version pragma.
 * Uses incremental versioning for future schema changes.
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

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

  // Future migrations would go here:
  // if (currentVersion < 2) { ... }
}

// ============ PUZZLE OPERATIONS ============

/**
 * Save a puzzle to local storage.
 * Uses INSERT OR REPLACE to handle both insert and update.
 */
export async function savePuzzle(puzzle: LocalPuzzle): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO puzzles (id, game_mode, puzzle_date, content, difficulty, synced_at)
     VALUES ($id, $game_mode, $puzzle_date, $content, $difficulty, $synced_at)`,
    {
      $id: puzzle.id,
      $game_mode: puzzle.game_mode,
      $puzzle_date: puzzle.puzzle_date,
      $content: puzzle.content,
      $difficulty: puzzle.difficulty,
      $synced_at: puzzle.synced_at,
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
     WHERE a.completed = 1
     ORDER BY p.puzzle_date DESC`
  );
  return rows.map((row) => ({
    ...parseAttempt(row),
    puzzle_date: row.puzzle_date,
  }));
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
