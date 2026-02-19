/**
 * Tests for Timeline game reducer logic.
 *
 * The reducer and helpers are not exported from the hook file.
 * They are replicated here for isolated unit testing, following the
 * convention established in src/features/the-chain/__tests__/useTheChainGame.test.ts.
 */

import {
  TimelineState,
  TimelineAction,
  TimelineContent,
  TimelineEvent,
  createInitialState,
} from '../types/timeline.types';
import { calculateTimelineScore, MAX_TIMELINE_ATTEMPTS } from '../utils/scoring';

// --- Helper functions replicated from useTimelineGame.ts ---

function eventsMatch(a: TimelineEvent, b: TimelineEvent): boolean {
  return a.text === b.text && a.year === b.year;
}

function checkOrder(
  currentOrder: TimelineEvent[],
  correctOrder: TimelineEvent[]
): boolean[] {
  return currentOrder.map((event, i) => eventsMatch(event, correctOrder[i]));
}

function reorderWithLocks(
  events: TimelineEvent[],
  from: number,
  to: number,
  lockedIndices: Set<number>
): TimelineEvent[] {
  if (lockedIndices.has(from)) return events;
  if (lockedIndices.has(to)) return events;

  const result = [...events];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

// --- Reducer replicated from useTimelineGame.ts ---

function timelineReducer(
  state: TimelineState,
  action: TimelineAction,
  content: TimelineContent | null
): TimelineState {
  switch (action.type) {
    case 'REORDER_EVENTS': {
      if (state.gameStatus !== 'playing' || state.revealPhase !== 'idle') return state;

      const { from, to } = action.payload;
      const newOrder = reorderWithLocks(state.eventOrder, from, to, state.lockedIndices);

      return { ...state, eventOrder: newOrder };
    }

    case 'SUBMIT': {
      if (!content || state.gameStatus !== 'playing' || state.revealPhase !== 'idle') {
        return state;
      }

      const correctOrder = content.events;
      const results = checkOrder(state.eventOrder, correctOrder);
      const isFirstAttempt = state.attemptCount === 0;
      const newAttemptCount = state.attemptCount + 1;

      const firstAttemptResults = isFirstAttempt ? results : state.firstAttemptResults;

      const allCorrect = results.every(Boolean);

      if (allCorrect) {
        const score = calculateTimelineScore(newAttemptCount, true);

        return {
          ...state,
          attemptCount: newAttemptCount,
          firstAttemptResults,
          lastAttemptResults: results,
          lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
          revealPhase: 'revealing',
          gameStatus: 'won',
          score,
        };
      }

      return {
        ...state,
        attemptCount: newAttemptCount,
        firstAttemptResults,
        lastAttemptResults: results,
        revealPhase: 'revealing',
      };
    }

    case 'REVEAL_COMPLETE': {
      if (content && state.attemptCount >= MAX_TIMELINE_ATTEMPTS && state.gameStatus === 'playing') {
        const score = calculateTimelineScore(state.attemptCount, false);
        return {
          ...state,
          revealPhase: 'idle',
          eventOrder: content.events,
          lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
          gameStatus: 'lost',
          score,
        };
      }
      return { ...state, revealPhase: 'idle' };
    }

    case 'GIVE_UP': {
      if (!content || state.gameStatus !== 'playing') return state;

      const score = calculateTimelineScore(state.attemptCount, false);

      return {
        ...state,
        eventOrder: content.events,
        lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
        gameStatus: 'gave_up',
        score,
        revealPhase: 'idle',
      };
    }

    case 'SET_ATTEMPT_ID': {
      return {
        ...state,
        attemptId: action.payload,
        startedAt: state.startedAt || new Date().toISOString(),
      };
    }

    case 'RESTORE_PROGRESS': {
      const { attemptId, startedAt, attemptCount, eventOrder, lockedIndices, firstAttemptCorrect } =
        action.payload;

      return {
        ...state,
        attemptId,
        startedAt,
        attemptCount,
        eventOrder,
        lockedIndices: new Set(lockedIndices),
        firstAttemptResults: Array.from({ length: 6 }, (_, i) => i < firstAttemptCorrect),
        lastAttemptResults: [],
        gameStatus: 'playing',
        revealPhase: 'idle',
      };
    }

    case 'ATTEMPT_SAVED': {
      return { ...state, attemptSaved: true };
    }

    case 'RESET_GAME': {
      if (!content) return state;
      // Note: shuffle is non-deterministic; tests verify structure only
      return createInitialState(content.events);
    }

    default:
      return state;
  }
}

// --- Test fixtures ---

const CORRECT_EVENTS: TimelineEvent[] = [
  { text: 'Joined Manchester United', year: 2003 },
  { text: 'Won Champions League', year: 2008 },
  { text: 'Moved to Real Madrid', year: 2009 },
  { text: "Won Ballon d'Or", year: 2014 },
  { text: 'Transferred to Juventus', year: 2018 },
  { text: 'Returned to Man United', year: 2021 },
];

const SHUFFLED_EVENTS: TimelineEvent[] = [
  CORRECT_EVENTS[3],
  CORRECT_EVENTS[0],
  CORRECT_EVENTS[5],
  CORRECT_EVENTS[1],
  CORRECT_EVENTS[4],
  CORRECT_EVENTS[2],
];

const CONTENT: TimelineContent = {
  events: CORRECT_EVENTS,
  subject: 'Cristiano Ronaldo',
  subject_id: 'cr7',
};

// --- Helper to build state with shuffled events ---
function makePlayingState(events: TimelineEvent[] = SHUFFLED_EVENTS): TimelineState {
  return createInitialState(events);
}

// --- Tests ---

describe('eventsMatch', () => {
  it('returns true when text and year are identical', () => {
    const a: TimelineEvent = { text: 'Joined Manchester United', year: 2003 };
    const b: TimelineEvent = { text: 'Joined Manchester United', year: 2003 };
    expect(eventsMatch(a, b)).toBe(true);
  });

  it('returns false when text differs', () => {
    const a: TimelineEvent = { text: 'Joined Manchester United', year: 2003 };
    const b: TimelineEvent = { text: 'Left Manchester United', year: 2003 };
    expect(eventsMatch(a, b)).toBe(false);
  });

  it('returns false when year differs', () => {
    const a: TimelineEvent = { text: 'Joined Manchester United', year: 2003 };
    const b: TimelineEvent = { text: 'Joined Manchester United', year: 2009 };
    expect(eventsMatch(a, b)).toBe(false);
  });

  it('ignores the optional month field', () => {
    const a: TimelineEvent = { text: 'Joined Manchester United', year: 2003, month: 7 };
    const b: TimelineEvent = { text: 'Joined Manchester United', year: 2003, month: 12 };
    expect(eventsMatch(a, b)).toBe(true);
  });
});

describe('checkOrder', () => {
  it('returns all-true when current order matches correct order exactly', () => {
    const results = checkOrder(CORRECT_EVENTS, CORRECT_EVENTS);
    expect(results).toEqual([true, true, true, true, true, true]);
  });

  it('returns all-false when every position is wrong', () => {
    // Construct a rotation where no event sits in its correct position
    const fullyWrong: TimelineEvent[] = [
      CORRECT_EVENTS[1],
      CORRECT_EVENTS[2],
      CORRECT_EVENTS[3],
      CORRECT_EVENTS[4],
      CORRECT_EVENTS[5],
      CORRECT_EVENTS[0],
    ];
    const results = checkOrder(fullyWrong, CORRECT_EVENTS);
    results.forEach((r) => expect(r).toBe(false));
  });

  it('returns partial truths when some positions are correct', () => {
    // Place first two events correctly, swap the rest to avoid accidental matches
    const partial: TimelineEvent[] = [
      CORRECT_EVENTS[0],
      CORRECT_EVENTS[1],
      CORRECT_EVENTS[5],
      CORRECT_EVENTS[4],
      CORRECT_EVENTS[3],
      CORRECT_EVENTS[2],
    ];
    const results = checkOrder(partial, CORRECT_EVENTS);
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(true);
    expect(results[2]).toBe(false);
    expect(results[3]).toBe(false);
    expect(results[4]).toBe(false);
    expect(results[5]).toBe(false);
  });

  it('returns an array with the same length as the inputs', () => {
    const results = checkOrder(CORRECT_EVENTS, CORRECT_EVENTS);
    expect(results).toHaveLength(6);
  });
});

describe('reorderWithLocks', () => {
  it('moves an item from one index to another', () => {
    const events = [...CORRECT_EVENTS];
    const locks = new Set<number>();
    const result = reorderWithLocks(events, 0, 2, locks);

    // Item at index 0 should now be at index 2
    expect(result[2]).toEqual(CORRECT_EVENTS[0]);
    expect(result).toHaveLength(6);
  });

  it('returns original array when the source index is locked', () => {
    const events = [...CORRECT_EVENTS];
    const locks = new Set([0]);
    const result = reorderWithLocks(events, 0, 3, locks);

    expect(result).toBe(events);
  });

  it('returns original array when the destination index is locked', () => {
    const events = [...CORRECT_EVENTS];
    const locks = new Set([3]);
    const result = reorderWithLocks(events, 0, 3, locks);

    expect(result).toBe(events);
  });

  it('allows reorder when neither source nor destination is locked', () => {
    const events = [...CORRECT_EVENTS];
    const locks = new Set([0, 1]); // Indices 0 and 1 locked, 4 and 5 are free
    const result = reorderWithLocks(events, 4, 5, locks);

    expect(result).not.toBe(events);
    expect(result[5]).toEqual(CORRECT_EVENTS[4]);
  });

  it('does not mutate the original array', () => {
    const events = [...CORRECT_EVENTS];
    const locks = new Set<number>();
    reorderWithLocks(events, 0, 5, locks);

    expect(events[0]).toEqual(CORRECT_EVENTS[0]);
  });
});

describe('timelineReducer — REORDER_EVENTS', () => {
  it('moves an event when game is playing and revealPhase is idle', () => {
    const state = makePlayingState();
    const originalFirst = state.eventOrder[0];
    const newState = timelineReducer(
      state,
      { type: 'REORDER_EVENTS', payload: { from: 0, to: 5 } },
      CONTENT
    );

    expect(newState.eventOrder[5]).toEqual(originalFirst);
    expect(newState.eventOrder).toHaveLength(6);
  });

  it('does not change state when gameStatus is not playing', () => {
    const state: TimelineState = { ...makePlayingState(), gameStatus: 'won' };
    const newState = timelineReducer(
      state,
      { type: 'REORDER_EVENTS', payload: { from: 0, to: 1 } },
      CONTENT
    );

    expect(newState).toBe(state);
  });

  it('does not change state when revealPhase is revealing', () => {
    const state: TimelineState = { ...makePlayingState(), revealPhase: 'revealing' };
    const newState = timelineReducer(
      state,
      { type: 'REORDER_EVENTS', payload: { from: 0, to: 1 } },
      CONTENT
    );

    expect(newState).toBe(state);
  });

  it('does not move a locked item', () => {
    const state: TimelineState = {
      ...makePlayingState(),
      lockedIndices: new Set([0]),
    };
    const originalOrder = [...state.eventOrder];
    const newState = timelineReducer(
      state,
      { type: 'REORDER_EVENTS', payload: { from: 0, to: 3 } },
      CONTENT
    );

    expect(newState.eventOrder).toEqual(originalOrder);
  });

  it('does not move an event to a locked position', () => {
    const state: TimelineState = {
      ...makePlayingState(),
      lockedIndices: new Set([3]),
    };
    const originalOrder = [...state.eventOrder];
    const newState = timelineReducer(
      state,
      { type: 'REORDER_EVENTS', payload: { from: 0, to: 3 } },
      CONTENT
    );

    expect(newState.eventOrder).toEqual(originalOrder);
  });
});

describe('timelineReducer — SUBMIT (all correct)', () => {
  it('sets gameStatus to won when all events are in correct order', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.gameStatus).toBe('won');
  });

  it('sets revealPhase to revealing on win', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.revealPhase).toBe('revealing');
  });

  it('locks all six indices on win', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.lockedIndices).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });

  it('calculates 5 points for first-attempt win', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.score?.points).toBe(5);
    expect(newState.score?.label).toBe('Perfect Timeline');
  });

  it('calculates 4 points for second-attempt win', () => {
    // Simulate one failed attempt first
    const afterFirst = timelineReducer(makePlayingState(SHUFFLED_EVENTS), { type: 'SUBMIT' }, CONTENT);
    const afterReveal: TimelineState = { ...afterFirst, revealPhase: 'idle' };
    // Now submit with correct order
    const state: TimelineState = { ...afterReveal, eventOrder: CORRECT_EVENTS };
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.score?.points).toBe(4);
  });

  it('sets lastAttemptResults to all-true on win', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.lastAttemptResults).toEqual([true, true, true, true, true, true]);
  });

  it('increments attemptCount on win', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.attemptCount).toBe(1);
  });
});

