/**
 * @jest-environment node
 */

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  closeDatabase,
  getCatalogEntriesIncomplete,
  getCatalogEntryCountIncomplete,
} from '@/lib/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Incomplete Filter Database Queries', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getFirstAsync: jest.fn().mockResolvedValue({ user_version: 3 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      closeAsync: jest.fn().mockResolvedValue(undefined),
    };

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    await initDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  describe('getCatalogEntriesIncomplete', () => {
    it('queries with correct SQL using LEFT JOIN', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { id: 'p1', game_mode: 'career_path', puzzle_date: '2025-01-10', difficulty: 'medium' },
        { id: 'p2', game_mode: 'the_grid', puzzle_date: '2025-01-09', difficulty: 'hard' },
      ]);

      const result = await getCatalogEntriesIncomplete(0, 50);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN attempts'),
        { $limit: 50, $offset: 0 }
      );
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pc.puzzle_date <='),
        expect.any(Object)
      );
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('a.id IS NULL OR a.completed = 0'),
        expect.any(Object)
      );
      expect(result.length).toBe(2);
    });

    it('uses GROUP BY to prevent duplicates', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await getCatalogEntriesIncomplete(0, 50);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY pc.id'),
        expect.any(Object)
      );
    });

    it('orders by puzzle_date DESC', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await getCatalogEntriesIncomplete(0, 50);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY pc.puzzle_date DESC'),
        expect.any(Object)
      );
    });

    it('supports pagination with offset and limit', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await getCatalogEntriesIncomplete(100, 25);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.any(String),
        { $limit: 25, $offset: 100 }
      );
    });

    it('filters out future-dated puzzles', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      await getCatalogEntriesIncomplete(0, 50);

      // Should include date filter to exclude future puzzles
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("puzzle_date <= date('now', 'localtime')"),
        expect.any(Object)
      );
    });
  });

  describe('getCatalogEntryCountIncomplete', () => {
    it('queries with correct SQL using LEFT JOIN', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 42 });

      const result = await getCatalogEntryCountIncomplete();

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN attempts')
      );
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('a.id IS NULL OR a.completed = 0')
      );
      expect(result).toBe(42);
    });

    it('uses COUNT(DISTINCT pc.id) to prevent duplicates', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 10 });

      await getCatalogEntryCountIncomplete();

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT pc.id)')
      );
    });

    it('returns 0 when no count result', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const result = await getCatalogEntryCountIncomplete();

      expect(result).toBe(0);
    });
  });
});
