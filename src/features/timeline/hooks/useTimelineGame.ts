/**
 * Timeline Game Hook
 *
 * Main game state management for the Timeline game mode.
 * Uses reducer pattern with shared persistence hook.
 */

import { useReducer, useMemo, useCallback, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  TimelineState,
  TimelineAction,
  TimelineContent,
  TimelineEvent,
  TimelineAttemptMetadata,
  RestoreProgressPayload,
  createInitialState,
  parseTimelineContent,
} from '../types/timeline.types';
import { calculateTimelineScore, MAX_TIMELINE_ATTEMPTS } from '../utils/scoring';
import { shareTimelineResult, ShareResult } from '../utils/share';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { useHaptics } from '@/hooks/useHaptics';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { LocalAttempt } from '@/types/database';

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Compare two events chronologically.
 * Returns true if they represent the same event position.
 */
function eventsMatch(a: TimelineEvent, b: TimelineEvent): boolean {
  return a.text === b.text && a.year === b.year;
}

/**
 * Check which positions in the current order are correct.
 * Returns a boolean array (length 6).
 */
function checkOrder(
  currentOrder: TimelineEvent[],
  correctOrder: TimelineEvent[]
): boolean[] {
  return currentOrder.map((event, i) => eventsMatch(event, correctOrder[i]));
}

/**
 * Reorder an array by moving an item from one index to another.
 * Respects locked indices — locked items cannot be moved or displaced.
 */
