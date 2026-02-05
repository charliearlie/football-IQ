import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCareerPathDefaults,
  getTransferGuessDefaults,
  getGoalscorerRecallDefaults,
  getTheGridDefaults,
  getTopicalQuizDefaults,
  getTopTensDefaults,
  getStartingXIDefaults,
  getDefaultContent,
  defaultValuesMap,
  getFormationPositions,
  getDefaultPlayersForFormation,
  FORMATION_POSITIONS,
} from "../puzzle-defaults";
import {
  startingXIContentSchema,
} from "../puzzle-schemas";
import { GAME_MODES } from "@/lib/constants";

// Mock crypto.randomUUID for consistent test results
beforeEach(() => {
  let counter = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => `test-uuid-${++counter}`);
});

// ============================================================================
// INDIVIDUAL DEFAULT FUNCTIONS
// ============================================================================

describe("getCareerPathDefaults", () => {
  it("returns object with answer and career_steps", () => {
    const defaults = getCareerPathDefaults();
    expect(defaults).toHaveProperty("answer");
    expect(defaults).toHaveProperty("career_steps");
  });

  it("returns empty answer", () => {
    const defaults = getCareerPathDefaults();
    expect(defaults.answer).toBe("");
  });

  it("returns 3 initial career steps", () => {
    const defaults = getCareerPathDefaults();
    expect(defaults.career_steps).toHaveLength(3);
  });

  it("career steps have correct structure", () => {
    const defaults = getCareerPathDefaults();
    defaults.career_steps.forEach((step) => {
      expect(step).toHaveProperty("type", "club");
      expect(step).toHaveProperty("text", "");
      expect(step).toHaveProperty("year", "");
      expect(step).toHaveProperty("apps", null);
      expect(step).toHaveProperty("goals", null);
    });
  });
});

describe("getTransferGuessDefaults", () => {
  it("returns all required fields", () => {
    const defaults = getTransferGuessDefaults();
    expect(defaults).toHaveProperty("answer", "");
    expect(defaults).toHaveProperty("from_club", "");
    expect(defaults).toHaveProperty("to_club", "");
    expect(defaults).toHaveProperty("fee", "");
    expect(defaults).toHaveProperty("hints");
  });

  it("returns exactly 3 empty hints", () => {
    const defaults = getTransferGuessDefaults();
    expect(defaults.hints).toHaveLength(3);
    expect(defaults.hints).toEqual(["", "", ""]);
  });
});

describe("getGoalscorerRecallDefaults", () => {
  it("returns all required fields", () => {
    const defaults = getGoalscorerRecallDefaults();
    expect(defaults).toHaveProperty("home_team", "");
    expect(defaults).toHaveProperty("away_team", "");
    expect(defaults).toHaveProperty("home_score", 0);
    expect(defaults).toHaveProperty("away_score", 0);
    expect(defaults).toHaveProperty("competition", "");
    expect(defaults).toHaveProperty("match_date", "");
    expect(defaults).toHaveProperty("goals");
  });

  it("returns one default goal entry", () => {
    const defaults = getGoalscorerRecallDefaults();
    expect(defaults.goals).toHaveLength(1);
    expect(defaults.goals[0]).toEqual({
      scorer: "",
      minute: 1,
      team: "home",
      isOwnGoal: false,
    });
  });
});

describe("getTheGridDefaults", () => {
  it("returns 3x3 axis structure", () => {
    const defaults = getTheGridDefaults();
    expect(defaults.xAxis).toHaveLength(3);
    expect(defaults.yAxis).toHaveLength(3);
  });

  it("has club type for x-axis by default", () => {
    const defaults = getTheGridDefaults();
    defaults.xAxis.forEach((cat) => {
      expect(cat.type).toBe("club");
      expect(cat.value).toBe("");
    });
  });

  it("has nation type for y-axis by default", () => {
    const defaults = getTheGridDefaults();
    defaults.yAxis.forEach((cat) => {
      expect(cat.type).toBe("nation");
      expect(cat.value).toBe("");
    });
  });

  it("has valid_answers for all 9 cells", () => {
    const defaults = getTheGridDefaults();
    expect(Object.keys(defaults.valid_answers)).toHaveLength(9);
    for (let i = 0; i < 9; i++) {
      expect(defaults.valid_answers[String(i)]).toEqual([]);
    }
  });
});

