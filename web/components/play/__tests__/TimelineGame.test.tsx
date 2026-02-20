import { describe, it, expect } from "vitest";
import {
  timelineReducer,
  shuffleArray,
  checkOrder,
  reorderWithLocks,
  calculateTimelineScore,
  type TimelineState,
  type TimelineEvent,
} from "../TimelineGame";

// ============================================================================
// Test Data
// ============================================================================

const CORRECT_ORDER: TimelineEvent[] = [
  { text: "Joined Sporting CP academy", year: 2001 },
  { text: "Signed for Manchester United", year: 2003 },
  { text: "Won Champions League", year: 2008 },
  { text: "Transferred to Real Madrid", year: 2009 },
  { text: "Won first Ballon d'Or at Madrid", year: 2014 },
  { text: "Moved to Juventus", year: 2018 },
];

// A shuffled order for testing (index 0 and 5 swapped, etc.)
const SHUFFLED_ORDER: TimelineEvent[] = [
  CORRECT_ORDER[5],
  CORRECT_ORDER[2],
  CORRECT_ORDER[0],
  CORRECT_ORDER[4],
  CORRECT_ORDER[1],
  CORRECT_ORDER[3],
];

const makeState = (overrides?: Partial<TimelineState>): TimelineState => ({
  eventOrder: [...SHUFFLED_ORDER],
  correctOrder: CORRECT_ORDER,
  lockedIndices: new Set(),
  attemptCount: 0,
  firstAttemptResults: [],
  lastAttemptResults: [],
  revealPhase: "idle",
  gameStatus: "playing",
  ...overrides,
});

// ============================================================================
// shuffleArray
// ============================================================================

describe("shuffleArray", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    expect(shuffleArray(arr)).toHaveLength(6);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });
});

// ============================================================================
// checkOrder
// ============================================================================

describe("checkOrder", () => {
  it("returns all true when order matches", () => {
    const results = checkOrder(CORRECT_ORDER, CORRECT_ORDER);
    expect(results).toEqual([true, true, true, true, true, true]);
  });

  it("returns all false when order is fully reversed", () => {
    const reversed = [...CORRECT_ORDER].reverse();
    const results = checkOrder(reversed, CORRECT_ORDER);
    expect(results).toEqual([false, false, false, false, false, false]);
  });

  it("returns mixed results for partial correctness", () => {
    const partial = [
      CORRECT_ORDER[0],
      CORRECT_ORDER[2], // wrong
      CORRECT_ORDER[2], // wrong position but same event
      CORRECT_ORDER[3],
      CORRECT_ORDER[4],
      CORRECT_ORDER[5],
    ];
    const results = checkOrder(partial, CORRECT_ORDER);
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(false);
    expect(results[3]).toBe(true);
    expect(results[4]).toBe(true);
    expect(results[5]).toBe(true);
  });

  it("returns an array of length 6", () => {
    const results = checkOrder(SHUFFLED_ORDER, CORRECT_ORDER);
    expect(results).toHaveLength(6);
  });
});

// ============================================================================
// reorderWithLocks
// ============================================================================

describe("reorderWithLocks", () => {
  it("moves an item from one index to another", () => {
    const events = [...CORRECT_ORDER];
    const result = reorderWithLocks(events, 0, 2, new Set());
    expect(result[0]).toEqual(CORRECT_ORDER[1]);
    expect(result[2]).toEqual(CORRECT_ORDER[0]);
  });

  it("returns same array when source index is locked", () => {
    const events = [...CORRECT_ORDER];
    const result = reorderWithLocks(events, 0, 2, new Set([0]));
    expect(result).toBe(events);
  });

  it("returns same array when destination index is locked", () => {
    const events = [...CORRECT_ORDER];
    const result = reorderWithLocks(events, 0, 2, new Set([2]));
    expect(result).toBe(events);
  });

  it("moves correctly when no indices are locked", () => {
    const events = [...CORRECT_ORDER];
    const result = reorderWithLocks(events, 5, 0, new Set());
    expect(result[0]).toEqual(CORRECT_ORDER[5]);
    expect(result[1]).toEqual(CORRECT_ORDER[0]);
  });

  it("does not mutate the original array", () => {
    const events = [...CORRECT_ORDER];
    const copy = [...events];
    reorderWithLocks(events, 0, 2, new Set());
    expect(events).toEqual(copy);
  });
});

