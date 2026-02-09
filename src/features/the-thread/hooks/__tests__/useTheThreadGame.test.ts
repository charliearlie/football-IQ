/**
 * Tests for The Thread Game Hook
 *
 * Test Scenarios:
 * 1. Initial state and content parsing
 * 2. Correct guess (score based on hints revealed, not guess count)
 * 3. Multiple incorrect guesses (guesses are free)
 * 4. Give up functionality
 * 5. Hint reveal (REVEAL_HINT action)
 * 6. Persistence (SET_ATTEMPT_ID, RESTORE_PROGRESS, ATTEMPT_SAVED)
 * 7. Kit lore availability after game ends
 */

import {
  TheThreadState,
  TheThreadAction,
  TheThreadContent,
  createInitialState,
  parseTheThreadContent,
} from "../../types/theThread.types";
import { calculateThreadScore } from "../../utils/scoring";
import { UnifiedClub } from "@/services/club/types";

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockClubCorrect: UnifiedClub = {
  id: "Q18656",
  name: "Manchester United",
  primary_color: "#DA291C",
  secondary_color: "#FFE500",
  source: "local",
  relevance_score: 1.0,
  match_type: "name",
};

const mockClubWrong: UnifiedClub = {
  id: "Q9617",
  name: "Arsenal",
  primary_color: "#EF0107",
  secondary_color: "#FFFFFF",
  source: "local",
  relevance_score: 1.0,
  match_type: "name",
};

const mockClubWrong2: UnifiedClub = {
  id: "Q9616",
  name: "Chelsea",
  primary_color: "#034694",
  secondary_color: "#FFFFFF",
  source: "local",
  relevance_score: 1.0,
  match_type: "name",
};

const mockSponsorContent: TheThreadContent = {
  thread_type: "sponsor",
  path: [
    { brand_name: "Sharp", years: "1982-2000" },
    { brand_name: "Vodafone", years: "2000-2006" },
    { brand_name: "AIG", years: "2006-2010" },
  ],
  correct_club_id: "Q18656",
  correct_club_name: "Manchester United",
  kit_lore: {
    fun_fact:
      "Manchester United were pioneers in shirt sponsorship deals in English football.",
  },
};

const mockSupplierContent: TheThreadContent = {
  thread_type: "supplier",
  path: [
    { brand_name: "Adidas", years: "1980-1992" },
    { brand_name: "Umbro", years: "1992-2000" },
    { brand_name: "Nike", years: "2000-" },
  ],
  correct_club_id: "Q9617",
  correct_club_name: "Arsenal",
  kit_lore: {
    fun_fact: "Arsenal wore Adidas for over a decade before switching to Nike.",
  },
};

// =============================================================================
// REDUCER (matches implementation in useTheThreadGame.ts)
// =============================================================================

function theThreadReducer(
  state: TheThreadState,
  action: TheThreadAction
): TheThreadState {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { club, isCorrect } = action.payload;
      const newGuesses = [...state.guesses, club];

      if (isCorrect) {
        const score = calculateThreadScore(newGuesses.length, true, state.hintsRevealed);
        return {
          ...state,
          guesses: newGuesses,
          gameStatus: "won",
          score,
          lastGuessIncorrect: false,
        };
      }

      return {
        ...state,
        guesses: newGuesses,
        lastGuessIncorrect: true,
      };
    }

    case "GIVE_UP": {
      const score = calculateThreadScore(state.guesses.length, false, state.hintsRevealed);
      return {
        ...state,
        gameStatus: "revealed",
        score,
      };
    }

    case "REVEAL_HINT":
      return {
        ...state,
        hintsRevealed: state.hintsRevealed + 1,
      };

    case "CLEAR_SHAKE":
      return { ...state, lastGuessIncorrect: false };

    case "SET_ATTEMPT_ID":
      return { ...state, attemptId: action.payload };

    case "RESTORE_PROGRESS": {
      const payload = action.payload;
      return {
        ...state,
        guesses: payload.guesses,
        attemptId: payload.attemptId,
        startedAt: payload.startedAt,
        hintsRevealed: payload.hintsRevealed ?? 0,
      };
    }

    case "ATTEMPT_SAVED":
      return { ...state, attemptSaved: true };

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

