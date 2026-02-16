/**
 * Type definitions for the Connections game mode.
 *
 * Connections is a 4x4 grid puzzle where players identify 4 groups of 4 related footballers.
 */

/**
 * Difficulty levels for connection groups.
 * Matches NYT Connections color scheme.
 */
export type ConnectionsDifficulty = 'yellow' | 'green' | 'blue' | 'purple';

/**
 * A group of 4 connected players.
 */
export interface ConnectionsGroup {
  /** Category description (e.g., "Won Ballon d'Or") */
  category: string;
  /** Difficulty level (yellow = easiest, purple = hardest) */
  difficulty: ConnectionsDifficulty;
  /** Exactly 4 player names in this group */
  players: [string, string, string, string];
}

/**
 * The Connections puzzle content structure.
 * Stored in daily_puzzles.content JSON field.
 */
export interface ConnectionsContent {
  /** Exactly 4 groups of 4 players each */
  groups: [ConnectionsGroup, ConnectionsGroup, ConnectionsGroup, ConnectionsGroup];
}

/**
 * A guess attempt (4 players).
 */
export interface ConnectionsGuess {
  /** The 4 players selected */
  players: string[];
  /** Whether this guess was correct (found a group) */
  correct: boolean;
  /** Number of players that matched a group (for "close" feedback) */
  matchCount?: number;
  /** The group that was matched (if correct) */
  matchedGroup?: ConnectionsDifficulty;
}

/**
 * Score structure for Connections.
 */
export interface ConnectionsScore {
  /** IQ points earned (0-10) */
  points: number;
  /** Number of mistakes made (0-4) */
  mistakes: number;
  /** Whether groups were solved in perfect order (yellow->green->blue->purple) */
  perfectOrder: boolean;
  /** Number of groups solved (0-4) */
  solvedCount: number;
}

/**
 * The Connections game state.
 */
export interface ConnectionsState {
  /** Currently selected player names (max 4) */
  selectedPlayers: string[];
  /** Groups that have been successfully found */
  solvedGroups: ConnectionsGroup[];
  /** Player names that haven't been solved yet */
  remainingPlayers: string[];
  /** Number of incorrect guesses (max 4) */
  mistakes: number;
  /** History of all guesses */
  guesses: ConnectionsGuess[];
  /** Game status */
  gameStatus: 'playing' | 'won' | 'lost' | 'gave_up';
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved */
  attemptSaved: boolean;
  /** ISO timestamp of game start */
  startedAt: string | null;
  /** Final score (set when game ends) */
  score: ConnectionsScore | null;
  /** Result of last guess for feedback ('close' = 3/4 correct) */
  lastGuessResult: 'correct' | 'incorrect' | 'close' | null;
  /** Group currently being revealed (for animation) */
  revealingGroup: ConnectionsGroup | null;
}

/**
 * Metadata structure saved with Connections attempts.
 */
export interface ConnectionsAttemptMetadata {
  mistakes: number;
  solvedGroups: string[];
  guesses: ConnectionsGuess[];
  startedAt: string;
}

/**
 * Actions for Connections game reducer.
 */
export type ConnectionsAction =
  | { type: 'TOGGLE_PLAYER'; payload: string }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'CORRECT_GUESS'; payload: ConnectionsGroup }
  | { type: 'INCORRECT_GUESS'; payload: { matchCount: number } }
  | { type: 'GAME_WON'; payload: ConnectionsScore }
  | { type: 'GAME_LOST'; payload: ConnectionsScore }
  | { type: 'SHUFFLE_REMAINING' }
  | { type: 'DESELECT_ALL' }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'GIVE_UP' }
  | { type: 'RESET_GAME' };

/**
 * Payload for restoring progress from saved attempt.
 */
export interface RestoreProgressPayload {
  attemptId: string;
  startedAt: string;
  mistakes: number;
  solvedGroups: ConnectionsGroup[];
  guesses: ConnectionsGuess[];
}

/**
 * Initial state factory for Connections game.
 * Takes shuffled player names to populate the grid.
 */
export function createInitialState(shuffledPlayers: string[]): ConnectionsState {
  return {
    selectedPlayers: [],
    solvedGroups: [],
    remainingPlayers: shuffledPlayers,
    mistakes: 0,
    guesses: [],
    gameStatus: 'playing',
    attemptId: null,
    attemptSaved: false,
    startedAt: null,
    score: null,
    lastGuessResult: null,
    revealingGroup: null,
  };
}

/**
 * Parse and validate Connections content from puzzle JSON.
 * Returns null if content is not valid ConnectionsContent.
 *
 * @param content - Raw content from puzzle
 * @returns Parsed ConnectionsContent or null
 */
export function parseConnectionsContent(content: unknown): ConnectionsContent | null {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const obj = content as Record<string, unknown>;

  // Check for required groups array
  if (!Array.isArray(obj.groups) || obj.groups.length !== 4) {
    return null;
  }

  // Validate each group
  const validDifficulties: ConnectionsDifficulty[] = ['yellow', 'green', 'blue', 'purple'];
  for (const group of obj.groups) {
    if (!group || typeof group !== 'object') {
      return null;
    }

    const g = group as Record<string, unknown>;

    // Must have category string
    if (typeof g.category !== 'string') {
      return null;
    }

    // Must have valid difficulty
    if (typeof g.difficulty !== 'string' || !validDifficulties.includes(g.difficulty as ConnectionsDifficulty)) {
      return null;
    }

    // Must have exactly 4 players
    if (!Array.isArray(g.players) || g.players.length !== 4) {
      return null;
    }

    // All players must be strings
    for (const player of g.players) {
      if (typeof player !== 'string') {
        return null;
      }
    }
  }

  return {
    groups: obj.groups as [ConnectionsGroup, ConnectionsGroup, ConnectionsGroup, ConnectionsGroup],
  };
}