describe('timelineReducer — SUBMIT (partial correct)', () => {
  it('stays playing when not all events are correct', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.gameStatus).toBe('playing');
  });

  it('increments attemptCount on partial correct submission', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.attemptCount).toBe(1);
  });

  it('sets revealPhase to revealing on partial correct submission', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.revealPhase).toBe('revealing');
  });

  it('sets lastAttemptResults with correct booleans for each position', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.lastAttemptResults).toHaveLength(6);
    expect(newState.lastAttemptResults.every((r) => typeof r === 'boolean')).toBe(true);
  });

  it('does not set a score when the game is still in progress', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.score).toBeNull();
  });
});

describe('timelineReducer — SUBMIT guards', () => {
  it('returns unchanged state when content is null', () => {
    const state = makePlayingState(CORRECT_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, null);

    expect(newState).toBe(state);
  });

  it('returns unchanged state when gameStatus is not playing', () => {
    const state: TimelineState = { ...makePlayingState(CORRECT_EVENTS), gameStatus: 'won' };
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState).toBe(state);
  });

  it('returns unchanged state when revealPhase is revealing', () => {
    const state: TimelineState = {
      ...makePlayingState(CORRECT_EVENTS),
      revealPhase: 'revealing',
    };
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState).toBe(state);
  });
});

