/**
 * @jest-environment node
 */

import { isPuzzleLocked } from '@/features/archive/utils/dateGrouping';
import { UnlockedPuzzle } from '@/types/database';

describe('Completed Puzzle Permanent Unlock', () => {
  it('unlocks completed puzzles for non-premium users outside 7-day window', () => {
    const oldDate = '2024-12-01'; // 40+ days ago
    const hasCompletedAttempt = true;

    expect(isPuzzleLocked(oldDate, false, 'puzzle-123', [], hasCompletedAttempt)).toBe(
      false
    );
  });

  it('keeps incomplete puzzles locked for non-premium outside 7-day window', () => {
    const oldDate = '2024-12-01';
    const hasCompletedAttempt = false;

    expect(isPuzzleLocked(oldDate, false, 'puzzle-123', [], hasCompletedAttempt)).toBe(
      true
    );
  });

  it('unlocks completed puzzles even without premium or ad unlock', () => {
    expect(isPuzzleLocked('2024-12-01', false, 'puzzle-123', [], true)).toBe(false);
  });

  it('prioritizes completion over all other unlock methods', () => {
    // Even with no premium, no ad unlock, outside window
    expect(isPuzzleLocked('2023-01-01', false, undefined, [], true)).toBe(false);
  });

  it('returns false for premium users regardless of completion', () => {
    expect(isPuzzleLocked('2024-12-01', true, undefined, [], false)).toBe(false);
    expect(isPuzzleLocked('2024-12-01', true, undefined, [], true)).toBe(false);
  });

  it('returns false for puzzles within free window', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    expect(isPuzzleLocked(dateStr, false, undefined, [], false)).toBe(false);
  });

  it('returns false for ad-unlocked puzzles', () => {
    const unlocks: UnlockedPuzzle[] = [
      { puzzle_id: 'puzzle-123', unlocked_at: '2025-01-10T10:00:00Z' },
    ];

    expect(isPuzzleLocked('2024-12-01', false, 'puzzle-123', unlocks, false)).toBe(
      false
    );
  });

  it('handles undefined hasCompletedAttempt as false', () => {
    // Old behavior: no completion parameter = locked if outside window
    expect(isPuzzleLocked('2024-12-01', false, 'puzzle-123', [], undefined)).toBe(
      true
    );
  });

  it('handles false hasCompletedAttempt explicitly', () => {
    // Explicit false = not completed = locked if outside window
    expect(isPuzzleLocked('2024-12-01', false, 'puzzle-123', [], false)).toBe(true);
  });
});

describe('Lock Logic Edge Cases', () => {
  it('handles missing puzzle ID gracefully', () => {
    // No puzzle ID means no ad unlock check, should be locked if outside window
    expect(isPuzzleLocked('2024-12-01', false, undefined, [], false)).toBe(true);
  });

  it('handles empty ad unlocks array', () => {
    expect(isPuzzleLocked('2024-12-01', false, 'puzzle-123', [], false)).toBe(true);
  });

  it('completion takes precedence over premium status', () => {
    // Completed puzzle should be unlocked even if we check premium first
    expect(isPuzzleLocked('2024-12-01', true, 'puzzle-123', [], true)).toBe(false);
  });
});
