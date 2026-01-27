import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useAuth, ONBOARDING_STORAGE_KEY, FirstRunModal } from '@/features/auth';

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
  const { isInitialized, isLoading: isAuthLoading, profile, updateDisplayName, user } = useAuth();

  // The single source of truth for the onboarding flow
  const [currentState, setCurrentState] = useState<OnboardingState>('UNKNOWN');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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
      // Check AsyncStorage first
      try {
        const storageValue = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!isMounted.current) return;

        if (storageValue === 'true') {
          // Previously completed -> Latch COMPLETED
          console.log('[Onboarding] Found completed in storage -> COMPLETED');
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

      // 2. Request App Tracking Transparency (ATT) on iOS
      // We do this here to ensure the prompt appears in context after user engagement
      if (Platform.OS === 'ios') {
        try {
          const { status } = await requestTrackingPermissionsAsync();
          console.log('[Onboarding] ATT status:', status);
        } catch (attError) {
          console.warn('[Onboarding] ATT request failed:', attError);
        }
      }

      // 3. Update Storage
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');

      // 4. Transition State -> COMPLETED
      setCurrentState('COMPLETED');


    } catch (error) {
      console.error('[OnboardingProvider] Submission failed:', error);
      throw error;
    }
  }, [updateDisplayName]);

  // Expose simplified state
  // isLoading is true if we haven't reached a final decision (Show or Complete)
  const isLoading = currentState === 'UNKNOWN' || currentState === 'CHECKING';
  const isOnboardingActive = currentState === 'SHOW_MODAL';

  return (
    <OnboardingContext.Provider value={{ isLoading, isOnboardingActive }}>
      {children}
      <FirstRunModal
        visible={isOnboardingActive}
        onSubmit={handleOnboardingSubmit}
        error={submissionError}
        testID="first-run-modal-root"
      />
    </OnboardingContext.Provider>
  );
}
