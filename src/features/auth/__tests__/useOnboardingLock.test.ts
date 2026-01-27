import { renderHook, act } from '@testing-library/react-native';
import { useOnboardingLock } from '../hooks/useOnboardingLock';

describe('useOnboardingLock', () => {
  describe('initial state', () => {
    it('returns isOnboardingActive false when not hydrated', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: true,
          hasCompletedOnboarding: false,
          isHydrated: false,
        })
      );

      expect(result.current.isOnboardingActive).toBe(false);
      expect(result.current.isLocked).toBe(false);
    });

    it('returns isOnboardingActive true when hydrated and needs display name', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: true,
          hasCompletedOnboarding: false,
          isHydrated: true,
        })
      );

      expect(result.current.isOnboardingActive).toBe(true);
    });

    it('returns isOnboardingActive false when already completed in storage', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: true,
          hasCompletedOnboarding: true,
          isHydrated: true,
        })
      );

      expect(result.current.isOnboardingActive).toBe(false);
    });

    it('returns isOnboardingActive false when display name already exists', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: false,
          hasCompletedOnboarding: false,
          isHydrated: true,
        })
      );

      expect(result.current.isOnboardingActive).toBe(false);
    });
  });

  describe('auto-lock behavior', () => {
    it('auto-locks when modal becomes active', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: true,
          hasCompletedOnboarding: false,
          isHydrated: true,
        })
      );

      // Should auto-lock when first becomes active
      expect(result.current.isOnboardingActive).toBe(true);
      expect(result.current.isLocked).toBe(true);
    });
  });

  describe('lock protection against external state changes', () => {
    it('keeps modal visible when locked, even if needsDisplayName becomes false', () => {
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

      // Modal should be active and locked
      expect(result.current.isOnboardingActive).toBe(true);
      expect(result.current.isLocked).toBe(true);

      // Simulate profile update that sets display_name (race condition scenario)
      rerender({
        needsDisplayName: false, // Profile now has display name
        hasCompletedOnboarding: false,
        isHydrated: true,
      });

      // Modal should STILL be visible because it's locked
      // This is the key protection against race conditions
      expect(result.current.isOnboardingActive).toBe(true);
      expect(result.current.isLocked).toBe(true);
    });

    it('keeps modal visible during multiple external state changes', () => {
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

      // Simulate multiple profile updates
      rerender({
        needsDisplayName: false,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });
      expect(result.current.isOnboardingActive).toBe(true);

      rerender({
        needsDisplayName: true,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });
      expect(result.current.isOnboardingActive).toBe(true);

      rerender({
        needsDisplayName: false,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });
      expect(result.current.isOnboardingActive).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('hides modal only after completeOnboarding is called', () => {
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
      expect(result.current.isLocked).toBe(true);

      // Complete the onboarding
      act(() => {
        result.current.completeOnboarding();
      });

      // Now modal should hide
      expect(result.current.isOnboardingActive).toBe(false);
      expect(result.current.isLocked).toBe(false);
    });

    it('does not show modal again after completion, even if conditions would trigger it', () => {
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

      // Simulate a state that would normally trigger the modal
      // (e.g., if AsyncStorage was cleared but ref remembers completion)
      rerender({
        needsDisplayName: true,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });

      // Modal should NOT reappear - session completion takes precedence
      expect(result.current.isOnboardingActive).toBe(false);
    });
  });

  describe('lockOnboarding', () => {
    it('allows manual locking', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: false,
          hasCompletedOnboarding: false,
          isHydrated: true,
        })
      );

      // Not active initially (no display name needed)
      expect(result.current.isOnboardingActive).toBe(false);
      expect(result.current.isLocked).toBe(false);

      // Manually lock
      act(() => {
        result.current.lockOnboarding();
      });

      expect(result.current.isLocked).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles hydration transition correctly', () => {
      const { result, rerender } = renderHook(
        (props) => useOnboardingLock(props),
        {
          initialProps: {
            needsDisplayName: true,
            hasCompletedOnboarding: false,
            isHydrated: false, // Not hydrated yet
          },
        }
      );

      // Not active while not hydrated
      expect(result.current.isOnboardingActive).toBe(false);

      // Hydrate
      rerender({
        needsDisplayName: true,
        hasCompletedOnboarding: false,
        isHydrated: true,
      });

      // Now active and locked
      expect(result.current.isOnboardingActive).toBe(true);
      expect(result.current.isLocked).toBe(true);
    });

    it('respects hasCompletedOnboarding from storage even if needsDisplayName is true', () => {
      const { result } = renderHook(() =>
        useOnboardingLock({
          needsDisplayName: true, // Would normally trigger modal
          hasCompletedOnboarding: true, // But storage says completed
          isHydrated: true,
        })
      );

      // Storage completion takes precedence
      expect(result.current.isOnboardingActive).toBe(false);
    });
  });
});
