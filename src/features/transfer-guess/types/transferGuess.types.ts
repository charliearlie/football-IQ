/**
 * Transfer Guess Game Types
 *
 * Type definitions for the Guess the Transfer game mode where players
 * guess a footballer based on transfer details (clubs, year, fee, hints).
 */

import { TransferGuessScore } from '../utils/transferScoring';

// Re-export for convenience
export type { TransferGuessScore } from '../utils/transferScoring';

/**
 * The puzzle content structure for guess_the_transfer game mode.
 * Stored in puzzle.content as JSONB in Supabase.
 */
export interface TransferGuessContent {
  /** The correct player name */
  answer: string;
  /** Origin club name */
  from_club: string;
  /** Destination club name */
  to_club: string;
  /** Transfer year */
  year: number;
  /** Transfer fee display (e.g., "€80M", "Free", "Undisclosed") */
  fee: string;
  /** Array of 3 hints: [nationality, position, achievement] */
  hints: [string, string, string];
}

/**
 * Game status for the transfer guess game.
 */
export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * State for the transfer guess game reducer.
 */
export interface TransferGuessState {
  /** Number of hints currently revealed (0-3) */
  hintsRevealed: number;
  /** Array of incorrect guesses made */
  guesses: string[];
  /** Current game status */
  gameStatus: GameStatus;
  /** Current text in the guess input */
  currentGuess: string;
  /** Triggers shake animation when true */
  lastGuessIncorrect: boolean;
  /** Final score (set when game ends) */
  score: TransferGuessScore | null;
  /** Whether the attempt has been saved to local DB */
  attemptSaved: boolean;
  /** Timestamp when game started (ISO string) */
  startedAt: string;
  /** Unique ID for the attempt (for resume support) */
  attemptId: string | null;
}

/**
 * Payload for restoring in-progress game state.
 */
export interface RestoreProgressPayload {
  hintsRevealed: number;
  guesses: string[];
  attemptId: string;
  startedAt: string;
}

/**
 * Actions for the transfer guess game reducer.
 */
export type TransferGuessAction =
  | { type: 'REVEAL_HINT' }
  | { type: 'CORRECT_GUESS'; payload: TransferGuessScore }
  | { type: 'INCORRECT_GUESS'; payload: string }
  | { type: 'SET_CURRENT_GUESS'; payload: string }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'GAME_LOST'; payload: TransferGuessScore }
  | { type: 'GIVE_UP'; payload: TransferGuessScore }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload };

/**
 * Hint category labels for display.
 */
export const HINT_LABELS = ['Nationality', 'Position', 'Achievement'] as const;
export type HintLabel = (typeof HINT_LABELS)[number];

/**
 * Constants for the game.
 */
export const MAX_GUESSES = 5;
export const MAX_HINTS = 3;