// =============================================================================
// TEST SUITE 1: Initial State
// =============================================================================

describe("createInitialState", () => {
  it("creates initial state with empty guesses array", () => {
    const state = createInitialState();
    expect(state.guesses).toEqual([]);
  });

  it("creates initial state with playing status", () => {
    const state = createInitialState();
    expect(state.gameStatus).toBe("playing");
  });

  it("creates initial state with null score", () => {
    const state = createInitialState();
    expect(state.score).toBeNull();
  });

  it("creates initial state with no shake animation", () => {
    const state = createInitialState();
    expect(state.lastGuessIncorrect).toBe(false);
  });

  it("creates initial state with null attemptId", () => {
    const state = createInitialState();
    expect(state.attemptId).toBeNull();
  });

  it("creates initial state with attemptSaved false", () => {
    const state = createInitialState();
    expect(state.attemptSaved).toBe(false);
  });

  it("creates initial state with valid startedAt timestamp", () => {
    const state = createInitialState();
    expect(state.startedAt).toBeDefined();
    expect(new Date(state.startedAt).getTime()).not.toBeNaN();
  });

  it("creates initial state with hintsRevealed 0", () => {
    const state = createInitialState();
    expect(state.hintsRevealed).toBe(0);
  });
});

// =============================================================================
// TEST SUITE 2: Content Parsing
// =============================================================================

describe("parseTheThreadContent", () => {
  describe("sponsor thread", () => {
    it("parses valid sponsor content", () => {
      const result = parseTheThreadContent(mockSponsorContent);
      expect(result).not.toBeNull();
      expect(result?.thread_type).toBe("sponsor");
    });

    it("returns path with all brands", () => {
      const result = parseTheThreadContent(mockSponsorContent);
      expect(result?.path).toHaveLength(3);
      expect(result?.path[0].brand_name).toBe("Sharp");
      expect(result?.path[0].years).toBe("1982-2000");
    });

    it("returns correct_club_id", () => {
      const result = parseTheThreadContent(mockSponsorContent);
      expect(result?.correct_club_id).toBe("Q18656");
    });

    it("returns correct_club_name for fallback validation", () => {
      const result = parseTheThreadContent(mockSponsorContent);
      expect(result?.correct_club_name).toBe("Manchester United");
    });

    it("returns kit_lore with fun_fact", () => {
      const result = parseTheThreadContent(mockSponsorContent);
      expect(result?.kit_lore.fun_fact).toBeDefined();
      expect(result?.kit_lore.fun_fact.length).toBeGreaterThan(0);
    });
  });

  describe("supplier thread", () => {
    it("parses valid supplier content", () => {
      const result = parseTheThreadContent(mockSupplierContent);
      expect(result).not.toBeNull();
      expect(result?.thread_type).toBe("supplier");
    });

    it("handles ongoing year format (YYYY-)", () => {
      const result = parseTheThreadContent(mockSupplierContent);
      expect(result?.path[2].years).toBe("2000-");
    });
  });

  describe("content with is_hidden brands", () => {
    it("parses brands with is_hidden field", () => {
      const contentWithHidden = {
        ...mockSponsorContent,
        path: [
          { brand_name: "Sharp", years: "1982-2000", is_hidden: false },
          { brand_name: "Vodafone", years: "2000-2006", is_hidden: true },
          { brand_name: "AIG", years: "2006-2010", is_hidden: true },
        ],
      };
      const result = parseTheThreadContent(contentWithHidden);
      expect(result).not.toBeNull();
      expect(result?.path[0].is_hidden).toBe(false);
      expect(result?.path[1].is_hidden).toBe(true);
    });

    it("accepts brands without is_hidden (backwards compat)", () => {
      const result = parseTheThreadContent(mockSponsorContent);
      expect(result).not.toBeNull();
    });
  });

  describe("invalid content", () => {
    it("returns null for null content", () => {
      expect(parseTheThreadContent(null)).toBeNull();
    });

    it("returns null for undefined content", () => {
      expect(parseTheThreadContent(undefined)).toBeNull();
    });

    it("returns null for non-object content", () => {
      expect(parseTheThreadContent("string")).toBeNull();
      expect(parseTheThreadContent(123)).toBeNull();
      expect(parseTheThreadContent([])).toBeNull();
    });

    it("returns null for path with fewer than 3 brands", () => {
      const invalid = {
        ...mockSponsorContent,
        path: [{ brand_name: "Nike", years: "2020-" }],
      };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for path with 2 brands", () => {
      const invalid = {
        ...mockSponsorContent,
        path: [
          { brand_name: "Nike", years: "2010-2020" },
          { brand_name: "Adidas", years: "2020-" },
        ],
      };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for missing correct_club_id", () => {
      const { correct_club_id, ...invalid } = mockSponsorContent;
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for empty correct_club_id", () => {
      const invalid = { ...mockSponsorContent, correct_club_id: "" };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for missing correct_club_name", () => {
      const { correct_club_name, ...invalid } = mockSponsorContent;
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for empty correct_club_name", () => {
      const invalid = { ...mockSponsorContent, correct_club_name: "" };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for missing kit_lore", () => {
      const { kit_lore, ...invalid } = mockSponsorContent;
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for empty kit_lore fun_fact", () => {
      const invalid = { ...mockSponsorContent, kit_lore: { fun_fact: "" } };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for invalid thread_type", () => {
      const invalid = { ...mockSponsorContent, thread_type: "manufacturer" };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for missing thread_type", () => {
      const { thread_type, ...invalid } = mockSponsorContent;
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for invalid brand in path (missing brand_name)", () => {
      const invalid = {
        ...mockSponsorContent,
        path: [
          { years: "1982-2000" }, // missing brand_name
          { brand_name: "Vodafone", years: "2000-2006" },
          { brand_name: "AIG", years: "2006-2010" },
        ],
      };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });

    it("returns null for invalid brand in path (empty brand_name)", () => {
      const invalid = {
        ...mockSponsorContent,
        path: [
          { brand_name: "", years: "1982-2000" },
          { brand_name: "Vodafone", years: "2000-2006" },
          { brand_name: "AIG", years: "2006-2010" },
        ],
      };
      expect(parseTheThreadContent(invalid)).toBeNull();
    });
  });
});

