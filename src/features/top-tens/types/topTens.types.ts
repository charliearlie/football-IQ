/**
 * Type definitions for Top Tens game mode.
 *
 * Top Tens is a ranking puzzle where players guess all 10 items in a top 10 list.
 * Correct guesses reveal at their rank position (like the TV show "Tenable").
 *
 * This is a premium-only game mode.
 */

/**
 * Rank indices 0-9 (representing display ranks 1-10).
 */
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * A single answer in the top 10 list.
 */
export interface TopTensAnswer {
  /** Primary display name shown when revealed */
  name: string;
  /** Alternative accepted answers for matching (e.g., ["Shearer"] for "Alan Shearer") */
  aliases?: string[];
  /** Optional additional info displayed when revealed (e.g., "260 goals") */
  info?: string;
}

/**
 * Top Tens puzzle content structure.
 * Stored in daily_puzzles.content JSON field.
 */
export interface TopTensContent {
  /** Puzzle title/question (e.g., "Top 10 Premier League All-Time Goalscorers") */
  title: string;
  /** Category for display (e.g., "Premier League", "World Cup") */
  category?: string;
  /** Ordered array of 10 answers where index 0 = Rank #1, index 9 = Rank #10 */
  answers: TopTensAnswer[];
}

/**
 * State for a single rank slot in the grid.
 */
export interface RankSlotState {
  /** Display rank (1-10) */
  rank: number;
  /** Whether this slot has been found/revealed */
  found: boolean;
  /** Whether this slot was auto-revealed on give up (not guessed by user) */
  autoRevealed: boolean;
  /** The answer (revealed when found) */
  answer: TopTensAnswer | null;
}

/**
 * Game status values.
 */
export type TopTensGameStatus = 'playing' | 'won' | 'lost';

/**
 * Score structure for Top Tens.
 */
export interface TopTensScore {
  /** Points earned (0-8, flat tier scoring) */
  points: number;
  /** Maximum possible points (always 8) */
  maxPoints: 8;
  /** Number of answers found (0-10) */
  foundCount: number;
  /** Number of incorrect guesses made */
  wrongGuessCount: number;
  /** Whether player found all answers (won) */
  won: boolean;
}

/**
 * Climbing animation state for Tenable-style feedback.
 */
export interface ClimbingState {
  /** Whether the climbing animation is active */
  isClimbing: boolean;
  /** Target rank (1-10) for correct answer, null for incorrect */
  targetRank: number | null;
  /** The answer to reveal (for correct guesses) */
  pendingAnswer: TopTensAnswer | null;
  /** The rank index (0-9) to reveal (for correct guesses) */
  pendingRankIndex: RankIndex | null;
}

/**
 * Top Tens game state.
 */
export interface TopTensState {
  /** Current game status */
  gameStatus: TopTensGameStatus;
  /** Array of 10 rank slots */
  rankSlots: RankSlotState[];
  /** Number of answers found (0-10) */
  foundCount: number;
  /** Number of incorrect guesses made */
  wrongGuessCount: number;
  /** Current guess text in input */
  currentGuess: string;
  /** Triggers correct guess animation */
  lastGuessCorrect: boolean;
  /** Triggers shake animation on incorrect guess */
  lastGuessIncorrect: boolean;
  /** Triggers duplicate feedback (already found) */
  lastGuessDuplicate: boolean;
  /** Score when game ends */
  score: TopTensScore | null;
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved to database */
  attemptSaved: boolean;
  /** When the game started (ISO string) */
  startedAt: string | null;
  /** Climbing animation state */
  climbing: ClimbingState;
}

/**
 * Payload for restoring progress from saved attempt.
 */
export interface RestoreProgressPayload {
  attemptId: string;
  startedAt: string;
  /** Indices of found answers (0-9) */
  foundIndices: number[];
  wrongGuessCount: number;
  /** Full answers array from puzzle content, used to fill in found slots */
  answers: TopTensAnswer[];
}