describe('timelineReducer — SUBMIT first attempt tracking', () => {
  it('sets firstAttemptResults on the first submission', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'SUBMIT' }, CONTENT);

    expect(newState.firstAttemptResults).toHaveLength(6);
    expect(newState.firstAttemptResults.every((r) => typeof r === 'boolean')).toBe(true);
  });

  it('preserves firstAttemptResults on subsequent submissions', () => {
    // First attempt (wrong)
    const afterFirst = timelineReducer(makePlayingState(SHUFFLED_EVENTS), { type: 'SUBMIT' }, CONTENT);
    const firstResults = afterFirst.firstAttemptResults;

    // Second attempt — reset revealPhase to allow submission
    const beforeSecond: TimelineState = { ...afterFirst, revealPhase: 'idle' };
    const afterSecond = timelineReducer(beforeSecond, { type: 'SUBMIT' }, CONTENT);

    expect(afterSecond.firstAttemptResults).toEqual(firstResults);
  });

  it('updates lastAttemptResults independently from firstAttemptResults', () => {
    // First attempt with shuffled (wrong) order
    const afterFirst = timelineReducer(makePlayingState(SHUFFLED_EVENTS), { type: 'SUBMIT' }, CONTENT);

    // Second attempt with correct order
    const beforeSecond: TimelineState = {
      ...afterFirst,
      revealPhase: 'idle',
      eventOrder: CORRECT_EVENTS,
    };
    const afterSecond = timelineReducer(beforeSecond, { type: 'SUBMIT' }, CONTENT);

    expect(afterSecond.lastAttemptResults).toEqual([true, true, true, true, true, true]);
    // firstAttemptResults must not be all-true (first attempt was with SHUFFLED)
    expect(afterSecond.firstAttemptResults.every(Boolean)).toBe(false);
  });
});

