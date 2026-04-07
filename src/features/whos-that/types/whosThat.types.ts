/**
 * Who's That? Game Types
 *
 * Type definitions for the "Who's That?" game mode — Wordle for footballers.
 * Players guess a footballer in 6 tries with attribute feedback.
 */

// Re-export scoring types for convenience
export type { WhosThatScore } from '../utils/scoring';

// =============================================================================
// CONTENT TYPES (mirror CMS schema)
// =============================================================================

/**
 * The Who's That? puzzle content structure
 */
export interface WhosThatContent {
  answer: {
    /** Full player name */
    player_name: string;
    /** Wikidata QID for the player (e.g. "Q615") */
    player_id: string;
    /** Current club name */
    club: string;
    /** League name */
    league: string;
    /** Nationality (e.g. "England", "Brazil") */
    nationality: string;
    /** Position (e.g. "Forward", "Midfielder", "Defender", "Goalkeeper") */
    position: string;
    /** Birth year (e.g. 2001) */
    birth_year: number;
    /** @deprecated Use birth_year instead. Kept for backward compat with old puzzles. */
    age?: number;
  };
}

// =============================================================================
// FEEDBACK TYPES
// =============================================================================

/**
 * Color feedback for a single attribute
 */
export type FeedbackColor = 'green' | 'yellow' | 'red';

/**
 * Feedback for a single attribute cell
 */
export interface AttributeFeedback {
  /** Display value shown in the cell */
  value: string;
  /** Color indicating correctness */
  color: FeedbackColor;
  /** Direction arrow for birth year attribute */
  direction?: 'up' | 'down';
}

/**
 * Complete feedback for a single guess (one row in the grid)
 */
export interface GuessFeedback {
  /** The player name guessed */
  playerName: string;
  club: AttributeFeedback;
  league: AttributeFeedback;
  nationality: AttributeFeedback;
  position: AttributeFeedback;
  birthYear: AttributeFeedback;
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

/**
 * Who's That? game state
 */
export interface WhosThatState {
  /** Array of completed guess feedback rows */
  guesses: GuessFeedback[];
  /** Maximum number of guesses allowed */
  maxGuesses: number;
  /** Current game status */
  gameStatus: 'playing' | 'won' | 'lost';
  /** Score when game ends (null while playing) */
  score: import('../utils/scoring').WhosThatScore | null;
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
export interface WhosThatRestorePayload {
  /** Restored guesses */
  guesses: GuessFeedback[];
  /** Restored attempt ID */
  attemptId: string;
  /** Restored start timestamp */
  startedAt: string;
}

/**
 * Actions for Who's That? game reducer
 */
export type WhosThatAction =
  | { type: 'SUBMIT_GUESS'; payload: GuessFeedback & { isCorrect: boolean } }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: WhosThatRestorePayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' };

/**
 * Metadata structure saved with Who's That? attempts
 */
export interface WhosThatAttemptMetadata {
  /** All guesses with feedback */
  guesses: GuessFeedback[];
  /** Whether player won */
  won: boolean;
  /** Total guesses used */
  guessCount: number;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create initial Who's That? game state
 */
export function createInitialState(): WhosThatState {
  return {
    guesses: [],
    maxGuesses: 6,
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
 * Parse and validate Who's That? content from puzzle JSON
 *
 * @param content - Raw puzzle content
 * @returns Validated WhosThatContent or null if invalid
 */
export function parseWhosThatContent(content: unknown): WhosThatContent | null {
  if (!content || typeof content !== 'object') return null;

  const obj = content as Record<string, unknown>;

  if (!obj.answer || typeof obj.answer !== 'object') return null;
  const answer = obj.answer as Record<string, unknown>;

  if (typeof answer.player_name !== 'string' || !answer.player_name) return null;
  if (typeof answer.player_id !== 'string' || !answer.player_id) return null;
  if (typeof answer.club !== 'string' || !answer.club) return null;
  if (typeof answer.league !== 'string' || !answer.league) return null;
  if (typeof answer.nationality !== 'string' || !answer.nationality) return null;
  if (typeof answer.position !== 'string' || !answer.position) return null;
  // Support both birth_year (new) and age (legacy) — derive birth_year from age if needed
  const currentYear = new Date().getFullYear();
  let birthYear: number;
  if (typeof answer.birth_year === 'number' && answer.birth_year > 1900) {
    birthYear = answer.birth_year;
  } else if (typeof answer.age === 'number' && answer.age > 0) {
    birthYear = currentYear - answer.age;
  } else {
    return null;
  }

  return {
    answer: {
      player_name: answer.player_name,
      player_id: answer.player_id,
      club: answer.club,
      league: answer.league,
      nationality: answer.nationality,
      position: answer.position,
      birth_year: birthYear,
    },
  };
}
