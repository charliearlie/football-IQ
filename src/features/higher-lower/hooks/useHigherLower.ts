/**
 * Higher/Lower Game Hook
 *
 * Main game state management for the Higher/Lower game mode.
 * Uses reducer pattern for predictable state updates.
 *
 * Players guess if Player 2's transfer fee is higher or lower than Player 1's.
 * 10 rounds total — one wrong answer ends the game.
 */

import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { ParsedLocalPuzzle } from '@/types/database';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { useHaptics } from '@/hooks/useHaptics';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import {
  HigherLowerState,
  HigherLowerAction,
  HigherLowerAttemptMetadata,
  createInitialState,
  parseHigherLowerContent,
} from '../types/higherLower.types';
import { calculateHigherLowerScore, normalizeHigherLowerScore } from '../utils/scoring';
import { shareHigherLowerResult } from '../utils/share';

/** Delay in ms before advancing to the next round after answer reveal */
const REVEAL_DELAY_MS = 1500;

/**
 * Reducer for Higher/Lower game state.
 */
function higherLowerReducer(
  state: HigherLowerState,
  action: HigherLowerAction
): HigherLowerState {
  switch (action.type) {
    case 'SUBMIT_ANSWER': {
      const { answer, isCorrect } = action.payload;
      const newAnswers = [...state.answers, answer];
      const newResults = [...state.results, isCorrect];

      if (!isCorrect) {
        const score = calculateHigherLowerScore(newResults);
        return {
          ...state,
          answers: newAnswers,
          results: newResults,
          showingResult: true,
          gameStatus: 'lost',
          score,
        };
      }

      // Correct — show result then advance
      return {
        ...state,
        answers: newAnswers,
        results: newResults,
        showingResult: true,
      };
    }

    case 'ADVANCE_ROUND': {
      // If game is already over (lost), no-op
      if (state.gameStatus === 'lost') {
        return { ...state, showingResult: false };
      }

      const nextRound = state.currentRound + 1;

      // All 10 rounds complete
      if (nextRound >= state.totalRounds) {
        const score = calculateHigherLowerScore(state.results);
        return {
          ...state,
          currentRound: nextRound,
          showingResult: false,
          gameStatus: 'won',
          score,
        };
      }

      return {
        ...state,
        currentRound: nextRound,
        showingResult: false,
      };
    }

    case 'SET_ATTEMPT_ID':
      return { ...state, attemptId: action.payload };

    case 'RESTORE_PROGRESS': {
      const payload = action.payload;
      return {
        ...state,
        currentRound: payload.currentRound,
        answers: payload.answers,
        results: payload.results,
        attemptId: payload.attemptId,
        startedAt: payload.startedAt,
      };
    }

    case 'ATTEMPT_SAVED':
      return { ...state, attemptSaved: true };

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

// Export reducer for testing
export { higherLowerReducer };

/**
 * Share result type
 */
export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Main hook for Higher/Lower game.
 *
 * @param puzzle - The puzzle to play
 * @param isFocused - Whether the screen is focused
 * @returns Game state and actions
 */
export function useHigherLower(puzzle: ParsedLocalPuzzle | null, isFocused: boolean = true) {
  // Parse content
  const higherLowerContent = useMemo(() => {
    if (!puzzle) return null;
    return parseHigherLowerContent(puzzle.content);
  }, [puzzle]);

  const [state, dispatch] = useReducer(higherLowerReducer, undefined, createInitialState);
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Track in-flight advance timer to avoid double-advancing
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  const isGameOver = state.gameStatus !== 'playing';
  const currentPair = higherLowerContent?.pairs[state.currentRound] ?? null;

  // Game persistence
  useGamePersistence<HigherLowerState, HigherLowerAttemptMetadata>({
    puzzle,
    isFocused,
    state,
    dispatch: dispatch as unknown as import('@/hooks/useGamePersistence').PersistenceDispatch,
    hasProgressToSave: (s) => s.answers.length > 0,
    serializeProgress: (s) => ({
      answers: s.answers,
      results: s.results,
      roundsCompleted: s.currentRound,
      won: false,
    }),
    hasRestoredProgress: (meta) => (meta.answers?.length ?? 0) > 0,
    deserializeProgress: (meta, attempt) => ({
      attemptId: attempt.id,
      startedAt: attempt.started_at ?? new Date().toISOString(),
      currentRound: meta.roundsCompleted ?? 0,
      answers: meta.answers ?? [],
      results: meta.results ?? [],
    }),
    buildFinalAttempt: (s, attemptId, completedAt) => {
      const score = s.score;
      if (!score) {
        throw new Error('Score must exist when building final attempt');
      }
      return {
        id: attemptId,
        completed: 1,
        score: normalizeHigherLowerScore(score),
        score_display: `${score.points}/${score.maxPoints}`,
        metadata: JSON.stringify({
          answers: s.answers,
          results: s.results,
          roundsCompleted: score.roundsCompleted,
          won: s.gameStatus === 'won',
        }),
        started_at: s.startedAt,
        completed_at: completedAt,
        synced: 0,
      };
    },
    onAttemptSaved: syncAttempts,
    onLocalAttemptSaved: refreshLocalIQ,
  });

  // Reset state when puzzle changes
  useEffect(() => {
    if (puzzle) {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      dispatch({ type: 'RESET' });
    }
  }, [puzzle?.id]);

  // Auto-advance after reveal animation
  useEffect(() => {
    if (!state.showingResult) return;

    advanceTimerRef.current = setTimeout(() => {
      dispatch({ type: 'ADVANCE_ROUND' });
      advanceTimerRef.current = null;
    }, REVEAL_DELAY_MS);

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [state.showingResult]);

  /**
   * Submit an answer (higher or lower).
   */
  const submitAnswer = useCallback(
    (answer: 'higher' | 'lower') => {
      if (state.gameStatus !== 'playing' || state.showingResult || !currentPair) return;

      const isCorrect =
        answer === 'higher'
          ? currentPair.player2.fee > currentPair.player1.fee
          : currentPair.player2.fee < currentPair.player1.fee;

      if (isCorrect) {
        triggerSuccess();
        if (state.currentRound === state.totalRounds - 1) {
          // Last round — completion haptic on advance
          triggerCompletion();
        }
      } else {
        triggerError();
      }

      dispatch({
        type: 'SUBMIT_ANSWER',
        payload: { answer, isCorrect },
      });
    },
    [
      state.gameStatus,
      state.showingResult,
      state.currentRound,
      state.totalRounds,
      currentPair,
      triggerSuccess,
      triggerError,
      triggerCompletion,
    ]
  );

  /**
   * Share the game result.
   */
  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !puzzle) {
      return {
        success: false,
        method: 'clipboard',
        error: new Error('No score to share'),
      };
    }

    return shareHigherLowerResult(state.score, state.results, puzzle.puzzle_date);
  }, [state.score, state.results, puzzle]);

  return {
    // State
    state,
    dispatch,

    // Derived data from content
    higherLowerContent,
    currentPair,

    // Derived state
    isGameOver,

    // Actions
    submitAnswer,
    shareResult,
  };
}
