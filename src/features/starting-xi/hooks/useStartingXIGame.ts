/**
 * Starting XI Game Hook
 *
 * Main game state management for Starting XI game mode.
 * Uses reducer pattern for predictable state updates.
 *
 * Game flow:
 * 1. Initialize slots from puzzle content
 * 2. Player selects a hidden slot (shows "?")
 * 3. PlayerSearchOverlay opens for guessing
 * 4. Validate guess against slot's player name
 * 5. On correct: mark slot as found
 * 6. Game completes when all hidden players found (or player gives up)
 */

import { useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ParsedLocalPuzzle } from '@/types/database';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { useHaptics } from '@/hooks/useHaptics';
import { validateGuess } from '@/lib/validation';
import type {
  StartingXIState,
  StartingXIAction,
  LineupContent,
  PlayerSlotState,
  SlotIndex,
  StartingXIMeta,
} from '../types/startingXI.types';
import { POSITION_MAP, extractSurname, getPositionCoords } from '../constants/formations';
import { calculateScoreFromSlots } from '../utils/scoring';
import { shareStartingXIResult, ShareResult } from '../utils/share';
import { generateScoreDisplayString } from '../utils/scoreDisplay';

/**
 * Create initial game state.
 */
function createInitialState(): StartingXIState {
  return {
    slots: [],
    gameStatus: 'idle',
    selectedSlot: null,
    score: null,
    startedAt: null,
    attemptSaved: false,
    attemptId: null,
    lastGuessIncorrect: false,
    lastGuessResult: null,
    lastGuessedId: null,
  };
}

/**
 * Parse puzzle content into LineupContent.
 */
function parseLineupContent(content: unknown): LineupContent | null {
  if (!content || typeof content !== 'object') return null;

  const c = content as Record<string, unknown>;

  if (
    typeof c.match_name === 'string' &&
    typeof c.formation === 'string' &&
    typeof c.team === 'string' &&
    Array.isArray(c.players)
  ) {
    return content as LineupContent;
  }

  return null;
}

/**
 * Initialize player slots from puzzle content.
 */
function initializeSlots(content: LineupContent): PlayerSlotState[] {
  return content.players.map((player) => {
    const coords = getPositionCoords(
      player.position_key,
      player.override_x,
      player.override_y
    );

    return {
      positionKey: player.position_key,
      coords,
      fullName: player.player_name,
      displayName: extractSurname(player.player_name),
      isHidden: player.is_hidden,
      isFound: false,
    };
  });
}

/**
 * Reducer for Starting XI game state.
 */
