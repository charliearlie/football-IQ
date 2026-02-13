/**
 * Shared Game Persistence Hook
 *
 * Extracts common game lifecycle management patterns from individual game hooks:
 * - StateRef tracking for AppState callbacks
 * - AttemptId generation on game start
 * - Progress restoration from interrupted attempts (on mount/focus)
 * - Background save on AppState change
 * - Progress save on screen unmount (in-app navigation back)
 * - Completion save when game ends
 *
 * Each game provides game-specific logic via configuration callbacks.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { usePostHog } from 'posthog-react-native';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import { ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import { emitStatsChanged } from '@/lib/statsEvents';
import { LocalAttempt } from '@/types/database';
import {
  ParsedLocalPuzzle,
  ParsedLocalAttempt,
} from '@/features/puzzles/types/puzzle.types';

/**
 * Base game state interface that all games must have.
 * Includes all possible game status values across all game modes.
 */
export interface BaseGameState {
  gameStatus: 'idle' | 'playing' | 'won' | 'lost' | 'draw' | 'complete' | 'revealed';
  attemptId: string | null;
  attemptSaved: boolean;
  startedAt: string | null;
  score: unknown;
}

/**
 * Restore progress payload dispatched to reducer.
 * Contains base fields; games extend with their own fields.
 */
export interface RestoreProgressPayload {
  attemptId: string;
  startedAt: string;
  [key: string]: unknown;
}

/**
 * Required persistence actions that all game reducers MUST support.
 * This is enforced at compile-time via the TAction generic constraint.
 *
 * Games can (and do) define these inline in their action unions,
 * but this type ensures the contract is met.
 */
export type PersistenceAction =
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload }
  | { type: 'ATTEMPT_SAVED' };

/**
 * Dispatch function type for game persistence.
 * Accepts the standard persistence actions that this hook dispatches.
 */
export type PersistenceDispatch = (action: PersistenceAction) => void;

/**
 * Configuration for the game persistence hook.
 *
 * @typeParam TState - The game's state type (must extend BaseGameState)
 * @typeParam TMeta - The metadata shape for serialization
 */
export interface UseGamePersistenceConfig<TState extends BaseGameState, TMeta> {
  /** The puzzle being played */
  puzzle: ParsedLocalPuzzle | null;

  /** Whether the screen is currently focused (from useIsFocused). Triggers restoration on focus. */
  isFocused?: boolean;

  /** Current game state from useReducer */
  state: TState;

  /**
   * Dispatch function from useReducer.
   * Must handle SET_ATTEMPT_ID, RESTORE_PROGRESS, and ATTEMPT_SAVED actions.
   * Game reducers should include these action types in their action union.
   */
  dispatch: PersistenceDispatch;

  /**
   * Determine if the game has meaningful progress worth saving.
   * Called when app goes to background.
   */
  hasProgressToSave: (state: TState) => boolean;

  /**
   * Serialize current state to metadata for saving.
   * Return an object that will be JSON.stringify'd.
   */
  serializeProgress: (state: TState) => TMeta;

  /**
   * Check if restored metadata has meaningful progress.
   * Return true to dispatch RESTORE_PROGRESS.
   */
  hasRestoredProgress: (meta: Partial<TMeta>) => boolean;

  /**
   * Convert restored attempt data to RESTORE_PROGRESS payload.
   */
  deserializeProgress: (
    meta: Partial<TMeta>,
    attempt: ParsedLocalAttempt
  ) => RestoreProgressPayload;

  /**
   * Build the final LocalAttempt for completed games.
   * Should set completed=1, score, score_display, and metadata.
   */
  buildFinalAttempt: (
    state: TState,
    attemptId: string,
    completedAt: string
  ) => Omit<LocalAttempt, 'puzzle_id'>;

  /**
   * Optional callback to sync attempts to cloud after local save.
   * Fire-and-forget - errors are logged but don't block the game.
   * Pass `syncAttempts` from usePuzzles() context.
   */
  onAttemptSaved?: () => Promise<unknown>;