// =============================================================================
// TEST SUITE 3: Correct Guess (Score based on hints, not guesses)
// =============================================================================

describe("theThreadReducer - SUBMIT_GUESS (correct)", () => {
  describe("correct guess with 0 hints (Max Score = 10)", () => {
    it("sets gameStatus to won", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: { club: mockClubCorrect, isCorrect: true },
      });
      expect(newState.gameStatus).toBe("won");
    });

    it("adds club to guesses array", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: { club: mockClubCorrect, isCorrect: true },
      });
      expect(newState.guesses).toHaveLength(1);
      expect(newState.guesses[0].id).toBe("Q18656");
      expect(newState.guesses[0].name).toBe("Manchester United");
    });

    it("calculates score of 10 points with 0 hints", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: { club: mockClubCorrect, isCorrect: true },
      });
      expect(newState.score?.points).toBe(10);
      expect(newState.score?.maxPoints).toBe(10);
      expect(newState.score?.won).toBe(true);
      expect(newState.score?.hintsRevealed).toBe(0);
    });

    it("clears lastGuessIncorrect flag", () => {
      const state = { ...createInitialState(), lastGuessIncorrect: true };
      const newState = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: { club: mockClubCorrect, isCorrect: true },
      });
      expect(newState.lastGuessIncorrect).toBe(false);
    });
  });
});

// =============================================================================
// TEST SUITE 4: Incorrect Guesses (free, no scoring penalty)
// =============================================================================

