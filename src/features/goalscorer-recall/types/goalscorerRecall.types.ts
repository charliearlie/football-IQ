/**
 * Type definitions for Goalscorer Recall game mode.
 *
 * This game challenges players to name all goalscorers from a classic match
 * within a 60-second time limit.
 */

/**
 * A single goal in the match.
 */
export interface Goal {
  /** Scorer's full name (e.g., "Mohamed Salah") */
  scorer: string;
  /** Minute scored (e.g., 45, 90 for added time use 91+) */
  minute: number;
  /** Which team scored */
  team: 'home' | 'away';
  /** Whether this was an own goal */
  isOwnGoal?: boolean;
}

/**
 * Puzzle content for guess_the_goalscorers game mode.
 * Stored in puzzle.content as JSONB in Supabase.
 */
export interface GoalscorerRecallContent {
  /** Home team name */
  home_team: string;
  /** Away team name */
  away_team: string;
  /** Home team final score */
  home_score: number;
  /** Away team final score */
  away_score: number;
  /** Competition name (e.g., "Premier League") */
  competition: string;
  /** Display format date (e.g., "15 May 2023") */
  match_date: string;
  /** All goals in chronological order */
  goals: Goal[];
}

/**
 * Goal with UI state for rendering.
 */
export interface GoalWithState extends Goal {
  /** Unique identifier for React keys */
  id: string;
  /** Whether this goal has been found by the player */
  found: boolean;
  /** Index for ordering in the UI (by minute) */
  displayOrder: number;
}

/**
 * Game status for goalscorer recall.
 * - idle: Before game starts (showing start overlay)
 * - playing: Timer running, accepting guesses
 * - won: All scorers found before time expired
 * - lost: Time expired OR player gave up
 */
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

/**
 * Score result for goalscorer recall.
 */
export interface GoalscorerRecallScore {
  /** Percentage of unique scorers found (0-100) */
  percentage: number;
  /** Number of unique scorers found */
  scorersFound: number;
  /** Total unique scorers (excluding own goals) */
  totalScorers: number;
  /** Seconds remaining when game ended */
  timeRemaining: number;
  /** Time bonus: remainingSeconds * 2 (only if all found) */
  timeBonus: number;
  /** Whether all scorers were found */
  allFound: boolean;
  /** Whether the player won (found all before time) */
  won: boolean;
}

/**
 * State for the goalscorer recall game reducer.
 */
export interface GoalscorerRecallState {
  /** Current game status */
  gameStatus: GameStatus;
  /** Seconds remaining on the timer */
  timeRemaining: number;
  /** Set of unique scorers already found (normalized names) */
  foundScorers: Set<string>;
  /** All goals with their found state */
  goals: GoalWithState[];
  /** Current text in the input */
  currentGuess: string;
  /** Last guess was correct (triggers "GOAL!" flash) */
  lastGuessCorrect: boolean;
  /** Last guess was incorrect (triggers shake) */
  lastGuessIncorrect: boolean;
  /** Final score (set when game ends) */
  score: GoalscorerRecallScore | null;
  /** Whether attempt has been saved to SQLite */
  attemptSaved: boolean;
  /** Game start timestamp (ISO string) */
  startedAt: string | null;
}

/**
 * Actions for the goalscorer recall reducer.
 */
export type GoalscorerRecallAction =
  | { type: 'INIT_GOALS'; payload: GoalWithState[] }
  | { type: 'START_GAME' }
  | { type: 'TICK' }
  | { type: 'CORRECT_GUESS'; payload: { scorer: string; goalsFound: number } }
  | { type: 'INCORRECT_GUESS' }
  | { type: 'DUPLICATE_GUESS' }
  | { type: 'SET_CURRENT_GUESS'; payload: string }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'TIME_UP'; payload: GoalscorerRecallScore }
  | { type: 'ALL_FOUND'; payload: GoalscorerRecallScore }
  | { type: 'GIVE_UP'; payload: GoalscorerRecallScore }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' };

/** Timer duration in seconds */
export const TIMER_DURATION = 60;

/** Timer warning threshold (turns red below this) */
export const TIMER_WARNING_THRESHOLD = 10;

/** Time bonus multiplier when all scorers found */
export const TIME_BONUS_MULTIPLIER = 2;
