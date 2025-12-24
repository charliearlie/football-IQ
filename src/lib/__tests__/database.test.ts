import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  getDatabase,
  closeDatabase,
  savePuzzle,
  getPuzzle,
  getPuzzleByDateAndMode,
  saveAttempt,
  getAttempt,
  getAttemptsByPuzzle,
  getUnsyncedAttempts,
  markAttemptSynced,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  clearSyncQueue,
} from '../database';
import { LocalPuzzle, LocalAttempt } from '@/types/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('database', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  describe('initDatabase', () => {
    it('creates database and runs migrations when version is 0', async () => {
      // Arrange - return version 0 to trigger migration
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 0 });

      // Act
      await initDatabase();

      // Assert
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('football_iq.db');
      expect(mockDb.execAsync).toHaveBeenCalled();

      // Verify migration SQL includes table creation
      const execCall = mockDb.execAsync.mock.calls[0][0];
      expect(execCall).toContain('CREATE TABLE IF NOT EXISTS puzzles');
      expect(execCall).toContain('CREATE TABLE IF NOT EXISTS attempts');
      expect(execCall).toContain('CREATE TABLE IF NOT EXISTS sync_queue');
      expect(execCall).toContain('PRAGMA user_version = 1');
    });

    it('skips migration if already at current version', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });

      // Act
      await initDatabase();

      // Assert
      expect(mockDb.execAsync).not.toHaveBeenCalled();
    });

    it('returns same instance on subsequent calls', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValue({ user_version: 1 });

      // Act
      const db1 = await initDatabase();
      const db2 = await initDatabase();

      // Assert
      expect(db1).toBe(db2);
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDatabase', () => {
    it('throws if not initialized', () => {
      expect(() => getDatabase()).toThrow('Database not initialized');
    });

    it('returns database after initialization', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });
      await initDatabase();
      expect(() => getDatabase()).not.toThrow();
    });
  });

  describe('puzzle operations', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });
      await initDatabase();
    });

    it('saves a puzzle with INSERT OR REPLACE', async () => {
      // Arrange
      const puzzle: LocalPuzzle = {
        id: 'puzzle-123',
        game_mode: 'mystery_player',
        puzzle_date: '2024-01-15',
        content: JSON.stringify({ clues: ['Clue 1', 'Clue 2'] }),
        difficulty: 'medium',
        synced_at: new Date().toISOString(),
      };

      // Act
      await savePuzzle(puzzle);

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO puzzles'),
        expect.objectContaining({ $id: 'puzzle-123' })
      );
    });

    it('retrieves a puzzle by id with parsed JSON content', async () => {
      // Arrange
      const mockRow: LocalPuzzle = {
        id: 'puzzle-123',
        game_mode: 'mystery_player',
        puzzle_date: '2024-01-15',
        content: '{"clues":["Clue 1","Clue 2"]}',
        difficulty: 'medium',
        synced_at: null,
      };
      mockDb.getFirstAsync.mockResolvedValueOnce(mockRow);

      // Act
      const result = await getPuzzle('puzzle-123');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe('puzzle-123');
      expect(result!.content).toEqual({ clues: ['Clue 1', 'Clue 2'] }); // Parsed JSON
    });

    it('returns null for non-existent puzzle', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      // Act
      const result = await getPuzzle('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('retrieves puzzle by date and game mode', async () => {
      // Arrange
      const mockRow: LocalPuzzle = {
        id: 'puzzle-456',
        game_mode: 'tic_tac_toe',
        puzzle_date: '2024-01-16',
        content: '{"grid":[]}',
        difficulty: 'hard',
        synced_at: null,
      };
      mockDb.getFirstAsync.mockResolvedValueOnce(mockRow);

      // Act
      const result = await getPuzzleByDateAndMode('2024-01-16', 'tic_tac_toe');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe('puzzle-456');
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('puzzle_date'),
        expect.objectContaining({ $date: '2024-01-16', $mode: 'tic_tac_toe' })
      );
    });
  });

  describe('attempt operations', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });
      await initDatabase();
    });

    it('saves an attempt with all fields', async () => {
      // Arrange
      const attempt: LocalAttempt = {
        id: 'attempt-123',
        puzzle_id: 'puzzle-123',
        completed: 1,
        score: 85,
        score_display: '85%',
        metadata: JSON.stringify({ guesses: 3 }),
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: 0,
      };

      // Act
      await saveAttempt(attempt);

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO attempts'),
        expect.objectContaining({
          $id: 'attempt-123',
          $puzzle_id: 'puzzle-123',
          $completed: 1,
          $synced: 0,
        })
      );
    });

    it('retrieves attempt with parsed boolean and JSON fields', async () => {
      // Arrange
      const mockRow: LocalAttempt = {
        id: 'attempt-123',
        puzzle_id: 'puzzle-123',
        completed: 1,
        score: 85,
        score_display: '85%',
        metadata: '{"guesses":3}',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
        synced: 0,
      };
      mockDb.getFirstAsync.mockResolvedValueOnce(mockRow);

      // Act
      const result = await getAttempt('attempt-123');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.completed).toBe(true); // Converted from 1
      expect(result!.synced).toBe(false); // Converted from 0
      expect(result!.metadata).toEqual({ guesses: 3 }); // Parsed JSON
    });

    it('handles null metadata gracefully', async () => {
      // Arrange
      const mockRow: LocalAttempt = {
        id: 'attempt-456',
        puzzle_id: 'puzzle-123',
        completed: 0,
        score: null,
        score_display: null,
        metadata: null,
        started_at: null,
        completed_at: null,
        synced: 0,
      };
      mockDb.getFirstAsync.mockResolvedValueOnce(mockRow);

      // Act
      const result = await getAttempt('attempt-456');

      // Assert
      expect(result).not.toBeNull();
      expect(result!.metadata).toBeNull();
      expect(result!.completed).toBe(false);
    });

    it('retrieves all attempts for a puzzle', async () => {
      // Arrange
      const mockRows: LocalAttempt[] = [
        {
          id: 'attempt-1',
          puzzle_id: 'puzzle-123',
          completed: 1,
          score: 100,
          score_display: '100%',
          metadata: null,
          started_at: '2024-01-15T10:00:00Z',
          completed_at: '2024-01-15T10:01:00Z',
          synced: 1,
        },
        {
          id: 'attempt-2',
          puzzle_id: 'puzzle-123',
          completed: 0,
          score: null,
          score_display: null,
          metadata: null,
          started_at: '2024-01-15T11:00:00Z',
          completed_at: null,
          synced: 0,
        },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(mockRows);

      // Act
      const results = await getAttemptsByPuzzle('puzzle-123');

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].completed).toBe(true);
      expect(results[1].completed).toBe(false);
    });

    it('retrieves only unsynced attempts', async () => {
      // Arrange
      const mockRows: LocalAttempt[] = [
        {
          id: 'attempt-1',
          puzzle_id: 'puzzle-1',
          completed: 1,
          score: 100,
          score_display: '100%',
          metadata: null,
          started_at: null,
          completed_at: null,
          synced: 0,
        },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(mockRows);

      // Act
      const results = await getUnsyncedAttempts();

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].synced).toBe(false);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE synced = 0')
      );
    });

    it('marks attempt as synced', async () => {
      // Act
      await markAttemptSynced('attempt-123');

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE attempts SET synced = 1'),
        { $id: 'attempt-123' }
      );
    });
  });

  describe('sync queue operations', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });
      await initDatabase();
    });

    it('adds item to sync queue', async () => {
      // Arrange
      const item = {
        table_name: 'attempts' as const,
        record_id: 'attempt-123',
        action: 'INSERT' as const,
        payload: JSON.stringify({ score: 85 }),
        created_at: new Date().toISOString(),
      };

      // Act
      await addToSyncQueue(item);

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sync_queue'),
        expect.objectContaining({
          $table_name: 'attempts',
          $action: 'INSERT',
        })
      );
    });

    it('retrieves sync queue ordered by created_at', async () => {
      // Arrange
      const mockItems = [
        {
          id: 1,
          table_name: 'attempts',
          record_id: 'attempt-1',
          action: 'INSERT',
          payload: '{}',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          table_name: 'puzzles',
          record_id: 'puzzle-1',
          action: 'UPDATE',
          payload: '{}',
          created_at: '2024-01-15T10:01:00Z',
        },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(mockItems);

      // Act
      const results = await getSyncQueue();

      // Assert
      expect(results).toHaveLength(2);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at ASC')
      );
    });

    it('removes item from sync queue by id', async () => {
      // Act
      await removeSyncQueueItem(1);

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sync_queue WHERE id'),
        { $id: 1 }
      );
    });

    it('clears entire sync queue', async () => {
      // Act
      await clearSyncQueue();

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM sync_queue');
    });
  });

  describe('closeDatabase', () => {
    it('closes the database connection', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });
      await initDatabase();

      // Act
      await closeDatabase();

      // Assert
      expect(mockDb.closeAsync).toHaveBeenCalled();
    });

    it('resets the database instance to null', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 1 });
      await initDatabase();

      // Act
      await closeDatabase();

      // Assert - should throw because db is now null
      expect(() => getDatabase()).toThrow('Database not initialized');
    });
  });
});