describe("getTopicalQuizDefaults", () => {
  it("returns exactly 5 questions", () => {
    const defaults = getTopicalQuizDefaults();
    expect(defaults.questions).toHaveLength(5);
  });

  it("each question has unique ID", () => {
    const defaults = getTopicalQuizDefaults();
    const ids = defaults.questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it("each question has correct structure", () => {
    const defaults = getTopicalQuizDefaults();
    defaults.questions.forEach((q) => {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("question", "");
      expect(q).toHaveProperty("options");
      expect(q).toHaveProperty("correctIndex", 0);
      expect(q).toHaveProperty("imageUrl", "");
      expect(q.options).toHaveLength(4);
      expect(q.options).toEqual(["", "", "", ""]);
    });
  });
});

describe("getTopTensDefaults", () => {
  it("returns empty title", () => {
    const defaults = getTopTensDefaults();
    expect(defaults.title).toBe("");
  });

  it("returns empty category", () => {
    const defaults = getTopTensDefaults();
    expect(defaults.category).toBe("");
  });

  it("returns exactly 10 answers", () => {
    const defaults = getTopTensDefaults();
    expect(defaults.answers).toHaveLength(10);
  });

  it("each answer has correct structure", () => {
    const defaults = getTopTensDefaults();
    defaults.answers.forEach((a) => {
      expect(a).toHaveProperty("name", "");
      expect(a).toHaveProperty("aliases");
      expect(a).toHaveProperty("info", "");
      expect(a.aliases).toEqual([]);
    });
  });
});

describe("getStartingXIDefaults", () => {
  it("returns all required fields", () => {
    const defaults = getStartingXIDefaults();
    expect(defaults).toHaveProperty("match_name", "");
    expect(defaults).toHaveProperty("competition", "");
    expect(defaults).toHaveProperty("match_date", "");
    expect(defaults).toHaveProperty("formation", "4-3-3");
    expect(defaults).toHaveProperty("team", "");
    expect(defaults).toHaveProperty("players");
  });

  it("returns exactly 11 players", () => {
    const defaults = getStartingXIDefaults();
    expect(defaults.players).toHaveLength(11);
  });

  it("returns correct positions for 4-3-3", () => {
    const defaults = getStartingXIDefaults();
    const positions = defaults.players.map((p) => p.position_key);
    expect(positions).toEqual([
      "GK",
      "RB",
      "RCB",
      "LCB",
      "LB",
      "RCM",
      "CM",
      "LCM",
      "RW",
      "ST",
      "LW",
    ]);
  });

  it("each player has correct structure", () => {
    const defaults = getStartingXIDefaults();
    defaults.players.forEach((p) => {
      expect(p).toHaveProperty("position_key");
      expect(p).toHaveProperty("player_name", "");
      expect(p).toHaveProperty("is_hidden", false);
      expect(p).toHaveProperty("override_x", null);
      expect(p).toHaveProperty("override_y", null);
    });
  });
});

// ============================================================================
// DEFAULT VALUES MAP
// ============================================================================

describe("defaultValuesMap", () => {
  it("has entry for all game modes", () => {
    GAME_MODES.forEach((mode) => {
      expect(defaultValuesMap).toHaveProperty(mode);
      expect(typeof defaultValuesMap[mode]).toBe("function");
    });
  });

  it("career_path and career_path_pro return same structure", () => {
    const careerPath = defaultValuesMap.career_path();
    const careerPathPro = defaultValuesMap.career_path_pro();
    expect(Object.keys(careerPath as object)).toEqual(Object.keys(careerPathPro as object));
  });
});

// ============================================================================
// getDefaultContent
// ============================================================================

describe("getDefaultContent", () => {
  it("returns correct defaults for each mode", () => {
    expect(getDefaultContent("career_path")).toEqual(getCareerPathDefaults());
    expect(getDefaultContent("the_grid")).toEqual(getTheGridDefaults());
    expect(getDefaultContent("guess_the_transfer")).toEqual(getTransferGuessDefaults());
    expect(getDefaultContent("guess_the_goalscorers")).toEqual(getGoalscorerRecallDefaults());
    // For topical_quiz, we can't use toEqual because of UUID generation
    const quizDefaults = getDefaultContent("topical_quiz") as { questions: Array<{ id: string }> };
    expect(quizDefaults.questions).toHaveLength(5);
    expect(getDefaultContent("top_tens")).toEqual(getTopTensDefaults());
    expect(getDefaultContent("starting_xi")).toEqual(getStartingXIDefaults());
  });

  // Test that defaults pass their respective schemas
  // This is critical for ensuring the editor works correctly
  describe("schema compatibility", () => {
    // Helper to test defaults pass schema (ignoring required empty fields)
    // Note: Defaults have empty strings which fail validation intentionally
    // This tests structure, not complete validity

    it("career_path defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("career_path");
      expect(defaults).toHaveProperty("answer");
      expect(defaults).toHaveProperty("career_steps");
      const typed = defaults as { career_steps: unknown[] };
      expect(typed.career_steps.length).toBeGreaterThanOrEqual(3);
    });

    it("career_path_pro defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("career_path_pro");
      expect(defaults).toHaveProperty("answer");
      expect(defaults).toHaveProperty("career_steps");
    });

    it("the_grid defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("the_grid");
      expect(defaults).toHaveProperty("xAxis");
      expect(defaults).toHaveProperty("yAxis");
      expect(defaults).toHaveProperty("valid_answers");
    });

    it("guess_the_transfer defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("guess_the_transfer");
      expect(defaults).toHaveProperty("answer");
      expect(defaults).toHaveProperty("from_club");
      expect(defaults).toHaveProperty("to_club");
      expect(defaults).toHaveProperty("fee");
      expect(defaults).toHaveProperty("hints");
    });

    it("guess_the_goalscorers defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("guess_the_goalscorers");
      expect(defaults).toHaveProperty("home_team");
      expect(defaults).toHaveProperty("away_team");
      expect(defaults).toHaveProperty("home_score");
      expect(defaults).toHaveProperty("away_score");
      expect(defaults).toHaveProperty("competition");
      expect(defaults).toHaveProperty("goals");
    });

    it("topical_quiz defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("topical_quiz") as { questions: unknown[] };
      expect(defaults).toHaveProperty("questions");
      expect(defaults.questions).toHaveLength(5);
    });

    it("top_tens defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("top_tens") as { answers: unknown[] };
      expect(defaults).toHaveProperty("title");
      expect(defaults).toHaveProperty("answers");
      expect(defaults.answers).toHaveLength(10);
    });

    it("starting_xi defaults have correct structure for schema", () => {
      const defaults = getDefaultContent("starting_xi") as { players: unknown[] };
      expect(defaults).toHaveProperty("match_name");
      expect(defaults).toHaveProperty("formation");
      expect(defaults).toHaveProperty("team");
      expect(defaults).toHaveProperty("players");
      expect(defaults.players).toHaveLength(11);
    });
  });
});