describe('timelineReducer — REVEAL_COMPLETE (under max attempts)', () => {
  it('sets revealPhase to idle', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: 2,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.revealPhase).toBe('idle');
  });

  it('leaves gameStatus as playing when attempts are below the limit', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: 3,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.gameStatus).toBe('playing');
  });

  it('does not transition to lost when content is null', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: MAX_TIMELINE_ATTEMPTS,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, null);

    expect(newState.gameStatus).toBe('playing');
    expect(newState.revealPhase).toBe('idle');
  });
});

describe('timelineReducer — REVEAL_COMPLETE (at max attempts)', () => {
  it('sets gameStatus to lost after exhausting all attempts', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: MAX_TIMELINE_ATTEMPTS,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.gameStatus).toBe('lost');
  });

  it('sets revealPhase to idle after game over', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: MAX_TIMELINE_ATTEMPTS,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.revealPhase).toBe('idle');
  });

  it('shows the correct event order after game over', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: MAX_TIMELINE_ATTEMPTS,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.eventOrder).toEqual(CORRECT_EVENTS);
  });

  it('locks all indices after game over', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: MAX_TIMELINE_ATTEMPTS,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.lockedIndices).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });

  it('sets score to 0 points on loss', () => {
    const state: TimelineState = {
      ...makePlayingState(SHUFFLED_EVENTS),
      revealPhase: 'revealing',
      attemptCount: MAX_TIMELINE_ATTEMPTS,
    };
    const newState = timelineReducer(state, { type: 'REVEAL_COMPLETE' }, CONTENT);

    expect(newState.score?.points).toBe(0);
  });
});