function startingXIReducer(
  state: StartingXIState,
  action: StartingXIAction
): StartingXIState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        slots: action.payload.slots,
        gameStatus: 'playing',
        startedAt: new Date().toISOString(),
      };

    case 'SELECT_SLOT': {
      // Can only select hidden, unfound slots while playing
      if (state.gameStatus !== 'playing') return state;
      const slot = state.slots[action.payload];
      if (!slot || !slot.isHidden || slot.isFound) return state;

      return {
        ...state,
        selectedSlot: action.payload,
        lastGuessIncorrect: false,
      };
    }

    case 'DESELECT_SLOT':
      return {
        ...state,
        selectedSlot: null,
        lastGuessIncorrect: false,
      };

    case 'PLAYER_FOUND': {
      const newSlots = [...state.slots];
      newSlots[action.payload] = {
        ...newSlots[action.payload],
        isFound: true,
      };
      return {
        ...state,
        slots: newSlots,
        selectedSlot: null,
        lastGuessIncorrect: false,
      };
    }

    case 'INCORRECT_GUESS':
      return {
        ...state,
        lastGuessIncorrect: true,
      };

    case 'CLEAR_INCORRECT':
      return {
        ...state,
        lastGuessIncorrect: false,
      };

    case 'GUESS_RESULT':
      return {
        ...state,
        lastGuessResult: action.payload.result,
        lastGuessedId: action.payload.slotId,
      };

    case 'CLEAR_GUESS_RESULT':
      return {
        ...state,
        lastGuessResult: null,
        lastGuessedId: null,
      };

    case 'GAME_COMPLETE':
      return {
        ...state,
        gameStatus: 'complete',
        score: action.payload,
        selectedSlot: null,
      };

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
      };

    case 'RESTORE_PROGRESS': {
      const newSlots = state.slots.map((slot, index) => ({
        ...slot,
        isFound: action.payload.foundSlots.includes(index as SlotIndex),
      }));
      return {
        ...state,
        slots: newSlots,
        attemptId: action.payload.attemptId,
        startedAt: action.payload.startedAt,
      };
    }

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
 * Main hook for Starting XI game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useStartingXIGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(startingXIReducer, undefined, createInitialState);
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion, triggerSelection, triggerIncomplete } =
    useHaptics();

  // Keep a ref for async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Parse puzzle content
  const puzzleContent = useMemo(() => {
    if (!puzzle) return null;
    return parseLineupContent(puzzle.content);
  }, [puzzle]);

  // Derived values
  const hiddenSlots = useMemo(
    () => state.slots.filter((s) => s.isHidden),
    [state.slots]
  );
  const foundCount = hiddenSlots.filter((s) => s.isFound).length;
  const totalHidden = hiddenSlots.length;
  const allFound = foundCount === totalHidden && totalHidden > 0;
  const isGameOver = state.gameStatus === 'complete';

  // Initialize slots from puzzle content
  useEffect(() => {
    if (!puzzleContent || state.gameStatus !== 'idle') return;

    const slots = initializeSlots(puzzleContent);
    dispatch({ type: 'INITIALIZE', payload: { slots } });
  }, [puzzleContent, state.gameStatus]);

  // Generate attempt ID on first play
  useEffect(() => {
    if (!state.attemptId && state.gameStatus === 'playing' && puzzle) {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
    }
  }, [state.attemptId, state.gameStatus, puzzle]);

  // Check for resume on mount
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle || state.slots.length === 0) return;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);

        if (existingAttempt && !existingAttempt.completed && existingAttempt.metadata) {
          const metadata = existingAttempt.metadata as StartingXIMeta;
          if (metadata.foundSlots && metadata.foundSlots.length > 0) {
            dispatch({
              type: 'RESTORE_PROGRESS',
              payload: {
                foundSlots: metadata.foundSlots,
                attemptId: existingAttempt.id,
                startedAt: metadata.startedAt || existingAttempt.started_at,
              },
            });
          }
        }
      } catch (error) {
        console.warn('[StartingXI] Failed to check for resume:', error);
      }
    }

    checkForResume();
  }, [puzzle?.id, state.slots.length]);

  // Check for game completion when all hidden players found
  useEffect(() => {
    if (!allFound || state.gameStatus !== 'playing') return;

    triggerCompletion();
    const score = calculateScoreFromSlots(state.slots);
    dispatch({ type: 'GAME_COMPLETE', payload: score });
  }, [allFound, state.gameStatus, state.slots, triggerCompletion]);

  // Save attempt on game complete
  useEffect(() => {
    if (state.gameStatus !== 'complete' || state.attemptSaved || !puzzle) return;

    const currentPuzzle = puzzle;

    async function saveCompletedAttempt() {
      if (!stateRef.current.score || !stateRef.current.attemptId) return;

      const foundSlots = stateRef.current.slots
        .map((s, i) => (s.isHidden && s.isFound ? i : -1))
        .filter((i) => i >= 0) as SlotIndex[];

      const metadata: StartingXIMeta = {
        foundSlots,
        startedAt: stateRef.current.startedAt || new Date().toISOString(),
      };

      const scoreDisplay = generateScoreDisplayString(stateRef.current.slots);

      try {
        await saveAttempt({
          id: stateRef.current.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 1,
          score: stateRef.current.score.points,
          score_display: scoreDisplay,
          metadata: JSON.stringify(metadata),
          started_at: stateRef.current.startedAt || new Date().toISOString(),
          completed_at: new Date().toISOString(),
          synced: 0,
        });

        dispatch({ type: 'ATTEMPT_SAVED' });

        // Refresh local IQ for immediate UI update
        refreshLocalIQ().catch((err) => {
          console.error('[StartingXI] Failed to refresh local IQ:', err);
        });

        // Fire-and-forget cloud sync
        syncAttempts().catch((err) => {
          console.error('[StartingXI] Cloud sync failed:', err);
        });
      } catch (error) {
        console.error('[StartingXI] Failed to save attempt:', error);
      }
    }

    saveCompletedAttempt();
  }, [state.gameStatus, state.attemptSaved, puzzle, syncAttempts, refreshLocalIQ]);

  // Save progress on app background
  useEffect(() => {
    if (!puzzle) return;

    const currentPuzzle = puzzle;

    async function saveProgress() {
      const currentState = stateRef.current;

      // Only save if game is in progress with an attempt ID
      if (currentState.gameStatus !== 'playing' || !currentState.attemptId) return;

      // Only save if there's progress
      const foundSlots = currentState.slots
        .map((s, i) => (s.isHidden && s.isFound ? i : -1))
        .filter((i) => i >= 0) as SlotIndex[];

      if (foundSlots.length === 0) return;

      const metadata: StartingXIMeta = {
        foundSlots,
        startedAt: currentState.startedAt || new Date().toISOString(),
      };

      try {
        await saveAttempt({
          id: currentState.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 0,
          score: 0,
          score_display: null,
          metadata: JSON.stringify(metadata),
          started_at: currentState.startedAt || new Date().toISOString(),
          completed_at: null,
          synced: 0,
        });
      } catch (error) {
        console.warn('[StartingXI] Failed to save progress:', error);
      }
    }

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background') {
          saveProgress();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [puzzle]);

  // Clear incorrect state after delay
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_INCORRECT' });
    }, 500);

    return () => clearTimeout(timer);
  }, [state.lastGuessIncorrect]);

  // Clear guess result after animation completes (600ms for flip animation)
  useEffect(() => {
    if (!state.lastGuessResult) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_GUESS_RESULT' });
    }, 600);

    return () => clearTimeout(timer);
  }, [state.lastGuessResult]);

  // Actions
  const selectSlot = useCallback(
    (index: SlotIndex) => {
      triggerSelection();
      dispatch({ type: 'SELECT_SLOT', payload: index });
    },
    [triggerSelection]
  );

  const deselectSlot = useCallback(() => {
    dispatch({ type: 'DESELECT_SLOT' });
  }, []);

  /**
   * Submit a guess for the currently selected slot.
   * Uses fuzzy validation from lib/validation.ts.
   *
   * Handles four outcomes:
   * - correct: Player found, triggers flip animation
   * - wrong_position: Player IS in lineup but in different slot (amber warning)
   * - incorrect: Player not in lineup, triggers shake animation
   * - duplicate: Guessed an already-found player, triggers bounce on that marker
   *
   * @param guess - Player name guess (can be surname only)
   * @returns true if correct, false otherwise
   */
  const submitGuess = useCallback(
    (guess: string): boolean => {
      if (state.selectedSlot === null) return false;

      const selectedSlotIndex = state.selectedSlot;
      const slot = state.slots[selectedSlotIndex];

      // 1. Check if correct (matches selected slot)
      const result = validateGuess(guess, slot.fullName);
      if (result.isMatch) {
        triggerSuccess();
        dispatch({ type: 'PLAYER_FOUND', payload: selectedSlotIndex });
        dispatch({
          type: 'GUESS_RESULT',
          payload: { result: 'correct', slotId: selectedSlotIndex },
        });
        return true;
      }

      // 2. Check if guess matches any already-found player (duplicate)
      const duplicateSlotIndex = state.slots.findIndex(
        (s, index) =>
          s.isFound && // Player already found
          index !== selectedSlotIndex && // Not the current slot
          validateGuess(guess, s.fullName).isMatch // Guess matches this found player
      );

      if (duplicateSlotIndex !== -1) {
        triggerIncomplete();
        dispatch({
          type: 'GUESS_RESULT',
          payload: { result: 'duplicate', slotId: duplicateSlotIndex as SlotIndex },
        });
        return false;
      }

      // 3. Check if guess matches a different unfound hidden player (wrong position)
      const wrongPositionIndex = state.slots.findIndex(
        (s, index) =>
          s.isHidden && // Must be a hidden slot
          !s.isFound && // Not yet found
          index !== selectedSlotIndex && // Not the current slot
          validateGuess(guess, s.fullName).isMatch // Guess matches this player
      );

      if (wrongPositionIndex !== -1) {
        // Player IS in lineup, just wrong position - amber warning
        triggerIncomplete();
        dispatch({
          type: 'GUESS_RESULT',
          payload: { result: 'wrong_position', slotId: wrongPositionIndex as SlotIndex },
        });
        return false;
      }

      // 4. Truly incorrect - player not in lineup at all
      triggerError();
      dispatch({ type: 'INCORRECT_GUESS' });
      dispatch({
        type: 'GUESS_RESULT',
        payload: { result: 'incorrect', slotId: selectedSlotIndex },
      });
      return false;
    },
    [state.selectedSlot, state.slots, triggerSuccess, triggerError, triggerIncomplete]
  );

  /**
   * Give up and end the game with current progress.
   */
  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing') return;

    const score = calculateScoreFromSlots(state.slots);
    dispatch({ type: 'GAME_COMPLETE', payload: score });
  }, [state.gameStatus, state.slots]);

  /**
   * Share the game result.
   */
  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !puzzleContent) {
      return { success: false, method: 'none' };
    }

    return shareStartingXIResult(state.score, state.slots, puzzleContent);
  }, [state.score, state.slots, puzzleContent]);

  /**
   * Reset the game to initial state.
   */
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    puzzleContent,
    isGameOver,
    foundCount,
    totalHidden,
    selectSlot,
    deselectSlot,
    submitGuess,
    giveUp,
    shareResult,
    resetGame,
    // Feedback state for animations
    lastGuessResult: state.lastGuessResult,
    lastGuessedId: state.lastGuessedId,
  };
}