// ============================================================================
// FORMATION HELPERS
// ============================================================================

describe("FORMATION_POSITIONS", () => {
  it("defines positions for all standard formations", () => {
    const formations = [
      "4-3-3",
      "4-2-3-1",
      "4-4-2",
      "4-4-1-1",
      "3-5-2",
      "3-4-3",
      "5-3-2",
      "5-4-1",
      "4-1-4-1",
      "4-3-2-1",
    ];
    formations.forEach((f) => {
      expect(FORMATION_POSITIONS).toHaveProperty(f);
      expect(FORMATION_POSITIONS[f]).toHaveLength(11);
    });
  });

  it("all formations start with GK", () => {
    Object.values(FORMATION_POSITIONS).forEach((positions) => {
      expect(positions[0]).toBe("GK");
    });
  });

  it("4-3-3 has correct positions", () => {
    expect(FORMATION_POSITIONS["4-3-3"]).toEqual([
      "GK",
      "RB",
      "RCB",
      "LCB",
      "LB",
      "RCM",
      "CM",
      "LCM",
      "RW",
      "ST",
      "LW",
    ]);
  });
});

describe("getFormationPositions", () => {
  it("returns positions for valid formation", () => {
    const positions = getFormationPositions("4-4-2");
    expect(positions).toHaveLength(11);
    expect(positions).toEqual(FORMATION_POSITIONS["4-4-2"]);
  });

  it("falls back to 4-3-3 for unknown formation", () => {
    const positions = getFormationPositions("10-0-0");
    expect(positions).toEqual(FORMATION_POSITIONS["4-3-3"]);
  });
});

describe("getDefaultPlayersForFormation", () => {
  it("returns 11 players for any formation", () => {
    const formations = ["4-3-3", "4-2-3-1", "3-5-2"];
    formations.forEach((f) => {
      const players = getDefaultPlayersForFormation(f);
      expect(players).toHaveLength(11);
    });
  });

  it("returns correct positions for 4-2-3-1", () => {
    const players = getDefaultPlayersForFormation("4-2-3-1");
    const positions = players.map((p) => p.position_key);
    expect(positions).toEqual(FORMATION_POSITIONS["4-2-3-1"]);
  });

  it("each player has correct default structure", () => {
    const players = getDefaultPlayersForFormation("4-3-3");
    players.forEach((p) => {
      expect(p.player_name).toBe("");
      expect(p.is_hidden).toBe(false);
      expect(p.override_x).toBeNull();
      expect(p.override_y).toBeNull();
    });
  });

  it("returns valid starting XI structure", () => {
    const players = getDefaultPlayersForFormation("4-3-3");
    const content = {
      match_name: "Test Match",
      competition: "Test",
      match_date: "2024-01-01",
      formation: "4-3-3",
      team: "Test Team",
      players: players.map((p) => ({ ...p, player_name: "Test Player" })),
    };
    expect(() => startingXIContentSchema.parse(content)).not.toThrow();
  });
});
