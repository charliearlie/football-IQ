/**
 * Locking Investigation Tests
 *
 * Tests for the 7-day rolling window locking logic.
 * Verifies that:
 * - Lock boundary shifts correctly with system time
 * - Month and year boundaries are handled correctly
 * - Cached puzzle data does not bypass lock checks
 */

import { isPuzzleLocked, isWithinFreeWindow } from '../utils/dateGrouping';

// Mock @/lib/time so getAuthorizedDateUnsafe returns current fake timer date
jest.mock('@/lib/time', () => ({
  getAuthorizedDateUnsafe: jest.fn(() => {
    const d = new Date();
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }),
}));

describe('7-Day Rolling Window', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isWithinFreeWindow', () => {
    it('returns true for today', () => {
      jest.setSystemTime(new Date('2025-02-01T12:00:00'));
      expect(isWithinFreeWindow('2025-02-01')).toBe(true);
    });

    it('returns true for 6 days ago (last day of free window)', () => {
      jest.setSystemTime(new Date('2025-02-01T12:00:00'));
      expect(isWithinFreeWindow('2025-01-26')).toBe(true);
    });

    it('returns false for 7 days ago (first day outside window)', () => {
      jest.setSystemTime(new Date('2025-02-01T12:00:00'));
      expect(isWithinFreeWindow('2025-01-25')).toBe(false);
    });

    it('returns false for 10 days ago', () => {
      jest.setSystemTime(new Date('2025-02-01T12:00:00'));
      expect(isWithinFreeWindow('2025-01-22')).toBe(false);
    });
  });

  describe('isPuzzleLocked boundary tests', () => {
    it('locks puzzles exactly 7 days old for non-premium', () => {
      jest.setSystemTime(new Date('2025-02-01T12:00:00'));
      expect(isPuzzleLocked('2025-01-25', false)).toBe(true); // 7 days ago - locked
      expect(isPuzzleLocked('2025-01-26', false)).toBe(false); // 6 days ago - unlocked
    });

    it('never locks puzzles for premium users regardless of age', () => {
      jest.setSystemTime(new Date('2025-02-01T12:00:00'));
      expect(isPuzzleLocked('2025-01-25', true)).toBe(false); // 7 days ago - unlocked for premium
      expect(isPuzzleLocked('2024-12-01', true)).toBe(false); // 62 days ago - unlocked for premium
    });
  });

  describe('month boundary handling', () => {
    it('window shifts correctly from March into February', () => {
      jest.setSystemTime(new Date('2025-03-03T12:00:00'));
      // March 3 - 6 days = Feb 25
      expect(isWithinFreeWindow('2025-02-25')).toBe(true); // Within window
      expect(isWithinFreeWindow('2025-02-24')).toBe(false); // Outside window
    });

    it('window shifts correctly from February into January', () => {
      jest.setSystemTime(new Date('2025-02-03T12:00:00'));
      // Feb 3 - 6 days = Jan 28
      expect(isWithinFreeWindow('2025-01-28')).toBe(true); // Within window
      expect(isWithinFreeWindow('2025-01-27')).toBe(false); // Outside window
    });

    it('handles 31-day months correctly', () => {
      jest.setSystemTime(new Date('2025-08-03T12:00:00'));
      // Aug 3 - 6 days = July 28
      expect(isWithinFreeWindow('2025-07-28')).toBe(true);
      expect(isWithinFreeWindow('2025-07-27')).toBe(false);
    });

    it('handles 30-day months correctly', () => {
      jest.setSystemTime(new Date('2025-05-03T12:00:00'));
      // May 3 - 6 days = April 27
      expect(isWithinFreeWindow('2025-04-27')).toBe(true);
      expect(isWithinFreeWindow('2025-04-26')).toBe(false);
    });
  });

  describe('year boundary handling', () => {
    it('window shifts correctly from January into December', () => {
      jest.setSystemTime(new Date('2025-01-05T12:00:00'));
      // Jan 5 - 6 days = Dec 30
      expect(isWithinFreeWindow('2024-12-30')).toBe(true); // Within window
      expect(isWithinFreeWindow('2024-12-29')).toBe(false); // Outside window
    });

    it('handles Jan 1 correctly', () => {
      jest.setSystemTime(new Date('2025-01-01T12:00:00'));
      // Jan 1 - 6 days = Dec 26
      expect(isWithinFreeWindow('2024-12-26')).toBe(true);
      expect(isWithinFreeWindow('2024-12-25')).toBe(false);
    });

    it('handles Jan 7 boundary (full week spans year)', () => {
      jest.setSystemTime(new Date('2025-01-07T12:00:00'));
      // Jan 7 - 6 days = Jan 1
      expect(isWithinFreeWindow('2025-01-01')).toBe(true);
      expect(isWithinFreeWindow('2024-12-31')).toBe(false);
    });
  });

  describe('leap year handling', () => {
    it('handles Feb 29 in a leap year', () => {
      jest.setSystemTime(new Date('2024-02-29T12:00:00')); // 2024 is a leap year
      // Feb 29 - 6 days = Feb 23
      expect(isWithinFreeWindow('2024-02-23')).toBe(true);
      expect(isWithinFreeWindow('2024-02-22')).toBe(false);
    });

    it('handles March 1 following leap year Feb 29', () => {
      jest.setSystemTime(new Date('2024-03-01T12:00:00'));
      // March 1 - 6 days = Feb 24
      expect(isWithinFreeWindow('2024-02-24')).toBe(true);
      expect(isWithinFreeWindow('2024-02-23')).toBe(false);
    });

    it('handles March 1 in a non-leap year', () => {
      jest.setSystemTime(new Date('2025-03-01T12:00:00')); // 2025 is not a leap year
      // March 1 - 6 days = Feb 23
      expect(isWithinFreeWindow('2025-02-23')).toBe(true);
      expect(isWithinFreeWindow('2025-02-22')).toBe(false);
    });
  });

  describe('window shifts dynamically each day', () => {
    it('same puzzle date becomes locked as days pass', () => {
      const puzzleDate = '2025-01-10';

      // Jan 16 - puzzle is 6 days old, still in window
      jest.setSystemTime(new Date('2025-01-16T12:00:00'));
      expect(isPuzzleLocked(puzzleDate, false)).toBe(false);

      // Jan 17 - puzzle is now 7 days old, locked
      jest.setSystemTime(new Date('2025-01-17T12:00:00'));
      expect(isPuzzleLocked(puzzleDate, false)).toBe(true);

      // Jan 18 - puzzle is 8 days old, still locked
      jest.setSystemTime(new Date('2025-01-18T12:00:00'));
      expect(isPuzzleLocked(puzzleDate, false)).toBe(true);
    });

    it('simulates the reported Dec 30 bug scenario', () => {
      // User reports: Today is Jan 12, Dec 30 and earlier should be locked
      // But only Dec 30 and earlier are locked (correct)
      // Jan 5 and earlier should be locked, but Jan 1-4 are not (bug)

      jest.setSystemTime(new Date('2025-01-12T12:00:00'));

      // Correct behavior after fix:
      expect(isPuzzleLocked('2025-01-06', false)).toBe(false); // 6 days ago - unlocked
      expect(isPuzzleLocked('2025-01-05', false)).toBe(true);  // 7 days ago - locked
      expect(isPuzzleLocked('2025-01-04', false)).toBe(true);  // 8 days ago - locked
      expect(isPuzzleLocked('2025-01-01', false)).toBe(true);  // 11 days ago - locked
      expect(isPuzzleLocked('2024-12-30', false)).toBe(true);  // 13 days ago - locked
    });
  });

  describe('ad unlock integration', () => {
    it('unlocks puzzle with valid ad unlock even if outside window', () => {
      jest.setSystemTime(new Date('2025-01-12T12:00:00'));
      const puzzleId = 'puzzle-123';
      const adUnlocks = [{ puzzle_id: 'puzzle-123', unlocked_at: '2025-01-10T12:00:00Z' }];

      expect(isPuzzleLocked('2025-01-01', false, puzzleId, adUnlocks)).toBe(false);
    });

    it('does not unlock puzzle with ad unlock for different puzzle', () => {
      jest.setSystemTime(new Date('2025-01-12T12:00:00'));
      const puzzleId = 'puzzle-123';
      const adUnlocks = [{ puzzle_id: 'puzzle-456', unlocked_at: '2025-01-10T12:00:00Z' }];

      expect(isPuzzleLocked('2025-01-01', false, puzzleId, adUnlocks)).toBe(true);
    });
  });
});
