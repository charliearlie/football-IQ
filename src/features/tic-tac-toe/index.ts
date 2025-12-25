/**
 * Tic Tac Toe Feature Module
 *
 * A 3x3 grid game where players compete against AI.
 * Each cell requires naming a player who fits both the row and column categories.
 */

// Screen
export { TicTacToeScreen } from './screens/TicTacToeScreen';

// Hook
export { useTicTacToeGame } from './hooks/useTicTacToeGame';

// Components
export { GridCell } from './components/GridCell';
export { TicTacToeGrid } from './components/TicTacToeGrid';
export { TicTacToeActionZone } from './components/TicTacToeActionZone';
export { TicTacToeResultModal } from './components/TicTacToeResultModal';

// Utils
export { validateCellGuess, getCellCategories } from './utils/validation';
export {
  checkWin,
  checkDraw,
  getEmptyCells,
  pickRandomEmptyCell,
  pickRandomPlayerForCell,
  calculateScore,
  createEmptyCells,
} from './utils/gameLogic';
export {
  generateTicTacToeEmojiGrid,
  generateTicTacToeScoreDisplay,
  getResultEmoji,
  getResultMessage,
} from './utils/scoreDisplay';
export { shareTicTacToeResult, copyToClipboard } from './utils/share';

// Types
export type {
  CellIndex,
  CellOwner,
  CellState,
  CellArray,
  GameStatus,
  TicTacToeContent,
  TicTacToeState,
  TicTacToeScore,
  TicTacToeAction,
} from './types/ticTacToe.types';
export { WINNING_LINES, POINTS_WIN, POINTS_DRAW, POINTS_LOSS } from './types/ticTacToe.types';
