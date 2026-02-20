import { describe, it, expect } from "vitest";
import {
  connectionsReducer,
  shuffleArray,
  checkGuess,
  type ConnectionsState,
} from "../ConnectionsGame";

// ============================================================================
// TEST DATA
// ============================================================================

const testGroups = [
  {
    category: "Cat A",
    difficulty: "yellow" as const,
    players: ["P1", "P2", "P3", "P4"] as [string, string, string, string],
  },
  {
    category: "Cat B",
    difficulty: "green" as const,
    players: ["P5", "P6", "P7", "P8"] as [string, string, string, string],
  },
  {
    category: "Cat C",
    difficulty: "blue" as const,
    players: ["P9", "P10", "P11", "P12"] as [string, string, string, string],
  },
  {
    category: "Cat D",
    difficulty: "purple" as const,
    players: ["P13", "P14", "P15", "P16"] as [string, string, string, string],
  },
];

const makeState = (overrides?: Partial<ConnectionsState>): ConnectionsState => ({
  selectedPlayers: [],
  solvedGroups: [],
  remainingPlayers: [
    "P1", "P2", "P3", "P4",
    "P5", "P6", "P7", "P8",
    "P9", "P10", "P11", "P12",
    "P13", "P14", "P15", "P16",
  ],
  mistakes: 0,
  guesses: [],
  gameStatus: "playing",
  lastGuessResult: null,
  revealingGroup: null,
  ...overrides,
});

// ============================================================================
// shuffleArray
// ============================================================================

describe("shuffleArray", () => {
  it("returns array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(arr.length);
  });

  it("contains all original elements", () => {
    const arr = ["P1", "P2", "P3", "P4", "P5"];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual([...arr].sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });
});

// ============================================================================
// checkGuess
// ============================================================================

describe("checkGuess", () => {
  it("correct 4/4 match returns { correct: true, matchedGroup }", () => {
    const result = checkGuess(["P1", "P2", "P3", "P4"], testGroups, []);
    expect(result.correct).toBe(true);
    expect(result.matchedGroup?.category).toBe("Cat A");
  });

  it("3/4 match (one away) returns { correct: false, matchCount: 3 }", () => {
    const result = checkGuess(["P1", "P2", "P3", "P5"], testGroups, []);
    expect(result.correct).toBe(false);
    expect(result.matchCount).toBe(3);
  });

  it("2/4 match returns { correct: false, matchCount: 2 }", () => {
    const result = checkGuess(["P1", "P2", "P5", "P6"], testGroups, []);
    expect(result.correct).toBe(false);
    expect(result.matchCount).toBe(2);
  });

  it("skips already-solved groups", () => {
    // Cat A is solved — selecting all 4 of its players should not match
    const solvedGroups = [testGroups[0]]; // Cat A solved
    const result = checkGuess(["P1", "P2", "P3", "P4"], testGroups, solvedGroups);
    expect(result.correct).toBe(false);
  });
});

// ============================================================================
// connectionsReducer
// ============================================================================

