/**
 * Higher/Lower Game Types
 *
 * Type definitions for the "Higher/Lower" game mode where players
 * compare transfer fees across 10 rounds.
 */

// Re-export scoring types for convenience
export type { HigherLowerScore } from '../utils/scoring';

// =============================================================================
// CONTENT TYPES (mirror CMS schema)
// =============================================================================

/**
 * A player entry in a transfer pair
 */
export interface TransferPairPlayer {
  /** Player name */
  name: string;
  /** Club involved in the transfer */
  club: string;
  /** Transfer fee in millions (e.g., 85.5 for €85.5m) */
  fee: number;
}

/**
 * A single transfer pair comparison in the puzzle
 */
export interface TransferPair {
  /** The revealed player (Player 1) */
  player1: TransferPairPlayer;
  /** The hidden player (Player 2) */
  player2: TransferPairPlayer;
}

/**
 * The Higher/Lower puzzle content structure
 */
export interface HigherLowerContent {
  /** Array of 10 transfer pairs for 10 rounds */
  pairs: TransferPair[];
}

// =============================================================================
// GAME STATE TYPES
// =============================================================================

/**
 * Higher/Lower game state
 */
export interface HigherLowerState {
  /** Current round index (0-9) */
  currentRound: number;
  /** Total rounds in the game */
  totalRounds: number;
  /** Player's answers for each completed round */
  answers: ('higher' | 'lower')[];
  /** Whether each answer was correct */
  results: boolean[];
  /** Current game status */
  gameStatus: 'playing' | 'won' | 'lost';
  /** Score when game ends (null while playing) */
  score: import('../utils/scoring').HigherLowerScore | null;
  /** True when animating the reveal of Player 2's fee */
  showingResult: boolean;
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved to local DB */
  attemptSaved: boolean;
  /** Timestamp when game started (ISO string) */
  startedAt: string | null;
}

/**
 * Actions for Higher/Lower game reducer
 */
export type HigherLowerAction =
  | { type: 'SUBMIT_ANSWER'; payload: { answer: 'higher' | 'lower'; isCorrect: boolean } }
  | { type: 'ADVANCE_ROUND' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: HigherLowerRestorePayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' };

/**
 * Payload for restoring progress from saved attempt
 */
export interface HigherLowerRestorePayload {
  /** Restored round index */
  currentRound: number;
  /** Restored answers */
  answers: ('higher' | 'lower')[];
  /** Restored results */
  results: boolean[];
  /** Restored attempt ID */
  attemptId: string;
  /** Restored start timestamp */
  startedAt: string;
}

/**
 * Metadata structure saved with Higher/Lower attempts
 */
export interface HigherLowerAttemptMetadata {
  /** Player's answers for each round */
  answers: ('higher' | 'lower')[];
  /** Whether each answer was correct */
  results: boolean[];
  /** Number of rounds completed */
  roundsCompleted: number;
  /** Whether player won (all 10 correct) */
  won: boolean;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create initial game state
 */
export function createInitialState(): HigherLowerState {
  return {
    currentRound: 0,
    totalRounds: 10,
    answers: [],
    results: [],
    gameStatus: 'playing',
    score: null,
    showingResult: false,
    attemptId: null,
    attemptSaved: false,
    startedAt: new Date().toISOString(),
  };
}

// =============================================================================
// CONTENT PARSING & VALIDATION
// =============================================================================

/**
 * Validate a TransferPairPlayer object
 */
function isValidTransferPairPlayer(value: unknown): value is TransferPairPlayer {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    typeof obj.club === 'string' &&
    obj.club.length > 0 &&
    typeof obj.fee === 'number' &&
    obj.fee >= 0
  );
}

/**
 * Validate a TransferPair object
 */
function isValidTransferPair(value: unknown): value is TransferPair {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    isValidTransferPairPlayer(obj.player1) &&
    isValidTransferPairPlayer(obj.player2)
  );
}

/**
 * Parse and validate Higher/Lower content from puzzle JSON
 *
 * @param content - Raw puzzle content
 * @returns Validated HigherLowerContent or null if invalid
 */
export function parseHigherLowerContent(content: unknown): HigherLowerContent | null {
  if (!content || typeof content !== 'object') return null;

  const obj = content as Record<string, unknown>;

  if (!Array.isArray(obj.pairs) || obj.pairs.length < 1) {
    return null;
  }

  for (const pair of obj.pairs) {
    if (!isValidTransferPair(pair)) return null;
  }

  return {
    pairs: obj.pairs as TransferPair[],
  };
}