function reorderWithLocks(
  events: TimelineEvent[],
  from: number,
  to: number,
  lockedIndices: Set<number>
): TimelineEvent[] {
  // Cannot move a locked item
  if (lockedIndices.has(from)) return events;
  // Cannot move to a locked position
  if (lockedIndices.has(to)) return events;

  const result = [...events];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

/**
 * Reducer for Timeline game state.
 */
function timelineReducer(
  state: TimelineState,
  action: TimelineAction,
  content: TimelineContent | null
): TimelineState {
  switch (action.type) {
    case 'REORDER_EVENTS': {
      if (state.gameStatus !== 'playing' || state.revealPhase !== 'idle') return state;

      const { from, to } = action.payload;
      const newOrder = reorderWithLocks(state.eventOrder, from, to, state.lockedIndices);

      return {
        ...state,
        eventOrder: newOrder,
      };
    }

    case 'SUBMIT': {
      if (!content || state.gameStatus !== 'playing' || state.revealPhase !== 'idle') {
        return state;
      }

      const correctOrder = content.events;
      const results = checkOrder(state.eventOrder, correctOrder);
      const isFirstAttempt = state.attemptCount === 0;
      const newAttemptCount = state.attemptCount + 1;

      // Track first attempt results
      const firstAttemptResults = isFirstAttempt
        ? results
        : state.firstAttemptResults;

      const allCorrect = results.every(Boolean);

      if (allCorrect) {
        // Won! All 6 in correct order
        const score = calculateTimelineScore(newAttemptCount, true);

        return {
          ...state,
          attemptCount: newAttemptCount,
          firstAttemptResults,
          lastAttemptResults: results,
          lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
          revealPhase: 'revealing',
          gameStatus: 'won',
          score,
        };
      }

      // Not all correct — flash results then reset to draggable
      return {
        ...state,
        attemptCount: newAttemptCount,
        firstAttemptResults,
        lastAttemptResults: results,
        revealPhase: 'revealing',
      };
    }

    case 'REVEAL_COMPLETE': {
      // If 5 attempts exhausted, end the game
      if (content && state.attemptCount >= MAX_TIMELINE_ATTEMPTS && state.gameStatus === 'playing') {
        const score = calculateTimelineScore(state.attemptCount, false);
        return {
          ...state,
          revealPhase: 'idle',
          eventOrder: content.events,
          lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
          gameStatus: 'lost',
          score,
        };
      }
      return {
        ...state,
        revealPhase: 'idle',
      };
    }

    case 'GIVE_UP': {
      if (!content || state.gameStatus !== 'playing') return state;

      const score = calculateTimelineScore(state.attemptCount, false);

      return {
        ...state,
        eventOrder: content.events, // Show correct order
        lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
        gameStatus: 'gave_up',
        score,
        revealPhase: 'idle',
      };
    }

    case 'SET_ATTEMPT_ID': {
      return {
        ...state,
        attemptId: action.payload,
        startedAt: state.startedAt || new Date().toISOString(),
      };
    }

    case 'RESTORE_PROGRESS': {
      const { attemptId, startedAt, attemptCount, eventOrder, lockedIndices, firstAttemptCorrect } = action.payload;

      return {
        ...state,
        attemptId,
        startedAt,
        attemptCount,
        eventOrder,
        lockedIndices: new Set(lockedIndices),
        firstAttemptResults: Array.from({ length: 6 }, (_, i) => i < firstAttemptCorrect),
        lastAttemptResults: [],
        gameStatus: 'playing',
        revealPhase: 'idle',
      };
    }

    case 'ATTEMPT_SAVED': {
      return {
        ...state,
        attemptSaved: true,
      };
    }

    case 'RESET_GAME': {
      if (!content) return state;
      const shuffled = shuffleArray(content.events);
      return createInitialState(shuffled);
    }

    default:
      return state;
  }
}

/**
 * Main hook for Timeline game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useTimelineGame(puzzle: ParsedLocalPuzzle | null) {
  const isFocused = useIsFocused();
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Parse puzzle content
  const content = useMemo(() => {
    if (!puzzle) return null;
    return parseTimelineContent(puzzle.content);
  }, [puzzle]);

  // Initial shuffled events
  const initialEvents = useMemo(() => {
    if (!content) return [];
    return shuffleArray(content.events);
  }, [content]);

  // Reducer with content passed as third arg
  const [state, baseDispatch] = useReducer(
    (s: TimelineState, a: TimelineAction) => timelineReducer(s, a, content),
    undefined,
    () => createInitialState(initialEvents)
  );

  const dispatch = baseDispatch as (action: TimelineAction) => void;

  // Use shared persistence hook
  useGamePersistence<TimelineState, TimelineAttemptMetadata>({
    puzzle,
    isFocused,
    state,
    dispatch: dispatch as never,
    hasProgressToSave: (s) => s.attemptCount > 0,
    serializeProgress: (s) => ({
      attemptCount: s.attemptCount,
      firstAttemptCorrect: s.firstAttemptResults.filter(Boolean).length,
      eventOrder: s.eventOrder.map((e) => e.text),
      lockedIndices: Array.from(s.lockedIndices),
      startedAt: s.startedAt ?? new Date().toISOString(),
    }),
    hasRestoredProgress: (m) => (m.attemptCount ?? 0) > 0,
    deserializeProgress: (meta, attempt) => {
      // Rebuild eventOrder from text strings
      const eventOrder: TimelineEvent[] = [];
      if (meta.eventOrder && content) {
        for (const text of meta.eventOrder) {
          const event = content.events.find((e) => e.text === text);
          if (event) eventOrder.push(event);
        }
      }

      // Fallback: if events didn't match, use shuffled content
      if (eventOrder.length !== 6 && content) {
        return {
          attemptId: attempt.id,
          startedAt: meta.startedAt ?? attempt.started_at ?? new Date().toISOString(),
          attemptCount: 0,
          eventOrder: shuffleArray(content.events),
          lockedIndices: [],
          firstAttemptCorrect: 0,
        };
      }

      return {
        attemptId: attempt.id,
        startedAt: meta.startedAt ?? attempt.started_at ?? new Date().toISOString(),
        attemptCount: meta.attemptCount ?? 0,
        eventOrder,
        lockedIndices: meta.lockedIndices ?? [],
        firstAttemptCorrect: meta.firstAttemptCorrect ?? 0,
      };
    },
    buildFinalAttempt: (s, attemptId, completedAt) => {
      const metadata: TimelineAttemptMetadata = {
        attemptCount: s.attemptCount,
        firstAttemptCorrect: s.firstAttemptResults.filter(Boolean).length,
        eventOrder: s.eventOrder.map((e) => e.text),
        lockedIndices: Array.from(s.lockedIndices),
        startedAt: s.startedAt ?? completedAt,
      };

      return {
        id: attemptId,
        completed: 1,
        score: s.score?.points ?? 0,
        score_display: `${s.score?.points ?? 0} IQ`,
        metadata: JSON.stringify(metadata),
        started_at: s.startedAt ?? completedAt,
        completed_at: completedAt,
        synced: 0,
      } satisfies Omit<LocalAttempt, 'puzzle_id'>;
    },
    onAttemptSaved: syncAttempts,
    onLocalAttemptSaved: refreshLocalIQ,
  });

  // Re-initialize when content arrives after async load
  // (e.g., ad-unlocked archive puzzle fetched after mount).
  // Guards: only fire when reducer was initialized with empty events
  // and persistence hasn't restored a prior attempt.
  useEffect(() => {
    if (
      content &&
      state.eventOrder.length === 0 &&
      state.attemptCount === 0 &&
      state.gameStatus === 'playing'
    ) {
      dispatch({ type: 'RESET_GAME' });
    }
  }, [content, state.eventOrder.length, state.attemptCount, state.gameStatus]);

  // Actions
  const reorderEvents = useCallback(
    (from: number, to: number) => {
      dispatch({ type: 'REORDER_EVENTS', payload: { from, to } });
    },
    [dispatch]
  );

  const submitOrder = useCallback(() => {
    if (!content || state.revealPhase !== 'idle') return;

    dispatch({ type: 'SUBMIT' });

    // Haptic feedback
    const results = checkOrder(state.eventOrder, content.events);
    const allCorrect = results.every(Boolean);

    if (allCorrect) {
      triggerCompletion();
    } else {
      const correctCount = results.filter(Boolean).length;
      if (correctCount > 0) {
        triggerSuccess();
      } else {
        triggerError();
      }
    }
  }, [state.eventOrder, state.revealPhase, content, dispatch, triggerSuccess, triggerError, triggerCompletion]);

  const revealComplete = useCallback(() => {
    dispatch({ type: 'REVEAL_COMPLETE' });
  }, [dispatch]);

  const giveUp = useCallback(() => {
    dispatch({ type: 'GIVE_UP' });
  }, [dispatch]);

  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !content) {
      return { success: false, method: 'clipboard', error: new Error('No score to share') };
    }

    return shareTimelineResult(
      state.firstAttemptResults,
      state.score,
      puzzle?.puzzle_date,
      content.title,
      content.subject,
    );
  }, [state.firstAttemptResults, state.score, content, puzzle?.puzzle_date]);

  return {
    state,
    content,
    reorderEvents,
    submitOrder,
    revealComplete,
    giveUp,
    shareResult,
    isLoading: !content,
  };
}
