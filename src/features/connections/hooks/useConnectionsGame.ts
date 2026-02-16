/**
 * Connections Game Hook
 *
 * Main game state management for the Connections game mode.
 * Uses reducer pattern with shared persistence hook.
 */

import { useReducer, useMemo, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  ConnectionsState,
  ConnectionsAction,
  ConnectionsContent,
  ConnectionsGroup,
  ConnectionsGuess,
  createInitialState,
  parseConnectionsContent,
  ConnectionsAttemptMetadata,
  RestoreProgressPayload,
} from '../types/connections.types';
import { calculateConnectionsScore } from '../utils/scoring';
import { shareConnectionsResult, ShareResult } from '../utils/share';
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
 * Check if a guess matches a group.
 * Returns match info for feedback.
 */
function checkGuess(
  selected: string[],
  groups: ConnectionsGroup[],
  solvedGroups: ConnectionsGroup[]
): {
  correct: boolean;
  matchedGroup?: ConnectionsGroup;
  matchCount?: number;
} {
  // Only check unsolved groups
  const unsolved = groups.filter((g) => !solvedGroups.some((s) => s.category === g.category));

  for (const group of unsolved) {
    const matches = selected.filter((p) => group.players.includes(p));
    if (matches.length === 4) {
      return { correct: true, matchedGroup: group };
    }
  }

  // Find best partial match for "close" feedback (3 out of 4)
  let bestMatch = 0;
  let bestGroup: ConnectionsGroup | undefined;
  for (const group of unsolved) {
    const matches = selected.filter((p) => group.players.includes(p));
    if (matches.length > bestMatch) {
      bestMatch = matches.length;
      bestGroup = group;
    }
  }

  return { correct: false, matchedGroup: bestGroup, matchCount: bestMatch };
}

/**
 * Reducer for Connections game state.
 */
