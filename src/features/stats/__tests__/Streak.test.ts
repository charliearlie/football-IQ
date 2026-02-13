/**
 * Streak Calculation Tests
 *
 * Tests for the calculateStreak function that determines
 * current and longest streaks from attempt dates.
 */

import { calculateStreak } from '@/features/home/hooks/useUserStats';

// Mock @/lib/time so getAuthorizedDateUnsafe returns current fake timer date
jest.mock('@/lib/time', () => ({
  getAuthorizedDateUnsafe: jest.fn(() => {
    const d = new Date();
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }),
}));

describe('calculateStreak', () => {
  // Fixed date for consistent testing
  const FIXED_NOW = new Date('2025-01-15T12:00:00Z');
  const TODAY = '2025-01-15';
  const YESTERDAY = '2025-01-14';
  const TWO_DAYS_AGO = '2025-01-13';
  const THREE_DAYS_AGO = '2025-01-12';
  const FOUR_DAYS_AGO = '2025-01-11';
  const FIVE_DAYS_AGO = '2025-01-10';

  beforeEach(() => {
    // Mock current date
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('empty attempts', () => {
    it('returns 0 for no attempts', () => {
      const result = calculateStreak([]);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(0);
    });
  });

  describe('single day streaks', () => {
    it('returns 1 for only today', () => {
      const result = calculateStreak([TODAY]);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(1);
    });

    it('returns 1 for only yesterday (streak still active)', () => {
      const result = calculateStreak([YESTERDAY]);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(1);
    });

    it('returns 0 current for two days ago (streak broken)', () => {
      const result = calculateStreak([TWO_DAYS_AGO]);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(1);
    });
  });

  describe('consecutive day streaks', () => {
    it('returns 2 for today and yesterday', () => {
      const result = calculateStreak([TODAY, YESTERDAY]);
      expect(result.current).toBe(2);
      expect(result.longest).toBe(2);
    });

    it('returns 3 for 3 consecutive days ending today', () => {
      const result = calculateStreak([TODAY, YESTERDAY, TWO_DAYS_AGO]);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it('returns 3 for 3 consecutive days ending yesterday', () => {
      const result = calculateStreak([YESTERDAY, TWO_DAYS_AGO, THREE_DAYS_AGO]);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it('returns 5 for 5 consecutive days ending today', () => {
      const result = calculateStreak([
        TODAY,
        YESTERDAY,
        TWO_DAYS_AGO,
        THREE_DAYS_AGO,
        FOUR_DAYS_AGO,
      ]);
      expect(result.current).toBe(5);
      expect(result.longest).toBe(5);
    });
  });

  describe('broken streaks', () => {
    it('returns 2 for today + yesterday with a gap before', () => {
      const result = calculateStreak([TODAY, YESTERDAY, FOUR_DAYS_AGO]);
      expect(result.current).toBe(2);
      expect(result.longest).toBe(2);
    });

    it('breaks streak when there is a gap in the middle', () => {
      // Today, yesterday, then gap, then 3-day streak in the past
      const result = calculateStreak([
        TODAY,
        YESTERDAY,
        // gap on TWO_DAYS_AGO
        THREE_DAYS_AGO,
        FOUR_DAYS_AGO,
        FIVE_DAYS_AGO,
      ]);
      expect(result.current).toBe(2);
      expect(result.longest).toBe(3); // The past 3-day streak was longer
    });

    it('returns 0 current when streak is completely broken', () => {
      const result = calculateStreak([THREE_DAYS_AGO, FOUR_DAYS_AGO, FIVE_DAYS_AGO]);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(3);
    });
  });

  describe('duplicate dates (multiple games same day)', () => {
    it('handles duplicate dates correctly', () => {
      const result = calculateStreak([TODAY, TODAY, TODAY, YESTERDAY, YESTERDAY]);
      expect(result.current).toBe(2);
      expect(result.longest).toBe(2);
    });

    it('deduplicates when counting streak', () => {
      const result = calculateStreak([
        TODAY,
        TODAY,
        YESTERDAY,
        YESTERDAY,
        TWO_DAYS_AGO,
        TWO_DAYS_AGO,
        TWO_DAYS_AGO,
      ]);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });
  });

  describe('longest vs current streak', () => {
    it('tracks longest streak separately from current', () => {
      // 2-day current streak, 5-day longest streak in the past
      const result = calculateStreak([
        TODAY,
        YESTERDAY,
        // gap
        '2025-01-10',
        '2025-01-09',
        '2025-01-08',
        '2025-01-07',
        '2025-01-06',
      ]);
      expect(result.current).toBe(2);
      expect(result.longest).toBe(5);
    });

    it('longest equals current when current is the best', () => {
      const result = calculateStreak([
        TODAY,
        YESTERDAY,
        TWO_DAYS_AGO,
        THREE_DAYS_AGO,
        FOUR_DAYS_AGO,
      ]);
      expect(result.current).toBe(5);
      expect(result.longest).toBe(5);
    });
  });

  describe('order independence', () => {
    it('works with dates in random order', () => {
      const result = calculateStreak([
        YESTERDAY,
        THREE_DAYS_AGO,
        TODAY,
        TWO_DAYS_AGO,
      ]);
      // All 4 days are consecutive: today, yesterday, 2 days ago, 3 days ago
      expect(result.current).toBe(4);
      expect(result.longest).toBe(4);
    });
  });

  describe('DST transitions', () => {
    // These tests verify the fix for DST-related streak calculation bugs.
    // Prior to the fix, Math.round(diffTime / DAY_MS) could produce incorrect
    // results during DST transitions (23-hour or 25-hour gaps).

    it('handles spring forward DST transition (23-hour day)', () => {
      // In 2025, US DST spring forward is March 9
      // Set system time to March 11
      jest.setSystemTime(new Date('2025-03-11T12:00:00Z'));

      const result = calculateStreak([
        '2025-03-11', // Today
        '2025-03-10', // Yesterday (after DST spring forward)
        '2025-03-09', // DST transition day (only 23 hours long in local time)
        '2025-03-08', // Before DST
      ]);

      // Should still be 4-day streak despite the 23-hour day
      expect(result.current).toBe(4);
      expect(result.longest).toBe(4);
    });

    it('handles fall back DST transition (25-hour day)', () => {
      // In 2025, US DST fall back is November 2
      // Set system time to November 4
      jest.setSystemTime(new Date('2025-11-04T12:00:00Z'));

      const result = calculateStreak([
        '2025-11-04', // Today
        '2025-11-03', // Yesterday (after DST fall back)
        '2025-11-02', // DST transition day (25 hours long in local time)
        '2025-11-01', // Before DST
      ]);

      // Should still be 4-day streak despite the 25-hour day
      expect(result.current).toBe(4);
      expect(result.longest).toBe(4);
    });

    it('correctly identifies broken streak across DST boundary', () => {
      // Verify we still detect gaps correctly during DST
      jest.setSystemTime(new Date('2025-03-11T12:00:00Z'));

      const result = calculateStreak([
        '2025-03-11', // Today
        '2025-03-10', // Yesterday
        // Gap on March 9 (DST day)
        '2025-03-08', // 3 days ago
      ]);

      expect(result.current).toBe(2); // Only today + yesterday
      expect(result.longest).toBe(2);
    });
  });
});
