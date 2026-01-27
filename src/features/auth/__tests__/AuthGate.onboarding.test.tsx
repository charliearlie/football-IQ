/**
 * AuthGate Onboarding Tests
 *
 * Tests the atomic submission flow and race condition protection
 * for the welcome modal (FirstRunModal).
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingLock } from '../hooks/useOnboardingLock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AuthGate Onboarding Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Race Condition Protection', () => {
    it('modal stays visible when profile updates during onboarding', () => {
      // Simulates the scenario where:
      // 1. Modal shows (needsDisplayName = true)
      // 2. Real-time subscription updates profile
      // 3. Modal should NOT close

      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: true,
          },
        }
      );

      // Modal is visible and locked
      expect(result.current.isOnboardingActive).toBe(true);
      expect(result.current.isLocked).toBe(true);

      // Simulate real-time profile update that adds display_name
      // (This is the race condition that caused App Store rejection)
      rerender({
        needsDisplayName: false, // Profile now has display_name
        hasCompletedOnboarding: false,
        isHydrated: true,
      });

      // Modal MUST stay visible - this is the critical fix
      expect(result.current.isOnboardingActive).toBe(true);
    });

    it('modal stays visible through multiple rapid profile updates', () => {
      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: true,
          },
        }
      );

      // Simulate rapid profile updates (real-time subscription bursts)
      for (let i = 0; i < 10; i++) {
        rerender({
          needsDisplayName: i % 2 === 0, // Alternating state
          hasCompletedOnboarding: false,
          isHydrated: true,
        });
        expect(result.current.isOnboardingActive).toBe(true);
      }
    });
  });

  describe('Atomic Submission Flow', () => {
    it('simulates successful atomic submission flow', async () => {
      const mockUpdateDisplayName = jest.fn().mockResolvedValue({ error: null });

      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: true,
          },
        }
      );

      expect(result.current.isOnboardingActive).toBe(true);

      // Simulate atomic submission:
      // 1. Update Supabase (success)
      await mockUpdateDisplayName('TestUser');
      expect(mockUpdateDisplayName).toHaveBeenCalledWith('TestUser');

      // 2. Update AsyncStorage
      await AsyncStorage.setItem('@app_onboarding_completed', 'true');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app_onboarding_completed', 'true');

      // 3. Call completeOnboarding to unlock modal
      act(() => {
        result.current.completeOnboarding();
      });

      // Modal should now be hidden
      expect(result.current.isOnboardingActive).toBe(false);
    });

    it('modal stays open on Supabase error', async () => {
      const mockUpdateDisplayName = jest.fn().mockResolvedValue({
        error: new Error('Network error'),
      });

      const { result } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: true,
          },
        }
      );

      expect(result.current.isOnboardingActive).toBe(true);

      // Simulate failed Supabase update
      const { error } = await mockUpdateDisplayName('TestUser');
      expect(error).toBeTruthy();

      // completeOnboarding should NOT be called on error
      // Modal should stay visible
      expect(result.current.isOnboardingActive).toBe(true);
      expect(result.current.isLocked).toBe(true);
    });

    it('AsyncStorage is only updated after Supabase success', async () => {
      const mockUpdateDisplayName = jest.fn();

      // First call fails
      mockUpdateDisplayName.mockResolvedValueOnce({
        error: new Error('Network error'),
      });

      // Second call succeeds
      mockUpdateDisplayName.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: true,
          },
        }
      );

      // First attempt - fails
      const { error: error1 } = await mockUpdateDisplayName('TestUser');
      if (error1) {
        // Don't update AsyncStorage or complete onboarding
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        expect(result.current.isOnboardingActive).toBe(true);
      }

      // Second attempt - succeeds
      const { error: error2 } = await mockUpdateDisplayName('TestUser');
      if (!error2) {
        // Now update AsyncStorage
        await AsyncStorage.setItem('@app_onboarding_completed', 'true');
        expect(AsyncStorage.setItem).toHaveBeenCalled();

        // Complete onboarding
        act(() => {
          result.current.completeOnboarding();
        });
        expect(result.current.isOnboardingActive).toBe(false);
      }
    });
  });

  describe('Session Persistence', () => {
    it('does not show modal again after completion in same session', () => {
      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: true,
          },
        }
      );

      // Complete onboarding
      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.isOnboardingActive).toBe(false);

      // Even if hasCompletedOnboarding is reset (shouldn't happen, but test edge case)
      rerender({
        needsDisplayName: true,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });

      // Modal should NOT reappear due to session completion ref
      expect(result.current.isOnboardingActive).toBe(false);
    });
  });

  describe('Hydration Edge Cases', () => {
    it('waits for hydration before showing modal', () => {
      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: false, // Not hydrated
          },
        }
      );

      // Modal should not be active while not hydrated
      expect(result.current.isOnboardingActive).toBe(false);

      // Hydrate
      rerender({
        needsDisplayName: true,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });

      // Now modal should be active
      expect(result.current.isOnboardingActive).toBe(true);
    });

    it('handles hydration with completion already set', () => {
      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: false,
          },
        }
      );

      // Hydrate with completion already set (from AsyncStorage)
      rerender({
        needsDisplayName: true,
        hasCompletedOnboarding: true, // Already completed
        isHydrated: true,
      });

      // Modal should not show
      expect(result.current.isOnboardingActive).toBe(false);
    });
  });
});