describe("theThreadReducer - SUBMIT_GUESS (incorrect)", () => {
  it("keeps gameStatus as playing", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    expect(newState.gameStatus).toBe("playing");
  });

  it("adds club to guesses array", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    expect(newState.guesses).toHaveLength(1);
    expect(newState.guesses[0].id).toBe(mockClubWrong.id);
  });

  it("sets lastGuessIncorrect to true", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    expect(newState.lastGuessIncorrect).toBe(true);
  });

  it("does not set score", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    expect(newState.score).toBeNull();
  });

  it("accumulates multiple wrong guesses", () => {
    let state = createInitialState();

    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong2, isCorrect: false },
    });

    expect(state.guesses).toHaveLength(2);
    expect(state.guesses[0].id).toBe(mockClubWrong.id);
    expect(state.guesses[1].id).toBe(mockClubWrong2.id);
  });

  it("wrong guesses do not affect score (guesses are free)", () => {
    let state = createInitialState();
    // Make 5 wrong guesses
    for (let i = 0; i < 5; i++) {
      state = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: {
          club: { ...mockClubWrong, id: `Q${i}`, name: `Club ${i}` },
          isCorrect: false,
        },
      });
    }
    // Correct on 6th guess - still 10 pts because 0 hints revealed
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubCorrect, isCorrect: true },
    });
    expect(state.score?.points).toBe(10);
    expect(state.guesses).toHaveLength(6);
  });
});

// =============================================================================
// TEST SUITE 5: Hint Reveal + Scoring Interaction
// =============================================================================

describe("theThreadReducer - REVEAL_HINT and scoring", () => {
  it("increments hintsRevealed by 1", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, { type: "REVEAL_HINT" });
    expect(newState.hintsRevealed).toBe(1);
  });

  it("increments hintsRevealed multiple times", () => {
    let state = createInitialState();
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    expect(state.hintsRevealed).toBe(3);
  });

  it("scores 6 when winning after 1 hint", () => {
    let state = createInitialState();
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubCorrect, isCorrect: true },
    });
    expect(state.score?.points).toBe(6);
    expect(state.score?.hintsRevealed).toBe(1);
  });

  it("scores 4 when winning after 2 hints", () => {
    let state = createInitialState();
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubCorrect, isCorrect: true },
    });
    expect(state.score?.points).toBe(4);
    expect(state.score?.hintsRevealed).toBe(2);
  });

  it("scores 2 when winning after 3 hints", () => {
    let state = createInitialState();
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubCorrect, isCorrect: true },
    });
    expect(state.score?.points).toBe(2);
    expect(state.score?.hintsRevealed).toBe(3);
  });

  it("hints + wrong guesses: score depends only on hints", () => {
    let state = createInitialState();
    state = theThreadReducer(state, { type: "REVEAL_HINT" }); // 1 hint
    // 3 wrong guesses (should be free)
    for (let i = 0; i < 3; i++) {
      state = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: {
          club: { ...mockClubWrong, id: `Q${i}`, name: `Club ${i}` },
          isCorrect: false,
        },
      });
    }
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubCorrect, isCorrect: true },
    });
    expect(state.score?.points).toBe(6); // 1 hint = 6 pts, guesses irrelevant
    expect(state.guesses).toHaveLength(4);
  });
});

// =============================================================================
// TEST SUITE 6: Give Up Functionality
// =============================================================================

describe("theThreadReducer - GIVE_UP", () => {
  it("sets gameStatus to revealed", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, { type: "GIVE_UP" });
    expect(newState.gameStatus).toBe("revealed");
  });

  it("sets score with 0 points", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, { type: "GIVE_UP" });
    expect(newState.score?.points).toBe(0);
    expect(newState.score?.won).toBe(false);
  });

  it("preserves existing guesses", () => {
    let state = createInitialState();
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    state = theThreadReducer(state, { type: "GIVE_UP" });
    expect(state.guesses).toHaveLength(1);
    expect(state.guesses[0].id).toBe(mockClubWrong.id);
  });

  it("records guessCount in score", () => {
    let state = createInitialState();
    for (let i = 0; i < 3; i++) {
      state = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: {
          club: { ...mockClubWrong, id: `Q${i}`, name: `Club ${i}` },
          isCorrect: false,
        },
      });
    }
    state = theThreadReducer(state, { type: "GIVE_UP" });
    expect(state.score?.guessCount).toBe(3);
  });

  it("records hintsRevealed in score on give up", () => {
    let state = createInitialState();
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "GIVE_UP" });
    expect(state.score?.hintsRevealed).toBe(2);
    expect(state.score?.points).toBe(0);
  });

  it("works with no guesses (immediate give up)", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, { type: "GIVE_UP" });
    expect(newState.guesses).toHaveLength(0);
    expect(newState.score?.guessCount).toBe(0);
    expect(newState.score?.points).toBe(0);
    expect(newState.score?.won).toBe(false);
  });
});