  /**
   * Optional callback fired immediately after local save (before cloud sync).
   * Use to refresh local IQ display for immediate UI update.
   * Pass `refreshLocalIQ` from useAuth().
   */
  onLocalAttemptSaved?: () => Promise<void>;
}

/**
 * Hook to manage game persistence lifecycle.
 *
 * Handles:
 * 1. StateRef sync for AppState callbacks
 * 2. AttemptId generation when game starts
 * 3. Progress restoration from interrupted attempts (on mount/focus)
 * 4. Background save when app goes inactive
 * 5. Progress save when screen unmounts (in-app navigation back)
 * 6. Final save when game completes
 *
 * @example
 * ```tsx
 * // Define metadata type for serialization
 * interface CareerPathMeta {
 *   revealedCount: number;
 *   guesses: string[];
 *   startedAt: string;
 * }
 *
 * // Use with explicit type parameters
 * useGamePersistence<CareerPathState, CareerPathMeta>({
 *   puzzle,
 *   state,
 *   dispatch,
 *   hasProgressToSave: (s) => s.revealedCount > 1,
 *   serializeProgress: (s) => ({
 *     revealedCount: s.revealedCount,
 *     guesses: s.guesses,
 *     startedAt: s.startedAt,
 *   }),
 *   hasRestoredProgress: (m) => (m.revealedCount ?? 0) > 1,
 *   deserializeProgress: (m, a) => ({
 *     attemptId: a.id,
 *     revealedCount: m.revealedCount ?? 1,
 *     guesses: m.guesses ?? [],
 *     startedAt: m.startedAt ?? a.started_at ?? new Date().toISOString(),
 *   }),
 *   buildFinalAttempt: (s, id, now) => ({ ... }),
 * });
 * ```
 */