// ============================================================================
// calculateTimelineScore
// ============================================================================

describe("calculateTimelineScore", () => {
  it("returns 5 points for 1 attempt", () => {
    expect(calculateTimelineScore(1, true)).toEqual({ points: 5, label: "Perfect Timeline" });
  });

  it("returns 4 points for 2 attempts", () => {
    expect(calculateTimelineScore(2, true)).toEqual({ points: 4, label: "World Class" });
  });

  it("returns 3 points for 3 attempts", () => {
    expect(calculateTimelineScore(3, true)).toEqual({ points: 3, label: "Expert" });
  });

  it("returns 2 points for 4 attempts", () => {
    expect(calculateTimelineScore(4, true)).toEqual({ points: 2, label: "Promising" });
  });

  it("returns 1 point for 5 attempts", () => {
    expect(calculateTimelineScore(5, true)).toEqual({ points: 1, label: "Rookie" });
  });

  it("returns 0 points when lost", () => {
    expect(calculateTimelineScore(5, false)).toEqual({ points: 0, label: "" });
  });

  it("returns 0 points when lost with fewer attempts", () => {
    expect(calculateTimelineScore(3, false)).toEqual({ points: 0, label: "" });
  });
});

// ============================================================================
// timelineReducer — REORDER_EVENTS
// ============================================================================

describe("timelineReducer — REORDER_EVENTS", () => {
  it("moves an event from one position to another", () => {
    const state = makeState();
    const next = timelineReducer(state, {
      type: "REORDER_EVENTS",
      payload: { from: 0, to: 2 },
    });
    expect(next.eventOrder[2]).toEqual(SHUFFLED_ORDER[0]);
  });

  it("is a no-op when gameStatus is not playing", () => {
    const state = makeState({ gameStatus: "won" });
    const next = timelineReducer(state, {
      type: "REORDER_EVENTS",
      payload: { from: 0, to: 2 },
    });
    expect(next).toBe(state);
  });

  it("is a no-op when revealPhase is revealing", () => {
    const state = makeState({ revealPhase: "revealing" });
    const next = timelineReducer(state, {
      type: "REORDER_EVENTS",
      payload: { from: 0, to: 2 },
    });
    expect(next).toBe(state);
  });

  it("is a no-op when source index is locked", () => {
    const state = makeState({ lockedIndices: new Set([0]) });
    const next = timelineReducer(state, {
      type: "REORDER_EVENTS",
      payload: { from: 0, to: 2 },
    });
    expect(next.eventOrder).toBe(state.eventOrder);
  });

  it("is a no-op when destination index is locked", () => {
    const state = makeState({ lockedIndices: new Set([2]) });
    const next = timelineReducer(state, {
      type: "REORDER_EVENTS",
      payload: { from: 0, to: 2 },
    });
    expect(next.eventOrder).toBe(state.eventOrder);
  });
});

// ============================================================================
// timelineReducer — SUBMIT (all correct)
// ============================================================================

describe("timelineReducer — SUBMIT (all correct)", () => {
  it("sets gameStatus to won", () => {
    const state = makeState({ eventOrder: [...CORRECT_ORDER] });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.gameStatus).toBe("won");
  });

  it("sets revealPhase to revealing", () => {
    const state = makeState({ eventOrder: [...CORRECT_ORDER] });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.revealPhase).toBe("revealing");
  });

  it("locks all 6 indices", () => {
    const state = makeState({ eventOrder: [...CORRECT_ORDER] });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.lockedIndices).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });

  it("increments attemptCount", () => {
    const state = makeState({ eventOrder: [...CORRECT_ORDER], attemptCount: 0 });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.attemptCount).toBe(1);
  });

  it("records firstAttemptResults on first attempt", () => {
    const state = makeState({ eventOrder: [...CORRECT_ORDER], attemptCount: 0 });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.firstAttemptResults).toEqual([true, true, true, true, true, true]);
  });

  it("records lastAttemptResults", () => {
    const state = makeState({ eventOrder: [...CORRECT_ORDER] });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.lastAttemptResults).toEqual([true, true, true, true, true, true]);
  });
});