describe("connectionsReducer", () => {
  it("TOGGLE_PLAYER selects a player", () => {
    const state = makeState();
    const next = connectionsReducer(state, { type: "TOGGLE_PLAYER", payload: "P1" });
    expect(next.selectedPlayers).toContain("P1");
  });

  it("TOGGLE_PLAYER deselects an already-selected player", () => {
    const state = makeState({ selectedPlayers: ["P1"] });
    const next = connectionsReducer(state, { type: "TOGGLE_PLAYER", payload: "P1" });
    expect(next.selectedPlayers).not.toContain("P1");
  });

  it("TOGGLE_PLAYER max 4 — selecting 5th player is a no-op", () => {
    const state = makeState({ selectedPlayers: ["P1", "P2", "P3", "P4"] });
    const next = connectionsReducer(state, { type: "TOGGLE_PLAYER", payload: "P5" });
    expect(next.selectedPlayers).toHaveLength(4);
    expect(next.selectedPlayers).not.toContain("P5");
  });

  it("TOGGLE_PLAYER when not playing is a no-op", () => {
    const state = makeState({ gameStatus: "won" });
    const next = connectionsReducer(state, { type: "TOGGLE_PLAYER", payload: "P1" });
    expect(next.selectedPlayers).toHaveLength(0);
  });

  it("SUBMIT_GUESS correct match updates solvedGroups, clears selection, updates remaining", () => {
    const state = makeState({ selectedPlayers: ["P1", "P2", "P3", "P4"] });
    const next = connectionsReducer(state, { type: "SUBMIT_GUESS", groups: testGroups });
    expect(next.solvedGroups).toHaveLength(1);
    expect(next.solvedGroups[0].category).toBe("Cat A");
    expect(next.selectedPlayers).toHaveLength(0);
    expect(next.remainingPlayers).not.toContain("P1");
    expect(next.remainingPlayers).not.toContain("P4");
  });

  it("SUBMIT_GUESS all 4 groups solved sets gameStatus to won", () => {
    const state = makeState({
      selectedPlayers: ["P13", "P14", "P15", "P16"],
      solvedGroups: [testGroups[0], testGroups[1], testGroups[2]],
      remainingPlayers: ["P13", "P14", "P15", "P16"],
    });
    const next = connectionsReducer(state, { type: "SUBMIT_GUESS", groups: testGroups });
    expect(next.gameStatus).toBe("won");
  });

  it("SUBMIT_GUESS incorrect increments mistakes", () => {
    const state = makeState({ selectedPlayers: ["P1", "P2", "P3", "P9"] });
    const next = connectionsReducer(state, { type: "SUBMIT_GUESS", groups: testGroups });
    expect(next.mistakes).toBe(1);
    expect(next.gameStatus).toBe("playing");
  });

  it("SUBMIT_GUESS 3/4 match sets lastGuessResult to close and KEEPS selection", () => {
    // P1, P2, P3 are Cat A; P5 is Cat B — so 3/4 match for Cat A
    const state = makeState({ selectedPlayers: ["P1", "P2", "P3", "P5"] });
    const next = connectionsReducer(state, { type: "SUBMIT_GUESS", groups: testGroups });
    expect(next.lastGuessResult).toBe("close");
    expect(next.selectedPlayers).toEqual(["P1", "P2", "P3", "P5"]);
  });

  it("SUBMIT_GUESS less than 3/4 match sets lastGuessResult to incorrect and clears selection", () => {
    // P1, P2 are Cat A; P5, P6 are Cat B — best is 2/4
    const state = makeState({ selectedPlayers: ["P1", "P2", "P5", "P6"] });
    const next = connectionsReducer(state, { type: "SUBMIT_GUESS", groups: testGroups });
    expect(next.lastGuessResult).toBe("incorrect");
    expect(next.selectedPlayers).toHaveLength(0);
  });

  it("SUBMIT_GUESS 4th mistake sets gameStatus to lost and reveals all unsolved groups", () => {
    const state = makeState({
      selectedPlayers: ["P1", "P2", "P5", "P6"],
      mistakes: 3,
    });
    const next = connectionsReducer(state, { type: "SUBMIT_GUESS", groups: testGroups });
    expect(next.gameStatus).toBe("lost");
    expect(next.solvedGroups).toHaveLength(4);
    expect(next.remainingPlayers).toHaveLength(0);
  });

  it("SHUFFLE_REMAINING reorders players", () => {
    // Run many times to confirm it can produce a different order
    const state = makeState();
    const original = [...state.remainingPlayers];
    let shuffled = false;
    for (let i = 0; i < 20; i++) {
      const next = connectionsReducer(state, { type: "SHUFFLE_REMAINING" });
      if (next.remainingPlayers.join(",") !== original.join(",")) {
        shuffled = true;
        break;
      }
    }
    // Also verify all players are still present
    const next = connectionsReducer(state, { type: "SHUFFLE_REMAINING" });
    expect(next.remainingPlayers.sort()).toEqual([...original].sort());
    expect(shuffled).toBe(true);
  });

  it("DESELECT_ALL clears selectedPlayers", () => {
    const state = makeState({ selectedPlayers: ["P1", "P2", "P3"] });
    const next = connectionsReducer(state, { type: "DESELECT_ALL" });
    expect(next.selectedPlayers).toHaveLength(0);
  });

  it("GIVE_UP reveals all unsolved groups and sets gameStatus to lost", () => {
    const state = makeState({
      solvedGroups: [testGroups[0]],
      remainingPlayers: ["P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12", "P13", "P14", "P15", "P16"],
    });
    const next = connectionsReducer(state, { type: "GIVE_UP", groups: testGroups });
    expect(next.gameStatus).toBe("lost");
    expect(next.solvedGroups).toHaveLength(4);
    expect(next.remainingPlayers).toHaveLength(0);
    expect(next.selectedPlayers).toHaveLength(0);
  });

  it("CLEAR_FEEDBACK nulls lastGuessResult and revealingGroup", () => {
    const state = makeState({
      lastGuessResult: "close",
      revealingGroup: testGroups[0],
    });
    const next = connectionsReducer(state, { type: "CLEAR_FEEDBACK" });
    expect(next.lastGuessResult).toBeNull();
    expect(next.revealingGroup).toBeNull();
  });
});
