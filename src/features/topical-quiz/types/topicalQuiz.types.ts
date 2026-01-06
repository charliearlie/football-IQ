/**
 * Topical Quiz Game Types
 *
 * A 5-question multiple-choice visual trivia quiz focused on current football events.
 * Each question has an optional image and exactly 4 answer options.
 */

/**
 * Single quiz question structure (matches Supabase JSONB)
 */
export interface QuizQuestion {
  /** Unique question identifier */
  id: string;
  /** The question text */
  question: string;
  /** Optional image URL (Supabase storage or CDN) */
  imageUrl?: string;
  /** Exactly 4 answer options */
  options: [string, string, string, string];
  /** Index of correct answer (0-3) */
  correctIndex: number;
}

/**
 * Full quiz puzzle content (stored in daily_puzzles.content)
 */
export interface TopicalQuizContent {
  /** Exactly 5 questions */
  questions: [
    QuizQuestion,
    QuizQuestion,
    QuizQuestion,
    QuizQuestion,
    QuizQuestion,
  ];
}

/**
 * Game status
 */
export type QuizGameStatus = 'playing' | 'complete';

/**
 * Record of a single answer
 */
export interface QuizAnswer {
  /** Question index (0-4) */
  questionIndex: number;
  /** Selected option index (0-3) */
  selectedIndex: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
}

/**
 * Quiz score result
 */
export interface TopicalQuizScore {
  /** Points earned (0-10, 2 per correct) */
  points: number;
  /** Maximum possible points */
  maxPoints: 10;
  /** Number of correct answers (0-5) */
  correctCount: number;
  /** Total questions */
  totalQuestions: 5;
  /** Always true - no fail condition in quiz */
  won: boolean;
}

/**
 * Full game state managed by reducer
 */
export interface TopicalQuizState {
  /** Current question index (0-4) */
  currentQuestionIndex: number;
  /** All answers recorded so far */
  answers: QuizAnswer[];
  /** Game completion status */
  gameStatus: QuizGameStatus;
  /** Final score (set on game complete) */
  score: TopicalQuizScore | null;
  /** Whether attempt has been saved to SQLite */
  attemptSaved: boolean;
  /** Timestamp when game started */
  startedAt: string;
  /** True during 1.5s feedback delay after answering */
  showingFeedback: boolean;
  /** Index of last answered question (for feedback display) */
  lastAnsweredIndex: number | null;
  /** Unique ID for the attempt (for resume support) */
  attemptId: string | null;
}

/**
 * Payload for restoring in-progress game state.
 */
export interface RestoreProgressPayload {
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  attemptId: string;
  startedAt: string;
}

/**
 * Reducer action types
 */
export type TopicalQuizAction =
  | {
      type: 'ANSWER_QUESTION';
      payload: { selectedIndex: number; isCorrect: boolean };
    }
  | { type: 'NEXT_QUESTION' }
  | { type: 'GAME_COMPLETE'; payload: TopicalQuizScore }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload };

/**
 * Option button visual state
 */
export type OptionButtonState =
  | 'default'
  | 'correct'
  | 'incorrect'
  | 'reveal'
  | 'disabled';

// Constants
export const TOTAL_QUESTIONS = 5;
export const POINTS_PER_CORRECT = 2;
export const MAX_POINTS = 10;
export const AUTO_ADVANCE_DELAY_MS = 1500;
export const OPTIONS_COUNT = 4;
