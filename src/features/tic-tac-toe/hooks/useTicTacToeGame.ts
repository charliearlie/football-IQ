import { useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { useHaptics } from '@/hooks/useHaptics';
import { ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { saveAttempt } from '@/lib/database';
import { LocalAttempt } from '@/types/database';
import {
  TicTacToeState,
  TicTacToeAction,
  TicTacToeContent,
  TicTacToeScore,
  CellIndex,
  CellArray,
} from '../types/ticTacToe.types';
import { validateCellGuess, getCellCategories } from '../utils/validation';
import {
  checkWin,
  checkDraw,
  pickRandomEmptyCell,
  pickRandomPlayerForCell,
  calculateScore,
  createEmptyCells,
} from '../utils/gameLogic';
import { generateTicTacToeScoreDisplay } from '../utils/scoreDisplay';
import { shareTicTacToeResult, ShareResult } from '../utils/share';

/**
 * Create the initial state for the Tic Tac Toe game.
 */
function createInitialState(): TicTacToeState {
  return {
    cells: createEmptyCells(),
    gameStatus: 'playing',
    selectedCell: null,
    currentGuess: '',
    currentTurn: 'player',
    winningLine: null,
    winner: null,
    score: null,
    startedAt: new Date().toISOString(),
    attemptSaved: false,
    lastGuessIncorrect: false,
  };
}

/**
 * Reducer for Tic Tac Toe game state.
 */
function ticTacToeReducer(
  state: TicTacToeState,
  action: TicTacToeAction
): TicTacToeState {
  switch (action.type) {
    case 'SELECT_CELL':
      // Can only select empty cells during player's turn
      if (
        state.gameStatus !== 'playing' ||
        state.currentTurn !== 'player' ||
        state.cells[action.payload].owner !== null
      ) {
        return state;
      }
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
      };

    case 'CORRECT_GUESS': {
      const { cellIndex, playerName } = action.payload;
      const newCells = [...state.cells] as CellArray;
      newCells[cellIndex] = { owner: 'player', playerName };

      return {
        ...state,
        cells: newCells,
        selectedCell: null,
        currentGuess: '',
        lastGuessIncorrect: false,
        currentTurn: 'ai', // AI's turn after player moves
      };
    }

    case 'INCORRECT_GUESS':
      return {
        ...state,
        currentGuess: '',
        lastGuessIncorrect: true,
      };

    case 'CLEAR_SHAKE':
      return {
        ...state,
        lastGuessIncorrect: false,
      };

    case 'AI_MOVE': {
      const { cellIndex, playerName } = action.payload;
      const newCells = [...state.cells] as CellArray;
      newCells[cellIndex] = { owner: 'ai', playerName };

      return {
        ...state,
        cells: newCells,
        currentTurn: 'player', // Player's turn after AI moves
      };
    }

    case 'GAME_WON':
      return {
        ...state,
        gameStatus: 'won',
        winningLine: action.payload.winningLine,
        winner: 'player',
        score: action.payload.score,
      };

    case 'GAME_LOST':
      return {
        ...state,
        gameStatus: 'lost',
        winningLine: action.payload.winningLine,
        winner: 'ai',
        score: action.payload.score,
      };

    case 'GAME_DRAW':
      return {
        ...state,
        gameStatus: 'draw',
        winner: null,
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
 * Hook to manage Tic Tac Toe game state.
 *
 * Handles:
 * - Cell selection and targeting
 * - Fuzzy matching validation for player names
 * - Turn-based gameplay (Player vs AI)
 * - AI move selection (random empty cell)
 * - Win/lose/draw detection
 * - Winning line tracking for animation
 * - Attempt persistence to local database
 * - Share functionality
 *
 * @param puzzle - The current puzzle data
 * @returns Game state, actions, and utilities
 */
export function useTicTacToeGame(puzzle: ParsedLocalPuzzle | null) {
  const [state, dispatch] = useReducer(ticTacToeReducer, createInitialState());
  const { triggerNotification, triggerSelection, triggerHeavy } = useHaptics();

  // Ref to track if AI move is in progress (prevents multiple triggers)
  const aiMoveInProgress = useRef(false);

  // Parse puzzle content
  const puzzleContent = useMemo<TicTacToeContent | null>(() => {
    if (!puzzle?.content) return null;
    return puzzle.content as TicTacToeContent;
  }, [puzzle]);

  // Computed values
  const isGameOver = state.gameStatus !== 'playing';
  const isPlayerTurn = state.currentTurn === 'player' && state.gameStatus === 'playing';

  // Get categories for the selected cell
  const selectedCellCategories = useMemo(() => {
    if (state.selectedCell === null || !puzzleContent) return null;
    return getCellCategories(state.selectedCell, puzzleContent);
  }, [state.selectedCell, puzzleContent]);

  // Select a cell
  const selectCell = useCallback(
    (cellIndex: CellIndex) => {
      if (!isPlayerTurn) return;
      dispatch({ type: 'SELECT_CELL', payload: cellIndex });
      triggerSelection();
    },
    [isPlayerTurn, triggerSelection]
  );

  // Deselect the current cell
  const deselectCell = useCallback(() => {
    dispatch({ type: 'DESELECT_CELL' });
  }, []);

  // Set current guess text
  const setCurrentGuess = useCallback((text: string) => {
    dispatch({ type: 'SET_CURRENT_GUESS', payload: text });
  }, []);

  // Submit a guess
  const submitGuess = useCallback(() => {
    const guess = state.currentGuess.trim();
    if (!guess || state.selectedCell === null || !puzzleContent) return;
    if (state.gameStatus !== 'playing') return;

    // Validate the guess against valid answers for this cell
    const result = validateCellGuess(guess, state.selectedCell, puzzleContent);

    if (result.isValid && result.matchedPlayer) {
      dispatch({
        type: 'CORRECT_GUESS',
        payload: {
          cellIndex: state.selectedCell,
          playerName: result.matchedPlayer,
        },
      });
      triggerNotification('success');
    } else {
      dispatch({ type: 'INCORRECT_GUESS' });
      triggerNotification('error');
    }
  }, [
    state.currentGuess,
    state.selectedCell,
    state.gameStatus,
    puzzleContent,
    triggerNotification,
  ]);

  // Reset the game
  const resetGame = useCallback(() => {
    aiMoveInProgress.current = false;
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
    return shareTicTacToeResult(state.cells, state.score, puzzle.puzzle_date);
  }, [state.score, state.cells, puzzle]);

  // Clear shake animation after delay
  useEffect(() => {
    if (state.lastGuessIncorrect) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_SHAKE' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.lastGuessIncorrect]);

  // Check for win/draw after player move (before AI moves)
  useEffect(() => {
    if (state.gameStatus !== 'playing') return;

    // Check if player won
    const playerWinLine = checkWin(state.cells, 'player');
    if (playerWinLine) {
      const score = calculateScore('win', state.cells);
      dispatch({ type: 'GAME_WON', payload: { winningLine: playerWinLine, score } });
      triggerHeavy();
      return;
    }

    // Check for draw (all cells filled, no winner)
    if (checkDraw(state.cells)) {
      const score = calculateScore('draw', state.cells);
      dispatch({ type: 'GAME_DRAW', payload: score });
      return;
    }
  }, [state.cells, state.gameStatus, triggerHeavy]);

  // AI move logic
  useEffect(() => {
    if (
      state.currentTurn !== 'ai' ||
      state.gameStatus !== 'playing' ||
      !puzzleContent ||
      aiMoveInProgress.current
    ) {
      return;
    }

    aiMoveInProgress.current = true;

    // Small delay before AI moves (feels more natural)
    const timer = setTimeout(() => {
      // Pick a random empty cell
      const aiCell = pickRandomEmptyCell(state.cells);

      if (aiCell === null) {
        // No empty cells - this shouldn't happen if game logic is correct
        aiMoveInProgress.current = false;
        return;
      }

      // Pick a random valid player for that cell
      const aiPlayer = pickRandomPlayerForCell(aiCell, puzzleContent);

      dispatch({
        type: 'AI_MOVE',
        payload: { cellIndex: aiCell, playerName: aiPlayer },
      });

      aiMoveInProgress.current = false;
    }, 600); // 600ms delay for AI "thinking"

    return () => {
      clearTimeout(timer);
      aiMoveInProgress.current = false;
    };
  }, [state.currentTurn, state.gameStatus, state.cells, puzzleContent]);

  // Check for AI win after AI move
  useEffect(() => {
    if (state.gameStatus !== 'playing' || state.currentTurn !== 'player') return;

    // Only check after AI has moved (when it's player's turn again)
    const aiWinLine = checkWin(state.cells, 'ai');
    if (aiWinLine) {
      const score = calculateScore('loss', state.cells);
      dispatch({ type: 'GAME_LOST', payload: { winningLine: aiWinLine, score } });
      triggerNotification('error');
      return;
    }

    // Check for draw after AI move
    if (checkDraw(state.cells)) {
      const score = calculateScore('draw', state.cells);
      dispatch({ type: 'GAME_DRAW', payload: score });
    }
  }, [state.cells, state.gameStatus, state.currentTurn, triggerNotification]);

  // Persist attempt to local database when game ends
  useEffect(() => {
    if (
      state.gameStatus === 'playing' ||
      !state.score ||
      state.attemptSaved ||
      !puzzle
    ) {
      return;
    }

    const saveGameAttempt = async () => {
      try {
        const attemptId = Crypto.randomUUID();
        const now = new Date().toISOString();

        const attempt: LocalAttempt = {
          id: attemptId,
          puzzle_id: puzzle.id,
          completed: 1,
          score: state.score!.points,
          score_display: generateTicTacToeScoreDisplay(state.cells, state.score!, {
            puzzleDate: puzzle.puzzle_date,
          }),
          metadata: JSON.stringify({
            cells: state.cells,
            result: state.score!.result,
            playerCells: state.score!.playerCells,
            aiCells: state.score!.aiCells,
            winningLine: state.winningLine,
          }),
          started_at: state.startedAt,
          completed_at: now,
          synced: 0,
        };

        await saveAttempt(attempt);
        dispatch({ type: 'ATTEMPT_SAVED' });
      } catch (error) {
        console.error('Failed to save attempt:', error);
      }
    };

    saveGameAttempt();
  }, [
    state.gameStatus,
    state.score,
    state.attemptSaved,
    state.cells,
    state.winningLine,
    state.startedAt,
    puzzle,
  ]);

  return {
    // State
    state,
    dispatch,

    // Derived data
    puzzleContent,

    // Computed
    isGameOver,
    isPlayerTurn,
    selectedCellCategories,

    // Actions
    selectCell,
    deselectCell,
    setCurrentGuess,
    submitGuess,
    resetGame,
    shareResult,
  };
}