describe('timelineReducer — GIVE_UP', () => {
  it('sets gameStatus to gave_up', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, CONTENT);

    expect(newState.gameStatus).toBe('gave_up');
  });

  it('sets score to 0 points', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, CONTENT);

    expect(newState.score?.points).toBe(0);
  });

  it('replaces eventOrder with the correct order', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, CONTENT);

    expect(newState.eventOrder).toEqual(CORRECT_EVENTS);
  });

  it('locks all six indices', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, CONTENT);

    expect(newState.lockedIndices).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });

  it('sets revealPhase to idle', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, CONTENT);

    expect(newState.revealPhase).toBe('idle');
  });
});

describe('timelineReducer — GIVE_UP guards', () => {
  it('returns unchanged state when gameStatus is not playing', () => {
    const state: TimelineState = { ...makePlayingState(), gameStatus: 'won' };
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, CONTENT);

    expect(newState).toBe(state);
  });

  it('returns unchanged state when content is null', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'GIVE_UP' }, null);

    expect(newState).toBe(state);
  });
});

describe('timelineReducer — SET_ATTEMPT_ID', () => {
  it('sets the attemptId on the state', () => {
    const state = makePlayingState();
    const newState = timelineReducer(
      state,
      { type: 'SET_ATTEMPT_ID', payload: 'uuid-abc-123' },
      CONTENT
    );

    expect(newState.attemptId).toBe('uuid-abc-123');
  });

  it('sets startedAt when it was previously null', () => {
    const state: TimelineState = { ...makePlayingState(), startedAt: null };
    const newState = timelineReducer(
      state,
      { type: 'SET_ATTEMPT_ID', payload: 'uuid-abc-123' },
      CONTENT
    );

    expect(newState.startedAt).not.toBeNull();
    expect(typeof newState.startedAt).toBe('string');
  });

  it('preserves existing startedAt when already set', () => {
    const existingTimestamp = '2026-01-01T00:00:00.000Z';
    const state: TimelineState = { ...makePlayingState(), startedAt: existingTimestamp };
    const newState = timelineReducer(
      state,
      { type: 'SET_ATTEMPT_ID', payload: 'uuid-abc-123' },
      CONTENT
    );

    expect(newState.startedAt).toBe(existingTimestamp);
  });
});

describe('timelineReducer — ATTEMPT_SAVED', () => {
  it('sets attemptSaved to true', () => {
    const state: TimelineState = { ...makePlayingState(), attemptSaved: false };
    const newState = timelineReducer(state, { type: 'ATTEMPT_SAVED' }, CONTENT);

    expect(newState.attemptSaved).toBe(true);
  });

  it('does not affect other state fields', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'ATTEMPT_SAVED' }, CONTENT);

    expect(newState.gameStatus).toBe(state.gameStatus);
    expect(newState.attemptCount).toBe(state.attemptCount);
    expect(newState.eventOrder).toEqual(state.eventOrder);
  });
});

describe('timelineReducer — RESET_GAME', () => {
  it('returns a fresh state with gameStatus playing', () => {
    const wonState: TimelineState = {
      ...makePlayingState(CORRECT_EVENTS),
      gameStatus: 'won',
      attemptCount: 1,
      score: calculateTimelineScore(1, true),
    };
    const newState = timelineReducer(wonState, { type: 'RESET_GAME' }, CONTENT);

    expect(newState.gameStatus).toBe('playing');
  });

  it('resets attemptCount to 0', () => {
    const state: TimelineState = { ...makePlayingState(), attemptCount: 3 };
    const newState = timelineReducer(state, { type: 'RESET_GAME' }, CONTENT);

    expect(newState.attemptCount).toBe(0);
  });

  it('resets score to null', () => {
    const state: TimelineState = {
      ...makePlayingState(),
      score: calculateTimelineScore(2, true),
    };
    const newState = timelineReducer(state, { type: 'RESET_GAME' }, CONTENT);

    expect(newState.score).toBeNull();
  });

  it('resets lockedIndices to an empty set', () => {
    const state: TimelineState = {
      ...makePlayingState(),
      lockedIndices: new Set([0, 1, 2, 3, 4, 5]),
    };
    const newState = timelineReducer(state, { type: 'RESET_GAME' }, CONTENT);

    expect(newState.lockedIndices.size).toBe(0);
  });

  it('populates eventOrder with 6 events', () => {
    const state = makePlayingState(SHUFFLED_EVENTS);
    const newState = timelineReducer(state, { type: 'RESET_GAME' }, CONTENT);

    expect(newState.eventOrder).toHaveLength(6);
  });

  it('returns unchanged state when content is null', () => {
    const state = makePlayingState();
    const newState = timelineReducer(state, { type: 'RESET_GAME' }, null);

    expect(newState).toBe(state);
  });
});

