import { useReducer, useEffect, useMemo, useCallback } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { validateGuess } from '@/lib/validation';
import { UnifiedPlayer } from '@/services/oracle/types';
import {
  TransferGuessState,
  TransferGuessAction,
  TransferGuessContent,
  TransferGuessRestorePayload,
  MAX_GUESSES,
  MAX_HINTS,
} from '../types/transferGuess.types';
import { calculateTransferScore } from '../utils/transferScoring';
import { generateTransferScoreDisplay } from '../utils/transferScoreDisplay';
import { shareTransferResult, ShareResult } from '../utils/transferShare';

/**
 * Metadata shape for transfer guess game persistence.
 */
interface TransferGuessMeta {
  hintsRevealed: number;
  guesses: string[];
  startedAt: string;
}

/**
 * Create the initial state for the transfer guess game.
 */
function createInitialState(): TransferGuessState {
  return {
    hintsRevealed: 0,
    guesses: [],
    gameStatus: 'playing',
    lastGuessIncorrect: false,
    score: null,
    attemptSaved: false,
    startedAt: new Date().toISOString(),
    attemptId: null,
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
        guesses: [...state.guesses, '__hint__'],
        lastGuessIncorrect: false,
      };

    case 'INCORRECT_GUESS':
      return {
        ...state,
        guesses: [...state.guesses, action.payload],
        lastGuessIncorrect: true,
        // Note: Does NOT reveal hints (unlike Career Path)
      };

    case 'CORRECT_GUESS':
      return {
        ...state,
        gameStatus: 'won',
        lastGuessIncorrect: false,
        score: action.payload,
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

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
      };

    case 'RESTORE_PROGRESS': {
      // Cast to specific payload type for type-safe access
      const payload = action.payload as TransferGuessRestorePayload;
      return {
        ...state,
        hintsRevealed: payload.hintsRevealed,
        guesses: payload.guesses,
        attemptId: payload.attemptId,
        startedAt: payload.startedAt,
        gameStatus: 'playing',
      };
    }

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
 * const { state, submitPlayerGuess, submitTextGuess, revealHint, giveUp, shareResult } = useTransferGuessGame(puzzle);
 * ```
 */
export function useTransferGuessGame(
  puzzle: ParsedLocalPuzzle | null,
  isFocused: boolean = true
) {
  const [state, dispatch] = useReducer(transferGuessReducer, createInitialState());
  const { triggerSuccess, triggerError, triggerSelection } = useHaptics();
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();

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

  // Game persistence (attemptId, progress restore, background save, completion save)
  useGamePersistence<TransferGuessState, TransferGuessMeta>({
    puzzle,
    isFocused,
    state,
    dispatch,
    hasProgressToSave: (s) => s.hintsRevealed > 0 || s.guesses.length > 0,
    serializeProgress: (s) => ({
      hintsRevealed: s.hintsRevealed,
      guesses: s.guesses,
      startedAt: s.startedAt,
    }),
    hasRestoredProgress: (meta) =>
      (meta.hintsRevealed ?? 0) > 0 || (meta.guesses?.length ?? 0) > 0,
    deserializeProgress: (meta, attempt) => ({
      attemptId: attempt.id,
      hintsRevealed: meta.hintsRevealed ?? 0,
      guesses: meta.guesses ?? [],
      startedAt: meta.startedAt ?? attempt.started_at ?? new Date().toISOString(),
    }),
    buildFinalAttempt: (s, attemptId, completedAt) => {
      // Score is guaranteed to exist when game ends (checked by hook)
      const score = s.score;
      if (!score) {
        throw new Error('Score must exist when building final attempt');
      }
      return {
        id: attemptId,
        completed: 1,
        score: score.points,
        score_display: generateTransferScoreDisplay(score, {
          puzzleDate: puzzle?.puzzle_date ?? '',
        }),
        metadata: JSON.stringify({
          guesses: s.guesses,
          hintsRevealed: s.hintsRevealed,
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

  // Reveal the next hint
  const revealHint = useCallback(() => {
    if (canRevealHint) {
      dispatch({ type: 'REVEAL_HINT' });
      triggerSelection();
    }
  }, [canRevealHint, triggerSelection]);

  // Process the result of a guess (shared by both submission paths)
  const processGuessResult = useCallback(
    (isMatch: boolean, guessLabel: string) => {
      if (isMatch) {
        const gameScore = calculateTransferScore(
          state.hintsRevealed,
          state.guesses.length,
          true
        );
        dispatch({ type: 'CORRECT_GUESS', payload: gameScore });
        triggerSuccess();
      } else {
        dispatch({ type: 'INCORRECT_GUESS', payload: guessLabel });
        triggerError();
      }
    },
    [state.hintsRevealed, state.guesses.length, triggerSuccess, triggerError]
  );

  // Submit a player selected from the autocomplete dropdown
  const submitPlayerGuess = useCallback(
    (player: UnifiedPlayer) => {
      if (state.gameStatus !== 'playing') return;
      const { isMatch } = validateGuess(player.name, answer);
      processGuessResult(isMatch, player.name);
    },
    [state.gameStatus, answer, processGuessResult]
  );

  // Submit typed text without selecting from dropdown
  const submitTextGuess = useCallback(
    (text: string) => {
      const guess = text.trim();
      if (!guess || state.gameStatus !== 'playing') return;
      const { isMatch } = validateGuess(guess, answer);
      processGuessResult(isMatch, guess);
    },
    [state.gameStatus, answer, processGuessResult]
  );

  // Give up
  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing') return;

    const gameScore = calculateTransferScore(
      state.hintsRevealed,
      state.guesses.length,
      false
    );
    dispatch({ type: 'GIVE_UP', payload: gameScore });
    triggerError();
  }, [state.gameStatus, state.hintsRevealed, state.guesses.length, triggerError]);

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
    submitPlayerGuess,
    submitTextGuess,
    giveUp,
    resetGame,
    shareResult,
  };
}