// =============================================================================
// TEST SUITE 7: Persistence Actions
// =============================================================================

describe("theThreadReducer - persistence actions", () => {
  describe("SET_ATTEMPT_ID", () => {
    it("sets attemptId", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "SET_ATTEMPT_ID",
        payload: "test-uuid-123",
      });
      expect(newState.attemptId).toBe("test-uuid-123");
    });

    it("preserves other state", () => {
      let state = createInitialState();
      state = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: { club: mockClubWrong, isCorrect: false },
      });
      const newState = theThreadReducer(state, {
        type: "SET_ATTEMPT_ID",
        payload: "test-uuid-456",
      });
      expect(newState.attemptId).toBe("test-uuid-456");
      expect(newState.guesses).toHaveLength(1);
    });
  });

  describe("RESTORE_PROGRESS", () => {
    it("restores guesses from saved state", () => {
      const state = createInitialState();
      const savedGuesses: UnifiedClub[] = [mockClubWrong, mockClubWrong2];
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: savedGuesses,
          attemptId: "saved-uuid",
          startedAt: "2024-01-15T10:00:00.000Z",
        },
      });
      expect(newState.guesses).toHaveLength(2);
      expect(newState.guesses[0].id).toBe(mockClubWrong.id);
      expect(newState.guesses[1].id).toBe(mockClubWrong2.id);
    });

    it("restores attemptId", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: [],
          attemptId: "saved-uuid-789",
          startedAt: "2024-01-15T10:00:00.000Z",
        },
      });
      expect(newState.attemptId).toBe("saved-uuid-789");
    });

    it("restores startedAt timestamp", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: [],
          attemptId: "saved-uuid",
          startedAt: "2024-01-15T10:00:00.000Z",
        },
      });
      expect(newState.startedAt).toBe("2024-01-15T10:00:00.000Z");
    });

    it("restores hintsRevealed from payload", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: [mockClubWrong],
          attemptId: "saved-uuid",
          startedAt: "2024-01-15T10:00:00.000Z",
          hintsRevealed: 2,
        },
      });
      expect(newState.hintsRevealed).toBe(2);
    });

    it("defaults hintsRevealed to 0 when not in payload (backwards compat)", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: [],
          attemptId: "saved-uuid",
          startedAt: "2024-01-15T10:00:00.000Z",
        },
      });
      expect(newState.hintsRevealed).toBe(0);
    });

    it("keeps gameStatus as playing after restore", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: [mockClubWrong],
          attemptId: "saved-uuid",
          startedAt: "2024-01-15T10:00:00.000Z",
        },
      });
      expect(newState.gameStatus).toBe("playing");
    });

    it("keeps score as null after restore (game not complete)", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: {
          guesses: [mockClubWrong],
          attemptId: "saved-uuid",
          startedAt: "2024-01-15T10:00:00.000Z",
        },
      });
      expect(newState.score).toBeNull();
    });
  });

  describe("ATTEMPT_SAVED", () => {
    it("marks attempt as saved", () => {
      const state = createInitialState();
      const newState = theThreadReducer(state, { type: "ATTEMPT_SAVED" });
      expect(newState.attemptSaved).toBe(true);
    });

    it("preserves other state", () => {
      let state = createInitialState();
      state = theThreadReducer(state, {
        type: "SUBMIT_GUESS",
        payload: { club: mockClubCorrect, isCorrect: true },
      });
      const newState = theThreadReducer(state, { type: "ATTEMPT_SAVED" });
      expect(newState.attemptSaved).toBe(true);
      expect(newState.gameStatus).toBe("won");
      expect(newState.score?.points).toBe(10);
    });
  });
});

// =============================================================================
// TEST SUITE 8: UI State Management
// =============================================================================

