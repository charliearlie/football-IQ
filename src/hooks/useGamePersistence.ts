/**
 * Shared Game Persistence Hook
 *
 * Extracts common game lifecycle management patterns from individual game hooks:
 * - StateRef tracking for AppState callbacks
 * - AttemptId generation on game start
 * - Progress restoration from interrupted attempts
 * - Background save on AppState change
 * - Completion save when game ends
 *
 * Each game provides game-specific logic via configuration callbacks.
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
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
  gameStatus: 'idle' | 'playing' | 'won' | 'lost' | 'draw' | 'complete';
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
}

/**
 * Hook to manage game persistence lifecycle.
 *
 * Handles:
 * 1. StateRef sync for AppState callbacks
 * 2. AttemptId generation when game starts
 * 3. Progress restoration from interrupted attempts
 * 4. Background save when app goes inactive
 * 5. Final save when game completes
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
  const {
    puzzle,
    state,
    dispatch,
    hasProgressToSave,
    serializeProgress,
    hasRestoredProgress,
    deserializeProgress,
    buildFinalAttempt,
  } = config;

  // 1. StateRef for AppState callbacks (avoids stale closure)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 2. Generate attemptId when game starts
  useEffect(() => {
    if (state.gameStatus === 'playing' && !state.attemptId && puzzle) {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
    }
  }, [state.gameStatus, state.attemptId, puzzle, dispatch]);

  // 3. Restore progress from interrupted attempt on mount
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle) return;

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
    // Only run on puzzle change, not on config callback changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.id]);

  // 4. Save progress when app goes to background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        const currentState = stateRef.current;

        // Check prerequisites
        if (
          currentState.gameStatus !== 'playing' ||
          !puzzle ||
          !currentState.attemptId
        ) {
          return;
        }

        // Check if there's meaningful progress to save
        if (!hasProgressToSave(currentState)) {
          return;
        }

        try {
          const attempt: LocalAttempt = {
            id: currentState.attemptId,
            puzzle_id: puzzle.id,
            completed: 0, // In-progress
            score: null,
            score_display: null,
            metadata: JSON.stringify(serializeProgress(currentState)),
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
    // Callbacks are stable via config object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // 5. Save final attempt when game ends
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
      try {
        const attemptId = state.attemptId ?? Crypto.randomUUID();
        const now = new Date().toISOString();

        const attemptData = buildFinalAttempt(state, attemptId, now);
        const attempt: LocalAttempt = {
          ...attemptData,
          puzzle_id: puzzle.id,
        };

        await saveAttempt(attempt);
        dispatch({ type: 'ATTEMPT_SAVED' });
      } catch (error) {
        console.error('Failed to save attempt:', error);
        // Don't block the game, just log the error
      }
    };

    saveGameAttempt();
    // Callback is stable via config object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus, state.score, state.attemptSaved, puzzle, dispatch]);
}
