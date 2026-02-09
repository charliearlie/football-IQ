/**
 * The Grid Game Hook
 *
 * Main game state management for The Grid game mode.
 * Uses reducer pattern for predictable state updates.
 */

import { useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import { ParsedLocalPuzzle } from '@/types/database';
import { saveAttempt, getAttemptByPuzzleId, getClubColorByName } from '@/lib/database';
import { usePuzzleContext } from '@/features/puzzles';
import { useAuth } from '@/features/auth';
import { useHaptics } from '@/hooks/useHaptics';
import {
  TheGridState,
  TheGridAction,
  TheGridContent,
  GridCategory,
  CellIndex,
  createInitialState,
  parseTheGridContent,
  TheGridAttemptMetadata,
} from '../types/theGrid.types';
import { validateCellGuess, getCellCategories, countFilledCells, validateCellWithDB } from '../utils/validation';
import { calculateGridScore, isGridComplete } from '../utils/scoring';
import { shareTheGridResult, ShareResult } from '../utils/share';
import { generateTheGridScoreDisplay } from '../utils/scoreDisplay';
import { useGridRarity } from './useGridRarity';
import { triggerRareFind } from '@/lib/haptics';

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
      newCells[action.payload.cellIndex] = {
        player: action.payload.player,
        playerId: action.payload.playerId,
        nationalityCode: action.payload.nationalityCode,
        rarityLoading: true, // Start loading rarity
      };

      return {
        ...state,
        cells: newCells,
        selectedCell: null,
        currentGuess: '',
        lastGuessIncorrect: false,
      };
    }

    case 'SET_CELL_RARITY': {
      const newCells = [...state.cells];
      const cell = newCells[action.payload.cellIndex];
      if (cell) {
        newCells[action.payload.cellIndex] = {
          ...cell,
          rarityPct: action.payload.rarityPct,
          rarityLoading: false,
        };
      }
      return { ...state, cells: newCells };
    }

    case 'SET_RARITY_LOADING': {
      const newCells = [...state.cells];
      const cell = newCells[action.payload.cellIndex];
      if (cell) {
        newCells[action.payload.cellIndex] = {
          ...cell,
          rarityLoading: action.payload.loading,
        };
      }
      return { ...state, cells: newCells };
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

    case 'GIVE_UP':
      return {
        ...state,
        gameStatus: 'gave_up',
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
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();
  const { recordSelection, fetchCellRarity } = useGridRarity(puzzle?.id ?? null);

  // Keep a ref for async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Parse puzzle content
  const parsedContent = useMemo(() => {
    if (!puzzle) return null;
    return parseTheGridContent(puzzle.content);
  }, [puzzle]);

  // Enrich club categories with colors from local cache
  const [gridContent, setGridContent] = useState<TheGridContent | null>(parsedContent);
  useEffect(() => {
    if (!parsedContent) {
      setGridContent(null);
      return;
    }

    // Capture non-null reference for async closure
    const content = parsedContent;
    let cancelled = false;

    async function enrichColors() {
      const enrichAxis = async (axis: [GridCategory, GridCategory, GridCategory]) => {
        const enriched = await Promise.all(
          axis.map(async (cat) => {
            if (cat.type === 'club' && !cat.primaryColor) {
              const clubColors = await getClubColorByName(cat.value);
              if (clubColors) {
                return { ...cat, primaryColor: clubColors.primary_color, secondaryColor: clubColors.secondary_color };
              }
            }
            return cat;
          })
        );
        return enriched as [GridCategory, GridCategory, GridCategory];
      };

      const [xAxis, yAxis] = await Promise.all([
        enrichAxis(content.xAxis),
        enrichAxis(content.yAxis),
      ]);

      if (!cancelled) {
        setGridContent({ ...content, xAxis, yAxis });
      }
    }

    // Set parsed content immediately, then enrich async
    setGridContent(content);
    enrichColors();

    return () => { cancelled = true; };
  }, [parsedContent]);

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
      // Celebration haptic for completing the grid
      triggerCompletion();
      const score = calculateGridScore(9);
      dispatch({ type: 'GAME_COMPLETE', payload: score });
    }
  }, [state.cells, state.gameStatus, triggerCompletion]);

  // Save attempt on game complete or give up
  useEffect(() => {
    if ((state.gameStatus !== 'complete' && state.gameStatus !== 'gave_up') || state.attemptSaved || !puzzle) return;

    // Capture puzzle reference for async function
    const currentPuzzle = puzzle;

    async function saveCompletedAttempt() {
      if (!stateRef.current.score || !stateRef.current.attemptId) return;

      const metadata: TheGridAttemptMetadata = {
        cellsFilled: stateRef.current.score.cellsFilled,
        cells: stateRef.current.cells,
        ...(stateRef.current.gameStatus === 'gave_up' && { gaveUp: true }),
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

        // Refresh local IQ for immediate UI update
        refreshLocalIQ().catch((err) => {
          console.error('[TheGrid] Failed to refresh local IQ:', err);
        });

        // Fire-and-forget cloud sync
        syncAttempts().catch((err) => {
          console.error('[TheGrid] Cloud sync failed:', err);
        });
      } catch (error) {
        console.error('[TheGrid] Failed to save attempt:', error);
      }
    }

    saveCompletedAttempt();
  }, [state.gameStatus, state.attemptSaved, puzzle, syncAttempts, refreshLocalIQ]);

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

  // Save progress when screen unmounts (in-app navigation back)
  useEffect(() => {
    if (!puzzle) return;

    const currentPuzzle = puzzle;

    return () => {
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

      // Fire and forget - can't await in cleanup
      saveAttempt({
        id: currentState.attemptId,
        puzzle_id: currentPuzzle.id,
        completed: 0,
        score: 0,
        score_display: null,
        metadata: JSON.stringify(metadata),
        started_at: new Date().toISOString(),
        completed_at: null,
        synced: 0,
      }).catch((error) => {
        console.warn('[TheGrid] Failed to save progress on unmount:', error);
      });
    };
  }, [puzzle?.id]);

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
      triggerSuccess();
      dispatch({
        type: 'CORRECT_GUESS',
        payload: {
          cellIndex: state.selectedCell,
          player: result.matchedPlayer,
        },
      });
    } else {
      triggerError();
      dispatch({ type: 'INCORRECT_GUESS' });
    }
  }, [state.selectedCell, state.currentGuess, gridContent, triggerSuccess, triggerError]);

  /**
   * Submit a player selection from the PlayerSearchOverlay.
   * Tries name-based valid_answers matching first, then falls back to DB validation.
   *
   * Flow:
   * 1. Local validation (instant) → dispatch CORRECT_GUESS
   * 2. triggerSuccess() haptic
   * 3. recordSelection() // fire-and-forget
   * 4. fetchCellRarity().then() → dispatch SET_CELL_RARITY → optional triggerRareFind
   *
   * @param playerId - Player ID (QID or local ID)
   * @param playerName - Player display name
   * @param nationalityCode - Optional ISO nationality code for flag display
   */
  const submitPlayerSelection = useCallback(
    async (playerId: string, playerName: string, nationalityCode?: string) => {
      if (state.selectedCell === null || !gridContent) return;

      const cellIndex = state.selectedCell;

      // Helper to handle post-validation rarity flow
      const handleCorrectGuess = (displayName: string) => {
        triggerSuccess();
        dispatch({
          type: 'CORRECT_GUESS',
          payload: {
            cellIndex,
            player: displayName,
            playerId,
            nationalityCode,
          },
        });

        // Fire-and-forget: record selection to server
        recordSelection(cellIndex, playerId, displayName, nationalityCode);

        // Async: fetch rarity and update cell
        fetchCellRarity(cellIndex, playerId).then((rarityPct) => {
          if (rarityPct !== null) {
            dispatch({
              type: 'SET_CELL_RARITY',
              payload: { cellIndex, rarityPct },
            });

            // Special haptic for ultra-rare picks (<1%)
            if (rarityPct < 1) {
              triggerRareFind();
            }
          }
        });
      };

      // Try name-based matching against valid_answers first
      const nameResult = validateCellGuess(playerName, state.selectedCell, gridContent);
      if (nameResult.isValid) {
        handleCorrectGuess(nameResult.matchedPlayer ?? playerName);
        return;
      }

      // Fall back to DB validation (club history, nationality, trophies, stats)
      try {
        const dbResult = await validateCellWithDB(playerId, state.selectedCell, gridContent);
        if (dbResult.isValid) {
          handleCorrectGuess(playerName);
        } else {
          triggerError();
          dispatch({ type: 'INCORRECT_GUESS' });
        }
      } catch (error) {
        console.error('[useTheGridGame] DB validation failed:', error);
        triggerError();
        dispatch({ type: 'INCORRECT_GUESS' });
      }
    },
    [state.selectedCell, gridContent, triggerSuccess, triggerError, recordSelection, fetchCellRarity]
  );

  const giveUp = useCallback(() => {
    if (state.gameStatus !== 'playing') return;
    const filledCount = countFilledCells(state.cells);
    const score = calculateGridScore(filledCount);
    dispatch({ type: 'GIVE_UP', payload: score });
  }, [state.gameStatus, state.cells]);

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
    giveUp,
    shareResult,
    resetGame,
  };
}
