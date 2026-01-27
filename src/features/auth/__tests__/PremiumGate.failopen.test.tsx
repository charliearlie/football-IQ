/**
 * PremiumGate Fail-Open Security Tests
 *
 * CRITICAL: Tests for revenue-impacting security behavior
 *
 * The PremiumGate component changed from "fail-closed" (block when uncertain)
 * to "fail-open" (allow when uncertain) in the latest changes.
 *
 * RISK: If SQLite catalog sync fails, all puzzles become free.
 *
 * These tests verify the gate's behavior in edge cases where puzzle data
 * is missing, malformed, or delayed.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { PremiumGate } from '../components/PremiumGate';
import * as AuthContext from '@/features/auth/context/AuthContext';
import * as database from '@/lib/database';
import * as dateGrouping from '@/features/archive/utils/dateGrouping';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/auth/context/AuthContext');
jest.mock('@/lib/database');
jest.mock('@/features/archive/utils/dateGrouping');

describe('PremiumGate Fail-Open Security Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default: free user
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      profile: { is_premium: false },
      isLoading: false,
    });

    // Default: no ad unlocks
    (database.getValidAdUnlocks as jest.Mock).mockResolvedValue([]);
    (database.getPuzzle as jest.Mock).mockResolvedValue(null);

    // Default: date grouping returns locked for old dates
    (dateGrouping.isWithinFreeWindow as jest.Mock).mockReturnValue(false);
    (dateGrouping.isPuzzleLocked as jest.Mock).mockReturnValue(true);
  });

  describe('CRITICAL: Revenue Loss Scenarios', () => {
    it('allows free access when SQLite sync fails (no puzzle data) - fail-open behavior', async () => {
      // Scenario: Free user tries to access locked puzzle
      // But SQLite catalog not synced yet (puzzle data missing)
      // NEW behavior: Allow access (fail-open)
      // This is intentional to prioritize UX for recent puzzles

      (database.getPuzzle as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-old-locked" puzzleDate={undefined}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      // Wait for async effects
      await waitFor(() => {
        // CURRENT BEHAVIOR: Renders children (free access)
        expect(getByText('Protected Content')).toBeTruthy();
      });

      // Note: This is a TRADE-OFF - UX over strict security
    });

    it('allows free access when puzzleDate param is missing - fail-open behavior', async () => {
      // Scenario: Navigation params are corrupted/missing
      // No puzzleDate provided, SQLite returns null
      // NEW behavior: Allow access (fail-open)

      (database.getPuzzle as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={undefined}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // Allows access even though we can't verify lock status
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });

    it('blocks access when puzzle is explicitly locked (expected behavior)', async () => {
      // Scenario: Puzzle date confirms it's locked (outside 7-day window)
      const oldDate = '2024-12-01'; // 40+ days ago

      (database.getPuzzle as jest.Mock).mockResolvedValue({
        id: 'puzzle-123',
        puzzle_date: oldDate
      });
      (dateGrouping.isWithinFreeWindow as jest.Mock).mockReturnValue(false);
      (dateGrouping.isPuzzleLocked as jest.Mock).mockReturnValue(true);

      const { queryByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // Should block (show loading fallback)
        expect(queryByText('Protected Content')).toBeFalsy();
      });

      // Should redirect to archive with unlock modal
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/archive',
          params: expect.objectContaining({
            showUnlock: 'true',
            unlockPuzzleId: 'puzzle-123',
          }),
        })
      );
    });
  });

  describe('Edge Cases: Malformed Data', () => {
    it('handles null puzzleDate gracefully', async () => {
      (database.getPuzzle as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={null as unknown as undefined}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // Currently allows access (fail-open)
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });

    it('handles empty string puzzleDate', async () => {
      (database.getPuzzle as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate="">
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // Fail-open behavior
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });

    it('handles malformed date strings', async () => {
      (database.getPuzzle as jest.Mock).mockResolvedValue({
        puzzle_date: 'invalid-date'
      });

      // Should not crash, but behavior is undefined
      const { root } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate="invalid-date">
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      expect(root).toBeTruthy();
    });
  });

  describe('Premium User Bypass', () => {
    it('allows premium users immediate access without date check', async () => {
      // Premium users should ALWAYS get fast access
      (AuthContext.useAuth as jest.Mock).mockReturnValue({
        profile: { is_premium: true },
        isLoading: false,
      });

      (database.getPuzzle as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={undefined}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // Premium gets immediate access
        expect(getByText('Protected Content')).toBeTruthy();
      });
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Recent Puzzle Access (7-day window)', () => {
    it('allows access to puzzles within 7-day window', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentDate = yesterday.toISOString().split('T')[0];

      (database.getPuzzle as jest.Mock).mockResolvedValue({
        puzzle_date: recentDate
      });
      (dateGrouping.isWithinFreeWindow as jest.Mock).mockReturnValue(true);
      (dateGrouping.isPuzzleLocked as jest.Mock).mockReturnValue(false);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={recentDate}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // Should allow access (within free window)
        expect(getByText('Protected Content')).toBeTruthy();
      });
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Ad Unlock Access', () => {
    it('allows access when puzzle is ad-unlocked', async () => {
      const oldDate = '2024-12-01';

      (database.getValidAdUnlocks as jest.Mock).mockResolvedValue([
        { puzzle_id: 'puzzle-123', expires_at: new Date(Date.now() + 86400000).toISOString() }
      ]);
      (database.getPuzzle as jest.Mock).mockResolvedValue({
        puzzle_date: oldDate
      });
      (dateGrouping.isWithinFreeWindow as jest.Mock).mockReturnValue(false);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Performance: Multiple Re-renders', () => {
    it('does not create navigation loops', async () => {
      const oldDate = '2024-12-01';

      (database.getPuzzle as jest.Mock).mockResolvedValue({
        puzzle_date: oldDate
      });
      (dateGrouping.isWithinFreeWindow as jest.Mock).mockReturnValue(false);
      (dateGrouping.isPuzzleLocked as jest.Mock).mockReturnValue(true);

      const { rerender } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        // First render triggers navigation
        expect(mockRouter.replace).toHaveBeenCalledTimes(1);
      });

      // Re-render should NOT trigger navigation again (hasNavigatedRef)
      rerender(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      expect(mockRouter.replace).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });
});

describe('PremiumGate Comparison: Fail-Closed vs Fail-Open', () => {
  it('documents the behavior change', () => {
    // OLD BEHAVIOR (fail-closed):
    // - If puzzleDate is missing → Block access, redirect to premium modal
    // - Rationale: Cannot verify if puzzle should be free, err on side of caution
    // - Risk: Might block legitimate access to recent puzzles during sync delay

    // NEW BEHAVIOR (fail-open):
    // - If puzzleDate is missing → Allow access, assume it's accessible
    // - Rationale: Better UX for recent puzzles that haven't synced yet
    // - Risk: Might allow free access to old locked puzzles during sync failure

    // TRADE-OFF DECISION:
    // UX (smoother experience) vs Security (revenue protection)
    // Current code chose UX > Security

    expect(true).toBe(true); // Placeholder for documentation
  });
});
