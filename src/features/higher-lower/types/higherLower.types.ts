/**
 * Higher/Lower Game Types
 *
 * Type definitions for the "Higher/Lower" game mode where players
 * compare stats (transfer fees, appearances, caps, goals, etc.) across 10 rounds.
 */

// Re-export scoring types for convenience
export type { HigherLowerScore } from '../utils/scoring';

// =============================================================================
// CONTENT TYPES (mirror CMS schema)
// =============================================================================

/**
 * Known stat categories — drives value formatting.
 */
export type StatType =
  | 'transfer_fee'
  | 'league_appearances'
  | 'international_caps'
  | 'goals'
  | 'assists'
  | 'clean_sheets';

/**
 * A single entry in a Higher/Lower chain or pair.
 */
export interface HigherLowerEntry {
  /** Player name */
  name: string;
  /** Club or national team */
  context: string;
  /** Human-readable stat label, e.g. "League Appearances", "Transfer Fee" */
  statLabel: string;
  /** Machine-readable stat category (drives formatting) */
  statType: StatType;
  /** The numeric stat value */
  value: number;
}

/** @deprecated Use HigherLowerEntry */
export type TransferPairPlayer = HigherLowerEntry;

/**
 * A single comparison pair in the puzzle
 */
export interface TransferPair {
  /** The revealed entry (Player 1) */
  player1: HigherLowerEntry;
  /** The hidden entry (Player 2) */
  player2: HigherLowerEntry;
}

/**
 * The Higher/Lower puzzle content structure.
 * Supports two formats:
 * - `players`: Chain format — 11 players, each round compares [N] vs [N+1]
 * - `pairs`: Legacy format — 10 independent pairs
 */
export interface HigherLowerContent {
  /** Chain of entries — round N compares players[N] vs players[N+1] */
  players?: HigherLowerEntry[];
  /** Legacy: independent pairs for each round */
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
  /** Whether player got all 10 correct */
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
 * Normalize a raw entry to HigherLowerEntry.
 * Accepts the new shape (context/statLabel/statType/value) or legacy shape (club/fee).
 * Returns null if invalid.
 */
function normalizeEntry(value: unknown): HigherLowerEntry | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;

  if (typeof obj.name !== 'string' || obj.name.length === 0) return null;

  // New format: has context + value
  if (typeof obj.context === 'string' && typeof obj.value === 'number') {
    return {
      name: obj.name,
      context: obj.context,
      statLabel: typeof obj.statLabel === 'string' ? obj.statLabel : 'Transfer Fee',
      statType: isValidStatType(obj.statType) ? obj.statType : 'transfer_fee',
      value: obj.value,
    };
  }

  // Legacy format: has club + fee → normalize
  if (typeof obj.club === 'string' && obj.club.length > 0 && typeof obj.fee === 'number' && obj.fee >= 0) {
    return {
      name: obj.name,
      context: obj.club,
      statLabel: 'Transfer Fee',
      statType: 'transfer_fee',
      value: obj.fee,
    };
  }

  return null;
}

const VALID_STAT_TYPES: Set<string> = new Set([
  'transfer_fee', 'league_appearances', 'international_caps', 'goals', 'assists', 'clean_sheets',
]);

function isValidStatType(value: unknown): value is StatType {
  return typeof value === 'string' && VALID_STAT_TYPES.has(value);
}

/**
 * Validate and normalize a TransferPair object
 */
function normalizePair(value: unknown): TransferPair | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  const player1 = normalizeEntry(obj.player1);
  const player2 = normalizeEntry(obj.player2);
  if (!player1 || !player2) return null;
  return { player1, player2 };
}

/**
 * Parse and validate Higher/Lower content from puzzle JSON.
 *
 * Supports two content formats:
 * - `players` array (chain): 11+ players, derives pairs as [N] vs [N+1]
 * - `pairs` array (legacy): explicit independent pairs
 *
 * Both legacy (club/fee) and new (context/statLabel/statType/value) entry shapes are accepted.
 *
 * @param content - Raw puzzle content
 * @returns Validated HigherLowerContent or null if invalid
 */
export function parseHigherLowerContent(content: unknown): HigherLowerContent | null {
  if (!content || typeof content !== 'object') return null;

  const obj = content as Record<string, unknown>;

  // Chain format: players array → derive pairs
  if (Array.isArray(obj.players) && obj.players.length >= 2) {
    const players: HigherLowerEntry[] = [];
    for (const raw of obj.players) {
      const entry = normalizeEntry(raw);
      if (!entry) return null;
      players.push(entry);
    }
    const pairs: TransferPair[] = [];
    for (let i = 0; i < players.length - 1; i++) {
      pairs.push({ player1: players[i], player2: players[i + 1] });
    }
    return { players, pairs };
  }

  // Legacy format: explicit pairs
  if (!Array.isArray(obj.pairs) || obj.pairs.length < 1) {
    return null;
  }

  const pairs: TransferPair[] = [];
  for (const raw of obj.pairs) {
    const pair = normalizePair(raw);
    if (!pair) return null;
    pairs.push(pair);
  }

  return { pairs };
}
