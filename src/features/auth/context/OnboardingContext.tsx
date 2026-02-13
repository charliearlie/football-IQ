import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePostHog } from 'posthog-react-native';
import { useRouter, type Href } from 'expo-router';
import { useAuth, ONBOARDING_STORAGE_KEY, FirstRunModal } from '@/features/auth';
import { ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import {
  isOnboardingCompletedSecure,
  setOnboardingCompleted,
} from '../services/SecureIdentityService';

const TUTORIAL_STORAGE_KEY = '@tutorial_completed';

/**
 * Onboarding State Machine
 *
 * UNKNOWN: Initial state, waiting for hydration and auth.
 * CHECKING: Auth is ready, checking profile/rules to see if onboarding is needed.
 * SHOW_MODAL: Decision made to SHOW. Latched state. Cannot exit except by completion.
 * COMPLETED: Decision made to HIDE. Latched state.
 */
type OnboardingState = 'UNKNOWN' | 'CHECKING' | 'SHOW_MODAL' | 'COMPLETED';

interface OnboardingContextValue {
  isLoading: boolean;
  isOnboardingActive: boolean;
  isTutorialComplete: boolean;
  completeTutorial: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const router = useRouter();
  const { isInitialized, isLoading: isAuthLoading, profile, updateDisplayName, user } = useAuth();

  // The single source of truth for the onboarding flow
  const [currentState, setCurrentState] = useState<OnboardingState>('UNKNOWN');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isTutorialComplete, setIsTutorialComplete] = useState(false);

  // Refs to prevent effects from running when unmounted
  const isMounted = useRef(true);

  // Effect: State Transition Logic
  useEffect(() => {
    isMounted.current = true;

    const runStateMachine = async () => {
      // 1. If we are already latched in a final state, DO NOTHING.
      // This is the race-condition killer.
      if (currentState === 'SHOW_MODAL' || currentState === 'COMPLETED') {
        return;
      }

      // 2. Wait for base systems (Auth & User)
      if (!isInitialized || isAuthLoading) {
        // Still loading auth, stay in UNKNOWN (or transition to it if needed)
        // But since we start in UNKNOWN, usually we just wait.
        return;
      }

      // 3. User is ready (or null if anonymous/failed, but initialized)
      // Check SecureStore first (survives reinstall), then AsyncStorage
      try {
        // First check SecureStore (Keychain/Keystore - survives reinstall)
        const secureCompleted = await isOnboardingCompletedSecure();
        if (!isMounted.current) return;

        if (secureCompleted) {
          // Previously completed (from SecureStore) -> Latch COMPLETED
          console.log('[Onboarding] Found completed in SecureStore -> COMPLETED');
          // Also repair AsyncStorage if needed
          AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true').catch(() => {});
          setCurrentState('COMPLETED');
          return;
        }

        // Then check AsyncStorage (normal case)
        const storageValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!isMounted.current) return;

        if (storageValue === 'true') {
          // Previously completed in AsyncStorage -> Latch COMPLETED
          console.log('[Onboarding] Found completed in AsyncStorage -> COMPLETED');
          // Also save to SecureStore for future reinstall recovery
          setOnboardingCompleted().catch(() => {});
          setCurrentState('COMPLETED');
          return;
        }
      } catch (e) {
        console.warn('[Onboarding] Storage check failed, continuing to profile check', e);
      }

      // 4. If not in storage, we rely on Profile check
      // We need to wait for profile to be loaded if we have a user
      if (user && !profile) {
         // Profile still loading, transition to CHECKING (if not already)
         // ensuring we show loading screen instead of flashing modal
         if (currentState !== 'CHECKING') {
           setCurrentState('CHECKING');
         }
         return;
      }

      // 5. Final Decision
      // If we are here, we have Auth + (User -> Profile).
      const hasDisplayName = !!profile?.display_name;

      if (hasDisplayName) {
        // Has name but maybe missed storage update -> Latch COMPLETED & Repair Storage
        console.log('[Onboarding] Profile has name -> COMPLETED');
        AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true').catch(() => {});
        setCurrentState('COMPLETED');
      } else {
        // No name, no storage record -> Latch SHOW_MODAL
        console.log('[Onboarding] No name, no storage -> SHOW_MODAL');
        setCurrentState('SHOW_MODAL');
      }
    };

    runStateMachine();

    return () => {
      isMounted.current = false;
    };
  }, [
    isInitialized,
    isAuthLoading,
    user,
    profile,
    currentState, // Dep for latch check
  ]);

  const handleOnboardingSubmit = useCallback(async (displayName: string) => {
    setSubmissionError(null);
    try {
      // 1. Update Server
      const { error } = await updateDisplayName(displayName);
      if (error) {
        setSubmissionError('Failed to save. Please try again.');
        throw error;
      }

      // 2. Update Storage (both AsyncStorage and SecureStore)
      // Note: ATT is now requested in _layout.tsx AuthGate after app loads
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      // Also save to SecureStore for reinstall recovery
      await setOnboardingCompleted();

      // 3. Transition State -> COMPLETED
      setCurrentState('COMPLETED');

      try {
        posthog?.capture(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
          has_display_name: !!displayName,
        });
      } catch { /* analytics should never crash the app */ }

    } catch (error) {
      console.error('[OnboardingProvider] Submission failed:', error);
      throw error;
    }
  }, [updateDisplayName, posthog]);

  const completeTutorial = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      setIsTutorialComplete(true);
      console.log('[OnboardingProvider] Tutorial marked as complete');

      try {
        posthog?.capture('tutorial_completed');
      } catch { /* analytics should never crash the app */ }
    } catch (error) {
      console.error('[OnboardingProvider] Failed to save tutorial completion:', error);
    }
  }, [posthog]);

  /**
   * Navigate to today's Career Path puzzle after onboarding completion.
   * Falls back to home screen if no Career Path puzzle exists.
   */
  const handlePostOnboardingNavigation = useCallback(() => {
    // Import PuzzleContext dynamically to get today's Career Path puzzle
    // For now, navigate to career-path route which auto-loads today's puzzle
    // The Career Path screen will handle tutorial overlay if needed

    // We can't directly access PuzzleContext here due to provider hierarchy
    // So we'll use a route param to signal tutorial mode
    console.log('[OnboardingProvider] Navigating to Career Path for tutorial');

    try {
      // Navigate to career-path route (without specific puzzle ID)
      // The Career Path index route should redirect to today's puzzle
      router.push('/career-path' as Href);
    } catch (error) {
      console.warn('[OnboardingProvider] Navigation failed, falling back to home', error);
      router.push('/' as Href);
    }
  }, [router]);

  // Load tutorial completion status from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_STORAGE_KEY).then((value) => {
      setIsTutorialComplete(value === 'true');
    }).catch(() => {
      // If read fails, assume not completed
      setIsTutorialComplete(false);
    });
  }, []);

  // Expose simplified state
  // isLoading is true if we haven't reached a final decision (Show or Complete)
  const isLoading = currentState === 'UNKNOWN' || currentState === 'CHECKING';
  const isOnboardingActive = currentState === 'SHOW_MODAL';

  return (
    <OnboardingContext.Provider value={{ isLoading, isOnboardingActive, isTutorialComplete, completeTutorial }}>
      {children}
      <FirstRunModal
        visible={isOnboardingActive}
        onSubmit={handleOnboardingSubmit}
        onSubmitSuccess={isTutorialComplete ? undefined : handlePostOnboardingNavigation}
        error={submissionError}
        testID="first-run-modal-root"
      />
    </OnboardingContext.Provider>
  );
}
