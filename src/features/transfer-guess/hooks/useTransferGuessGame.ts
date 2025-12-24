import { useReducer, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useHaptics } from '@/hooks/useHaptics';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { saveAttempt } from '@/lib/database';
import { LocalAttempt } from '@/types/database';
import { validateGuess } from '@/features/career-path/utils/validation';
import {
  TransferGuessState,
  TransferGuessAction,
  TransferGuessContent,
  MAX_GUESSES,
  MAX_HINTS,
} from '../types/transferGuess.types';
import { calculateTransferScore, TransferGuessScore } from '../utils/transferScoring';
import { generateTransferScoreDisplay } from '../utils/transferScoreDisplay';
import { shareTransferResult, ShareResult } from '../utils/transferShare';

/**
 * Create the initial state for the transfer guess game.
 */
function createInitialState(): TransferGuessState {
  return {
    hintsRevealed: 0,
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
 * Reducer for transfer guess game state.
 */
function transferGuessReducer(
  state: TransferGuessState,
  action: TransferGuessAction
): TransferGuessState {
  switch (action.type) {
    case 'REVEAL_HINT':
      return {
        ...state,
        hintsRevealed: Math.min(state.hintsRevealed + 1, MAX_HINTS),
        lastGuessIncorrect: false,
      };

    case 'INCORRECT_GUESS':
      return {
        ...state,
        guesses: [...state.guesses, action.payload],
        currentGuess: '',
        lastGuessIncorrect: true,
        // Note: Does NOT reveal hints (unlike Career Path)
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

    case 'GIVE_UP':
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
 * Hook to manage Transfer Guess game state.
 *
 * Handles:
 * - Hint reveal logic (starts with 0 hints revealed)
 * - Incorrect guess tracking (no penalty reveal)
 * - Fuzzy matching for player name validation
 * - Dynamic scoring based on hints and guesses
 * - Win/lose detection (5 wrong guesses = lose)
 * - Give up functionality
 * - Shake animation trigger on incorrect guess
 * - Attempt persistence to local database
 * - Share functionality
 *
 * @param puzzle - The current puzzle data
 * @returns Game state, actions, and utilities
 *
 * @example
 * ```tsx
 * const { state, content, submitGuess, revealHint, giveUp, shareResult } = useTransferGuessGame(puzzle);
 * ```
 */
export function useTransferGuessGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(transferGuessReducer, createInitialState());
  const { triggerNotification, triggerSelection } = useHaptics();

  // Parse puzzle content
  const transferContent = useMemo<TransferGuessContent | null>(() => {
    if (!puzzle?.content) return null;
    return puzzle.content as TransferGuessContent;
  }, [puzzle]);

  const answer = useMemo(() => {
    return transferContent?.answer ?? '';
  }, [transferContent]);

  const hints = useMemo(() => {
    return transferContent?.hints ?? ['', '', ''];
  }, [transferContent]);

  // Computed values
  const canRevealHint = state.hintsRevealed < MAX_HINTS && state.gameStatus === 'playing';
  const guessesRemaining = MAX_GUESSES - state.guesses.length;
  const isGameOver = state.gameStatus !== 'playing';

  // Reveal the next hint
  const revealHint = useCallback(() => {
    if (canRevealHint) {
      dispatch({ type: 'REVEAL_HINT' });
      triggerSelection();
    }
  }, [canRevealHint, triggerSelection]);

  // Submit a guess with fuzzy matching
  const submitGuess = useCallback(() => {
    const guess = state.currentGuess.trim();
    if (!guess || state.gameStatus !== 'playing') return;

    // Use fuzzy matching for validation (reused from Career Path)
    const { isMatch } = validateGuess(guess, answer);

    if (isMatch) {
      // Calculate score on correct guess
      const gameScore = calculateTransferScore(
        state.hintsRevealed,
        state.guesses.length,
        true
      );
      dispatch({ type: 'CORRECT_GUESS', payload: gameScore });
      triggerNotification('success');
    } else {
      // Record incorrect guess (no hint reveal penalty)
      dispatch({ type: 'INCORRECT_GUESS', payload: guess });
      triggerNotification('error');
    }
  }, [
    state.currentGuess,
    state.gameStatus,
    state.hintsRevealed,
    state.guesses.length,
    answer,
    triggerNotification,
  ]);

  // Give up
  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing') return;

    const gameScore = calculateTransferScore(
      state.hintsRevealed,
      state.guesses.length,
      false
    );
    dispatch({ type: 'GIVE_UP', payload: gameScore });
    triggerNotification('error');
  }, [state.gameStatus, state.hintsRevealed, state.guesses.length, triggerNotification]);

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
    return shareTransferResult(state.score, puzzle.puzzle_date);
  }, [state.score, puzzle]);

  // Clear shake animation after delay
  useEffect(() => {
    if (state.lastGuessIncorrect) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_SHAKE' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.lastGuessIncorrect]);

  // Check for game lost condition (5 wrong guesses)
  useEffect(() => {
    if (
      state.guesses.length >= MAX_GUESSES &&
      state.gameStatus === 'playing'
    ) {
      // Give a brief moment before showing lost state
      const timer = setTimeout(() => {
        const gameScore = calculateTransferScore(
          state.hintsRevealed,
          state.guesses.length,
          false
        );
        dispatch({ type: 'GAME_LOST', payload: gameScore });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.guesses.length, state.gameStatus, state.hintsRevealed]);

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
            score_display: generateTransferScoreDisplay(state.score!, {
              puzzleDate: puzzle.puzzle_date,
            }),
            metadata: JSON.stringify({
              guesses: state.guesses,
              hintsRevealed: state.hintsRevealed,
              won: state.gameStatus === 'won',
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
    state.hintsRevealed,
    state.startedAt,
    puzzle,
  ]);

  return {
    // State
    state,
    dispatch,

    // Derived data
    transferContent,
    answer,
    hints,

    // Computed
    canRevealHint,
    guessesRemaining,
    isGameOver,
    maxGuesses: MAX_GUESSES,

    // Actions
    revealHint,
    submitGuess,
    giveUp,
    setCurrentGuess,
    resetGame,
    shareResult,
  };
}