// ============================================================================
// timelineReducer — SUBMIT (partial correct)
// ============================================================================

describe("timelineReducer — SUBMIT (partial correct)", () => {
  it("stays in playing state", () => {
    const state = makeState();
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.gameStatus).toBe("playing");
  });

  it("increments attemptCount", () => {
    const state = makeState({ attemptCount: 2 });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.attemptCount).toBe(3);
  });

  it("sets revealPhase to revealing", () => {
    const state = makeState();
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.revealPhase).toBe("revealing");
  });

  it("records lastAttemptResults with mixed correctness", () => {
    const state = makeState();
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.lastAttemptResults).toHaveLength(6);
    // shuffled order won't match correct order, so at least some should be false
    expect(next.lastAttemptResults).toContain(false);
  });

  it("records firstAttemptResults only on first attempt", () => {
    const state = makeState({ attemptCount: 0 });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next.firstAttemptResults).toHaveLength(6);

    // Second attempt should not overwrite firstAttemptResults
    const next2 = timelineReducer(next, { type: "REVEAL_COMPLETE" });
    const next3 = timelineReducer(next2, { type: "SUBMIT" });
    expect(next3.firstAttemptResults).toEqual(next.firstAttemptResults);
  });
});

// ============================================================================
// timelineReducer — SUBMIT guards
// ============================================================================

describe("timelineReducer — SUBMIT guards", () => {
  it("is a no-op when gameStatus is not playing", () => {
    const state = makeState({ gameStatus: "won" });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next).toBe(state);
  });

  it("is a no-op when revealPhase is revealing", () => {
    const state = makeState({ revealPhase: "revealing" });
    const next = timelineReducer(state, { type: "SUBMIT" });
    expect(next).toBe(state);
  });
});

// ============================================================================
// timelineReducer — REVEAL_COMPLETE
// ============================================================================

describe("timelineReducer — REVEAL_COMPLETE", () => {
  it("sets revealPhase to idle", () => {
    const state = makeState({ revealPhase: "revealing" });
    const next = timelineReducer(state, { type: "REVEAL_COMPLETE" });
    expect(next.revealPhase).toBe("idle");
  });

  it("stays in playing when under attempt limit", () => {
    const state = makeState({ revealPhase: "revealing", attemptCount: 3 });
    const next = timelineReducer(state, { type: "REVEAL_COMPLETE" });
    expect(next.gameStatus).toBe("playing");
  });

  it("sets gameStatus to lost at 5 attempts", () => {
    const state = makeState({ revealPhase: "revealing", attemptCount: 5 });
    const next = timelineReducer(state, { type: "REVEAL_COMPLETE" });
    expect(next.gameStatus).toBe("lost");
  });

  it("shows correct order on loss", () => {
    const state = makeState({ revealPhase: "revealing", attemptCount: 5 });
    const next = timelineReducer(state, { type: "REVEAL_COMPLETE" });
    expect(next.eventOrder).toEqual(CORRECT_ORDER);
  });

  it("locks all indices on loss", () => {
    const state = makeState({ revealPhase: "revealing", attemptCount: 5 });
    const next = timelineReducer(state, { type: "REVEAL_COMPLETE" });
    expect(next.lockedIndices).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });
});

// ============================================================================
// timelineReducer — GIVE_UP
// ============================================================================

describe("timelineReducer — GIVE_UP", () => {
  it("sets gameStatus to lost", () => {
    const state = makeState();
    const next = timelineReducer(state, { type: "GIVE_UP" });
    expect(next.gameStatus).toBe("lost");
  });

  it("shows correct order", () => {
    const state = makeState();
    const next = timelineReducer(state, { type: "GIVE_UP" });
    expect(next.eventOrder).toEqual(CORRECT_ORDER);
  });

  it("locks all indices", () => {
    const state = makeState();
    const next = timelineReducer(state, { type: "GIVE_UP" });
    expect(next.lockedIndices).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });

  it("is a no-op when not playing", () => {
    const state = makeState({ gameStatus: "won" });
    const next = timelineReducer(state, { type: "GIVE_UP" });
    expect(next).toBe(state);
  });
});
