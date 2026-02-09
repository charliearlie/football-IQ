/**
 * Tests for The Chain game hook logic.
 * TDD: These tests define the expected state management behavior.
 */

import {
  TheChainState,
  TheChainAction,
  ChainLink,
  ChainPlayer,
  createInitialState,
  parseTheChainContent,
} from "../types/theChain.types";
import { calculateChainScore } from "../utils/scoring";

// --- Reducer function extracted for testing ---
// Note: This matches the reducer in useTheChainGame.ts
function theChainReducer(
  state: TheChainState,
  action: TheChainAction
): TheChainState {
  switch (action.type) {
    case "OPEN_SEARCH":
      if (state.gameStatus !== "playing") return state;
      return { ...state, isSearchOpen: true, lastLinkInvalid: false };

    case "CLOSE_SEARCH":
      return { ...state, isSearchOpen: false };

    case "START_VALIDATION":
      return { ...state, isValidating: true, lastLinkInvalid: false };

    case "VALID_LINK":
      return {
        ...state,
        chain: [...state.chain, action.payload.link],
        isSearchOpen: false,
        isValidating: false,
        lastLinkInvalid: false,
        showSuccessBurst: true,
        burstOrigin: action.payload.burstOrigin ?? null,
      };

    case "INVALID_LINK":
      return { ...state, isValidating: false, lastLinkInvalid: true };

    case "CLEAR_INVALID":
      return { ...state, lastLinkInvalid: false };

    case "GAME_COMPLETE":
      return {
        ...state,
        gameStatus: "complete",
        score: action.payload,
        isSearchOpen: false,
      };

    case "GIVE_UP":
      return {
        ...state,
        gameStatus: "gave_up",
        score: action.payload,
        isSearchOpen: false,
      };

    case "SET_ATTEMPT_ID":
      return { ...state, attemptId: action.payload };

    case "RESTORE_PROGRESS":
      return {
        ...state,
        chain: action.payload.chain,
        attemptId: action.payload.attemptId,
      };

    case "MARK_ATTEMPT_SAVED":
      return { ...state, attemptSaved: true };

    case "CLEAR_SUCCESS_BURST":
      return { ...state, showSuccessBurst: false, burstOrigin: null };

    case "RESET_GAME":
      return createInitialState(action.payload);

    default:
      return state;
  }
}

// Test fixtures
const mockStartPlayer: ChainPlayer = {
  qid: "Q11571",
  name: "Cristiano Ronaldo",
  nationality_code: "PT",
};

const mockEndPlayer: ChainPlayer = {
  qid: "Q615",
  name: "Lionel Messi",
  nationality_code: "AR",
};

const mockLink: ChainLink = {
  player: { qid: "Q12345", name: "Wayne Rooney", nationality_code: "GB-ENG" },
  shared_club_name: "Manchester United",
  shared_club_id: "Q18656",
  overlap_start: 2004,
  overlap_end: 2009,
};

describe("createInitialState", () => {
  it("creates initial state with start player in chain", () => {
    const state = createInitialState(mockStartPlayer);

    expect(state.chain).toHaveLength(1);
    expect(state.chain[0].player).toEqual(mockStartPlayer);
    expect(state.chain[0].shared_club_name).toBe("");
    expect(state.gameStatus).toBe("playing");
    expect(state.score).toBeNull();
    expect(state.isSearchOpen).toBe(false);
    expect(state.lastLinkInvalid).toBe(false);
    expect(state.isValidating).toBe(false);
    expect(state.attemptId).toBeNull();
    expect(state.attemptSaved).toBe(false);
    expect(state.showSuccessBurst).toBe(false);
    expect(state.burstOrigin).toBeNull();
  });
});

