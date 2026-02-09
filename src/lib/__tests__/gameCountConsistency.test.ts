/**
 * Game Count Consistency Regression Tests
 *
 * Prevents the bug where "Games Completed X/Y" showed inconsistent values:
 * - Archive showed 5/50 initially (paginated), then 6/92 after scrolling
 * - Home showed different values than Archive
 *
 * Root causes:
 * 1. Archive computed stats from paginated loaded data instead of DB totals
 * 2. Home used tier-limited `puzzles` table instead of complete `puzzle_catalog`
 *
 * Fix: Both screens now use getTotalPuzzleCount() and getCompletedPuzzleCount()
 * which prefer puzzle_catalog (complete, bypasses RLS) with puzzles table fallback.
 */

import * as SQLite from 'expo-sqlite';
import {
  initDatabase,
  closeDatabase,
  getTotalPuzzleCount,
  getCompletedPuzzleCount,
  getPuzzleCount,
  getCatalogEntryCount,
} from '../database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Game Count Consistency', () => {
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

  describe('getTotalPuzzleCount', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('uses puzzle_catalog when catalog is populated', async () => {
      // First call: catalog count query returns 92
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });

      const result = await getTotalPuzzleCount();

      expect(result).toBe(92);
      // Verify it queried puzzle_catalog with date filter
      const calls = mockDb.getFirstAsync.mock.calls;
      const catalogCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('puzzle_catalog') &&
          call[0].includes('COUNT')
      );
      expect(catalogCall).toBeDefined();
      expect(catalogCall![0]).toContain("puzzle_date <= date('now', 'localtime')");
    });

    it('falls back to puzzles table when catalog is empty', async () => {
      // First call: catalog count returns 0 (not synced yet)
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });
      // Second call: puzzles table fallback returns 50
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 50 });

      const result = await getTotalPuzzleCount();

      expect(result).toBe(50);
    });

    it('filters by date to exclude future puzzles', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });

      await getTotalPuzzleCount();

      const calls = mockDb.getFirstAsync.mock.calls;
      const catalogCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('puzzle_catalog') &&
          call[0].includes('COUNT')
      );
      expect(catalogCall![0]).toContain("puzzle_date <= date('now', 'localtime')");
      expect(catalogCall![0]).toContain('is_special = 0');
    });

    it('returns 0 when both catalog and puzzles are empty', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });

      const result = await getTotalPuzzleCount();

      expect(result).toBe(0);
    });
  });

  describe('getCompletedPuzzleCount', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('uses puzzle_catalog JOIN when catalog is populated', async () => {
      // First call: catalog existence check returns > 0
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      // Second call: completed count from catalog JOIN returns 6
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 6 });

      const result = await getCompletedPuzzleCount();

      expect(result).toBe(6);
      // Verify it joined with puzzle_catalog
      const calls = mockDb.getFirstAsync.mock.calls;
      const joinCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('puzzle_catalog') &&
          call[0].includes('attempts') &&
          call[0].includes('completed = 1')
      );
      expect(joinCall).toBeDefined();
    });

    it('falls back to puzzles table JOIN when catalog is empty', async () => {
      // First call: catalog existence check returns 0
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });
      // Second call: puzzles table fallback returns 5
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 5 });

      const result = await getCompletedPuzzleCount();

      expect(result).toBe(5);
      // Verify it fell back to puzzles table
      const calls = mockDb.getFirstAsync.mock.calls;
      const fallbackCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('puzzles p') &&
          call[0].includes('attempts') &&
          call[0].includes('completed = 1')
      );
      expect(fallbackCall).toBeDefined();
    });

    it('filters out special puzzles', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 6 });

      await getCompletedPuzzleCount();

      const calls = mockDb.getFirstAsync.mock.calls;
      const joinCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('puzzle_catalog') &&
          call[0].includes('completed = 1')
      );
      expect(joinCall![0]).toContain('is_special = 0');
    });

    it('filters by date to exclude future puzzle completions', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 6 });

      await getCompletedPuzzleCount();

      const calls = mockDb.getFirstAsync.mock.calls;
      const joinCall = calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('puzzle_catalog') &&
          call[0].includes('completed = 1')
      );
      expect(joinCall![0]).toContain("puzzle_date <= date('now', 'localtime')");
    });

    it('returns 0 when user has no completed puzzles (catalog populated)', async () => {
      // Catalog exists with entries
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      // But no completed attempts
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });

      const result = await getCompletedPuzzleCount();

      expect(result).toBe(0);
    });
  });

  describe('consistency between Home and Archive data sources', () => {
    beforeEach(async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ user_version: 3 });
      await initDatabase();
    });

    it('getTotalPuzzleCount and getCatalogEntryCount return same value when catalog is populated', async () => {
      // Both should query puzzle_catalog with the same WHERE clause
      // getTotalPuzzleCount call
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      const totalCount = await getTotalPuzzleCount();

      // getCatalogEntryCount call (used internally by archive)
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      const catalogCount = await getCatalogEntryCount(null);

      expect(totalCount).toBe(catalogCount);
    });

    it('completed count does NOT change based on number of loaded pages', async () => {
      // This is the core regression test: the completed count must be
      // a stable DB query result, NOT derived from paginated loaded data.
      //
      // Before fix: archive computed stats from rawDateGroups (paginated)
      //   Page 0 (50 items): 5 completed / 50 total
      //   Page 0+1 (100 items): 6 completed / 92 total
      //
      // After fix: both use getCompletedPuzzleCount() which queries DB directly

      // Call 1: catalog check
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      // Call 2: completed count
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 6 });
      const firstCall = await getCompletedPuzzleCount();

      // Call 3: catalog check (simulating a second read after scrolling)
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 92 });
      // Call 4: completed count
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 6 });
      const secondCall = await getCompletedPuzzleCount();

      // The count must be identical regardless of when it's called
      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBe(6);
    });
  });
});