describe('timelineReducer — RESTORE_PROGRESS', () => {
  it('restores attemptId and startedAt', () => {
    const state = makePlayingState();
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 2,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [0, 1],
          firstAttemptCorrect: 3,
        },
      },
      CONTENT
    );

    expect(newState.attemptId).toBe('restored-uuid');
    expect(newState.startedAt).toBe('2026-01-15T12:00:00.000Z');
  });

  it('restores attemptCount', () => {
    const state = makePlayingState();
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 2,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [],
          firstAttemptCorrect: 0,
        },
      },
      CONTENT
    );

    expect(newState.attemptCount).toBe(2);
  });

  it('restores eventOrder', () => {
    const state = makePlayingState();
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 1,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [],
          firstAttemptCorrect: 0,
        },
      },
      CONTENT
    );

    expect(newState.eventOrder).toEqual(SHUFFLED_EVENTS);
  });

  it('restores lockedIndices as a Set', () => {
    const state = makePlayingState();
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 2,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [0, 1],
          firstAttemptCorrect: 2,
        },
      },
      CONTENT
    );

    expect(newState.lockedIndices).toBeInstanceOf(Set);
    expect(newState.lockedIndices).toEqual(new Set([0, 1]));
  });

  it('reconstructs firstAttemptResults from firstAttemptCorrect count', () => {
    const state = makePlayingState();
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 1,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [],
          firstAttemptCorrect: 3,
        },
      },
      CONTENT
    );

    // First 3 should be true, last 3 false
    expect(newState.firstAttemptResults).toEqual([true, true, true, false, false, false]);
  });

  it('sets gameStatus back to playing', () => {
    const state: TimelineState = { ...makePlayingState(), gameStatus: 'lost' };
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 2,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [],
          firstAttemptCorrect: 0,
        },
      },
      CONTENT
    );

    expect(newState.gameStatus).toBe('playing');
  });

  it('resets lastAttemptResults to empty array', () => {
    const state: TimelineState = {
      ...makePlayingState(),
      lastAttemptResults: [true, false, true, false, true, false],
    };
    const newState = timelineReducer(
      state,
      {
        type: 'RESTORE_PROGRESS',
        payload: {
          attemptId: 'restored-uuid',
          startedAt: '2026-01-15T12:00:00.000Z',
          attemptCount: 1,
          eventOrder: SHUFFLED_EVENTS,
          lockedIndices: [],
          firstAttemptCorrect: 0,
        },
      },
      CONTENT
    );

    expect(newState.lastAttemptResults).toEqual([]);
  });
});

describe('createInitialState', () => {
  it('creates state with the provided events as eventOrder', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.eventOrder).toEqual(SHUFFLED_EVENTS);
  });

  it('starts with gameStatus playing', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.gameStatus).toBe('playing');
  });

  it('starts with zero attempts', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.attemptCount).toBe(0);
  });

  it('starts with empty lockedIndices set', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.lockedIndices).toBeInstanceOf(Set);
    expect(state.lockedIndices.size).toBe(0);
  });

  it('starts with null score', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.score).toBeNull();
  });

  it('starts with null attemptId', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.attemptId).toBeNull();
  });

  it('starts with attemptSaved false', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.attemptSaved).toBe(false);
  });

  it('starts with revealPhase idle', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.revealPhase).toBe('idle');
  });

  it('starts with empty firstAttemptResults', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.firstAttemptResults).toEqual([]);
  });

  it('starts with empty lastAttemptResults', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.lastAttemptResults).toEqual([]);
  });

  it('starts with null startedAt', () => {
    const state = createInitialState(SHUFFLED_EVENTS);

    expect(state.startedAt).toBeNull();
  });
});
