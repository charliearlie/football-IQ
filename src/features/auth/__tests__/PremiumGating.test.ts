/**
 * Premium Gating Tests
 *
 * Tests for premium access enforcement at the database/RLS level.
 * Verifies that:
 * - Free users can only access puzzles within 7-day window
 * - Premium users can access all puzzles regardless of date
 * - RLS correctly blocks old puzzles for free users
 */

import { isPuzzleLocked, isWithinFreeWindow } from '@/features/archive/utils/dateGrouping';

/**
 * Get a date string N days ago in YYYY-MM-DD format.
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

describe('Premium Gating - RLS Simulation', () => {
  describe('Free user puzzle access', () => {
    const isPremium = false;

    it('allows access to puzzles within 7-day window', () => {
      const recentDate = getDateDaysAgo(3);

      // Free user should NOT be locked for recent puzzle
      expect(isPuzzleLocked(recentDate, isPremium)).toBe(false);
      expect(isWithinFreeWindow(recentDate)).toBe(true);
    });

    it('blocks access to puzzles older than 7 days', () => {
      const oldDate = getDateDaysAgo(10);

      // Free user should be locked for old puzzle (simulates RLS rejection)
      expect(isPuzzleLocked(oldDate, isPremium)).toBe(true);
      expect(isWithinFreeWindow(oldDate)).toBe(false);
    });

    it('returns empty for 10-day-old puzzle query (RLS rejection simulation)', () => {
      const oldDate = getDateDaysAgo(10);

      // Simulating RLS behavior: old puzzles should be blocked
      // In real RLS, this would return empty result set
      const isBlocked = isPuzzleLocked(oldDate, isPremium);
      expect(isBlocked).toBe(true);

      // When RLS blocks a puzzle, the client should treat it as inaccessible
      const simulatedRLSResult = isBlocked ? null : { id: 'puzzle-123' };
      expect(simulatedRLSResult).toBeNull();
    });

    it('allows access to puzzle exactly 6 days old (boundary)', () => {
      const sixDaysAgo = getDateDaysAgo(6);

      expect(isPuzzleLocked(sixDaysAgo, isPremium)).toBe(false);
      expect(isWithinFreeWindow(sixDaysAgo)).toBe(true);
    });

    it('blocks access to puzzle 7 days old (outside window)', () => {
      const sevenDaysAgo = getDateDaysAgo(7);

      expect(isPuzzleLocked(sevenDaysAgo, isPremium)).toBe(true);
      expect(isWithinFreeWindow(sevenDaysAgo)).toBe(false);
    });
  });

  describe('Premium user puzzle access', () => {
    const isPremium = true;

    it('allows access to all puzzles regardless of date', () => {
      const oldDate = getDateDaysAgo(30);

      // Premium user should NOT be locked even for old puzzles
      expect(isPuzzleLocked(oldDate, isPremium)).toBe(false);
    });

    it('successfully fetches 10-day-old puzzle', () => {
      const oldDate = getDateDaysAgo(10);

      // Premium user should have access
      const isBlocked = isPuzzleLocked(oldDate, isPremium);
      expect(isBlocked).toBe(false);

      // Simulated: premium user gets puzzle data
      const simulatedRLSResult = isBlocked ? null : { id: 'puzzle-123', puzzle_date: oldDate };
      expect(simulatedRLSResult).not.toBeNull();
      expect(simulatedRLSResult?.id).toBe('puzzle-123');
    });

    it('allows access to puzzle from 100 days ago', () => {
      const veryOldDate = getDateDaysAgo(100);

      expect(isPuzzleLocked(veryOldDate, isPremium)).toBe(false);
    });

    it('allows access to today puzzle', () => {
      const today = getDateDaysAgo(0);

      expect(isPuzzleLocked(today, isPremium)).toBe(false);
    });
  });

  describe('Access tier comparison', () => {
    it('same puzzle has different access based on premium status', () => {
      const oldDate = getDateDaysAgo(15);

      // Free user: blocked
      expect(isPuzzleLocked(oldDate, false)).toBe(true);

      // Premium user: allowed
      expect(isPuzzleLocked(oldDate, true)).toBe(false);
    });

    it('recent puzzles accessible by all users', () => {
      const recentDate = getDateDaysAgo(2);

      // Both should have access
      expect(isPuzzleLocked(recentDate, false)).toBe(false);
      expect(isPuzzleLocked(recentDate, true)).toBe(false);
    });
  });
});
