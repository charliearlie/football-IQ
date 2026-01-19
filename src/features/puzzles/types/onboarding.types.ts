/**
 * Type definitions for the Onboarding feature.
 *
 * Manages "has seen intro" state for each game mode,
 * persisted to AsyncStorage.
 */

import { GameMode } from './puzzle.types';

/**
 * Storage key prefix for onboarding status.
 * Full key format: @onboarding_seen_{gameMode}
 */
export const ONBOARDING_STORAGE_KEY_PREFIX = '@onboarding_seen_';

/**
 * Get AsyncStorage key for a specific game mode's onboarding status
 */
export function getOnboardingStorageKey(gameMode: GameMode): string {
  return `${ONBOARDING_STORAGE_KEY_PREFIX}${gameMode}`;
}

/**
 * Onboarding state for all game modes.
 * Maps game mode to whether user has seen the intro.
 */
export type OnboardingState = Partial<Record<GameMode, boolean>>;

/**
 * Context value for onboarding state management
 */
export interface OnboardingContextValue {
  /** Map of game modes to whether user has seen the intro */
  hasSeenIntro: OnboardingState;

  /** Whether state has been loaded from AsyncStorage */
  isHydrated: boolean;

  /** Mark a game mode intro as seen */
  markIntroSeen: (gameMode: GameMode) => Promise<void>;

  /** Check if user has seen intro for a game mode */
  hasUserSeenIntro: (gameMode: GameMode) => boolean;

  /** Reset intro seen status for a game mode (for testing/dev) */
  resetIntroSeen: (gameMode: GameMode) => Promise<void>;

  /** Reset all intro statuses (for testing/dev) */
  resetAllIntros: () => Promise<void>;
}

/**
 * Return type for useOnboarding hook
 */
export interface UseOnboardingResult {
  /** Whether the onboarding intro should be shown */
  shouldShowIntro: boolean;

  /** Whether onboarding state has been loaded from storage */
  isReady: boolean;

  /** Mark the intro as seen and allow game to start */
  completeIntro: () => Promise<void>;
}