describe("theChainReducer", () => {
  describe("OPEN_SEARCH action", () => {
    it("opens search overlay when game is playing", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, { type: "OPEN_SEARCH" });

      expect(newState.isSearchOpen).toBe(true);
      expect(newState.lastLinkInvalid).toBe(false);
    });

    it("clears invalid state when opening search", () => {
      const state = { ...createInitialState(mockStartPlayer), lastLinkInvalid: true };
      const newState = theChainReducer(state, { type: "OPEN_SEARCH" });

      expect(newState.lastLinkInvalid).toBe(false);
    });

    it("does not open search when game is complete", () => {
      const state: TheChainState = {
        ...createInitialState(mockStartPlayer),
        gameStatus: "complete",
      };
      const newState = theChainReducer(state, { type: "OPEN_SEARCH" });

      expect(newState.isSearchOpen).toBe(false);
    });

    it("does not open search when game is gave_up", () => {
      const state: TheChainState = {
        ...createInitialState(mockStartPlayer),
        gameStatus: "gave_up",
      };
      const newState = theChainReducer(state, { type: "OPEN_SEARCH" });

      expect(newState.isSearchOpen).toBe(false);
    });
  });

  describe("CLOSE_SEARCH action", () => {
    it("closes search overlay", () => {
      const state = { ...createInitialState(mockStartPlayer), isSearchOpen: true };
      const newState = theChainReducer(state, { type: "CLOSE_SEARCH" });

      expect(newState.isSearchOpen).toBe(false);
    });
  });

  describe("START_VALIDATION action", () => {
    it("sets validating state to true", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, { type: "START_VALIDATION" });

      expect(newState.isValidating).toBe(true);
      expect(newState.lastLinkInvalid).toBe(false);
    });
  });

  describe("VALID_LINK action", () => {
    it("adds link to chain", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: mockLink },
      });

      expect(newState.chain).toHaveLength(2);
      expect(newState.chain[1]).toEqual(mockLink);
    });

    it("closes search and clears validation state", () => {
      const state = {
        ...createInitialState(mockStartPlayer),
        isSearchOpen: true,
        isValidating: true,
      };
      const newState = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: mockLink },
      });

      expect(newState.isSearchOpen).toBe(false);
      expect(newState.isValidating).toBe(false);
      expect(newState.lastLinkInvalid).toBe(false);
    });

    it("triggers success burst", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: mockLink },
      });

      expect(newState.showSuccessBurst).toBe(true);
    });

    it("sets burst origin when provided", () => {
      const state = createInitialState(mockStartPlayer);
      const origin = { x: 100, y: 200 };
      const newState = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: mockLink, burstOrigin: origin },
      });

      expect(newState.burstOrigin).toEqual(origin);
    });

    it("builds chain with multiple links", () => {
      let state = createInitialState(mockStartPlayer);

      // Add first link
      state = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: mockLink },
      });

      // Add second link
      const secondLink: ChainLink = {
        player: { qid: "Q999", name: "David Beckham" },
        shared_club_name: "Real Madrid",
        overlap_start: 2003,
        overlap_end: 2007,
      };
      state = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: secondLink },
      });

      expect(state.chain).toHaveLength(3);
      expect(state.chain[0].player.name).toBe("Cristiano Ronaldo");
      expect(state.chain[1].player.name).toBe("Wayne Rooney");
      expect(state.chain[2].player.name).toBe("David Beckham");
    });
  });

  describe("INVALID_LINK action", () => {
    it("sets invalid state and clears validation", () => {
      const state = { ...createInitialState(mockStartPlayer), isValidating: true };
      const newState = theChainReducer(state, { type: "INVALID_LINK" });

      expect(newState.lastLinkInvalid).toBe(true);
      expect(newState.isValidating).toBe(false);
    });

    it("does not modify chain", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, { type: "INVALID_LINK" });

      expect(newState.chain).toHaveLength(1);
    });
  });

  describe("CLEAR_INVALID action", () => {
    it("clears invalid state", () => {
      const state = { ...createInitialState(mockStartPlayer), lastLinkInvalid: true };
      const newState = theChainReducer(state, { type: "CLEAR_INVALID" });

      expect(newState.lastLinkInvalid).toBe(false);
    });
  });

  describe("GAME_COMPLETE action", () => {
    it("sets game status to complete", () => {
      const state = createInitialState(mockStartPlayer);
      const score = calculateChainScore(4, 5, true);
      const newState = theChainReducer(state, {
        type: "GAME_COMPLETE",
        payload: score,
      });

      expect(newState.gameStatus).toBe("complete");
      expect(newState.score).toEqual(score);
      expect(newState.isSearchOpen).toBe(false);
    });
  });

  describe("GIVE_UP action", () => {
    it("sets game status to gave_up", () => {
      const state = createInitialState(mockStartPlayer);
      const score = calculateChainScore(0, 5, false);
      const newState = theChainReducer(state, {
        type: "GIVE_UP",
        payload: score,
      });

      expect(newState.gameStatus).toBe("gave_up");
      expect(newState.score).toEqual(score);
      expect(newState.score?.label).toBe("Did Not Finish");
      expect(newState.isSearchOpen).toBe(false);
    });
  });

  describe("SET_ATTEMPT_ID action", () => {
    it("sets attempt ID", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, {
        type: "SET_ATTEMPT_ID",
        payload: "test-uuid-123",
      });

      expect(newState.attemptId).toBe("test-uuid-123");
    });
  });

  describe("RESTORE_PROGRESS action", () => {
    it("restores chain from saved state", () => {
      const state = createInitialState(mockStartPlayer);
      const savedChain: ChainLink[] = [
        state.chain[0],
        mockLink,
        {
          player: { qid: "Q999", name: "David Beckham" },
          shared_club_name: "Real Madrid",
          overlap_start: 2003,
          overlap_end: 2007,
        },
      ];

      const newState = theChainReducer(state, {
        type: "RESTORE_PROGRESS",
        payload: { chain: savedChain, attemptId: "saved-uuid" },
      });

      expect(newState.chain).toHaveLength(3);
      expect(newState.attemptId).toBe("saved-uuid");
    });
  });

  describe("MARK_ATTEMPT_SAVED action", () => {
    it("marks attempt as saved", () => {
      const state = createInitialState(mockStartPlayer);
      const newState = theChainReducer(state, { type: "MARK_ATTEMPT_SAVED" });

      expect(newState.attemptSaved).toBe(true);
    });
  });

  describe("CLEAR_SUCCESS_BURST action", () => {
    it("clears success burst state", () => {
      const state = {
        ...createInitialState(mockStartPlayer),
        showSuccessBurst: true,
        burstOrigin: { x: 100, y: 200 },
      };
      const newState = theChainReducer(state, { type: "CLEAR_SUCCESS_BURST" });

      expect(newState.showSuccessBurst).toBe(false);
      expect(newState.burstOrigin).toBeNull();
    });
  });

  describe("RESET_GAME action", () => {
    it("resets to initial state with new start player", () => {
      let state = createInitialState(mockStartPlayer);
      state = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link: mockLink },
      });

      const newStartPlayer: ChainPlayer = { qid: "Q999", name: "New Player" };
      const newState = theChainReducer(state, {
        type: "RESET_GAME",
        payload: newStartPlayer,
      });

      expect(newState.chain).toHaveLength(1);
      expect(newState.chain[0].player.name).toBe("New Player");
      expect(newState.gameStatus).toBe("playing");
    });
  });
});

