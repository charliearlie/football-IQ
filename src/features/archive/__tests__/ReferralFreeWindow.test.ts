/**
 * Tests for extended free window for referred users.
 * Referred users get 7 days instead of the default 3.
 */

import { isWithinFreeWindow, isPuzzleLocked } from '../utils/dateGrouping';

// Mock @/lib/time so getAuthorizedDateUnsafe returns current fake timer date
jest.mock('@/lib/time', () => ({
  getAuthorizedDateUnsafe: () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },
}));

describe('Referral extended free window', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-19T12:00:00'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('isWithinFreeWindow', () => {
    it('default 3-day window: today is within', () => {
      expect(isWithinFreeWindow('2026-03-19')).toBe(true);
    });

    it('default 3-day window: 2 days ago is within', () => {
      expect(isWithinFreeWindow('2026-03-17')).toBe(true);
    });

    it('default 3-day window: 3 days ago is NOT within', () => {
      expect(isWithinFreeWindow('2026-03-16')).toBe(false);
    });

    it('7-day window: 6 days ago is within', () => {
      expect(isWithinFreeWindow('2026-03-13', 7)).toBe(true);
    });

    it('7-day window: 7 days ago is NOT within', () => {
      expect(isWithinFreeWindow('2026-03-12', 7)).toBe(false);
    });

    it('7-day window: 4 days ago is within (would be locked with 3-day)', () => {
      expect(isWithinFreeWindow('2026-03-15', 7)).toBe(true);
      expect(isWithinFreeWindow('2026-03-15', 3)).toBe(false);
    });
  });

  describe('isPuzzleLocked with freeWindowDays', () => {
    it('uses default 3-day window when freeWindowDays not specified', () => {
      // 4 days ago — locked with default, unlocked with 7
      expect(isPuzzleLocked('2026-03-15', false)).toBe(true);
    });

    it('uses extended 7-day window for referred users', () => {
      // 4 days ago — unlocked with 7-day window
      expect(isPuzzleLocked('2026-03-15', false, undefined, undefined, undefined, 7)).toBe(false);
    });

    it('premium users are never locked regardless of window', () => {
      expect(isPuzzleLocked('2024-01-01', true, undefined, undefined, undefined, 3)).toBe(false);
    });

    it('completed puzzles are never locked regardless of window', () => {
      expect(isPuzzleLocked('2024-01-01', false, undefined, undefined, true, 3)).toBe(false);
    });
  });
});
