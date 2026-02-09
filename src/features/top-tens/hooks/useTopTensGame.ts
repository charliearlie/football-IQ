/**
 * Top Tens Game Hook
 *
 * Main game state management for Top Tens game mode.
 * Uses reducer pattern for predictable state updates.
 */

import { useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ParsedLocalPuzzle } from '@/types/database';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import { useHaptics } from '@/hooks/useHaptics';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import {
  TopTensState,
  TopTensAction,
  RankIndex,
  TopTensAttemptMetadata,
  parseTopTensContent,
  createInitialClimbingState,
} from '../types/topTens.types';
import { validateTopTensGuess } from '../utils/validation';
import { calculateTopTensScore } from '../utils/scoring';
import { generateTopTensScoreDisplay } from '../utils/scoreDisplay';
import { shareTopTensResult, ShareResult } from '../utils/share';

// Re-export createInitialState for testing
export { createInitialState } from '../types/topTens.types';

/**
 * Reducer for Top Tens game state.
 */
export function topTensReducer(state: TopTensState, action: TopTensAction): TopTensState {
  switch (action.type) {
    case 'INIT_GAME':
      // Initialize with puzzle content (currently unused, kept for future)
      return state;

    case 'SET_CURRENT_GUESS':
      return {
        ...state,
        currentGuess: action.payload,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
      };

    case 'START_CLIMB':
      return {
        ...state,
        currentGuess: '',
        climbing: {
          isClimbing: true,
          targetRank: action.payload.targetRank,
          pendingAnswer: action.payload.answer,
          pendingRankIndex: action.payload.rankIndex,
        },
      };

    case 'CLIMB_COMPLETE': {
      // Reset climbing state - the actual reveal/error happens via separate dispatch
      return {
        ...state,
        climbing: createInitialClimbingState(),
      };
    }

    case 'CORRECT_GUESS': {
      const newRankSlots = [...state.rankSlots];
      newRankSlots[action.payload.rankIndex] = {
        ...newRankSlots[action.payload.rankIndex],
        found: true,
        autoRevealed: false,
        answer: action.payload.answer,
      };

      return {
        ...state,
        rankSlots: newRankSlots,
        foundCount: state.foundCount + 1,
        currentGuess: '',
        lastGuessCorrect: true,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
      };
    }

    case 'INCORRECT_GUESS':
      return {
        ...state,
        wrongGuessCount: state.wrongGuessCount + 1,
        currentGuess: '',
        lastGuessCorrect: false,
        lastGuessIncorrect: true,
        lastGuessDuplicate: false,
      };

    case 'DUPLICATE_GUESS':
      return {
        ...state,
        currentGuess: '',
        lastGuessCorrect: false,
        lastGuessIncorrect: false,
        lastGuessDuplicate: true,
      };

    case 'CLEAR_FEEDBACK':
      return {
        ...state,
        lastGuessCorrect: false,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
      };

    case 'ALL_FOUND':
      return {
        ...state,
        gameStatus: 'won',
        score: action.payload,
        currentGuess: '',
      };

    case 'GIVE_UP': {
      // Reveal all remaining answers, marking unfound as auto-revealed
      const revealedSlots = state.rankSlots.map((slot, i) => ({
        ...slot,
        found: true,
        autoRevealed: !slot.found,
        answer: action.payload.content.answers[i],
      }));

      return {
        ...state,
        gameStatus: 'lost',
        rankSlots: revealedSlots,
        score: action.payload.score,
        currentGuess: '',
      };
    }

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
        startedAt: state.startedAt || new Date().toISOString(),
      };

    case 'RESTORE_PROGRESS': {
      // Restore found indices and fill in answers from puzzle content
      const restoredSlots = state.rankSlots.map((slot, i) => ({
        ...slot,
        found: action.payload.foundIndices.includes(i),
        autoRevealed: false,
        answer: action.payload.foundIndices.includes(i)
          ? action.payload.answers[i] ?? null
          : null,
      }));

      return {
        ...state,
        rankSlots: restoredSlots,
        foundCount: action.payload.foundIndices.length,
        wrongGuessCount: action.payload.wrongGuessCount,
        attemptId: action.payload.attemptId,
        startedAt: action.payload.startedAt,
      };
    }

    case 'ATTEMPT_SAVED':
      return {
        ...state,
        attemptSaved: true,
      };

    case 'RESET_GAME':
      return {
        gameStatus: 'playing',
        rankSlots: Array.from({ length: 10 }, (_, i) => ({
          rank: i + 1,
          found: false,
          autoRevealed: false,
          answer: null,
        })),
        foundCount: 0,
        wrongGuessCount: 0,
        currentGuess: '',
        lastGuessCorrect: false,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
        score: null,
        attemptId: null,
        attemptSaved: false,
        startedAt: null,
        climbing: createInitialClimbingState(),
      };

    default:
      return state;
  }
}

