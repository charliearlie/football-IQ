/**
 * Who Am I? Game Hook
 *
 * Main game state management for the Who Am I? game mode.
 * Uses reducer pattern for predictable state updates.
 *
 * Players guess a footballer from 5 progressive clues.
 * Fewer clues needed = higher score.
 */

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { ParsedLocalPuzzle } from '@/types/database';
import { validateGuess } from '@/lib/validation';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { useHaptics } from '@/hooks/useHaptics';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import {
  WhoAmIState,
  WhoAmIAction,
  WhoAmIAttemptMetadata,
  createInitialState,
  parseWhoAmIContent,
} from '../types/whoAmI.types';
import { calculateWhoAmIScore, normalizeWhoAmIScore } from '../utils/scoring';
import { generateWhoAmIEmojiGrid } from '../utils/share';

/**
 * Reducer for Who Am I? game state.
 */
function whoAmIReducer(state: WhoAmIState, action: WhoAmIAction): WhoAmIState {
  switch (action.type) {
    case 'SUBMIT_GUESS': {
      const { playerName, isCorrect } = action.payload;
      const newGuesses = [...state.guesses, playerName];

      if (isCorrect) {
        const score = calculateWhoAmIScore(5, state.cluesRevealed, true);
        return {
          ...state,
          guesses: newGuesses,
          gameStatus: 'won',
          score,
          lastGuessIncorrect: false,
        };
      }

      return {
        ...state,
        guesses: newGuesses,
        lastGuessIncorrect: true,
      };
    }

    case 'REVEAL_NEXT_CLUE': {
      const nextClue = state.cluesRevealed + 1;
      // If all 5 clues revealed and no correct guess, game over
      if (nextClue > 5) {
        const score = calculateWhoAmIScore(5, 5, false);
        return {
          ...state,
          cluesRevealed: 5,
          gameStatus: 'lost',
          score,
        };
      }
      return {
        ...state,
        cluesRevealed: nextClue,
      };
    }

    case 'GIVE_UP': {
      const score = calculateWhoAmIScore(5, state.cluesRevealed, false);
      return {
        ...state,
        gameStatus: 'revealed',
        score,
      };
    }

    case 'CLEAR_SHAKE':
      return { ...state, lastGuessIncorrect: false };

    case 'SET_ATTEMPT_ID':
      return { ...state, attemptId: action.payload };

    case 'RESTORE_PROGRESS': {
      const payload = action.payload;
      return {
        ...state,
        guesses: payload.guesses,
        attemptId: payload.attemptId,
        startedAt: payload.startedAt,
        cluesRevealed: payload.cluesRevealed ?? 1,
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
export { whoAmIReducer };

/**
 * Share result type
 */
export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Main hook for Who Am I? game.
 *
 * @param puzzle - The puzzle to play
 * @param isFocused - Whether the screen is focused
 * @returns Game state and actions
 */
export function useWhoAmIGame(puzzle: ParsedLocalPuzzle | null, isFocused: boolean = true) {
  // Parse content
  const whoAmIContent = useMemo(() => {
    if (!puzzle) return null;
    return parseWhoAmIContent(puzzle.content);
  }, [puzzle]);

  const [state, dispatch] = useReducer(whoAmIReducer, undefined, createInitialState);
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Derived state
  const isGameOver = state.gameStatus !== 'playing';
  const totalClues = whoAmIContent?.clues.length ?? 5;
  const canRevealMore = state.gameStatus === 'playing' && state.cluesRevealed < totalClues;

  // Visible clues (only show revealed ones)
  const visibleClues = useMemo(() => {
    if (!whoAmIContent) return [];
    return whoAmIContent.clues.slice(0, state.cluesRevealed);
  }, [whoAmIContent, state.cluesRevealed]);

  // Game persistence
  useGamePersistence<WhoAmIState, WhoAmIAttemptMetadata>({
    puzzle,
    isFocused,
    state,
    dispatch: dispatch as unknown as import('@/hooks/useGamePersistence').PersistenceDispatch,
    hasProgressToSave: (s) => s.guesses.length > 0 || s.cluesRevealed > 1,
    serializeProgress: (s) => ({
      guesses: s.guesses,
      cluesRevealed: s.cluesRevealed,
      won: false,
    }),
    hasRestoredProgress: (meta) =>
      (meta.guesses?.length ?? 0) > 0 || (meta.cluesRevealed ?? 1) > 1,
    deserializeProgress: (meta, attempt) => ({
      attemptId: attempt.id,
      startedAt: attempt.started_at ?? new Date().toISOString(),
      guesses: meta.guesses ?? [],
      cluesRevealed: meta.cluesRevealed ?? 1,
    }),
    buildFinalAttempt: (s, attemptId, completedAt) => {
      const score = s.score;
      if (!score) {
        throw new Error('Score must exist when building final attempt');
      }
      return {
        id: attemptId,
        completed: 1,
        score: normalizeWhoAmIScore(score),
        score_display: `${score.points}/${score.maxPoints}`,
        metadata: JSON.stringify({
          guesses: s.guesses,
          cluesRevealed: s.cluesRevealed,
          won: s.gameStatus === 'won',
          ...(s.gameStatus === 'revealed' && { gaveUp: true }),
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
      dispatch({ type: 'RESET' });
    }
  }, [puzzle?.id]);

  // Clear shake animation after delay
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_SHAKE' });
    }, 500);

    return () => clearTimeout(timer);
  }, [state.lastGuessIncorrect]);

  /**
   * Submit a player guess.
   * Validates against correct_player_id with fallback to fuzzy name matching.
   */
  const submitGuess = useCallback(
    (playerName: string, playerId?: string) => {
      if (state.gameStatus !== 'playing' || !whoAmIContent) return;

      // Check if already guessed this player
      const alreadyGuessed = state.guesses.some(
        (g) => g.toLowerCase() === playerName.toLowerCase()
      );
      if (alreadyGuessed) return;

      // Primary check: ID exact match
      let isCorrect = playerId != null && playerId === whoAmIContent.correct_player_id;

      // Fallback: fuzzy name matching
      if (!isCorrect) {
        const { isMatch } = validateGuess(playerName, whoAmIContent.correct_player_name);
        isCorrect = isMatch;
      }

      if (isCorrect) {
        triggerSuccess();
        triggerCompletion();
      } else {
        triggerError();
      }

      dispatch({
        type: 'SUBMIT_GUESS',
        payload: { playerName, isCorrect },
      });
    },
    [state.gameStatus, state.guesses, whoAmIContent, triggerSuccess, triggerError, triggerCompletion]
  );

  /**
   * Reveal the next clue.
   */
  const revealNextClue = useCallback(() => {
    if (!canRevealMore) return;
    dispatch({ type: 'REVEAL_NEXT_CLUE' });
  }, [canRevealMore]);

  /**
   * Give up and reveal the answer.
   */
  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing') return;
    dispatch({ type: 'GIVE_UP' });
  }, [state.gameStatus]);

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

    const { Share, Platform } = await import('react-native');
    const ExpoClipboard = await import('expo-clipboard');

    const emojiGrid = generateWhoAmIEmojiGrid(state.score);
    const dateStr = puzzle.puzzle_date;

    const firstLine = state.score.won
      ? `I knew who it was after just ${state.score.cluesRevealed} clue${state.score.cluesRevealed === 1 ? '' : 's'}!`
      : 'This one stumped me completely';

    const shareText = `${firstLine}
${dateStr}
${emojiGrid}
${state.score.points}/${state.score.maxPoints} IQ

Play at https://football-iq.app?ref=share`;

    try {
      if (Platform.OS === 'web') {
        await ExpoClipboard.setStringAsync(shareText);
        return { success: true, method: 'clipboard' };
      }

      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      }
      return { success: false, method: 'share' };
    } catch (error) {
      console.error('[WhoAmI] Share failed:', error);
      try {
        await ExpoClipboard.setStringAsync(shareText);
        return { success: true, method: 'clipboard' };
      } catch {
        return {
          success: false,
          method: 'clipboard',
          error: error as Error,
        };
      }
    }
  }, [state.score, puzzle]);

  return {
    // State
    state,
    dispatch,

    // Derived data from content
    whoAmIContent,
    visibleClues,

    // Derived state
    isGameOver,
    canRevealMore,
    totalClues,

    // Actions
    submitGuess,
    revealNextClue,
    giveUp,
    shareResult,
  };
}