export function useGamePersistence<TState extends BaseGameState, TMeta>(
  config: UseGamePersistenceConfig<TState, TMeta>
): void {
  const posthog = usePostHog();

  const {
    puzzle,
    isFocused,
    state,
    dispatch,
  } = config;

  // 1. Refs to avoid stale closures in background/unmount callbacks.
  // State and config are updated every render so effects always read the latest.
  const stateRef = useRef(state);
  stateRef.current = state;

  const configRef = useRef(config);
  configRef.current = config;

  // 2. Generate attemptId when game starts
  useEffect(() => {
    if (state.gameStatus === 'playing' && !state.attemptId && puzzle) {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });

      try {
        posthog?.capture(ANALYTICS_EVENTS.GAME_STARTED, {
          game_mode: puzzle.game_mode,
          puzzle_date: puzzle.puzzle_date,
        });
      } catch { /* analytics should never crash the game */ }
    }
  }, [state.gameStatus, state.attemptId, puzzle, dispatch, posthog]);

  // 3. Restore progress from interrupted attempt on mount/focus
  useEffect(() => {
    async function checkForResume() {
      // Skip if no puzzle or screen is unfocused
      if (!puzzle || isFocused === false) return;

      const { hasRestoredProgress, deserializeProgress } = configRef.current;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);

        // Only restore in-progress attempts (completed=0)
        if (existingAttempt && !existingAttempt.completed) {
          const meta = existingAttempt.metadata as Partial<TMeta>;

          if (hasRestoredProgress(meta)) {
            const payload = deserializeProgress(meta, existingAttempt);
            dispatch({ type: 'RESTORE_PROGRESS', payload });
          }
        }
      } catch (error) {
        console.error('Failed to check for resume:', error);
      }
    }

    checkForResume();
    // Run on puzzle change or when screen gains focus
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.id, isFocused]);

  // 4. Save progress when app goes to background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const currentState = stateRef.current;
        const { hasProgressToSave: checkProgress, serializeProgress: serialize } =
          configRef.current;

        // Check prerequisites
        if (
          currentState.gameStatus !== 'playing' ||
          !puzzle ||
          !currentState.attemptId
        ) {
          return;
        }

        // Check if there's meaningful progress to save
        if (!checkProgress(currentState)) {
          return;
        }

        try {
          const attempt: LocalAttempt = {
            id: currentState.attemptId,
            puzzle_id: puzzle.id,
            completed: 0, // In-progress
            score: null,
            score_display: null,
            metadata: JSON.stringify(serialize(currentState)),
            started_at: currentState.startedAt,
            completed_at: null,
            synced: 0,
          };

          await saveAttempt(attempt);
        } catch (error) {
          console.error('Failed to save progress on background:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
    // configRef ensures fresh callbacks without effect re-creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // 5. Save progress when screen unmounts (in-app navigation back)
  useEffect(() => {
    // Return cleanup function that saves on unmount
    return () => {
      const currentState = stateRef.current;
      const { hasProgressToSave: checkProgress, serializeProgress: serialize } =
        configRef.current;

      // Check prerequisites
      if (
        currentState.gameStatus !== 'playing' ||
        !puzzle ||
        !currentState.attemptId ||
        !checkProgress(currentState)
      ) {
        return;
      }

      // Save progress - fire and forget (can't await in cleanup)
      const attempt: LocalAttempt = {
        id: currentState.attemptId,
        puzzle_id: puzzle.id,
        completed: 0,
        score: null,
        score_display: null,
        metadata: JSON.stringify(serialize(currentState)),
        started_at: currentState.startedAt,
        completed_at: null,
        synced: 0,
      };

      saveAttempt(attempt).catch((error) => {
        console.error('Failed to save progress on unmount:', error);
      });
    };
    // Only re-create cleanup when puzzle changes
    // configRef ensures fresh callbacks without effect re-creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.id]);

  // 6. Save final attempt when game ends
  useEffect(() => {
    // Check completion conditions
    if (
      state.gameStatus === 'playing' ||
      state.gameStatus === 'idle' ||
      !state.score ||
      state.attemptSaved ||
      !puzzle
    ) {
      return;
    }

    const saveGameAttempt = async () => {
      const {
        buildFinalAttempt: buildAttempt,
        onAttemptSaved: onSaved,
        onLocalAttemptSaved: onLocalSaved,
      } = configRef.current;

      try {
        const attemptId = state.attemptId ?? Crypto.randomUUID();
        const now = new Date().toISOString();

        const attemptData = buildAttempt(state, attemptId, now);
        const attempt: LocalAttempt = {
          ...attemptData,
          puzzle_id: puzzle.id,
        };

        await saveAttempt(attempt);
        dispatch({ type: 'ATTEMPT_SAVED' });

        // Notify useUserStats consumers (e.g. NotificationWrapper) so
        // totalGamesPlayed updates and celebration/permission effects fire.
        emitStatsChanged();

        try {
          const timeSpent = state.startedAt
            ? Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000)
            : null;
          posthog?.capture(ANALYTICS_EVENTS.GAME_COMPLETED, {
            game_mode: puzzle.game_mode,
            result: state.gameStatus,
            score: JSON.stringify(state.score),
            time_spent_seconds: timeSpent,
            puzzle_date: puzzle.puzzle_date,
          });
        } catch { /* analytics should never crash the game */ }

        // Refresh local IQ immediately for instant UI update
        if (onLocalSaved) {
          onLocalSaved().catch((err) => {
            console.error('Failed to refresh local IQ:', err);
          });
        }

        // Fire-and-forget cloud sync if callback provided
        if (onSaved) {
          onSaved().catch((err) => {
            console.error('Cloud sync failed:', err);
          });
        }
      } catch (error) {
        console.error('Failed to save attempt:', error);
        // Don't block the game, just log the error
      }
    };

    saveGameAttempt();
    // Callback is stable via config object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus, state.score, state.attemptSaved, puzzle, dispatch, posthog]);
}