/**
 * Create initial state for the game.
 * Exported from types file but re-implemented here for convenience.
 */
function createInitialGameState(): TopTensState {
  return {
    gameStatus: 'playing',
    rankSlots: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      found: false,
      autoRevealed: false,
      answer: null,
    })),
    foundCount: 0,
    wrongGuessCount: 0,
    currentGuess: '',
    lastGuessCorrect: false,
    lastGuessIncorrect: false,
    lastGuessDuplicate: false,
    score: null,
    attemptId: null,
    attemptSaved: false,
    startedAt: null,
    climbing: createInitialClimbingState(),
  };
}

/**
 * Main hook for Top Tens game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useTopTensGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(topTensReducer, undefined, createInitialGameState);
  const { triggerNotification, triggerHeavy, triggerSelection } = useHaptics();
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();

  // Keep a ref for async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Parse puzzle content
  const puzzleContent = useMemo(() => {
    if (!puzzle) return null;
    return parseTopTensContent(puzzle.content);
  }, [puzzle]);

  // Track found indices for validation
  const foundIndices = useMemo(() => {
    const indices = new Set<RankIndex>();
    state.rankSlots.forEach((slot, i) => {
      if (slot.found) indices.add(i as RankIndex);
    });
    return indices;
  }, [state.rankSlots]);

  // Generate attempt ID on first action
  useEffect(() => {
    if (!state.attemptId && state.gameStatus === 'playing' && puzzle) {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
    }
  }, [state.attemptId, state.gameStatus, puzzle]);

  // Check for resume on mount
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle || !puzzleContent) return;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);

        if (existingAttempt && !existingAttempt.completed && existingAttempt.metadata) {
          const metadata = existingAttempt.metadata as TopTensAttemptMetadata;
          if (metadata.foundIndices && metadata.foundIndices.length > 0) {
            dispatch({
              type: 'RESTORE_PROGRESS',
              payload: {
                attemptId: existingAttempt.id,
                startedAt: metadata.startedAt || existingAttempt.started_at || new Date().toISOString(),
                foundIndices: metadata.foundIndices,
                wrongGuessCount: metadata.wrongGuessCount || 0,
                answers: puzzleContent.answers,
              },
            });
          }
        }
      } catch (error) {
        console.warn('[TopTens] Failed to check for resume:', error);
      }
    }

    checkForResume();
  }, [puzzle?.id, puzzleContent]);

  // Check for win condition
  useEffect(() => {
    if (state.foundCount === 10 && state.gameStatus === 'playing') {
      const score = calculateTopTensScore(10, state.wrongGuessCount, true);
      dispatch({ type: 'ALL_FOUND', payload: score });
      triggerHeavy();
    }
  }, [state.foundCount, state.gameStatus, state.wrongGuessCount, triggerHeavy]);

  // Save attempt on game complete
  useEffect(() => {
    if (
      (state.gameStatus !== 'won' && state.gameStatus !== 'lost') ||
      state.attemptSaved ||
      !puzzle ||
      !state.score
    ) {
      return;
    }

    const currentPuzzle = puzzle;

    async function saveCompletedAttempt() {
      const currentState = stateRef.current;
      if (!currentState.score || !currentState.attemptId) return;

      const metadata: TopTensAttemptMetadata = {
        foundIndices: currentState.rankSlots
          .map((slot, i) => (slot.found ? i : -1))
          .filter((i) => i >= 0),
        wrongGuessCount: currentState.wrongGuessCount,
        startedAt: currentState.startedAt || new Date().toISOString(),
      };

      const scoreDisplay = generateTopTensScoreDisplay(
        currentState.rankSlots,
        currentState.score,
        { date: currentPuzzle.puzzle_date }
      );

      try {
        await saveAttempt({
          id: currentState.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 1,
          score: currentState.score.points,
          score_display: scoreDisplay,
          metadata: JSON.stringify(metadata),
          started_at: currentState.startedAt || new Date().toISOString(),
          completed_at: new Date().toISOString(),
          synced: 0,
        });

        dispatch({ type: 'ATTEMPT_SAVED' });

        // Refresh local IQ for immediate UI update
        refreshLocalIQ().catch((err) => {
          console.error('[TopTens] Failed to refresh local IQ:', err);
        });

        // Fire-and-forget cloud sync
        syncAttempts().catch((err) => {
          console.error('[TopTens] Cloud sync failed:', err);
        });
      } catch (error) {
        console.error('[TopTens] Failed to save attempt:', error);
      }
    }

    saveCompletedAttempt();
  }, [state.gameStatus, state.attemptSaved, puzzle, state.score]);

  // Save progress on app background
  useEffect(() => {
    if (!puzzle) return;

    const currentPuzzle = puzzle;

    async function saveProgress() {
      const currentState = stateRef.current;

      if (currentState.gameStatus !== 'playing' || !currentState.attemptId) return;
      if (currentState.foundCount === 0 && currentState.wrongGuessCount === 0) return;

      const metadata: TopTensAttemptMetadata = {
        foundIndices: currentState.rankSlots
          .map((slot, i) => (slot.found ? i : -1))
          .filter((i) => i >= 0),
        wrongGuessCount: currentState.wrongGuessCount,
        startedAt: currentState.startedAt || new Date().toISOString(),
      };

      try {
        await saveAttempt({
          id: currentState.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 0,
          score: null,
          score_display: null,
          metadata: JSON.stringify(metadata),
          started_at: currentState.startedAt || new Date().toISOString(),
          completed_at: null,
          synced: 0,
        });
      } catch (error) {
        console.warn('[TopTens] Failed to save progress:', error);
      }
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        saveProgress();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [puzzle]);

  // Save progress when screen unmounts (in-app navigation back)
  useEffect(() => {
    if (!puzzle) return;

    const currentPuzzle = puzzle;

    return () => {
      const currentState = stateRef.current;

      if (currentState.gameStatus !== 'playing' || !currentState.attemptId) return;
      if (currentState.foundCount === 0 && currentState.wrongGuessCount === 0) return;

      const metadata: TopTensAttemptMetadata = {
        foundIndices: currentState.rankSlots
          .map((slot, i) => (slot.found ? i : -1))
          .filter((i) => i >= 0),
        wrongGuessCount: currentState.wrongGuessCount,
        startedAt: currentState.startedAt || new Date().toISOString(),
      };

      // Fire and forget - can't await in cleanup
      saveAttempt({
        id: currentState.attemptId,
        puzzle_id: currentPuzzle.id,
        completed: 0,
        score: null,
        score_display: null,
        metadata: JSON.stringify(metadata),
        started_at: currentState.startedAt || new Date().toISOString(),
        completed_at: null,
        synced: 0,
      }).catch((error) => {
        console.warn('[TopTens] Failed to save progress on unmount:', error);
      });
    };
  }, [puzzle?.id]);

  // Auto-save progress after each correct guess
  useEffect(() => {
    async function autoSaveProgress() {
      if (!puzzle || state.gameStatus !== 'playing' || !state.attemptId) return;
      if (state.foundCount === 0) return; // Nothing to save yet

      const metadata: TopTensAttemptMetadata = {
        foundIndices: state.rankSlots
          .map((slot, i) => (slot.found ? i : -1))
          .filter((i) => i >= 0),
        wrongGuessCount: state.wrongGuessCount,
        startedAt: state.startedAt || new Date().toISOString(),
      };

      try {
        await saveAttempt({
          id: state.attemptId,
          puzzle_id: puzzle.id,
          completed: 0,
          score: null,
          score_display: null,
          metadata: JSON.stringify(metadata),
          started_at: state.startedAt || new Date().toISOString(),
          completed_at: null,
          synced: 0,
        });
      } catch (error) {
        console.warn('[TopTens] Failed to auto-save progress:', error);
      }
    }

    autoSaveProgress();
  }, [puzzle, state.foundCount, state.attemptId, state.gameStatus, state.rankSlots, state.wrongGuessCount, state.startedAt]);

  // Clear feedback after delay
  useEffect(() => {
    if (!state.lastGuessCorrect && !state.lastGuessIncorrect && !state.lastGuessDuplicate) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_FEEDBACK' });
    }, 500);

    return () => clearTimeout(timer);
  }, [state.lastGuessCorrect, state.lastGuessIncorrect, state.lastGuessDuplicate]);

  // Actions
  const setCurrentGuess = useCallback((text: string) => {
    dispatch({ type: 'SET_CURRENT_GUESS', payload: text });
  }, []);

  const submitGuess = useCallback(() => {
    if (!puzzleContent || state.gameStatus !== 'playing' || state.climbing.isClimbing) return;

    const guess = state.currentGuess.trim();
    if (!guess) return;

    const result = validateTopTensGuess(guess, puzzleContent, foundIndices);

    if (result.isMatch && result.matchedIndex !== null) {
      // Check if this was a duplicate (already found via alias)
      if (foundIndices.has(result.matchedIndex)) {
        dispatch({ type: 'DUPLICATE_GUESS' });
        triggerNotification('warning');
        return;
      }

      // Start climbing animation to the correct rank
      dispatch({
        type: 'START_CLIMB',
        payload: {
          targetRank: result.matchedIndex + 1, // Convert 0-indexed to 1-10 rank
          answer: puzzleContent.answers[result.matchedIndex],
          rankIndex: result.matchedIndex,
        },
      });
    } else {
      // Start climbing animation to the top (will fail)
      dispatch({
        type: 'START_CLIMB',
        payload: {
          targetRank: null, // null = incorrect, climb to top
          answer: null,
          rankIndex: null,
        },
      });
    }
  }, [puzzleContent, state.currentGuess, state.gameStatus, state.climbing.isClimbing, foundIndices, triggerNotification]);

  /**
   * Called when climbing animation completes.
   * Triggers the actual reveal (correct) or error feedback (incorrect).
   */
  const handleClimbComplete = useCallback(() => {
    const { targetRank, pendingAnswer, pendingRankIndex } = state.climbing;

    // Reset climbing state first
    dispatch({ type: 'CLIMB_COMPLETE' });

    if (targetRank !== null && pendingAnswer && pendingRankIndex !== null) {
      // Correct guess - reveal the answer
      dispatch({
        type: 'CORRECT_GUESS',
        payload: {
          rankIndex: pendingRankIndex,
          answer: pendingAnswer,
        },
      });
      triggerNotification('success');
    } else {
      // Incorrect guess
      dispatch({ type: 'INCORRECT_GUESS' });
      triggerNotification('error');
    }
  }, [state.climbing, triggerNotification]);

  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing' || !puzzleContent) return;

    const score = calculateTopTensScore(state.foundCount, state.wrongGuessCount, false);
    dispatch({ type: 'GIVE_UP', payload: { score, content: puzzleContent } });
    triggerSelection();
  }, [state.gameStatus, state.foundCount, state.wrongGuessCount, puzzleContent, triggerSelection]);

  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score) {
      return { success: false, method: 'clipboard', error: new Error('No score to share') };
    }

    return shareTopTensResult(state.rankSlots, state.score, puzzle?.puzzle_date);
  }, [state.rankSlots, state.score, puzzle?.puzzle_date]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    dispatch,
    puzzleContent,
    isGameOver: state.gameStatus !== 'playing',
    isClimbing: state.climbing.isClimbing,
    setCurrentGuess,
    submitGuess,
    handleClimbComplete,
    giveUp,
    shareResult,
    resetGame,
  };
}