/**
 * Payload for starting climb animation.
 */
export interface StartClimbPayload {
  /** Target rank (1-10) for correct answer, null for incorrect */
  targetRank: number | null;
  /** The answer to reveal (for correct guesses) */
  answer: TopTensAnswer | null;
  /** The rank index (0-9) to reveal (for correct guesses) */
  rankIndex: RankIndex | null;
}

/**
 * Actions for Top Tens game reducer.
 */
export type TopTensAction =
  | { type: 'INIT_GAME'; payload: TopTensContent }
  | { type: 'SET_CURRENT_GUESS'; payload: string }
  | { type: 'START_CLIMB'; payload: StartClimbPayload }
  | { type: 'CLIMB_COMPLETE' }
  | { type: 'CORRECT_GUESS'; payload: { rankIndex: RankIndex; answer: TopTensAnswer } }
  | { type: 'INCORRECT_GUESS' }
  | { type: 'DUPLICATE_GUESS' }
  | { type: 'CLEAR_FEEDBACK' }
  | { type: 'ALL_FOUND'; payload: TopTensScore }
  | { type: 'GIVE_UP'; payload: { score: TopTensScore; content: TopTensContent } }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET_GAME' };

/**
 * Create initial climbing state.
 */
export function createInitialClimbingState(): ClimbingState {
  return {
    isClimbing: false,
    targetRank: null,
    pendingAnswer: null,
    pendingRankIndex: null,
  };
}

/**
 * Create initial game state.
 */
export function createInitialState(): TopTensState {
  return {
    gameStatus: 'playing',
    rankSlots: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      found: false,
      autoRevealed: false,
      answer: null,
    })),
    foundCount: 0,
    wrongGuessCount: 0,
    currentGuess: '',
    lastGuessCorrect: false,
    lastGuessIncorrect: false,
    lastGuessDuplicate: false,
    score: null,
    attemptId: null,
    attemptSaved: false,
    startedAt: null,
    climbing: createInitialClimbingState(),
  };
}

/**
 * Parse and validate Top Tens content from puzzle JSON.
 * Returns null if content is not valid TopTensContent.
 *
 * @param content - Raw content from puzzle
 * @returns Parsed TopTensContent or null
 */
export function parseTopTensContent(content: unknown): TopTensContent | null {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const obj = content as Record<string, unknown>;

  // Must have title as string
  if (typeof obj.title !== 'string' || !obj.title.trim()) {
    return null;
  }

  // Must have answers array with exactly 10 items
  if (!Array.isArray(obj.answers) || obj.answers.length !== 10) {
    return null;
  }

  // Validate each answer
  const validatedAnswers: TopTensAnswer[] = [];
  for (const answer of obj.answers) {
    if (!isValidTopTensAnswer(answer)) {
      return null;
    }
    validatedAnswers.push(answer as TopTensAnswer);
  }

  return {
    title: obj.title,
    category: typeof obj.category === 'string' ? obj.category : undefined,
    answers: validatedAnswers,
  };
}

/**
 * Check if a value is a valid TopTensAnswer.
 */
function isValidTopTensAnswer(value: unknown): value is TopTensAnswer {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Must have name as non-empty string
  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    return false;
  }

  // aliases must be array of strings if present
  if (obj.aliases !== undefined) {
    if (!Array.isArray(obj.aliases)) {
      return false;
    }
    for (const alias of obj.aliases) {
      if (typeof alias !== 'string') {
        return false;
      }
    }
  }

  // info must be string if present
  if (obj.info !== undefined && typeof obj.info !== 'string') {
    return false;
  }

  return true;
}

/**
 * Metadata structure saved with Top Tens attempts.
 * Used for progress restoration and IQ calculation.
 */
export interface TopTensAttemptMetadata {
  /** Indices of found answers (0-9) */
  foundIndices: number[];
  /** Number of incorrect guesses */
  wrongGuessCount: number;
  /** When the game started */
  startedAt: string;
}
