/**
 * Type definitions for the Timeline game mode.
 *
 * Timeline is a chronological ordering puzzle — 6 career events from a footballer,
 * drag to reorder, multiple attempts with scoring based on first-attempt accuracy.
 */

/**
 * A single event in the timeline.
 */
export interface TimelineEvent {
  /** Description of the event (e.g., "Signed for Barcelona") */
  text: string;
  /** Year the event occurred */
  year: number;
  /** Optional month (1-12) for more precise ordering */
  month?: number;
}

/**
 * The Timeline puzzle content structure.
 * Stored in daily_puzzles.content JSON field.
 * Events are stored in correct chronological order.
 *
 * Supports three modes:
 * - Player career: subject is set (e.g., "Thierry Henry")
 * - Themed: title is set (e.g., "Premier League Moments")
 * - Generic: neither set — just a list of events
 */
export interface TimelineContent {
  /** Optional title/theme for the timeline (e.g., "Premier League Moments") */
  title?: string;
  /** The footballer's name (optional — only for player career timelines) */
  subject?: string;
  /** Optional reference ID for the subject */
  subject_id?: string;
  /** Exactly 6 events in correct chronological order */
  events: TimelineEvent[];
}

/**
 * Score structure for Timeline.
 */
export interface TimelineScore {
  /** IQ points earned (0-5) */
  points: number;
  /** Total number of submit attempts */
  totalAttempts: number;
  /** Score label (e.g., "Perfect Timeline") */
  label: string;
}

/**
 * Reveal phase for simultaneous card flash animations.
 */
export type RevealPhase = 'idle' | 'revealing';

/**
 * The Timeline game state.
 */
export interface TimelineState {
  /** Current order of events (indices into the correct order) */
  eventOrder: TimelineEvent[];
  /** Set of indices (in eventOrder) that are locked in correct position */
  lockedIndices: Set<number>;
  /** Number of submit attempts made */
  attemptCount: number;
  /** Which positions were correct on first attempt (array of booleans, length 6) */
  firstAttemptResults: boolean[];
  /** Which positions were correct on last attempt (for reveal animation) */
  lastAttemptResults: boolean[];
  /** Current reveal phase */
  revealPhase: RevealPhase;
  /** Game status */
  gameStatus: 'playing' | 'won' | 'lost' | 'gave_up';
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved */
  attemptSaved: boolean;
  /** ISO timestamp of game start */
  startedAt: string | null;
  /** Final score (set when game ends) */
  score: TimelineScore | null;
}

/**
 * Metadata structure saved with Timeline attempts.
 */
export interface TimelineAttemptMetadata {
  attemptCount: number;
  firstAttemptCorrect: number;
  eventOrder: string[];
  lockedIndices: number[];
  startedAt: string;
}

/**
 * Actions for Timeline game reducer.
 */
export type TimelineAction =
  | { type: 'REORDER_EVENTS'; payload: { from: number; to: number } }
  | { type: 'SUBMIT' }
  | { type: 'REVEAL_COMPLETE' }
  | { type: 'GIVE_UP' }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload }
  | { type: 'ATTEMPT_SAVED' }
  | { type: 'RESET_GAME' };

/**
 * Payload for restoring progress from saved attempt.
 */
export interface RestoreProgressPayload {
  attemptId: string;
  startedAt: string;
  attemptCount: number;
  eventOrder: TimelineEvent[];
  lockedIndices: number[];
  firstAttemptCorrect: number;
}

/**
 * Initial state factory for Timeline game.
 * Takes shuffled events to populate the list.
 */
export function createInitialState(shuffledEvents: TimelineEvent[]): TimelineState {
  return {
    eventOrder: shuffledEvents,
    lockedIndices: new Set<number>(),
    attemptCount: 0,
    firstAttemptResults: [],
    lastAttemptResults: [],
    revealPhase: 'idle',
    gameStatus: 'playing',
    attemptId: null,
    attemptSaved: false,
    startedAt: null,
    score: null,
  };
}

/**
 * Parse and validate Timeline content from puzzle JSON.
 * Returns null if content is not valid TimelineContent.
 */
export function parseTimelineContent(content: unknown): TimelineContent | null {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const obj = content as Record<string, unknown>;

  // Must have events array of length 6
  if (!Array.isArray(obj.events) || obj.events.length !== 6) {
    return null;
  }

  for (const event of obj.events) {
    if (!event || typeof event !== 'object') {
      return null;
    }

    const e = event as Record<string, unknown>;

    if (typeof e.text !== 'string' || e.text.length === 0) {
      return null;
    }

    if (typeof e.year !== 'number' || !Number.isInteger(e.year)) {
      return null;
    }

    if (e.month !== undefined && e.month !== null) {
      if (typeof e.month !== 'number' || !Number.isInteger(e.month) || e.month < 1 || e.month > 12) {
        return null;
      }
    }
  }

  return {
    title: typeof obj.title === 'string' && obj.title.length > 0 ? obj.title : undefined,
    subject: typeof obj.subject === 'string' && obj.subject.length > 0 ? obj.subject : undefined,
    subject_id: typeof obj.subject_id === 'string' ? obj.subject_id : undefined,
    events: obj.events as TimelineEvent[],
  };
}
