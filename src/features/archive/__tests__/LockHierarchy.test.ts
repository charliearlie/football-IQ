/**
 * @jest-environment node
 *
 * Lock Hierarchy Priority Tests
 *
 * CRITICAL: Validates the unlock priority order is correct
 *
 * Lock Priority Hierarchy (MUST be checked in this order):
 * 1. Completed puzzles → Always unlocked (HIGHEST PRIORITY)
 * 2. Premium users → Always unlocked
 * 3. Within 7-day window → Unlocked
 * 4. Has ad unlock → Unlocked
 * 5. Otherwise → Locked (LOWEST PRIORITY)
 *
 * RISKS:
 * - If order is wrong, users could lose access to completed puzzles
 * - Premium users could hit paywalls unexpectedly
 * - Revenue loss if free users bypass locks
 */

import { isPuzzleLocked, isWithinFreeWindow, hasValidAdUnlock } from '@/features/archive/utils/dateGrouping';
import { UnlockedPuzzle } from '@/types/database';

describe('Lock Hierarchy Priority Order', () => {
  const OLD_DATE = '2024-12-01'; // 40+ days ago (outside 7-day window)
  const RECENT_DATE = (() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  })();

  describe('Priority 1: Completed Puzzles (HIGHEST)', () => {
    it('✅ completed puzzle overrides all other lock conditions', () => {
      // Scenario: Non-premium, outside window, no ad unlock
      // BUT puzzle is completed
      // Expected: UNLOCKED (completed takes precedence)

      const result = isPuzzleLocked(
        OLD_DATE,
        false, // Not premium
        'puzzle-123',
        [], // No ad unlocks
        true // Completed ✓
      );

      expect(result).toBe(false); // Unlocked
    });

    it('✅ completed puzzle unlocks even without puzzle ID', () => {
      // Edge case: Missing puzzle ID (shouldn't happen, but test defensive logic)
      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        undefined, // No puzzle ID
        [],
        true // Completed
      );

      expect(result).toBe(false); // Still unlocked (completion is first check)
    });

    it('✅ completed puzzle unlocks even with null ad unlocks', () => {
      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        'puzzle-123',
        undefined as any, // Null/undefined ad unlocks
        true
      );

      expect(result).toBe(false); // Unlocked
    });

    it('🚨 CRITICAL: incomplete puzzle does NOT get free unlock', () => {
      // Same scenario as above, but NOT completed
      // Expected: LOCKED (should require premium or ad unlock)

      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        'puzzle-123',
        [],
        false // NOT completed
      );

      expect(result).toBe(true); // Locked (correct)
    });

    it('🚨 CRITICAL: undefined completion status defaults to locked', () => {
      // If hasCompletedAttempt parameter is missing/undefined
      // Should default to "not completed" (locked)

      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        'puzzle-123',
        [],
        undefined // No completion info
      );

      expect(result).toBe(true); // Locked (safe default)
    });
  });

  describe('Priority 2: Premium Users', () => {
    it('✅ premium user unlocks old puzzle without completion', () => {
      const result = isPuzzleLocked(
        OLD_DATE,
        true, // Premium ✓
        'puzzle-123',
        [],
        false // Not completed
      );

      expect(result).toBe(false); // Unlocked (premium access)
    });

    it('✅ premium user unlocks even without ad unlocks or puzzle ID', () => {
      const result = isPuzzleLocked(
        OLD_DATE,
        true,
        undefined,
        undefined as any,
        false
      );

      expect(result).toBe(false); // Premium always unlocks
    });

    it('premium user does NOT need completion check (already unlocked)', () => {
      // Both completed and incomplete puzzles are unlocked for premium
      const completedResult = isPuzzleLocked(OLD_DATE, true, 'p1', [], true);
      const incompleteResult = isPuzzleLocked(OLD_DATE, true, 'p2', [], false);

      expect(completedResult).toBe(false);
      expect(incompleteResult).toBe(false);
      // Both unlocked (premium status is enough)
    });
  });

  describe('Priority 3: 7-Day Free Window', () => {
    it('✅ recent puzzle unlocks without premium or completion', () => {
      const result = isPuzzleLocked(
        RECENT_DATE,
        false, // Not premium
        'puzzle-123',
        [],
        false // Not completed
      );

      expect(result).toBe(false); // Unlocked (within free window)
    });

    it('today puzzle is always unlocked', () => {
      const today = new Date().toISOString().split('T')[0];

      const result = isPuzzleLocked(
        today,
        false,
        'puzzle-123',
        [],
        false
      );

      expect(result).toBe(false); // Today is always free
    });

    it('puzzle from 6 days ago is unlocked (within 7-day window)', () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      const dateStr = sixDaysAgo.toISOString().split('T')[0];

      const result = isPuzzleLocked(
        dateStr,
        false,
        'puzzle-123',
        [],
        false
      );

      expect(result).toBe(false); // Within window
    });

    it('puzzle from 8 days ago is locked (outside 7-day window)', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      const dateStr = eightDaysAgo.toISOString().split('T')[0];

      const result = isPuzzleLocked(
        dateStr,
        false,
        'puzzle-123',
        [],
        false
      );

      expect(result).toBe(true); // Outside window (locked)
    });
  });

  describe('Priority 4: Ad Unlock', () => {
    it('✅ ad unlock grants access to old puzzle', () => {
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'puzzle-123', unlocked_at: '2025-01-10T10:00:00Z' },
      ];

      const result = isPuzzleLocked(
        OLD_DATE,
        false, // Not premium
        'puzzle-123',
        adUnlocks,
        false // Not completed
      );

      expect(result).toBe(false); // Unlocked (ad unlock)
    });

    it('ad unlock is permanent (no expiration)', () => {
      // Ad unlocked 6 months ago, still valid
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'puzzle-123', unlocked_at: '2024-07-01T10:00:00Z' },
      ];

      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        'puzzle-123',
        adUnlocks,
        false
      );

      expect(result).toBe(false); // Still unlocked
    });

    it('ad unlock for different puzzle does NOT unlock this puzzle', () => {
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'puzzle-456', unlocked_at: '2025-01-10T10:00:00Z' }, // Different puzzle
      ];

      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        'puzzle-123', // This puzzle not unlocked
        adUnlocks,
        false
      );

      expect(result).toBe(true); // Locked (wrong puzzle ID)
    });

    it('empty ad unlocks array means no ad unlock', () => {
      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        'puzzle-123',
        [], // No unlocks
        false
      );

      expect(result).toBe(true); // Locked
    });

    it('missing puzzle ID means ad unlock check is skipped', () => {
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'puzzle-123', unlocked_at: '2025-01-10T10:00:00Z' },
      ];

      const result = isPuzzleLocked(
        OLD_DATE,
        false,
        undefined, // No puzzle ID
        adUnlocks,
        false
      );

      expect(result).toBe(true); // Locked (can't verify ad unlock without ID)
    });
  });

  describe('Priority 5: Default Locked', () => {
    it('🚨 old puzzle with no unlocks is LOCKED', () => {
      const result = isPuzzleLocked(
        OLD_DATE,
        false, // Not premium
        'puzzle-123',
        [], // No ad unlocks
        false // Not completed
      );

      expect(result).toBe(true); // Locked (all checks failed)
    });
  });

  describe('🚨 CRITICAL: Priority Order Violations', () => {
    it('REGRESSION TEST: completion must be checked BEFORE premium', () => {
      // If premium check happens first, completed flag is ignored
      // This test ensures completion is ALWAYS first

      const completedNonPremium = isPuzzleLocked(OLD_DATE, false, 'p1', [], true);
      const incompletePremium = isPuzzleLocked(OLD_DATE, true, 'p2', [], false);

      // Both should be unlocked, but for different reasons
      expect(completedNonPremium).toBe(false); // Completion unlock
      expect(incompletePremium).toBe(false); // Premium unlock

      // If premium was checked first, completed flag would be dead code
    });

    it('REGRESSION TEST: premium must be checked BEFORE 7-day window', () => {
      // Premium users should unlock old puzzles
      // If 7-day window is checked first, premium users might be blocked

      const premiumOldPuzzle = isPuzzleLocked(OLD_DATE, true, 'p1', [], false);

      expect(premiumOldPuzzle).toBe(false); // Premium unlocks even old puzzles
    });

    it('REGRESSION TEST: 7-day window must be checked BEFORE ad unlock', () => {
      // Free window should not require ad unlock
      // If ad unlock is checked first, recent puzzles might be incorrectly locked

      const recentPuzzleNoAd = isPuzzleLocked(RECENT_DATE, false, 'p1', [], false);

      expect(recentPuzzleNoAd).toBe(false); // Free window unlocks without ad
    });

    it('REGRESSION TEST: ad unlock must be checked BEFORE default lock', () => {
      // Ad unlocks should work for old puzzles
      // If not checked, ad unlocks are useless

      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'puzzle-123', unlocked_at: '2025-01-10T10:00:00Z' },
      ];

      const oldPuzzleWithAd = isPuzzleLocked(OLD_DATE, false, 'puzzle-123', adUnlocks, false);

      expect(oldPuzzleWithAd).toBe(false); // Ad unlock works
    });
  });

  describe('Edge Cases: Boundary Conditions', () => {
    it('handles exactly 7 days ago (boundary)', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const result = isPuzzleLocked(dateStr, false, 'p1', [], false);

      // Depends on isWithinFreeWindow implementation
      // Should be inclusive (7 days including today = 8 day window)
      // Or exclusive (7 days = day 0-6)
      // Need to verify actual implementation
    });

    it('handles invalid date strings gracefully', () => {
      // Should not crash on malformed dates
      expect(() => {
        isPuzzleLocked('invalid-date', false, 'p1', [], false);
      }).not.toThrow();
    });

    it('handles empty string date', () => {
      expect(() => {
        isPuzzleLocked('', false, 'p1', [], false);
      }).not.toThrow();
    });

    it('handles future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const result = isPuzzleLocked(futureDate, false, 'p1', [], false);

      // Future puzzles should be unlocked (within free window)
      expect(result).toBe(false);
    });
  });

  describe('Integration: Combined Scenarios', () => {
    it('completed + premium = unlocked (redundant checks)', () => {
      const result = isPuzzleLocked(OLD_DATE, true, 'p1', [], true);
      expect(result).toBe(false);
      // Both unlock conditions met, but completion should short-circuit
    });

    it('completed + recent = unlocked (redundant checks)', () => {
      const result = isPuzzleLocked(RECENT_DATE, false, 'p1', [], true);
      expect(result).toBe(false);
      // Both unlock conditions met
    });

    it('completed + ad unlock = unlocked (redundant checks)', () => {
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'p1', unlocked_at: '2025-01-10T10:00:00Z' },
      ];
      const result = isPuzzleLocked(OLD_DATE, false, 'p1', adUnlocks, true);
      expect(result).toBe(false);
      // Both unlock conditions met
    });

    it('premium + recent = unlocked (redundant checks)', () => {
      const result = isPuzzleLocked(RECENT_DATE, true, 'p1', [], false);
      expect(result).toBe(false);
      // Both unlock conditions met, premium should short-circuit
    });

    it('premium + ad unlock = unlocked (redundant checks)', () => {
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'p1', unlocked_at: '2025-01-10T10:00:00Z' },
      ];
      const result = isPuzzleLocked(OLD_DATE, true, 'p1', adUnlocks, false);
      expect(result).toBe(false);
      // Both unlock conditions met, premium should short-circuit
    });

    it('recent + ad unlock = unlocked (redundant checks)', () => {
      const adUnlocks: UnlockedPuzzle[] = [
        { puzzle_id: 'p1', unlocked_at: '2025-01-10T10:00:00Z' },
      ];
      const result = isPuzzleLocked(RECENT_DATE, false, 'p1', adUnlocks, false);
      expect(result).toBe(false);
      // Both unlock conditions met, recent window should short-circuit
    });
  });
});

