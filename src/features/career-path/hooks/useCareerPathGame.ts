import { useReducer, useEffect, useRef, useMemo, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import { usePuzzleContext } from '@/features/puzzles';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { LocalAttempt } from '@/types/database';
import {
  CareerPathState,
  CareerPathAction,
  CareerPathContent,
  CareerStep,
  CareerPathRestorePayload,
} from '../types/careerPath.types';

/**
 * Metadata shape for career path game persistence.
 */
interface CareerPathMeta {
  revealedCount: number;
  guesses: string[];
  startedAt: string;
}
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
    attemptId: null,
    isVictoryRevealing: false,
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
        isVictoryRevealing: true, // Start victory reveal animation
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

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
      };

    case 'VICTORY_REVEAL_COMPLETE':
      return {
        ...state,
        isVictoryRevealing: false,
      };

    case 'RESTORE_PROGRESS': {
      // Cast to specific payload type for type-safe access
      const payload = action.payload as CareerPathRestorePayload;
      return {
        ...state,
        revealedCount: payload.revealedCount,
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
  const { triggerSuccess, triggerError, triggerSelection } = useHaptics();
  const { syncAttempts } = usePuzzleContext();

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

  // Derived state for game progression
  // allCluesRevealed: true when all n steps have been shown to the player
  const allCluesRevealed = state.revealedCount >= totalSteps;
  // isLastChance: true when all clues are revealed but player can still make a final guess
  const isLastChance = allCluesRevealed && state.gameStatus === 'playing';
  // canStillGuess: true while game is in playing state (player hasn't won/lost yet)
  const canStillGuess = state.gameStatus === 'playing';

  // Backwards compatibility alias
  const allRevealed = allCluesRevealed;

  // Game persistence (attemptId, progress restore, background save, completion save)
  useGamePersistence<CareerPathState, CareerPathMeta>({
    puzzle,
    state,
    dispatch,
    hasProgressToSave: (s) => s.revealedCount > 1,
    serializeProgress: (s) => ({
      revealedCount: s.revealedCount,
      guesses: s.guesses,
      startedAt: s.startedAt,
    }),
    hasRestoredProgress: (meta) => (meta.revealedCount ?? 0) > 1,
    deserializeProgress: (meta, attempt) => ({
      attemptId: attempt.id,
      revealedCount: meta.revealedCount ?? 1,
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
        score_display: generateScoreDisplay(score, totalSteps, {
          puzzleDate: puzzle?.puzzle_date ?? '',
        }),
        metadata: JSON.stringify({
          guesses: s.guesses,
          revealedCount: s.revealedCount,
          won: s.gameStatus === 'won',
          totalSteps,
          points: score.points,
          maxPoints: score.maxPoints,
        }),
        started_at: s.startedAt,
        completed_at: completedAt,
        synced: 0,
      };
    },
    onAttemptSaved: syncAttempts,
  });

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
      triggerSuccess();
    } else {
      // Check if all clues are already revealed (this is the player's last chance)
      const wasLastChance = state.revealedCount >= totalSteps;

      if (wasLastChance) {
        // Player guessed wrong with all clues revealed - game over
        const gameScore = calculateScore(totalSteps, state.revealedCount, false);
        dispatch({ type: 'GAME_LOST', payload: gameScore });
        triggerError();
      } else {
        // Penalty reveal - show next clue and let player try again
        dispatch({ type: 'INCORRECT_GUESS', payload: guess });
        triggerError();
      }
    }
  }, [
    state.currentGuess,
    state.gameStatus,
    state.revealedCount,
    totalSteps,
    answer,
    triggerSuccess,
    triggerError,
  ]);

  // Set current guess text
  const setCurrentGuess = useCallback((text: string) => {
    dispatch({ type: 'SET_CURRENT_GUESS', payload: text });
  }, []);

  // Reset the game
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Complete the victory reveal animation
  const completeVictoryReveal = useCallback(() => {
    dispatch({ type: 'VICTORY_REVEAL_COMPLETE' });
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
    // Use dynamic title based on game mode
    const title = puzzle.game_mode === 'career_path_pro'
      ? 'Football IQ - Career Path Pro'
      : 'Football IQ - Career Path';
    return shareGameResult(state.score, totalSteps, {
      puzzleDate: puzzle.puzzle_date,
      title,
    });
  }, [state.score, totalSteps, puzzle]);

  // NOTE: Auto-scroll removed to prevent input from jumping when user types.
  // The timeline is compact enough that users can see their guesses without auto-scroll.

  // Clear shake animation after delay
  useEffect(() => {
    if (state.lastGuessIncorrect) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_SHAKE' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.lastGuessIncorrect]);

  // NOTE: Game loss is now handled in submitGuess when player makes incorrect guess
  // while all clues are revealed (isLastChance). This fixes the off-by-one bug where
  // the game previously ended immediately when all clues were revealed, without
  // giving the player a chance to make a final guess.

  return {
    // State
    state,
    dispatch,

    // Derived data
    careerSteps,
    answer,
    totalSteps,
    allRevealed,
    allCluesRevealed,
    isLastChance,
    canStillGuess,
    isVictoryRevealing: state.isVictoryRevealing,

    // Actions
    revealNext,
    submitGuess,
    setCurrentGuess,
    resetGame,
    shareResult,
    completeVictoryReveal,

    // Refs
    flatListRef,
  };
}
