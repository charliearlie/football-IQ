/**
 * useOnboardingLock Hook
 *
 * Manages the "lock" state for the onboarding flow to prevent race conditions.
 *
 * Problem solved:
 * The welcome modal's visibility depends on profile?.display_name, which can
 * change unexpectedly due to real-time Supabase subscriptions. This causes the
 * modal to close prematurely, leading to App Store rejection.
 *
 * Solution:
 * Once the modal is shown, it becomes "locked" - external state changes cannot
 * close it. Only explicit completion (after successful submission) can unlock
 * and hide the modal.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

interface UseOnboardingLockOptions {
  /** Whether user needs display name (from profile state) */
  needsDisplayName: boolean;
  /** Whether onboarding has been marked complete in AsyncStorage */
  hasCompletedOnboarding: boolean;
  /** Whether AsyncStorage state has been hydrated */
  isHydrated: boolean;
}

interface UseOnboardingLockResult {
  /** Whether the onboarding modal should be visible */
  isOnboardingActive: boolean;
  /** Lock the onboarding state manually (usually auto-locks) */
  lockOnboarding: () => void;
  /** Unlock and complete onboarding (call after successful submission) */
  completeOnboarding: () => void;
  /** Whether onboarding is currently locked */
  isLocked: boolean;
}

export function useOnboardingLock({
  needsDisplayName,
  hasCompletedOnboarding,
  isHydrated,
}: UseOnboardingLockOptions): UseOnboardingLockResult {
  // Internal lock state - once true, external changes cannot close modal
  const [isLocked, setIsLocked] = useState(false);

  // Track if we've completed onboarding this session (prevents re-showing)
  const hasBeenCompletedRef = useRef(false);

  // Track previous active state for auto-lock detection
  const wasActiveRef = useRef(false);

  const lockOnboarding = useCallback(() => {
    setIsLocked(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    hasBeenCompletedRef.current = true;
    setIsLocked(false);
  }, []);

  // Determine if onboarding should be active
  const isOnboardingActive = useMemo(() => {
    // Not ready yet - don't show
    if (!isHydrated) return false;

    // Already completed this session - never show again
    if (hasBeenCompletedRef.current) return false;

    // Already marked complete in AsyncStorage - don't show
    if (hasCompletedOnboarding) return false;

    // If locked, stay visible regardless of profile state
    // This is the key protection against race conditions
    if (isLocked) return true;

    // Initial determination: show if needs display name
    return needsDisplayName;
  }, [isHydrated, hasCompletedOnboarding, isLocked, needsDisplayName]);

  // Auto-lock when modal first becomes active
  // This prevents profile updates from closing it unexpectedly
  useEffect(() => {
    if (isOnboardingActive && !wasActiveRef.current && !isLocked) {
      // Modal just became active for the first time - lock it
      setIsLocked(true);
    }
    wasActiveRef.current = isOnboardingActive;
  }, [isOnboardingActive, isLocked]);

  return {
    isOnboardingActive,
    lockOnboarding,
    completeOnboarding,
    isLocked,
  };
}
