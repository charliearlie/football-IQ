/**
 * Starting XI Game Types
 *
 * A lineup guessing game where players identify hidden footballers
 * positioned on a visual football pitch in match formation.
 */

// ============ Position System ============

/**
 * Standard position keys used in football formations.
 * Coordinate system: y=90 is defensive baseline, y=10 is attacking.
 */
export type PositionKey =
  | 'GK'
  // Defenders
  | 'RB'
  | 'RCB'
  | 'CB'
  | 'LCB'
  | 'LB'
  | 'RWB'
  | 'LWB'
  // Defensive Midfield
  | 'CDM'
  | 'RCDM'
  | 'LCDM'
  // Central Midfield
  | 'RCM'
  | 'CM'
  | 'LCM'
  | 'RM'
  | 'LM'
  // Attacking Midfield
  | 'CAM'
  | 'RCAM'
  | 'LCAM'
  // Forwards
  | 'RW'
  | 'LW'
  | 'ST'
  | 'RST'
  | 'LST'
  | 'CF';

/**
 * Position coordinates on pitch (0-100 scale).
 */
export interface PositionCoords {
  /** 0=left touchline, 100=right touchline */
  x: number;
  /** 0=attacking goal (top), 100=defensive goal (bottom) */
  y: number;
}

/**
 * Supported formation names.
 */
export type FormationName =
  | '4-3-3'
  | '4-2-3-1'
  | '4-4-2'
  | '4-4-1-1'
  | '3-5-2'
  | '3-4-3'
  | '5-3-2'
  | '5-4-1'
  | '4-1-4-1'
  | '4-3-2-1';

// ============ Content Structure ============

/**
 * Individual player in the lineup (stored in puzzle content JSONB).
 */
export interface LineupPlayer {
  /** Position identifier (e.g., "ST", "RCB") */
  position_key: PositionKey;
  /** Full player name for validation (e.g., "Sadio Mané") */
  player_name: string;
  /** Whether this player is hidden and needs guessing */
  is_hidden: boolean;
  /** Manual x-coordinate override (0-100), takes precedence over formation default */
  override_x?: number;
  /** Manual y-coordinate override (0-100), takes precedence over formation default */
  override_y?: number;
}

/**
 * Puzzle content structure stored in daily_puzzles.content JSONB.
 */
export interface LineupContent {
  /** Match headline (e.g., "Liverpool 4-0 Barcelona") */
  match_name: string;
  /** Competition name (e.g., "Champions League SF") */
  competition: string;
  /** Match date in ISO format or display format */
  match_date: string;
  /** Formation (e.g., "4-3-3") */
  formation: FormationName;
  /** Team name (e.g., "Liverpool") */
  team: string;
  /** Array of 11 players */
  players: LineupPlayer[];
}

// ============ Game State ============

/**
 * Runtime state for a single player slot.
 */
export interface PlayerSlotState {
  /** Position key for this slot */
  positionKey: PositionKey;
  /** Computed x,y after formation + override */
  coords: PositionCoords;
  /** Full name (for validation) */
  fullName: string;
  /** Display name (surname only, shown when found/revealed) */
  displayName: string;
  /** Whether this slot requires guessing */
  isHidden: boolean;
  /** Whether the user has correctly guessed this player */
  isFound: boolean;
}

/** Slot index (0-10 for 11 players) */
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Result of the last guess attempt for targeted animations.
 * - correct: Guessed the right player for the selected slot
 * - incorrect: Player not in lineup at all
 * - wrong_position: Player IS in lineup but in a different slot (amber warning)
 * - duplicate: Player already found/revealed
 */
export type GuessResult = 'correct' | 'incorrect' | 'wrong_position' | 'duplicate' | null;

/**
 * Game state managed by useReducer.
 */
export interface StartingXIState {
  /** 11 player slots */
  slots: PlayerSlotState[];
  /** Current game status */
  gameStatus: 'idle' | 'playing' | 'complete';
  /** Currently selected slot for guessing (null if none) */
  selectedSlot: SlotIndex | null;
  /** Score object when game completes */
  score: StartingXIScore | null;
  /** Timestamp when game started */
  startedAt: string | null;
  /** Whether attempt has been saved to database */
  attemptSaved: boolean;
  /** Unique attempt ID (for resume support) */
  attemptId: string | null;
  /** Flash state for incorrect guess animation */
  lastGuessIncorrect: boolean;
  /** Result of the last guess attempt ('correct' | 'incorrect' | 'duplicate' | null) */
  lastGuessResult: GuessResult;
  /** Slot index of the last guessed marker (for targeted animations) */
  lastGuessedId: SlotIndex | null;
}

// ============ Scoring ============

/**
 * Score structure for Starting XI.
 */
export interface StartingXIScore {
  /** Points earned (1 per found player) */
  points: number;
  /** Maximum possible points (count of hidden players) */
  maxPoints: number;
  /** Number of players found */
  foundCount: number;
  /** Total hidden players in puzzle */
  totalHidden: number;
}

// ============ Actions ============

/**
 * Payload for restoring in-progress game from saved attempt.
 */
export interface RestoreProgressPayload {
  attemptId: string;
  startedAt: string;
  /** Indices of slots the user has already found */
  foundSlots: SlotIndex[];
}

/**
 * Payload for GUESS_RESULT action.
 */
export interface GuessResultPayload {
  /** The result of the guess */
  result: 'correct' | 'incorrect' | 'wrong_position' | 'duplicate';
  /** The slot index that was guessed (or found duplicate/wrong position) */
  slotId: SlotIndex;
}

/**
 * Reducer action types for useStartingXIGame.
 */
export type StartingXIAction =
  | { type: 'INITIALIZE'; payload: { slots: PlayerSlotState[] } }
  | { type: 'SELECT_SLOT'; payload: SlotIndex }
  | { type: 'DESELECT_SLOT' }
  | { type: 'PLAYER_FOUND'; payload: SlotIndex }
  | { type: 'INCORRECT_GUESS' }
  | { type: 'CLEAR_INCORRECT' }
  | { type: 'GUESS_RESULT'; payload: GuessResultPayload }
  | { type: 'CLEAR_GUESS_RESULT' }
  | { type: 'GAME_COMPLETE'; payload: StartingXIScore }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' };

// ============ Metadata ============

/**
 * Metadata structure for attempt persistence.
 * Stored in puzzle_attempts.metadata JSONB.
 */
export interface StartingXIMeta {
  /** Indices of found slots for progress restoration */
  foundSlots: SlotIndex[];
  /** Game started timestamp */
  startedAt: string;
}