describe("theThreadReducer - CLEAR_SHAKE", () => {
  it("clears lastGuessIncorrect flag", () => {
    const state = { ...createInitialState(), lastGuessIncorrect: true };
    const newState = theThreadReducer(state, { type: "CLEAR_SHAKE" });
    expect(newState.lastGuessIncorrect).toBe(false);
  });

  it("preserves other state when clearing shake", () => {
    let state = createInitialState();
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    const newState = theThreadReducer(state, { type: "CLEAR_SHAKE" });
    expect(newState.lastGuessIncorrect).toBe(false);
    expect(newState.guesses).toHaveLength(1);
  });
});

describe("theThreadReducer - RESET", () => {
  it("resets to initial state", () => {
    let state = createInitialState();
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    state = theThreadReducer(state, {
      type: "SET_ATTEMPT_ID",
      payload: "some-uuid",
    });
    state = theThreadReducer(state, { type: "REVEAL_HINT" });
    state = theThreadReducer(state, { type: "RESET" });
    expect(state.guesses).toEqual([]);
    expect(state.gameStatus).toBe("playing");
    expect(state.score).toBeNull();
    expect(state.attemptId).toBeNull();
    expect(state.attemptSaved).toBe(false);
    expect(state.hintsRevealed).toBe(0);
  });

  it("generates new startedAt timestamp on reset", () => {
    const originalState = createInitialState();
    const newState = theThreadReducer(originalState, { type: "RESET" });
    expect(new Date(newState.startedAt).getTime()).not.toBeNaN();
  });
});

// =============================================================================
// TEST SUITE 9: Kit Lore Availability
// =============================================================================

describe("kit_lore availability", () => {
  it("kit_lore is available from content when game ends with win", () => {
    const content = parseTheThreadContent(mockSponsorContent);
    let state = createInitialState();
    state = theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubCorrect, isCorrect: true },
    });

    expect(state.gameStatus).toBe("won");
    expect(content?.kit_lore.fun_fact).toBeDefined();
    expect(content?.kit_lore.fun_fact).toContain("Manchester United");
  });

  it("kit_lore is available from content when game ends with give up", () => {
    const content = parseTheThreadContent(mockSponsorContent);
    let state = createInitialState();
    state = theThreadReducer(state, { type: "GIVE_UP" });

    expect(state.gameStatus).toBe("revealed");
    expect(content?.kit_lore.fun_fact).toBeDefined();
  });

  it("kit_lore should NOT be shown while playing (UI responsibility)", () => {
    const content = parseTheThreadContent(mockSponsorContent);
    const state = createInitialState();

    expect(state.gameStatus).toBe("playing");
    expect(content?.kit_lore.fun_fact).toBeDefined();

    const canShowKitLore =
      state.gameStatus === "won" || state.gameStatus === "revealed";
    expect(canShowKitLore).toBe(false);
  });
});

// =============================================================================
// TEST SUITE 10: Edge Cases
// =============================================================================

describe("theThreadReducer - edge cases", () => {
  it("handles unknown action type gracefully", () => {
    const state = createInitialState();
    const newState = theThreadReducer(state, {
      type: "UNKNOWN_ACTION" as never,
    });
    expect(newState).toEqual(state);
  });

  it("does not mutate original state on SUBMIT_GUESS", () => {
    const state = createInitialState();
    const original = { ...state, guesses: [...state.guesses] };
    theThreadReducer(state, {
      type: "SUBMIT_GUESS",
      payload: { club: mockClubWrong, isCorrect: false },
    });
    expect(state.guesses).toEqual(original.guesses);
  });

  it("does not mutate original state on GIVE_UP", () => {
    const state = createInitialState();
    const original = { ...state };
    theThreadReducer(state, { type: "GIVE_UP" });
    expect(state.gameStatus).toEqual(original.gameStatus);
  });

  it("does not mutate original state on REVEAL_HINT", () => {
    const state = createInitialState();
    const original = state.hintsRevealed;
    theThreadReducer(state, { type: "REVEAL_HINT" });
    expect(state.hintsRevealed).toBe(original);
  });
});
