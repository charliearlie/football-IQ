/**
 * @jest-environment node
 *
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
import { render } from '@testing-library/react-native';
import { PremiumGate } from '../components/PremiumGate';
import * as useStablePuzzle from '@/features/puzzles/hooks/useStablePuzzle';
import * as useAuth from '@/features/auth/hooks/useAuth';
import * as useAdUnlocks from '@/features/ads/hooks/useAdUnlocks';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/puzzles/hooks/useStablePuzzle');
jest.mock('@/features/auth/hooks/useAuth');
jest.mock('@/features/ads/hooks/useAdUnlocks');

describe('PremiumGate Fail-Open Security Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default: free user, no ad unlocks
    (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
      isPremium: false,
      isLoading: false,
    } as any);

    (useAdUnlocks as jest.MockedFunction<typeof useAdUnlocks>).mockReturnValue({
      adUnlocks: [],
      isLoading: false,
      areAdUnlocksLoaded: true,
    } as any);
  });

  describe('CRITICAL: Revenue Loss Scenarios', () => {
    it('🚨 FAILS: allows free access when SQLite sync fails (no puzzle data)', () => {
      // Scenario: Free user tries to access locked puzzle
      // But SQLite catalog not synced yet (puzzle data missing)
      // Expected OLD behavior: Block access (fail-closed)
      // Actual NEW behavior: Allow access (fail-open) ❌

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: null, // SQLite not synced
        isLoading: false,
        error: null,
      } as any);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-old-locked" puzzleDate={undefined}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // CURRENT BEHAVIOR: Renders children (free access)
      expect(getByText('Protected Content')).toBeTruthy();
      expect(mockRouter.push).not.toHaveBeenCalled();

      // 🚨 RISK: Free user gets access to locked content
      // This is a REVENUE LOSS bug if it happens for old puzzles
    });

    it('🚨 FAILS: allows free access when puzzleDate param is missing', () => {
      // Scenario: Navigation params are corrupted/missing
      // No puzzleDate provided, SQLite returns null
      // Expected: Block access until we can verify date
      // Actual: Allow access (fail-open)

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: null,
        isLoading: false,
        error: null,
      } as any);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={undefined}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // Allows access even though we can't verify lock status
      expect(getByText('Protected Content')).toBeTruthy();

      // 🚨 SECURITY FLAW: Cannot verify if puzzle should be locked
    });

    it('🚨 FAILS: allows access during SQLite loading (race condition)', () => {
      // Scenario: User navigates quickly, SQLite query still pending
      // The gate checks before data is ready
      // Expected: Show loading state, then block if locked
      // Actual: Might allow access if timing is wrong

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: null,
        isLoading: true, // Still loading
        error: null,
      } as any);

      const { queryByText } = render(
        <PremiumGate puzzleId="puzzle-locked" puzzleDate={undefined}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // During loading, should NOT render protected content
      // But fail-open logic might allow it through
      const content = queryByText('Protected Content');

      // If this passes, it means we're blocking during load (good)
      // If this fails, we're allowing access during load (bad)
      expect(content).toBeFalsy(); // Currently blocks (GOOD)
    });

    it('blocks access when puzzle is explicitly locked (expected behavior)', () => {
      // Scenario: Puzzle date confirms it's locked (outside 7-day window)
      const oldDate = '2024-12-01'; // 40+ days ago

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: { id: 'puzzle-123', puzzle_date: oldDate } as any,
        isLoading: false,
        error: null,
      } as any);

      const { queryByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // Should block (show loading fallback)
      expect(queryByText('Protected Content')).toBeFalsy();

      // Should redirect to premium modal
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/premium-modal',
        params: { puzzleDate: oldDate, mode: 'blocked' },
      });
    });
  });

  describe('Edge Cases: Malformed Data', () => {
    it('handles null puzzleDate gracefully', () => {
      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: null,
        isLoading: false,
        error: null,
      } as any);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={null as any}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // Currently allows access (fail-open)
      expect(getByText('Protected Content')).toBeTruthy();
    });

    it('handles empty string puzzleDate', () => {
      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: null,
        isLoading: false,
        error: null,
      } as any);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate="">
          <div>Protected Content</div>
        </PremiumGate>
      );

      // Fail-open behavior
      expect(getByText('Protected Content')).toBeTruthy();
    });

    it('handles malformed date strings', () => {
      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: { puzzle_date: 'invalid-date' } as any,
        isLoading: false,
        error: null,
      } as any);

      // Should not crash, but behavior is undefined
      const { container } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate="invalid-date">
          <div>Protected Content</div>
        </PremiumGate>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Premium User Bypass', () => {
    it('allows premium users immediate access without date check', () => {
      // Premium users should ALWAYS get fast access
      (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
        isPremium: true,
        isLoading: false,
      } as any);

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: null, // Even with missing data
        isLoading: false,
        error: null,
      } as any);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={undefined}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // Premium gets immediate access
      expect(getByText('Protected Content')).toBeTruthy();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Recent Puzzle Access (7-day window)', () => {
    it('allows access to puzzles within 7-day window', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentDate = yesterday.toISOString().split('T')[0];

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: { puzzle_date: recentDate } as any,
        isLoading: false,
        error: null,
      } as any);

      const { getByText } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={recentDate}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // Should allow access (within free window)
      expect(getByText('Protected Content')).toBeTruthy();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Performance: Multiple Re-renders', () => {
    it('does not create navigation loops', () => {
      const oldDate = '2024-12-01';

      (useStablePuzzle as jest.MockedFunction<typeof useStablePuzzle>).mockReturnValue({
        puzzle: { puzzle_date: oldDate } as any,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = render(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      // First render triggers navigation
      expect(mockRouter.push).toHaveBeenCalledTimes(1);

      // Re-render should NOT trigger navigation again (hasNavigatedRef)
      rerender(
        <PremiumGate puzzleId="puzzle-123" puzzleDate={oldDate}>
          <div>Protected Content</div>
        </PremiumGate>
      );

      expect(mockRouter.push).toHaveBeenCalledTimes(1); // Still 1, not 2
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
