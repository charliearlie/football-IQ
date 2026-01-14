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

const DATABASE_NAME = 'football_iq.db';
const SCHEMA_VERSION = 4;

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

  // Future migrations would go here:
  // if (currentVersion < 5) { ... }
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
      const base = idx * 5; // 5 params per entry
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');

    // Flatten parameters into positional array
    const params: Record<string, string | null> = {};
    batch.forEach((entry, idx) => {
      const base = idx * 5;
      params[`$${base + 1}`] = entry.id;
      params[`$${base + 2}`] = entry.game_mode;
      params[`$${base + 3}`] = entry.puzzle_date;
      params[`$${base + 4}`] = entry.difficulty;
      params[`$${base + 5}`] = syncedAt;
    });

    await database.runAsync(
      `INSERT OR REPLACE INTO puzzle_catalog (id, game_mode, puzzle_date, difficulty, synced_at)
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
       WHERE game_mode = $gameMode AND puzzle_date <= date('now', 'localtime')
       ORDER BY puzzle_date DESC
       LIMIT $limit OFFSET $offset`,
      { $gameMode: gameMode, $limit: limit, $offset: offset }
    );
  }

  return database.getAllAsync<LocalCatalogEntry>(
    `SELECT * FROM puzzle_catalog
     WHERE puzzle_date <= date('now', 'localtime')
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
       WHERE game_mode = $gameMode AND puzzle_date <= date('now', 'localtime')`,
      { $gameMode: gameMode }
    );
    return result?.count ?? 0;
  }

  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM puzzle_catalog
     WHERE puzzle_date <= date('now', 'localtime')`
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
       AND (a.id IS NULL OR a.completed = 0)`
  );
  return result?.count ?? 0;
}

/**
 * Clear all catalog entries.
 * Used for full resync scenarios.
 */
export async function clearCatalog(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM puzzle_catalog');
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
