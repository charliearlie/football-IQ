/**
 * Career Path Game Types
 *
 * Type definitions for the Career Path game mode where players
 * guess a footballer based on their career history.
 */

import { GameScore } from '../utils/scoring';
import { RestoreProgressPayload as BaseRestorePayload } from '@/hooks/useGamePersistence';

// Re-export GameScore for convenience
export type { GameScore } from '../utils/scoring';

/**
 * A single step in a player's career.
 */
export interface CareerStep {
  /** Type of career move */
  type: 'club' | 'loan';
  /** Club name or description */
  text: string;
  /** Year or year range (e.g., "2019-2023") */
  year: string;
  /** End year (for current club logic) - null if current */
  endYear?: number | null;
  /** Number of appearances (optional) */
  apps?: number;
  /** Number of goals scored (optional) */
  goals?: number;
}

/**
 * The puzzle content structure for career_path game mode.
 * Stored in puzzle.content as JSONB in Supabase.
 */
export interface CareerPathContent {
  /** The correct player name */
  answer: string;
  /** Wikidata QID for the correct player (e.g., "Q11571") */
  answer_qid?: string;
  /** Array of career steps (3-20 items) */
  career_steps: CareerStep[];
}

/**
 * Game status for the career path game.
 */
export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * State for the career path game reducer.
 */
export interface CareerPathState {
  /** Number of steps currently revealed (starts at 1) */
  revealedCount: number;
  /** Array of incorrect guesses made */
  guesses: string[];
  /** Current game status */
  gameStatus: GameStatus;
  /** Current text in the guess input */
  currentGuess: string;
  /** Triggers shake animation when true */
  lastGuessIncorrect: boolean;
  /** Final score (set when game ends) */
  score: GameScore | null;
  /** Whether the attempt has been saved to local DB */
  attemptSaved: boolean;
  /** Timestamp when game started (ISO string) */
  startedAt: string;
  /** Unique ID for the attempt (for resume support) */
  attemptId: string | null;
  /** True during victory reveal animation sequence (all hidden cards revealing) */
  isVictoryRevealing: boolean;
}

/**
 * Payload for restoring in-progress game state.
 * Used for type-safe access in the reducer.
 */
export interface CareerPathRestorePayload extends BaseRestorePayload {
  revealedCount: number;
  guesses: string[];
}

/**
 * Actions for the career path game reducer.
 * Uses BaseRestorePayload for dispatch compatibility with useGamePersistence.
 */
export type CareerPathAction =
  | { type: 'REVEAL_NEXT' }
  | { type: 'CORRECT_GUESS'; payload: GameScore }
  | { type: 'INCORRECT_GUESS'; payload: string }
  | { type: 'SET_CURRENT_GUESS'; payload: string }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'GAME_LOST'; payload: GameScore }
  | { type: 'GIVE_UP'; payload: GameScore }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: BaseRestorePayload }
  | { type: 'VICTORY_REVEAL_COMPLETE' };
