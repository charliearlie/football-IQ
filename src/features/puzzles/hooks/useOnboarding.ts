/**
 * useOnboarding Hook
 *
 * Simple hook for managing onboarding state for a specific game mode.
 * Use this in game screens to check if intro should be shown.
 *
 * @example
 * ```tsx
 * function CareerPathScreen() {
 *   const { shouldShowIntro, isReady, completeIntro } = useOnboarding('career_path');
 *
 *   if (!isReady) {
 *     return <LoadingIndicator />;
 *   }
 *
 *   if (shouldShowIntro) {
 *     return <GameIntroScreen gameMode="career_path" onStart={completeIntro} />;
 *   }
 *
 *   return <GameContent />;
 * }
 * ```
 */

import { useCallback } from 'react';
import { GameMode } from '../types/puzzle.types';
import { UseOnboardingResult } from '../types/onboarding.types';
import { useOnboardingContext } from '../context/OnboardingContext';

/**
 * Hook to manage onboarding state for a specific game mode.
 *
 * @param gameMode - The game mode to check onboarding for
 * @returns Onboarding state and actions
 */
export function useOnboarding(gameMode: GameMode): UseOnboardingResult {
  const { hasUserSeenIntro, markIntroSeen, isHydrated } = useOnboardingContext();

  // Show intro if hydrated and user hasn't seen it
  const shouldShowIntro = isHydrated && !hasUserSeenIntro(gameMode);

  // Ready when hydration is complete
  const isReady = isHydrated;

  // Mark intro as seen and transition to game
  const completeIntro = useCallback(async () => {
    await markIntroSeen(gameMode);
  }, [gameMode, markIntroSeen]);

  return {
    shouldShowIntro,
    isReady,
    completeIntro,
  };
}