describe("parseTheChainContent", () => {
  it("parses valid content", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 5,
    };
    const result = parseTheChainContent(content);

    expect(result).not.toBeNull();
    expect(result?.start_player.name).toBe("Cristiano Ronaldo");
    expect(result?.end_player.name).toBe("Lionel Messi");
    expect(result?.par).toBe(5);
  });

  it("parses content with nationality codes", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo", nationality_code: "PT" },
      end_player: { qid: "Q615", name: "Lionel Messi", nationality_code: "AR" },
      par: 5,
    };
    const result = parseTheChainContent(content);

    expect(result?.start_player.nationality_code).toBe("PT");
    expect(result?.end_player.nationality_code).toBe("AR");
  });

  it("parses content with solution_path", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 3,
      solution_path: [
        { qid: "Q11571", name: "Cristiano Ronaldo" },
        { qid: "Q12345", name: "Wayne Rooney" },
        { qid: "Q615", name: "Lionel Messi" },
      ],
    };
    const result = parseTheChainContent(content);

    expect(result?.solution_path).toHaveLength(3);
    expect(result?.solution_path?.[1].name).toBe("Wayne Rooney");
  });

  it("parses content with hint_player", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 5,
      hint_player: { qid: "Q12345", name: "Wayne Rooney" },
    };
    const result = parseTheChainContent(content);

    expect(result?.hint_player?.name).toBe("Wayne Rooney");
  });

  it("returns null for null content", () => {
    expect(parseTheChainContent(null)).toBeNull();
  });

  it("returns null for undefined content", () => {
    expect(parseTheChainContent(undefined)).toBeNull();
  });

  it("returns null for non-object content", () => {
    expect(parseTheChainContent("string")).toBeNull();
    expect(parseTheChainContent(123)).toBeNull();
    expect(parseTheChainContent([])).toBeNull();
  });

  it("returns null for missing start_player", () => {
    const content = {
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 5,
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for missing end_player", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      par: 5,
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for missing par", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for invalid par (0)", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 0,
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for invalid par (negative)", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: -1,
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for invalid par (string)", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: "five",
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for invalid start_player (missing qid)", () => {
    const content = {
      start_player: { name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 5,
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("returns null for invalid start_player (missing name)", () => {
    const content = {
      start_player: { qid: "Q11571" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 5,
    };
    expect(parseTheChainContent(content)).toBeNull();
  });

  it("ignores invalid hint_player", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 5,
      hint_player: { name: "Invalid" }, // Missing qid
    };
    const result = parseTheChainContent(content);

    expect(result).not.toBeNull();
    expect(result?.hint_player).toBeUndefined();
  });

  it("filters invalid entries from solution_path", () => {
    const content = {
      start_player: { qid: "Q11571", name: "Cristiano Ronaldo" },
      end_player: { qid: "Q615", name: "Lionel Messi" },
      par: 3,
      solution_path: [
        { qid: "Q11571", name: "Cristiano Ronaldo" },
        { name: "Invalid" }, // Missing qid
        { qid: "Q615", name: "Lionel Messi" },
      ],
    };
    const result = parseTheChainContent(content);

    expect(result?.solution_path).toHaveLength(2);
  });
});

describe("Step counting logic", () => {
  it("calculates 0 steps for start player only", () => {
    const state = createInitialState(mockStartPlayer);
    const stepsTaken = state.chain.length - 1;
    expect(stepsTaken).toBe(0);
  });

  it("calculates 1 step after first link", () => {
    let state = createInitialState(mockStartPlayer);
    state = theChainReducer(state, {
      type: "VALID_LINK",
      payload: { link: mockLink },
    });
    const stepsTaken = state.chain.length - 1;
    expect(stepsTaken).toBe(1);
  });

  it("calculates 3 steps after three links", () => {
    let state = createInitialState(mockStartPlayer);

    // Add three links
    for (let i = 0; i < 3; i++) {
      const link: ChainLink = {
        player: { qid: `Q${i}`, name: `Player ${i}` },
        shared_club_name: "Some Club",
        overlap_start: 2000 + i,
        overlap_end: 2005 + i,
      };
      state = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link },
      });
    }

    const stepsTaken = state.chain.length - 1;
    expect(stepsTaken).toBe(3);
  });
});

describe("Score calculation integration", () => {
  it("calculates Birdie score for 4 steps on par 5", () => {
    let state = createInitialState(mockStartPlayer);

    // Add 4 links to reach 4 steps
    for (let i = 0; i < 4; i++) {
      const link: ChainLink = {
        player: { qid: `Q${i}`, name: `Player ${i}` },
        shared_club_name: "Some Club",
        overlap_start: 2000,
        overlap_end: 2005,
      };
      state = theChainReducer(state, {
        type: "VALID_LINK",
        payload: { link },
      });
    }

    const stepsTaken = state.chain.length - 1;
    expect(stepsTaken).toBe(4);

    const score = calculateChainScore(stepsTaken, 5, true);
    expect(score.label).toBe("Birdie");
    expect(score.points).toBe(6);
  });

  it("calculates DNF score on give up", () => {
    const state = createInitialState(mockStartPlayer);
    const stepsTaken = state.chain.length - 1;

    const score = calculateChainScore(stepsTaken, 5, false);
    expect(score.label).toBe("Did Not Finish");
    expect(score.points).toBe(0);
    expect(score.completed).toBe(false);
  });
});
