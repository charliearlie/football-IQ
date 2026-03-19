/**
 * Who Am I? Game Types
 *
 * Type definitions for the "Who Am I?" game mode where players
 * guess a footballer from 5 progressive clues (most obscure to most obvious).
 */

// Re-export scoring types for convenience
export type { WhoAmIScore } from '../utils/scoring';

// =============================================================================
// CONTENT TYPES (mirror CMS schema)
// =============================================================================

/**
 * A single clue in the "Who Am I?" puzzle
 */
export interface WhoAmIClue {
  /** Clue number (1 = most obscure, 5 = most obvious) */
  number: number;
  /** Clue text (e.g., "I was born in Rosario, Argentina") */
  text: string;
}

/**
 * The Who Am I? puzzle content structure
 */
export interface WhoAmIContent {
  /** Array of 5 progressive clues (1 = hardest, 5 = easiest) */
  clues: WhoAmIClue[];
  /** Correct player name for validation */
  correct_player_name: string;
  /** Wikidata QID for the correct player (e.g., "Q615") */
  correct_player_id: string;
  /** Optional fun fact revealed after game ends */
  fun_fact?: string;
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

/**
 * Game status values
 */
export type WhoAmIGameStatus = 'playing' | 'won' | 'lost' | 'revealed';

/**
 * Who Am I? game state
 */
export interface WhoAmIState {
  /** Number of clues currently revealed (1-5) */
  cluesRevealed: number;
  /** Array of incorrect guesses made */
  guesses: string[];
  /** Current game status */
  gameStatus: WhoAmIGameStatus;
  /** Score when game ends (null while playing) */
  score: import('../utils/scoring').WhoAmIScore | null;
  /** Whether the last guess was incorrect (for shake animation) */
  lastGuessIncorrect: boolean;
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved to local DB */
  attemptSaved: boolean;
  /** Timestamp when game started (ISO string) */
  startedAt: string | null;
}

/**
 * Payload for restoring progress from saved attempt
 */
export interface WhoAmIRestorePayload {
  /** Restored guesses */
  guesses: string[];
  /** Restored attempt ID */
  attemptId: string;
  /** Restored start timestamp */
  startedAt: string;
  /** Restored clues revealed count */
  cluesRevealed: number;
}

/**
 * Actions for Who Am I? game reducer
 */
export type WhoAmIAction =
  | { type: 'SUBMIT_GUESS'; payload: { playerName: string; isCorrect: boolean } }
  | { type: 'REVEAL_NEXT_CLUE' }
  | { type: 'GIVE_UP' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: WhoAmIRestorePayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' };

/**
 * Metadata structure saved with Who Am I? attempts
 */
export interface WhoAmIAttemptMetadata {
  /** Incorrect guesses made */
  guesses: string[];
  /** Number of clues revealed when game ended */
  cluesRevealed: number;
  /** Whether player won */
  won: boolean;
  /** Whether player gave up */
  gaveUp?: boolean;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create initial game state
 */
export function createInitialState(): WhoAmIState {
  return {
    cluesRevealed: 1,
    guesses: [],
    gameStatus: 'playing',
    score: null,
    lastGuessIncorrect: false,
    attemptId: null,
    attemptSaved: false,
    startedAt: new Date().toISOString(),
  };
}

// =============================================================================
// CONTENT PARSING & VALIDATION
// =============================================================================

/**
 * Validate a WhoAmIClue object
 */
function isValidClue(value: unknown): value is WhoAmIClue {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.number === 'number' &&
    typeof obj.text === 'string' &&
    obj.text.length > 0
  );
}

/**
 * Parse and validate Who Am I? content from puzzle JSON
 *
 * @param content - Raw puzzle content
 * @returns Validated WhoAmIContent or null if invalid
 */
export function parseWhoAmIContent(content: unknown): WhoAmIContent | null {
  if (!content || typeof content !== 'object') return null;

  const obj = content as Record<string, unknown>;

  // Validate clues (need exactly 5)
  if (!Array.isArray(obj.clues) || obj.clues.length < 3) {
    return null;
  }
  for (const clue of obj.clues) {
    if (!isValidClue(clue)) return null;
  }

  // Validate correct_player_name
  if (typeof obj.correct_player_name !== 'string' || !obj.correct_player_name) {
    return null;
  }

  // Validate correct_player_id
  if (typeof obj.correct_player_id !== 'string' || !obj.correct_player_id) {
    return null;
  }

  return {
    clues: obj.clues as WhoAmIClue[],
    correct_player_name: obj.correct_player_name,
    correct_player_id: obj.correct_player_id,
    fun_fact: typeof obj.fun_fact === 'string' ? obj.fun_fact : undefined,
  };
}
