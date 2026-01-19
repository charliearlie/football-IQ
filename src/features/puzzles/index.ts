/**
 * Puzzles Feature
 *
 * Provides offline-first puzzle data management with sync between
 * Supabase (cloud) and SQLite (local).
 */

// Context and Provider
export { PuzzleProvider, usePuzzleContext } from './context/PuzzleContext';
export { OnboardingProvider, useOnboardingContext } from './context/OnboardingContext';

// Hooks
export { usePuzzle } from './hooks/usePuzzle';
export { useStablePuzzle } from './hooks/useStablePuzzle';
export { useOnboarding } from './hooks/useOnboarding';

// Components
export { GameIntroScreen, GameIntroModal } from './components/GameIntroScreen';

// Rules
export { RULES_MAP, getGameRules, getGameDisplayTitle, getAllGameModes } from './constants/rules';
export type { GameRules, ScoringConfig, ScoringTier, RuleBullet } from './constants/rules';

// Services (for direct use if needed)
export { syncPuzzlesFromSupabase } from './services/puzzleSyncService';
export { syncAttemptsToSupabase } from './services/attemptSyncService';

// Types
export type {
  SyncStatus,
  GameMode,
  SyncResult,
  PuzzleContextValue,
  UsePuzzleResult,
  PuzzleSyncOptions,
  SupabasePuzzle,
  SupabaseAttempt,
} from './types/puzzle.types';

export type {
  OnboardingContextValue,
  OnboardingState,
  UseOnboardingResult,
} from './types/onboarding.types';
