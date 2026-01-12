/**
 * The Grid Game Hook
 *
 * Main game state management for The Grid game mode.
 * Uses reducer pattern for predictable state updates.
 */

import { useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ParsedLocalPuzzle } from '@/types/database';
import { saveAttempt, getAttemptByPuzzleId } from '@/lib/database';
import { usePuzzleContext } from '@/features/puzzles';
import {
  TheGridState,
  TheGridAction,
  TheGridContent,
  TheGridScore,
  FilledCell,
  CellIndex,
  createInitialState,
  parseTheGridContent,
  RestoreProgressPayload,
  TheGridAttemptMetadata,
} from '../types/theGrid.types';
import { validateCellGuess, getCellCategories, countFilledCells, validateCellWithDB } from '../utils/validation';
import { calculateGridScore, isGridComplete } from '../utils/scoring';
import { shareTheGridResult, ShareResult } from '../utils/share';
import { generateTheGridScoreDisplay } from '../utils/scoreDisplay';

/**
 * Reducer for The Grid game state.
 */
function theGridReducer(state: TheGridState, action: TheGridAction): TheGridState {
  switch (action.type) {
    case 'SELECT_CELL':
      // Can only select empty cells while playing
      if (state.gameStatus !== 'playing') return state;
      if (state.cells[action.payload] !== null) return state;

      return {
        ...state,
        selectedCell: action.payload,
        currentGuess: '',
        lastGuessIncorrect: false,
      };

    case 'DESELECT_CELL':
      return {
        ...state,
        selectedCell: null,
        currentGuess: '',
        lastGuessIncorrect: false,
      };

    case 'SET_CURRENT_GUESS':
      return {
        ...state,
        currentGuess: action.payload,
        lastGuessIncorrect: false,
      };

    case 'CORRECT_GUESS': {
      const newCells = [...state.cells];
      newCells[action.payload.cellIndex] = { player: action.payload.player };

      return {
        ...state,
        cells: newCells,
        selectedCell: null,
        currentGuess: '',
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

    case 'GAME_COMPLETE':
      return {
        ...state,
        gameStatus: 'complete',
        score: action.payload,
        selectedCell: null,
        currentGuess: '',
      };

    case 'SET_ATTEMPT_ID':
      return {
        ...state,
        attemptId: action.payload,
      };

    case 'RESTORE_PROGRESS':
      return {
        ...state,
        cells: action.payload.cells,
        attemptId: action.payload.attemptId,
      };

    case 'MARK_ATTEMPT_SAVED':
      return {
        ...state,
        attemptSaved: true,
      };

    case 'RESET_GAME':
      return createInitialState();

    default:
      return state;
  }
}

/**
 * Main hook for The Grid game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useTheGridGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(theGridReducer, undefined, createInitialState);
  const { syncAttempts } = usePuzzleContext();

  // Keep a ref for async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Parse puzzle content
  const gridContent = useMemo(() => {
    if (!puzzle) return null;
    return parseTheGridContent(puzzle.content);
  }, [puzzle]);

  // Get categories for selected cell
  const selectedCellCategories = useMemo(() => {
    if (state.selectedCell === null || !gridContent) return null;
    return getCellCategories(state.selectedCell, gridContent);
  }, [state.selectedCell, gridContent]);

  // Generate attempt ID on first action
  useEffect(() => {
    if (!state.attemptId && state.gameStatus === 'playing' && puzzle) {
      dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
    }
  }, [state.attemptId, state.gameStatus, puzzle]);

  // Check for resume on mount
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle) return;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);

        if (existingAttempt && !existingAttempt.completed && existingAttempt.metadata) {
          const metadata = existingAttempt.metadata as TheGridAttemptMetadata;
          if (metadata.cells) {
            dispatch({
              type: 'RESTORE_PROGRESS',
              payload: {
                cells: metadata.cells,
                attemptId: existingAttempt.id,
              },
            });
          }
        }
      } catch (error) {
        console.warn('[TheGrid] Failed to check for resume:', error);
      }
    }

    checkForResume();
  }, [puzzle?.id]);

  // Check for game completion after each correct guess
  useEffect(() => {
    if (state.gameStatus !== 'playing') return;

    if (isGridComplete(state.cells)) {
      const score = calculateGridScore(9);
      dispatch({ type: 'GAME_COMPLETE', payload: score });
    }
  }, [state.cells, state.gameStatus]);

  // Save attempt on game complete
  useEffect(() => {
    if (state.gameStatus !== 'complete' || state.attemptSaved || !puzzle) return;

    // Capture puzzle reference for async function
    const currentPuzzle = puzzle;

    async function saveCompletedAttempt() {
      if (!stateRef.current.score || !stateRef.current.attemptId) return;

      const metadata: TheGridAttemptMetadata = {
        cellsFilled: stateRef.current.score.cellsFilled,
        cells: stateRef.current.cells,
      };

      const scoreDisplay = generateTheGridScoreDisplay(
        stateRef.current.cells,
        stateRef.current.score,
        { date: currentPuzzle.puzzle_date }
      );

      try {
        await saveAttempt({
          id: stateRef.current.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 1,
          score: stateRef.current.score.points,
          score_display: scoreDisplay,
          metadata: JSON.stringify(metadata),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          synced: 0,
        });

        dispatch({ type: 'MARK_ATTEMPT_SAVED' });

        // Fire-and-forget cloud sync
        syncAttempts().catch((err) => {
          console.error('[TheGrid] Cloud sync failed:', err);
        });
      } catch (error) {
        console.error('[TheGrid] Failed to save attempt:', error);
      }
    }

    saveCompletedAttempt();
  }, [state.gameStatus, state.attemptSaved, puzzle, syncAttempts]);

  // Save progress on app background
  useEffect(() => {
    if (!puzzle) return;

    // Capture puzzle reference for async function
    const currentPuzzle = puzzle;

    async function saveProgress() {
      const currentState = stateRef.current;

      // Only save if game is in progress and has an attempt ID
      if (currentState.gameStatus !== 'playing' || !currentState.attemptId) return;

      // Only save if there's progress to save
      const filledCount = countFilledCells(currentState.cells);
      if (filledCount === 0) return;

      const metadata: TheGridAttemptMetadata = {
        cellsFilled: filledCount,
        cells: currentState.cells,
      };

      try {
        await saveAttempt({
          id: currentState.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 0,
          score: 0,
          score_display: null,
          metadata: JSON.stringify(metadata),
          started_at: new Date().toISOString(),
          completed_at: null,
          synced: 0,
        });
      } catch (error) {
        console.warn('[TheGrid] Failed to save progress:', error);
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

  // Clear incorrect state after delay
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_INCORRECT' });
    }, 500);

    return () => clearTimeout(timer);
  }, [state.lastGuessIncorrect]);

  // Actions
  const selectCell = useCallback((cellIndex: CellIndex) => {
    dispatch({ type: 'SELECT_CELL', payload: cellIndex });
  }, []);

  const deselectCell = useCallback(() => {
    dispatch({ type: 'DESELECT_CELL' });
  }, []);

  const setCurrentGuess = useCallback((text: string) => {
    dispatch({ type: 'SET_CURRENT_GUESS', payload: text });
  }, []);

  const submitGuess = useCallback(() => {
    if (state.selectedCell === null || !gridContent) return;

    const result = validateCellGuess(state.currentGuess, state.selectedCell, gridContent);

    if (result.isValid && result.matchedPlayer) {
      dispatch({
        type: 'CORRECT_GUESS',
        payload: {
          cellIndex: state.selectedCell,
          player: result.matchedPlayer,
        },
      });
    } else {
      dispatch({ type: 'INCORRECT_GUESS' });
    }
  }, [state.selectedCell, state.currentGuess, gridContent]);

  /**
   * Submit a player selection from the PlayerSearchOverlay.
   * Uses database validation instead of pre-defined valid_answers.
   *
   * @param playerId - Player database ID
   * @param playerName - Player display name (used if valid)
   */
  const submitPlayerSelection = useCallback(
    async (playerId: string, playerName: string) => {
      if (state.selectedCell === null || !gridContent) return;

      const result = await validateCellWithDB(playerId, state.selectedCell, gridContent);

      if (result.isValid) {
        dispatch({
          type: 'CORRECT_GUESS',
          payload: {
            cellIndex: state.selectedCell,
            player: playerName,
          },
        });
      } else {
        dispatch({ type: 'INCORRECT_GUESS' });
      }
    },
    [state.selectedCell, gridContent]
  );

  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score) {
      return { success: false, method: 'clipboard', error: new Error('No score to share') };
    }

    return shareTheGridResult(state.cells, state.score, puzzle?.puzzle_date);
  }, [state.cells, state.score, puzzle?.puzzle_date]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    gridContent,
    selectedCellCategories,
    selectCell,
    deselectCell,
    setCurrentGuess,
    submitGuess,
    submitPlayerSelection,
    shareResult,
    resetGame,
  };
}
