/**
 * Onboarding Context
 *
 * Manages "has seen intro" state for each game mode.
 * Persists to AsyncStorage so first-time intro screens only show once.
 *
 * Usage:
 * - Wrap app with <OnboardingProvider>
 * - Use useOnboardingContext() in game screens
 * - Or use the simpler useOnboarding(gameMode) hook
 */

import React, {
  createContext,
  use,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types/puzzle.types';
import {
  OnboardingContextValue,
  OnboardingState,
  getOnboardingStorageKey,
  ONBOARDING_STORAGE_KEY_PREFIX,
} from '../types/onboarding.types';
import { getAllGameModes } from '../constants/rules';

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

/**
 * Provider for game onboarding state.
 * Manages AsyncStorage persistence for "has seen intro" flags.
 */
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [hasSeenIntro, setHasSeenIntro] = useState<OnboardingState>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const isMounted = useRef(true);

  // Load all onboarding states from AsyncStorage on mount
  useEffect(() => {
    isMounted.current = true;

    async function hydrate() {
      try {
        const gameModes = getAllGameModes();
        const keys = gameModes.map(getOnboardingStorageKey);
        const results = await AsyncStorage.multiGet(keys);

        if (!isMounted.current) return;

        const state: OnboardingState = {};
        results.forEach(([key, value]) => {
          // Extract game mode from key: @onboarding_seen_career_path -> career_path
          const gameMode = key.replace(ONBOARDING_STORAGE_KEY_PREFIX, '') as GameMode;
          state[gameMode] = value === 'true';
        });

        setHasSeenIntro(state);
      } catch (error) {
        console.error('[Onboarding] Failed to hydrate from AsyncStorage:', error);
      } finally {
        if (isMounted.current) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();

    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Mark a game mode intro as seen
   */
  const markIntroSeen = useCallback(async (gameMode: GameMode) => {
    try {
      const key = getOnboardingStorageKey(gameMode);
      await AsyncStorage.setItem(key, 'true');

      if (isMounted.current) {
        setHasSeenIntro((prev) => ({ ...prev, [gameMode]: true }));
      }
    } catch (error) {
      console.error('[Onboarding] Failed to mark intro seen:', error);
    }
  }, []);

  /**
   * Check if user has seen intro for a game mode
   */
  const hasUserSeenIntro = useCallback(
    (gameMode: GameMode): boolean => {
      return hasSeenIntro[gameMode] ?? false;
    },
    [hasSeenIntro]
  );

  /**
   * Reset intro seen status for a game mode (for testing)
   */
  const resetIntroSeen = useCallback(async (gameMode: GameMode) => {
    try {
      const key = getOnboardingStorageKey(gameMode);
      await AsyncStorage.removeItem(key);

      if (isMounted.current) {
        setHasSeenIntro((prev) => ({ ...prev, [gameMode]: false }));
      }
    } catch (error) {
      console.error('[Onboarding] Failed to reset intro:', error);
    }
  }, []);

  /**
   * Reset all intro statuses (for testing/dev)
   */
  const resetAllIntros = useCallback(async () => {
    try {
      const gameModes = getAllGameModes();
      const keys = gameModes.map(getOnboardingStorageKey);
      await AsyncStorage.multiRemove(keys);

      if (isMounted.current) {
        setHasSeenIntro({});
      }
    } catch (error) {
      console.error('[Onboarding] Failed to reset all intros:', error);
    }
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hasSeenIntro,
      isHydrated,
      markIntroSeen,
      hasUserSeenIntro,
      resetIntroSeen,
      resetAllIntros,
    }),
    [hasSeenIntro, isHydrated, markIntroSeen, hasUserSeenIntro, resetIntroSeen, resetAllIntros]
  );

  return (
    <OnboardingContext value={value}>
      {children}
    </OnboardingContext>
  );
}

/**
 * Hook to access the full onboarding context.
 * For simpler usage in game screens, use useOnboarding(gameMode) instead.
 *
 * @throws Error if used outside OnboardingProvider
 */
export function useOnboardingContext(): OnboardingContextValue {
  const context = use(OnboardingContext);
  if (!context) {
    throw new Error(
      'useOnboardingContext must be used within an OnboardingProvider. ' +
        'Make sure <OnboardingProvider> is in your app layout.'
    );
  }
  return context;
}