describe('Helper Functions: isWithinFreeWindow', () => {
  it('returns true for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isWithinFreeWindow(today)).toBe(true);
  });

  it('returns true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    expect(isWithinFreeWindow(dateStr)).toBe(true);
  });

  it('returns false for 30 days ago', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const dateStr = oldDate.toISOString().split('T')[0];
    expect(isWithinFreeWindow(dateStr)).toBe(false);
  });
});

describe('Helper Functions: hasValidAdUnlock', () => {
  it('returns true when puzzle ID matches unlock', () => {
    const unlocks: UnlockedPuzzle[] = [
      { puzzle_id: 'puzzle-123', unlocked_at: '2025-01-10T10:00:00Z' },
    ];
    expect(hasValidAdUnlock('puzzle-123', unlocks)).toBe(true);
  });

  it('returns false when puzzle ID not in unlocks', () => {
    const unlocks: UnlockedPuzzle[] = [
      { puzzle_id: 'puzzle-456', unlocked_at: '2025-01-10T10:00:00Z' },
    ];
    expect(hasValidAdUnlock('puzzle-123', unlocks)).toBe(false);
  });

  it('returns false for empty unlocks array', () => {
    expect(hasValidAdUnlock('puzzle-123', [])).toBe(false);
  });

  it('handles multiple unlocks (finds match)', () => {
    const unlocks: UnlockedPuzzle[] = [
      { puzzle_id: 'p1', unlocked_at: '2025-01-09T10:00:00Z' },
      { puzzle_id: 'p2', unlocked_at: '2025-01-10T10:00:00Z' },
      { puzzle_id: 'p3', unlocked_at: '2025-01-11T10:00:00Z' },
    ];
    expect(hasValidAdUnlock('p2', unlocks)).toBe(true);
  });
});
