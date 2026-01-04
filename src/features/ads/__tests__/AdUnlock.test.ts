/**
 * Ad Unlock Tests
 *
 * TDD tests for the ad-to-unlock feature.
 * Tests database operations for permanent puzzle unlocks.
 * One ad = one puzzle forever.
 */

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  closeDatabase,
  saveAdUnlock,
  isAdUnlocked,
  getValidAdUnlocks,
  clearExpiredUnlocks,
  removeAdUnlock,
  clearAllAdUnlocks,
} from '@/lib/database';
import { UnlockedPuzzle } from '@/types/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Ad Unlock Feature', () => {
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

  describe('Database Migration', () => {
    it('creates unlocked_puzzles table in migration v3', async () => {
      // Arrange - version 2 to trigger v3 migration
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 2 });

      // Act
      await initDatabase();

      // Assert
      const execCall = mockDb.execAsync.mock.calls[0][0];
      expect(execCall).toContain('CREATE TABLE IF NOT EXISTS unlocked_puzzles');
      expect(execCall).toContain('puzzle_id TEXT PRIMARY KEY NOT NULL');
      expect(execCall).toContain('unlocked_at TEXT NOT NULL');
      expect(execCall).toContain('PRAGMA user_version = 3');
    });

    it('skips migration if already at version 3', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });

      // Act
      await initDatabase();

      // Assert
      expect(mockDb.execAsync).not.toHaveBeenCalled();
    });
  });

  describe('saveAdUnlock', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('saves unlock with correct puzzle_id', async () => {
      // Act
      await saveAdUnlock('puzzle-123');

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO unlocked_puzzles'),
        expect.objectContaining({ $puzzle_id: 'puzzle-123' })
      );
    });

    it('saves unlock with ISO timestamp for unlocked_at', async () => {
      // Arrange
      const beforeTime = new Date();

      // Act
      await saveAdUnlock('puzzle-123');

      // Assert
      const callArgs = mockDb.runAsync.mock.calls[0][1];
      const unlockedAt = new Date(callArgs.$unlocked_at);

      // Should be a valid ISO timestamp close to now
      expect(unlockedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(unlockedAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('does not set expiry - unlock is permanent', async () => {
      // Act
      await saveAdUnlock('puzzle-123');

      // Assert
      const callArgs = mockDb.runAsync.mock.calls[0][1];
      expect(callArgs.$expires_at).toBeUndefined();
    });

    it('uses INSERT OR REPLACE to allow re-unlocking (idempotent)', async () => {
      // Act
      await saveAdUnlock('puzzle-123');

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.any(Object)
      );
    });
  });

  describe('isAdUnlocked', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('returns true when unlock exists', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({
        puzzle_id: 'puzzle-123',
        unlocked_at: new Date().toISOString(),
      });

      // Act
      const result = await isAdUnlocked('puzzle-123');

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when no unlock exists', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      // Act
      const result = await isAdUnlocked('puzzle-456');

      // Assert
      expect(result).toBe(false);
    });

    it('queries by puzzle_id only (no expiry check)', async () => {
      // Act
      await isAdUnlocked('puzzle-123');

      // Assert
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE puzzle_id = $puzzle_id'),
        expect.objectContaining({
          $puzzle_id: 'puzzle-123',
        })
      );
      // Should not contain expiry check
      const query = mockDb.getFirstAsync.mock.calls[0][0];
      expect(query).not.toContain('expires_at');
    });
  });

  describe('getValidAdUnlocks', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('returns all unlocks (permanent - no expiry filter)', async () => {
      // Arrange
      const mockUnlocks: UnlockedPuzzle[] = [
        {
          puzzle_id: 'puzzle-1',
          unlocked_at: new Date().toISOString(),
        },
        {
          puzzle_id: 'puzzle-2',
          unlocked_at: new Date().toISOString(),
        },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(mockUnlocks);

      // Act
      const result = await getValidAdUnlocks();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].puzzle_id).toBe('puzzle-1');
      expect(result[1].puzzle_id).toBe('puzzle-2');
    });

    it('returns empty array when no unlocks exist', async () => {
      // Arrange
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      // Act
      const result = await getValidAdUnlocks();

      // Assert
      expect(result).toEqual([]);
    });

    it('orders by unlocked_at descending (most recent first)', async () => {
      // Act
      await getValidAdUnlocks();

      // Assert
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY unlocked_at DESC')
      );
    });
  });

  describe('clearExpiredUnlocks', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('is a no-op since unlocks are permanent', async () => {
      // Act
      await clearExpiredUnlocks();

      // Assert - should not call runAsync (no database operation)
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });

  describe('removeAdUnlock', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('removes unlock for specific puzzle', async () => {
      // Act
      await removeAdUnlock('puzzle-123');

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM unlocked_puzzles WHERE puzzle_id'),
        { $puzzle_id: 'puzzle-123' }
      );
    });
  });

  describe('clearAllAdUnlocks', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('deletes all unlocks from database', async () => {
      // Act
      await clearAllAdUnlocks();

      // Assert
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM unlocked_puzzles');
    });
  });
});

describe('Ad Unlock Service', () => {
  describe('isPuzzleInUnlocks', () => {
    // Note: This is a sync function that checks against an in-memory array
    const { isPuzzleInUnlocks } = require('../services/adUnlockService');

    it('returns true when puzzle is in unlocks array', () => {
      // Arrange
      const unlocks: UnlockedPuzzle[] = [
        {
          puzzle_id: 'puzzle-123',
          unlocked_at: new Date().toISOString(),
        },
      ];

      // Act
      const result = isPuzzleInUnlocks('puzzle-123', unlocks);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when puzzle is not in unlocks array', () => {
      // Arrange
      const unlocks: UnlockedPuzzle[] = [
        {
          puzzle_id: 'puzzle-456',
          unlocked_at: new Date().toISOString(),
        },
      ];

      // Act
      const result = isPuzzleInUnlocks('puzzle-123', unlocks);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false for empty unlocks array', () => {
      // Act
      const result = isPuzzleInUnlocks('puzzle-123', []);

      // Assert
      expect(result).toBe(false);
    });
  });
});
