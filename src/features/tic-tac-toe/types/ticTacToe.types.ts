/**
 * Tic Tac Toe Game Types
 *
 * A 3x3 grid where rows and columns are categories (Teams, Nationalities, Achievements).
 * Players must name a footballer who fits BOTH the row and column criteria.
 */

// Cell indices: 0-8 in reading order
// [0][1][2]
// [3][4][5]
// [6][7][8]

export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type CellOwner = 'player' | 'ai' | null;

export interface CellState {
  owner: CellOwner;
  playerName: string | null; // The player name that claimed this cell
}

/** Type for the 9-cell array representing the game board */
export type CellArray = [
  CellState, CellState, CellState,
  CellState, CellState, CellState,
  CellState, CellState, CellState,
];

export type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

/**
 * Puzzle content structure stored in Supabase daily_puzzles.content
 */
export interface TicTacToeContent {
  // Row categories (displayed on left side)
  rows: [string, string, string];

  // Column categories (displayed on top)
  columns: [string, string, string];

  // Valid answers for each cell (cell index 0-8 as string keys)
  // Each cell has an array of player names that satisfy both row & column criteria
  valid_answers: {
    [key: string]: string[];
  };
}

/**
 * Game state managed by reducer
 */
export interface TicTacToeState {
  // 9 cells (0-8)
  cells: CellArray;

  // Current game status
  gameStatus: GameStatus;

  // Currently selected cell for input (null if none selected)
  selectedCell: CellIndex | null;

  // Current guess input
  currentGuess: string;

  // Whose turn it is
  currentTurn: 'player' | 'ai';

  // Winning line (indices of 3 cells if someone won)
  winningLine: [CellIndex, CellIndex, CellIndex] | null;

  // Winner of the game
  winner: 'player' | 'ai' | null;

  // Score calculated on game end
  score: TicTacToeScore | null;

  // Track when game started
  startedAt: string;

  // Whether attempt has been saved to SQLite
  attemptSaved: boolean;

  // For shake animation on incorrect guess
  lastGuessIncorrect: boolean;
}

/**
 * Score structure for Tic Tac Toe
 */
export interface TicTacToeScore {
  points: number; // 10 for win, 5 for draw, 0 for loss
  maxPoints: 10;
  result: 'win' | 'draw' | 'loss';
  playerCells: number; // Number of cells claimed by player
  aiCells: number; // Number of cells claimed by AI
}

/**
 * Reducer action types
 */
export type TicTacToeAction =
  | { type: 'SELECT_CELL'; payload: CellIndex }
  | { type: 'DESELECT_CELL' }
  | { type: 'SET_CURRENT_GUESS'; payload: string }
  | { type: 'CORRECT_GUESS'; payload: { cellIndex: CellIndex; playerName: string } }
  | { type: 'INCORRECT_GUESS' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'AI_MOVE'; payload: { cellIndex: CellIndex; playerName: string } }
  | { type: 'GAME_WON'; payload: { winningLine: [CellIndex, CellIndex, CellIndex]; score: TicTacToeScore } }
  | { type: 'GAME_LOST'; payload: { winningLine: [CellIndex, CellIndex, CellIndex]; score: TicTacToeScore } }
  | { type: 'GAME_DRAW'; payload: TicTacToeScore }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' };

/**
 * All possible winning combinations (indices)
 */
export const WINNING_LINES: ReadonlyArray<[CellIndex, CellIndex, CellIndex]> = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
] as const;

/**
 * Constants
 */
export const POINTS_WIN = 10;
export const POINTS_DRAW = 5;
export const POINTS_LOSS = 0;
