import { useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useHaptics } from '@/hooks/useHaptics';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { saveAttempt } from '@/lib/database';
import { LocalAttempt } from '@/types/database';
import {
  CareerPathState,
  CareerPathAction,
  CareerPathContent,
  CareerStep,
  GameScore,
} from '../types/careerPath.types';
import { validateGuess } from '../utils/validation';
import { calculateScore } from '../utils/scoring';
import { generateScoreDisplay } from '../utils/scoreDisplay';
import { shareGameResult, ShareResult } from '../utils/share';

/**
 * Create the initial state for the career path game.
 */
function createInitialState(): CareerPathState {
  return {
    revealedCount: 1,
    guesses: [],
    gameStatus: 'playing',
    currentGuess: '',
    lastGuessIncorrect: false,
    score: null,
    attemptSaved: false,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Reducer for career path game state.
 */
function careerPathReducer(
  state: CareerPathState,
  action: CareerPathAction
): CareerPathState {
  switch (action.type) {
    case 'REVEAL_NEXT':
      return {
        ...state,
        revealedCount: state.revealedCount + 1,
        lastGuessIncorrect: false,
      };

    case 'INCORRECT_GUESS':
      return {
        ...state,
        guesses: [...state.guesses, action.payload],
        currentGuess: '',
        lastGuessIncorrect: true,
        revealedCount: state.revealedCount + 1, // Penalty reveal
      };

    case 'CORRECT_GUESS':
      return {
        ...state,
        gameStatus: 'won',
        currentGuess: '',
        lastGuessIncorrect: false,
        score: action.payload,
      };

    case 'SET_CURRENT_GUESS':
      return {
        ...state,
        currentGuess: action.payload,
      };

    case 'CLEAR_SHAKE':
      return {
        ...state,
        lastGuessIncorrect: false,
      };

    case 'GAME_LOST':
      return {
        ...state,
        gameStatus: 'lost',
        score: action.payload,
      };

    case 'ATTEMPT_SAVED':
      return {
        ...state,
        attemptSaved: true,
      };

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

/**
 * Hook to manage Career Path game state.
 *
 * Handles:
 * - Sequential reveal logic (starts with 1 step revealed)
 * - Incorrect guess penalty (reveals next step)
 * - Fuzzy matching for player name validation
 * - Dynamic scoring based on revealed steps
 * - Win/lose detection
 * - Auto-scroll to bottom on reveal
 * - Shake animation trigger on incorrect guess
 * - Attempt persistence to local database
 * - Share functionality
 *
 * @param puzzle - The current puzzle data
 * @returns Game state, actions, and utilities
 *
 * @example
 * ```tsx
 * const { state, careerSteps, submitGuess, revealNext, shareResult } = useCareerPathGame(puzzle);
 * ```
 */
export function useCareerPathGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(careerPathReducer, createInitialState());
  const flatListRef = useRef<FlatList>(null);
  const { triggerNotification, triggerSelection } = useHaptics();

  // Parse puzzle content
  const puzzleContent = useMemo<CareerPathContent | null>(() => {
    if (!puzzle?.content) return null;
    return puzzle.content as CareerPathContent;
  }, [puzzle]);

  const careerSteps = useMemo<CareerStep[]>(() => {
    return puzzleContent?.career_steps ?? [];
  }, [puzzleContent]);

  const answer = useMemo(() => {
    return puzzleContent?.answer ?? '';
  }, [puzzleContent]);

  const totalSteps = careerSteps.length;

  // Check if all steps are revealed (triggers lost state)
  const allRevealed = state.revealedCount >= totalSteps;

  // Reveal the next step manually
  const revealNext = useCallback(() => {
    if (state.revealedCount < totalSteps && state.gameStatus === 'playing') {
      dispatch({ type: 'REVEAL_NEXT' });
      triggerSelection();
    }
  }, [state.revealedCount, totalSteps, state.gameStatus, triggerSelection]);

  // Submit a guess with fuzzy matching
  const submitGuess = useCallback(() => {
    const guess = state.currentGuess.trim();
    if (!guess || state.gameStatus !== 'playing') return;

    // Use fuzzy matching for validation
    const { isMatch } = validateGuess(guess, answer);

    if (isMatch) {
      // Calculate score on correct guess
      const gameScore = calculateScore(totalSteps, state.revealedCount, true);
      dispatch({ type: 'CORRECT_GUESS', payload: gameScore });
      triggerNotification('success');
    } else {
      // Check if this incorrect guess will reveal the last step
      if (state.revealedCount >= totalSteps) {
        // Already at max reveals, just record the guess
        dispatch({ type: 'INCORRECT_GUESS', payload: guess });
        triggerNotification('error');
      } else {
        // Penalty reveal
        dispatch({ type: 'INCORRECT_GUESS', payload: guess });
        triggerNotification('error');
      }
    }
  }, [
    state.currentGuess,
    state.gameStatus,
    state.revealedCount,
    totalSteps,
    answer,
    triggerNotification,
  ]);

  // Set current guess text
  const setCurrentGuess = useCallback((text: string) => {
    dispatch({ type: 'SET_CURRENT_GUESS', payload: text });
  }, []);

  // Reset the game
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Share game result
  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !puzzle) {
      return {
        success: false,
        method: 'share',
        error: new Error('No score to share'),
      };
    }
    return shareGameResult(state.score, totalSteps, puzzle.puzzle_date);
  }, [state.score, totalSteps, puzzle]);

  // Auto-scroll to bottom when new step revealed
  useEffect(() => {
    if (flatListRef.current && state.revealedCount > 1) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.revealedCount]);

  // Clear shake animation after delay
  useEffect(() => {
    if (state.lastGuessIncorrect) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_SHAKE' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.lastGuessIncorrect]);

  // Check for game lost condition
  useEffect(() => {
    if (
      allRevealed &&
      state.gameStatus === 'playing' &&
      state.revealedCount >= totalSteps
    ) {
      // Give a brief moment before showing lost state
      const timer = setTimeout(() => {
        const gameScore = calculateScore(totalSteps, state.revealedCount, false);
        dispatch({ type: 'GAME_LOST', payload: gameScore });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allRevealed, state.gameStatus, state.revealedCount, totalSteps]);

  // Persist attempt to local database when game ends
  useEffect(() => {
    if (
      state.gameStatus !== 'playing' &&
      state.score &&
      !state.attemptSaved &&
      puzzle
    ) {
      const saveGameAttempt = async () => {
        try {
          const attemptId = uuidv4();
          const now = new Date().toISOString();

          const attempt: LocalAttempt = {
            id: attemptId,
            puzzle_id: puzzle.id,
            completed: 1,
            score: state.score!.points,
            score_display: generateScoreDisplay(state.score!, totalSteps, {
              puzzleDate: puzzle.puzzle_date,
            }),
            metadata: JSON.stringify({
              guesses: state.guesses,
              revealedCount: state.revealedCount,
              won: state.gameStatus === 'won',
              totalSteps,
            }),
            started_at: state.startedAt,
            completed_at: now,
            synced: 0,
          };

          await saveAttempt(attempt);
          dispatch({ type: 'ATTEMPT_SAVED' });
        } catch (error) {
          console.error('Failed to save attempt:', error);
          // Don't block the game, just log the error
        }
      };

      saveGameAttempt();
    }
  }, [
    state.gameStatus,
    state.score,
    state.attemptSaved,
    state.guesses,
    state.revealedCount,
    state.startedAt,
    puzzle,
    totalSteps,
  ]);

  return {
    // State
    state,
    dispatch,

    // Derived data
    careerSteps,
    answer,
    totalSteps,
    allRevealed,

    // Actions
    revealNext,
    submitGuess,
    setCurrentGuess,
    resetGame,
    shareResult,

    // Refs
    flatListRef,
  };
}