function connectionsReducer(
  state: ConnectionsState,
  action: ConnectionsAction,
  content: ConnectionsContent | null
): ConnectionsState {
  switch (action.type) {
    case 'TOGGLE_PLAYER': {
      if (state.gameStatus !== 'playing') return state;

      const player = action.payload;
      const isSelected = state.selectedPlayers.includes(player);

      if (isSelected) {
        // Deselect
        return {
          ...state,
          selectedPlayers: state.selectedPlayers.filter((p) => p !== player),
          lastGuessResult: null,
        };
      } else {
        // Select (max 4)
        if (state.selectedPlayers.length >= 4) return state;

        return {
          ...state,
          selectedPlayers: [...state.selectedPlayers, player],
          lastGuessResult: null,
        };
      }
    }

    case 'SUBMIT_GUESS': {
      if (!content || state.selectedPlayers.length !== 4 || state.gameStatus !== 'playing') {
        return state;
      }

      const guessResult = checkGuess(state.selectedPlayers, content.groups, state.solvedGroups);

      if (guessResult.correct && guessResult.matchedGroup) {
        // Correct guess - trigger CORRECT_GUESS action
        const guess: ConnectionsGuess = {
          players: [...state.selectedPlayers],
          correct: true,
          matchedGroup: guessResult.matchedGroup.difficulty,
        };

        const newSolvedGroups = [...state.solvedGroups, guessResult.matchedGroup];
        const newRemainingPlayers = state.remainingPlayers.filter(
          (p) => !guessResult.matchedGroup!.players.includes(p)
        );

        const newGuesses = [...state.guesses, guess];

        // Check for win
        if (newSolvedGroups.length === 4) {
          const score = calculateConnectionsScore(state.mistakes, newSolvedGroups);
          return {
            ...state,
            selectedPlayers: [],
            solvedGroups: newSolvedGroups,
            remainingPlayers: newRemainingPlayers,
            guesses: newGuesses,
            gameStatus: 'won',
            score,
            lastGuessResult: 'correct',
            revealingGroup: guessResult.matchedGroup,
          };
        }

        return {
          ...state,
          selectedPlayers: [],
          solvedGroups: newSolvedGroups,
          remainingPlayers: newRemainingPlayers,
          guesses: newGuesses,
          lastGuessResult: 'correct',
          revealingGroup: guessResult.matchedGroup,
        };
      } else {
        // Incorrect guess
        const newMistakes = state.mistakes + 1;
        const guess: ConnectionsGuess = {
          players: [...state.selectedPlayers],
          correct: false,
          matchCount: guessResult.matchCount,
        };

        const newGuesses = [...state.guesses, guess];

        // Check for loss (4 mistakes)
        if (newMistakes >= 4) {
          const score = calculateConnectionsScore(newMistakes, state.solvedGroups);
          return {
            ...state,
            selectedPlayers: [],
            mistakes: newMistakes,
            guesses: newGuesses,
            gameStatus: 'lost',
            score,
            lastGuessResult: guessResult.matchCount === 3 ? 'close' : 'incorrect',
          };
        }

        return {
          ...state,
          selectedPlayers: guessResult.matchCount === 3 ? state.selectedPlayers : [],
          mistakes: newMistakes,
          guesses: newGuesses,
          lastGuessResult: guessResult.matchCount === 3 ? 'close' : 'incorrect',
        };
      }
    }

    case 'SHUFFLE_REMAINING': {
      if (state.gameStatus !== 'playing') return state;

      return {
        ...state,
        remainingPlayers: shuffleArray(state.remainingPlayers),
        lastGuessResult: null,
      };
    }

    case 'DESELECT_ALL': {
      return {
        ...state,
        selectedPlayers: [],
        lastGuessResult: null,
      };
    }

    case 'CLEAR_FEEDBACK': {
      return {
        ...state,
        lastGuessResult: null,
        revealingGroup: null,
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
      const { attemptId, startedAt, mistakes, solvedGroups, guesses } = action.payload;

      // Rebuild remainingPlayers from content
      if (!content) return state;

      const allPlayers = content.groups.flatMap((g) => g.players);
      const solvedPlayers = solvedGroups.flatMap((g) => g.players);
      const remaining = allPlayers.filter((p) => !solvedPlayers.includes(p));

      return {
        ...state,
        attemptId,
        startedAt,
        mistakes,
        solvedGroups,
        guesses,
        remainingPlayers: remaining,
        selectedPlayers: [],
        gameStatus: 'playing',
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
      const allPlayers = content.groups.flatMap((g) => g.players);
      const shuffled = shuffleArray(allPlayers);
      return createInitialState(shuffled);
    }

    default:
      return state;
  }
}

/**
 * Main hook for Connections game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useConnectionsGame(puzzle: ParsedLocalPuzzle | null) {
  const isFocused = useIsFocused();
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Parse puzzle content
  const content = useMemo(() => {
    if (!puzzle) return null;
    return parseConnectionsContent(puzzle.content);
  }, [puzzle]);

  // Initial shuffled players
  const initialPlayers = useMemo(() => {
    if (!content) return [];
    const allPlayers = content.groups.flatMap((g) => g.players);
    return shuffleArray(allPlayers);
  }, [content]);

  // Reducer with content passed as third arg
  const [state, baseDispatch] = useReducer(
    (s: ConnectionsState, a: ConnectionsAction) => connectionsReducer(s, a, content),
    undefined,
    () => createInitialState(initialPlayers)
  );

  // Type-safe dispatch
  const dispatch = baseDispatch as (action: ConnectionsAction) => void;

  // Use shared persistence hook
  useGamePersistence<ConnectionsState, ConnectionsAttemptMetadata>({
    puzzle,
    isFocused,
    state,
    dispatch: dispatch as never, // Cast to satisfy PersistenceDispatch
    hasProgressToSave: (s) => s.guesses.length > 0 || s.mistakes > 0,
    serializeProgress: (s) => ({
      mistakes: s.mistakes,
      solvedGroups: s.solvedGroups.map((g) => g.category),
      guesses: s.guesses,
      startedAt: s.startedAt ?? new Date().toISOString(),
    }),
    hasRestoredProgress: (m) => (m.guesses?.length ?? 0) > 0 || (m.mistakes ?? 0) > 0,
    deserializeProgress: (meta, attempt) => {
      // Rebuild solvedGroups from category names
      const solvedGroups: ConnectionsGroup[] = [];
      if (meta.solvedGroups && content) {
        for (const category of meta.solvedGroups) {
          const group = content.groups.find((g) => g.category === category);
          if (group) solvedGroups.push(group);
        }
      }

      return {
        attemptId: attempt.id,
        startedAt: meta.startedAt ?? attempt.started_at ?? new Date().toISOString(),
        mistakes: meta.mistakes ?? 0,
        solvedGroups,
        guesses: meta.guesses ?? [],
      };
    },
    buildFinalAttempt: (s, attemptId, completedAt) => {
      const metadata: ConnectionsAttemptMetadata = {
        mistakes: s.mistakes,
        solvedGroups: s.solvedGroups.map((g) => g.category),
        guesses: s.guesses,
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

  // Actions
  const togglePlayer = useCallback(
    (name: string) => {
      dispatch({ type: 'TOGGLE_PLAYER', payload: name });
    },
    [dispatch]
  );

  const submitGuess = useCallback(() => {
    if (state.selectedPlayers.length !== 4) return;

    dispatch({ type: 'SUBMIT_GUESS' });

    // Haptic feedback based on result (happens after state update)
    // We need to check the result manually here
    if (!content) return;

    const guessResult = checkGuess(state.selectedPlayers, content.groups, state.solvedGroups);

    if (guessResult.correct) {
      if (state.solvedGroups.length === 3) {
        // Last group - completion haptic
        triggerCompletion();
      } else {
        triggerSuccess();
      }
    } else {
      triggerError();
    }
  }, [state.selectedPlayers, state.solvedGroups, content, dispatch, triggerSuccess, triggerError, triggerCompletion]);

  const shufflePlayers = useCallback(() => {
    dispatch({ type: 'SHUFFLE_REMAINING' });
  }, [dispatch]);

  const deselectAll = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL' });
  }, [dispatch]);

  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !content) {
      return { success: false, method: 'clipboard', error: new Error('No score to share') };
    }

    return shareConnectionsResult(
      state.guesses,
      state.solvedGroups,
      content.groups,
      state.mistakes,
      state.score,
      puzzle?.puzzle_date
    );
  }, [state.guesses, state.solvedGroups, state.mistakes, state.score, content, puzzle?.puzzle_date]);

  return {
    state,
    content,
    togglePlayer,
    submitGuess,
    shufflePlayers,
    deselectAll,
    shareResult,
    isLoading: !content,
  };
}
