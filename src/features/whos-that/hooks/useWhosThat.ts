/**
 * Who's That? Game Hook
 *
 * Main game state management for the Who's That? game mode.
 * Uses reducer pattern for predictable state updates.
 *
 * Players guess a footballer in up to 6 tries, receiving
 * colour-coded attribute feedback after each guess.
 * Fewer guesses needed = higher score.
 */

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { ParsedLocalPuzzle } from '@/types/database';
import { validateGuess } from '@/lib/validation';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { useHaptics } from '@/hooks/useHaptics';
import { useGamePersistence } from '@/hooks/useGamePersistence';
import {
  WhosThatState,
  WhosThatAction,
  WhosThatAttemptMetadata,
  GuessFeedback,
  createInitialState,
  parseWhosThatContent,
} from '../types/whosThat.types';
import { calculateWhosThatScore, normalizeWhosThatScore } from '../utils/scoring';
import { generateWhosThatEmojiGrid } from '../utils/share';
import { generateFeedback } from '../utils/feedback';

/**
 * Reducer for Who's That? game state.
 */
function whosThatReducer(state: WhosThatState, action: WhosThatAction): WhosThatState {
  switch (action.type) {
    case 'SUBMIT_GUESS': {
      const { isCorrect, ...feedback } = action.payload;
      const newGuesses: GuessFeedback[] = [...state.guesses, feedback];
      const guessCount = newGuesses.length;

      if (isCorrect) {
        const score = calculateWhosThatScore(guessCount, true);
        return {
          ...state,
          guesses: newGuesses,
          gameStatus: 'won',
          score,
          lastGuessIncorrect: false,
        };
      }

      if (guessCount >= state.maxGuesses) {
        const score = calculateWhosThatScore(guessCount, false);
        return {
          ...state,
          guesses: newGuesses,
          gameStatus: 'lost',
          score,
          lastGuessIncorrect: true,
        };
      }

      return {
        ...state,
        guesses: newGuesses,
        lastGuessIncorrect: true,
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
export { whosThatReducer };

/**
 * Share result type
 */
export interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard';
  error?: Error;
}

/**
 * Main hook for Who's That? game.
 *
 * @param puzzle - The puzzle to play
 * @param isFocused - Whether the screen is focused
 * @returns Game state and actions
 */
export function useWhosThat(puzzle: ParsedLocalPuzzle | null, isFocused: boolean = true) {
  // Parse content
  const whosThatContent = useMemo(() => {
    if (!puzzle) return null;
    return parseWhosThatContent(puzzle.content);
  }, [puzzle]);

  const [state, dispatch] = useReducer(whosThatReducer, undefined, createInitialState);
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Derived state
  const isGameOver = state.gameStatus !== 'playing';
  const remainingGuesses = state.maxGuesses - state.guesses.length;

  // Game persistence
  useGamePersistence<WhosThatState, WhosThatAttemptMetadata>({
    puzzle,
    isFocused,
    state,
    dispatch: dispatch as unknown as import('@/hooks/useGamePersistence').PersistenceDispatch,
    hasProgressToSave: (s) => s.guesses.length > 0,
    serializeProgress: (s) => ({
      guesses: s.guesses,
      won: false,
      guessCount: s.guesses.length,
    }),
    hasRestoredProgress: (meta) => (meta.guesses?.length ?? 0) > 0,
    deserializeProgress: (meta, attempt) => ({
      attemptId: attempt.id,
      startedAt: attempt.started_at ?? new Date().toISOString(),
      guesses: meta.guesses ?? [],
    }),
    buildFinalAttempt: (s, attemptId, completedAt) => {
      const score = s.score;
      if (!score) {
        throw new Error('Score must exist when building final attempt');
      }
      return {
        id: attemptId,
        completed: 1,
        score: normalizeWhosThatScore(score),
        score_display: `${score.points}/${score.maxPoints}`,
        metadata: JSON.stringify({
          guesses: s.guesses,
          won: s.gameStatus === 'won',
          guessCount: s.guesses.length,
        } satisfies WhosThatAttemptMetadata),
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
   * Validates by player ID (primary) or fuzzy name match (fallback),
   * then generates attribute feedback from the guessed player's data.
   *
   * @param playerName - The player display name
   * @param playerId - Wikidata QID (if selected from autocomplete)
   * @param playerAttributes - The guessed player's attributes for feedback generation
   */
  const submitGuess = useCallback(
    (
      playerName: string,
      playerId?: string,
      playerAttributes?: {
        club: string;
        league: string;
        nationality: string;
        position: string;
        birthYear: number;
      }
    ) => {
      if (state.gameStatus !== 'playing' || !whosThatContent) return;

      // Check if already guessed this player
      const alreadyGuessed = state.guesses.some(
        (g) => g.playerName.toLowerCase() === playerName.toLowerCase()
      );
      if (alreadyGuessed) return;

      // Primary check: ID exact match
      let isCorrect = playerId != null && playerId === whosThatContent.answer.player_id;

      // Fallback: fuzzy name matching
      if (!isCorrect) {
        const { isMatch } = validateGuess(playerName, whosThatContent.answer.player_name);
        isCorrect = isMatch;
      }

      // Generate attribute feedback — use real attributes if provided, otherwise
      // use the answer's own data so at least the correct player shows all green.
      // When the guess IS correct, always use the answer's attributes to guarantee all-green
      // (avoids birth_year vs exact-age mismatches).
      const attrs = isCorrect
        ? {
            club: whosThatContent.answer.club,
            league: whosThatContent.answer.league,
            nationality: whosThatContent.answer.nationality,
            position: whosThatContent.answer.position,
            birthYear: whosThatContent.answer.birth_year,
          }
        : playerAttributes ?? {
            club: '',
            league: '',
            nationality: '',
            position: '',
            birthYear: 0,
          };

      const feedback = generateFeedback(
        { playerName, ...attrs },
        whosThatContent.answer
      );

      if (isCorrect) {
        triggerSuccess();
        triggerCompletion();
      } else {
        triggerError();
      }

      dispatch({
        type: 'SUBMIT_GUESS',
        payload: { ...feedback, isCorrect },
      });
    },
    [state.gameStatus, state.guesses, whosThatContent, triggerSuccess, triggerError, triggerCompletion]
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

    const { Share, Platform } = await import('react-native');
    const ExpoClipboard = await import('expo-clipboard');

    const emojiGrid = generateWhosThatEmojiGrid(state.guesses);
    const dateStr = puzzle.puzzle_date;

    const firstLine = state.score.won
      ? state.score.guessCount === 1
        ? 'Got it in one!'
        : `Got it in ${state.score.guessCount}/${state.score.maxPoints} guesses`
      : `Couldn't crack it in ${state.score.maxPoints} tries`;

    const shareText = `Football IQ — Who's That?
${firstLine}
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
      console.error('[WhosThat] Share failed:', error);
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
  }, [state.score, state.guesses, puzzle]);

  return {
    // State
    state,
    dispatch,

    // Derived data from content
    whosThatContent,

    // Derived state
    isGameOver,
    remainingGuesses,

    // Actions
    submitGuess,
    shareResult,
  };
}
