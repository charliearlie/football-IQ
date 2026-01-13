/**
 * Catalog Pagination Regression Tests
 *
 * These tests prevent the "future-dated puzzles" bug from recurring.
 * The bug: SQLite was returning future-dated puzzles first (ordered by date DESC),
 * which were then filtered out client-side, causing Page 0 to return 0 items.
 *
 * The fix: Filter future-dated puzzles at the SQL level with:
 * WHERE puzzle_date <= date('now', 'localtime')
 */

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  closeDatabase,
  getCatalogEntriesPaginated,
  getCatalogEntryCount,
} from '../database';
import { LocalCatalogEntry } from '@/types/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Catalog Pagination - Future Date Filtering', () => {
  let mockDb: {
    execAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  // Helper to generate test dates
  const getDateString = (daysOffset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };

  const today = getDateString(0);
  const yesterday = getDateString(-1);
  const lastWeek = getDateString(-7);
  const nextWeek = getDateString(7);
  const nextMonth = getDateString(30);

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

  describe('getCatalogEntriesPaginated', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('TEST CASE 1: SQL query includes date filter to exclude future puzzles', async () => {
      // Arrange - mock returns past-dated puzzles only (as the fixed SQL should do)
      const pastPuzzles: LocalCatalogEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `past-puzzle-${i}`,
        game_mode: 'mystery_player',
        puzzle_date: getDateString(-i - 1), // Yesterday, 2 days ago, etc.
        difficulty: 'medium',
        synced_at: null,
      }));
      mockDb.getAllAsync.mockResolvedValueOnce(pastPuzzles);

      // Act
      const result = await getCatalogEntriesPaginated(0, 10, null);

      // Assert - Query MUST include date filter
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("puzzle_date <= date('now', 'localtime')"),
        expect.any(Object)
      );

      // Assert - Result must NOT be empty (the bug returned 0 items)
      expect(result.length).toBe(10);
      expect(result[0].puzzle_date).toBe(yesterday);
    });

    it('TEST CASE 1b: Page 0 returns past puzzles, not 0 items due to future filtering', async () => {
      // This test simulates what SHOULD happen after the fix:
      // The SQL filters out future puzzles, so Page 0 returns valid past puzzles

      const pastPuzzles: LocalCatalogEntry[] = [
        { id: 'puzzle-1', game_mode: 'mystery_player', puzzle_date: yesterday, difficulty: 'easy', synced_at: null },
        { id: 'puzzle-2', game_mode: 'tic_tac_toe', puzzle_date: lastWeek, difficulty: 'medium', synced_at: null },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(pastPuzzles);

      // Act
      const result = await getCatalogEntriesPaginated(0, 10, null);

      // Assert - MUST return past puzzles, NOT empty array
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.puzzle_date <= today)).toBe(true);
    });

    it('TEST CASE 3: Today\'s puzzle is included (not excluded by timezone)', async () => {
      // Arrange - puzzle dated today
      const todayPuzzle: LocalCatalogEntry = {
        id: 'today-puzzle',
        game_mode: 'mystery_player',
        puzzle_date: today,
        difficulty: 'medium',
        synced_at: null,
      };
      mockDb.getAllAsync.mockResolvedValueOnce([todayPuzzle]);

      // Act
      const result = await getCatalogEntriesPaginated(0, 10, null);

      // Assert - Today's puzzle MUST be included
      expect(result.length).toBe(1);
      expect(result[0].puzzle_date).toBe(today);
    });

    it('TEST CASE 4: Game mode filter is applied correctly', async () => {
      // Arrange
      const mysteryPuzzles: LocalCatalogEntry[] = [
        { id: 'mp-1', game_mode: 'mystery_player', puzzle_date: yesterday, difficulty: 'easy', synced_at: null },
        { id: 'mp-2', game_mode: 'mystery_player', puzzle_date: lastWeek, difficulty: 'medium', synced_at: null },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(mysteryPuzzles);

      // Act
      const result = await getCatalogEntriesPaginated(0, 10, 'mystery_player');

      // Assert - Query includes BOTH game mode AND date filter
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringMatching(/game_mode = \$gameMode.*puzzle_date <= date\('now', 'localtime'\)/s),
        expect.objectContaining({ $gameMode: 'mystery_player' })
      );

      expect(result.length).toBe(2);
      expect(result.every(p => p.game_mode === 'mystery_player')).toBe(true);
    });

    it('applies correct pagination with LIMIT and OFFSET', async () => {
      // Arrange
      const page2Puzzles: LocalCatalogEntry[] = [
        { id: 'puzzle-20', game_mode: 'mystery_player', puzzle_date: getDateString(-20), difficulty: 'easy', synced_at: null },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(page2Puzzles);

      // Act - Request page 2 (offset 20, limit 10)
      await getCatalogEntriesPaginated(20, 10, null);

      // Assert - Correct LIMIT and OFFSET
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $limit OFFSET $offset'),
        expect.objectContaining({ $limit: 10, $offset: 20 })
      );
    });

    it('orders results by puzzle_date DESC (newest first)', async () => {
      // Arrange
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      // Act
      await getCatalogEntriesPaginated(0, 10, null);

      // Assert - Query includes ORDER BY
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY puzzle_date DESC'),
        expect.any(Object)
      );
    });
  });

  describe('getCatalogEntryCount', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('TEST CASE 2: Count excludes future-dated puzzles', async () => {
      // Arrange - Mock returns count of 10 (only past puzzles, not 20 with future)
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 10 });

      // Act
      const count = await getCatalogEntryCount(null);

      // Assert - Query MUST include date filter (check the second call, first is PRAGMA)
      const calls = mockDb.getFirstAsync.mock.calls;
      const countQueryCall = calls.find(call => call[0].includes('COUNT'));
      expect(countQueryCall).toBeDefined();
      expect(countQueryCall![0]).toContain("puzzle_date <= date('now', 'localtime')");

      // Assert - Count should be 10 (past puzzles only), NOT 20
      expect(count).toBe(10);
    });

    it('TEST CASE 2b: Count with game mode filter also excludes future puzzles', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 5 });

      // Act
      const count = await getCatalogEntryCount('mystery_player');

      // Assert - Query includes BOTH game mode AND date filter
      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringMatching(/game_mode = \$gameMode.*puzzle_date <= date\('now', 'localtime'\)/s),
        expect.objectContaining({ $gameMode: 'mystery_player' })
      );

      expect(count).toBe(5);
    });

    it('returns 0 when no puzzles match criteria', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });

      // Act
      const count = await getCatalogEntryCount(null);

      // Assert
      expect(count).toBe(0);
    });

    it('handles null result gracefully', async () => {
      // Arrange
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      // Act
      const count = await getCatalogEntryCount(null);

      // Assert - Should default to 0
      expect(count).toBe(0);
    });
  });

  describe('Pagination consistency', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('count matches total paginated entries for same filter', async () => {
      // This ensures getCatalogEntryCount and getCatalogEntriesPaginated
      // use the same WHERE clause (both exclude future puzzles)

      // Mock count
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 25 });

      // Mock paginated (page 0)
      mockDb.getAllAsync.mockResolvedValueOnce(
        Array.from({ length: 25 }, (_, i) => ({
          id: `puzzle-${i}`,
          game_mode: 'mystery_player',
          puzzle_date: getDateString(-i - 1),
          difficulty: 'medium',
          synced_at: null,
        }))
      );

      // Act
      const count = await getCatalogEntryCount(null);
      const entries = await getCatalogEntriesPaginated(0, 50, null);

      // Assert - Count query should use date filter (find the COUNT call)
      const countCalls = mockDb.getFirstAsync.mock.calls;
      const countQueryCall = countCalls.find(call => call[0].includes('COUNT'));
      expect(countQueryCall).toBeDefined();
      expect(countQueryCall?.[0]).toContain("puzzle_date <= date('now', 'localtime')");

      // Assert - Paginated query should use date filter
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("puzzle_date <= date('now', 'localtime')"),
        expect.any(Object)
      );

      // Count and entries should be consistent
      expect(count).toBe(25);
      expect(entries.length).toBe(25);
    });
  });
});
