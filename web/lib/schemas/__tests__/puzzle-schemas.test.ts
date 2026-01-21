import { describe, it, expect } from "vitest";
import {
  careerPathContentSchema,
  careerStepSchema,
  transferGuessContentSchema,
  goalscorerRecallContentSchema,
  goalEventSchema,
  theGridContentSchema,
  gridCategorySchema,
  topicalQuizContentSchema,
  quizQuestionSchema,
  topTensContentSchema,
  topTenAnswerSchema,
  startingXIContentSchema,
  lineupPlayerSchema,
  puzzleBaseSchema,
  contentSchemaMap,
  validateContent,
  getContentSchema,
} from "../puzzle-schemas";
import { GAME_MODES } from "@/lib/constants";

// ============================================================================
// PUZZLE BASE SCHEMA
// ============================================================================

describe("puzzleBaseSchema", () => {
  it("validates correct base puzzle data", () => {
    const valid = {
      puzzle_date: "2024-01-15",
      game_mode: "career_path",
      status: "draft",
      difficulty: "medium",
    };
    expect(() => puzzleBaseSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid date format", () => {
    const invalid = {
      puzzle_date: "01-15-2024",
      game_mode: "career_path",
    };
    const result = puzzleBaseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid game mode", () => {
    const invalid = {
      puzzle_date: "2024-01-15",
      game_mode: "invalid_mode",
    };
    const result = puzzleBaseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts null difficulty", () => {
    const valid = {
      puzzle_date: "2024-01-15",
      game_mode: "career_path",
      difficulty: null,
    };
    expect(() => puzzleBaseSchema.parse(valid)).not.toThrow();
  });
});

// ============================================================================
// CAREER PATH SCHEMA
// ============================================================================

describe("careerStepSchema", () => {
  it("validates correct career step", () => {
    const valid = {
      type: "club",
      text: "Manchester United",
      year: "2020-2023",
      apps: 100,
      goals: 25,
    };
    expect(() => careerStepSchema.parse(valid)).not.toThrow();
  });

  it("accepts loan type", () => {
    const valid = {
      type: "loan",
      text: "Sevilla",
      year: "2019",
      apps: 30,
      goals: 10,
    };
    expect(() => careerStepSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid step type", () => {
    const invalid = { type: "permanent", text: "Club", year: "2020" };
    const result = careerStepSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty club name", () => {
    const invalid = { type: "club", text: "", year: "2020" };
    const result = careerStepSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts null apps and goals", () => {
    const valid = {
      type: "club",
      text: "Real Madrid",
      year: "2020",
      apps: null,
      goals: null,
    };
    expect(() => careerStepSchema.parse(valid)).not.toThrow();
  });
});

describe("careerPathContentSchema", () => {
  const validContent = {
    answer: "Cristiano Ronaldo",
    career_steps: [
      { type: "club", text: "Sporting CP", year: "2002-2003" },
      { type: "club", text: "Manchester United", year: "2003-2009" },
      { type: "club", text: "Real Madrid", year: "2009-2018" },
    ],
  };

  it("validates correct content", () => {
    expect(() => careerPathContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects missing answer", () => {
    const invalid = { ...validContent, answer: "" };
    const result = careerPathContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty career_steps", () => {
    const invalid = { answer: "Test Player", career_steps: [] };
    const result = careerPathContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 3 career steps", () => {
    const invalid = {
      answer: "Test",
      career_steps: [
        { type: "club", text: "Club 1", year: "2020" },
        { type: "club", text: "Club 2", year: "2021" },
      ],
    };
    const result = careerPathContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects more than 15 career steps", () => {
    const invalid = {
      answer: "Test",
      career_steps: Array.from({ length: 16 }, (_, i) => ({
        type: "club" as const,
        text: `Club ${i + 1}`,
        year: String(2000 + i),
      })),
    };
    const result = careerPathContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts optional apps/goals fields", () => {
    const valid = {
      answer: "Test Player",
      career_steps: [
        { type: "club", text: "Club 1", year: "2020", apps: 50, goals: 20 },
        { type: "club", text: "Club 2", year: "2021" },
        { type: "loan", text: "Club 3", year: "2022", apps: null, goals: null },
      ],
    };
    expect(() => careerPathContentSchema.parse(valid)).not.toThrow();
  });
});

// ============================================================================
// TRANSFER GUESS SCHEMA
// ============================================================================

describe("transferGuessContentSchema", () => {
  const validContent = {
    answer: "Neymar",
    from_club: "Barcelona",
    to_club: "PSG",
    year: 2017,
    fee: "€222m",
    hints: ["Brazilian", "Forward", "Won La Liga"],
  };

  it("validates correct content", () => {
    expect(() => transferGuessContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects missing answer", () => {
    const invalid = { ...validContent, answer: "" };
    const result = transferGuessContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects missing from_club", () => {
    const invalid = { ...validContent, from_club: "" };
    const result = transferGuessContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid year (too old)", () => {
    const invalid = { ...validContent, year: 1800 };
    const result = transferGuessContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid year (too new)", () => {
    const invalid = { ...validContent, year: 2100 };
    const result = transferGuessContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty hints", () => {
    const invalid = { ...validContent, hints: ["", "", ""] };
    const result = transferGuessContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects wrong number of hints", () => {
    const invalid = { ...validContent, hints: ["Hint 1", "Hint 2"] };
    const result = transferGuessContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("coerces string year to number", () => {
    const withStringYear = { ...validContent, year: "2017" as unknown as number };
    const result = transferGuessContentSchema.parse(withStringYear);
    expect(result.year).toBe(2017);
  });
});

// ============================================================================
// GOALSCORER RECALL SCHEMA
// ============================================================================

describe("goalEventSchema", () => {
  it("validates correct goal event", () => {
    const valid = { scorer: "Messi", minute: 45, team: "home", isOwnGoal: false };
    expect(() => goalEventSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty scorer", () => {
    const invalid = { scorer: "", minute: 45, team: "home" };
    const result = goalEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects minute below 1", () => {
    const invalid = { scorer: "Test", minute: 0, team: "home" };
    const result = goalEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects minute above 120", () => {
    const invalid = { scorer: "Test", minute: 121, team: "home" };
    const result = goalEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid team value", () => {
    const invalid = { scorer: "Test", minute: 45, team: "both" };
    const result = goalEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("defaults isOwnGoal to false", () => {
    const valid = { scorer: "Test", minute: 45, team: "away" };
    const result = goalEventSchema.parse(valid);
    expect(result.isOwnGoal).toBe(false);
  });
});

describe("goalscorerRecallContentSchema", () => {
  const validContent = {
    home_team: "Liverpool",
    away_team: "Manchester City",
    home_score: 2,
    away_score: 2,
    competition: "Premier League",
    match_date: "2024-01-15",
    goals: [
      { scorer: "Salah", minute: 25, team: "home" },
      { scorer: "Haaland", minute: 40, team: "away" },
      { scorer: "Nunez", minute: 60, team: "home" },
      { scorer: "De Bruyne", minute: 85, team: "away" },
    ],
  };

  it("validates correct content", () => {
    expect(() => goalscorerRecallContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects missing home_team", () => {
    const invalid = { ...validContent, home_team: "" };
    const result = goalscorerRecallContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty goals array", () => {
    const invalid = { ...validContent, goals: [] };
    const result = goalscorerRecallContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects negative score", () => {
    const invalid = { ...validContent, home_score: -1 };
    const result = goalscorerRecallContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts own goals", () => {
    const withOwnGoal = {
      ...validContent,
      goals: [{ scorer: "Own Goal Player", minute: 30, team: "home", isOwnGoal: true }],
    };
    expect(() => goalscorerRecallContentSchema.parse(withOwnGoal)).not.toThrow();
  });
});

// ============================================================================
// THE GRID SCHEMA
// ============================================================================

describe("gridCategorySchema", () => {
  it("validates club category", () => {
    const valid = { type: "club", value: "Manchester United" };
    expect(() => gridCategorySchema.parse(valid)).not.toThrow();
  });

  it("validates nation category", () => {
    const valid = { type: "nation", value: "England" };
    expect(() => gridCategorySchema.parse(valid)).not.toThrow();
  });

  it("validates stat category", () => {
    const valid = { type: "stat", value: "50+ Goals" };
    expect(() => gridCategorySchema.parse(valid)).not.toThrow();
  });

  it("validates trophy category", () => {
    const valid = { type: "trophy", value: "Champions League" };
    expect(() => gridCategorySchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid type", () => {
    const invalid = { type: "invalid", value: "Test" };
    const result = gridCategorySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty value", () => {
    const invalid = { type: "club", value: "" };
    const result = gridCategorySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("theGridContentSchema", () => {
  const validContent = {
    xAxis: [
      { type: "club", value: "Man Utd" },
      { type: "club", value: "Chelsea" },
      { type: "club", value: "Arsenal" },
    ],
    yAxis: [
      { type: "nation", value: "England" },
      { type: "nation", value: "France" },
      { type: "nation", value: "Brazil" },
    ],
    valid_answers: {
      "0": ["Rooney"],
      "1": ["Terry"],
      "2": ["Henry"],
      "3": ["Cantona"],
      "4": ["Hazard"],
      "5": ["Pires"],
      "6": ["Anderson"],
      "7": ["Willian"],
      "8": ["Edu"],
    },
  };

  it("validates correct 3x3 grid", () => {
    expect(() => theGridContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects wrong number of x-axis categories", () => {
    const invalid = {
      ...validContent,
      xAxis: [
        { type: "club", value: "Club 1" },
        { type: "club", value: "Club 2" },
      ],
    };
    const result = theGridContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid cell index in valid_answers", () => {
    const invalid = {
      ...validContent,
      valid_answers: { ...validContent.valid_answers, "9": ["Invalid"] },
    };
    const result = theGridContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts empty valid_answers arrays for cells", () => {
    const withEmptyCell = {
      ...validContent,
      valid_answers: { ...validContent.valid_answers, "0": [] },
    };
    expect(() => theGridContentSchema.parse(withEmptyCell)).not.toThrow();
  });
});

// ============================================================================
// TOPICAL QUIZ SCHEMA
// ============================================================================

describe("quizQuestionSchema", () => {
  const validQuestion = {
    id: "q1",
    question: "Who won the 2022 World Cup?",
    options: ["France", "Argentina", "Brazil", "Germany"],
    correctIndex: 1,
    imageUrl: "",
  };

  it("validates correct question", () => {
    expect(() => quizQuestionSchema.parse(validQuestion)).not.toThrow();
  });

  it("rejects empty question text", () => {
    const invalid = { ...validQuestion, question: "" };
    const result = quizQuestionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty option", () => {
    const invalid = { ...validQuestion, options: ["A", "B", "", "D"] };
    const result = quizQuestionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects wrong number of options", () => {
    const invalid = { ...validQuestion, options: ["A", "B", "C"] };
    const result = quizQuestionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects correctIndex out of range (negative)", () => {
    const invalid = { ...validQuestion, correctIndex: -1 };
    const result = quizQuestionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects correctIndex out of range (too high)", () => {
    const invalid = { ...validQuestion, correctIndex: 4 };
    const result = quizQuestionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts valid image URL", () => {
    const withImage = { ...validQuestion, imageUrl: "https://example.com/image.jpg" };
    expect(() => quizQuestionSchema.parse(withImage)).not.toThrow();
  });

  it("accepts empty imageUrl", () => {
    const emptyImage = { ...validQuestion, imageUrl: "" };
    expect(() => quizQuestionSchema.parse(emptyImage)).not.toThrow();
  });
});

describe("topicalQuizContentSchema", () => {
  const createQuestion = (index: number) => ({
    id: `q${index}`,
    question: `Question ${index}?`,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    imageUrl: "",
  });

  const validContent = {
    questions: [1, 2, 3, 4, 5].map(createQuestion),
  };

  it("validates exactly 5 questions", () => {
    expect(() => topicalQuizContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects fewer than 5 questions", () => {
    const invalid = { questions: [1, 2, 3, 4].map(createQuestion) };
    const result = topicalQuizContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 questions", () => {
    const invalid = { questions: [1, 2, 3, 4, 5, 6].map(createQuestion) };
    const result = topicalQuizContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// TOP TENS SCHEMA
// ============================================================================

describe("topTenAnswerSchema", () => {
  it("validates correct answer", () => {
    const valid = { name: "Ronaldo", aliases: ["CR7"], info: "5 Ballon d'Or" };
    expect(() => topTenAnswerSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty name", () => {
    const invalid = { name: "" };
    const result = topTenAnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("defaults aliases to empty array", () => {
    const minimal = { name: "Messi" };
    const result = topTenAnswerSchema.parse(minimal);
    expect(result.aliases).toEqual([]);
  });

  it("defaults info to empty string", () => {
    const minimal = { name: "Messi" };
    const result = topTenAnswerSchema.parse(minimal);
    expect(result.info).toBe("");
  });
});

describe("topTensContentSchema", () => {
  const createAnswer = (index: number) => ({
    name: `Answer ${index}`,
    aliases: [],
    info: "",
  });

  const validContent = {
    title: "Top 10 Goal Scorers",
    category: "Goals",
    answers: Array.from({ length: 10 }, (_, i) => createAnswer(i + 1)),
  };

  it("validates exactly 10 answers", () => {
    expect(() => topTensContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects empty title", () => {
    const invalid = { ...validContent, title: "" };
    const result = topTensContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 10 answers", () => {
    const invalid = {
      ...validContent,
      answers: Array.from({ length: 9 }, (_, i) => createAnswer(i + 1)),
    };
    const result = topTensContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 answers", () => {
    const invalid = {
      ...validContent,
      answers: Array.from({ length: 11 }, (_, i) => createAnswer(i + 1)),
    };
    const result = topTensContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("defaults category to empty string", () => {
    const minimal = {
      title: "Test Title",
      answers: Array.from({ length: 10 }, (_, i) => createAnswer(i + 1)),
    };
    const result = topTensContentSchema.parse(minimal);
    expect(result.category).toBe("");
  });
});

// ============================================================================
// STARTING XI SCHEMA
// ============================================================================

describe("lineupPlayerSchema", () => {
  it("validates correct player", () => {
    const valid = {
      position_key: "GK",
      player_name: "Alisson",
      is_hidden: false,
      override_x: null,
      override_y: null,
    };
    expect(() => lineupPlayerSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid position key", () => {
    const invalid = {
      position_key: "INVALID",
      player_name: "Test",
      is_hidden: false,
    };
    const result = lineupPlayerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty player name", () => {
    const invalid = {
      position_key: "GK",
      player_name: "",
      is_hidden: false,
    };
    const result = lineupPlayerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts valid override positions", () => {
    const valid = {
      position_key: "CM",
      player_name: "Henderson",
      is_hidden: false,
      override_x: 50,
      override_y: 60,
    };
    expect(() => lineupPlayerSchema.parse(valid)).not.toThrow();
  });

  it("rejects override_x out of range", () => {
    const invalid = {
      position_key: "CM",
      player_name: "Test",
      is_hidden: false,
      override_x: 150,
      override_y: 50,
    };
    const result = lineupPlayerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("defaults is_hidden to false", () => {
    const minimal = { position_key: "ST", player_name: "Salah" };
    const result = lineupPlayerSchema.parse(minimal);
    expect(result.is_hidden).toBe(false);
  });
});

describe("startingXIContentSchema", () => {
  const createPlayer = (position: string, name: string) => ({
    position_key: position,
    player_name: name,
    is_hidden: false,
    override_x: null,
    override_y: null,
  });

  const validContent = {
    match_name: "Liverpool vs Man City",
    competition: "Premier League",
    match_date: "2024-01-15",
    formation: "4-3-3",
    team: "Liverpool",
    players: [
      createPlayer("GK", "Alisson"),
      createPlayer("RB", "Alexander-Arnold"),
      createPlayer("RCB", "Konate"),
      createPlayer("LCB", "Van Dijk"),
      createPlayer("LB", "Robertson"),
      createPlayer("RCM", "Szoboszlai"),
      createPlayer("CM", "Mac Allister"),
      createPlayer("LCM", "Gravenberch"),
      createPlayer("RW", "Salah"),
      createPlayer("ST", "Nunez"),
      createPlayer("LW", "Diaz"),
    ],
  };

  it("validates correct content", () => {
    expect(() => startingXIContentSchema.parse(validContent)).not.toThrow();
  });

  it("rejects invalid formation", () => {
    const invalid = { ...validContent, formation: "10-0-0" };
    const result = startingXIContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects wrong player count (too few)", () => {
    const invalid = { ...validContent, players: validContent.players.slice(0, 10) };
    const result = startingXIContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects wrong player count (too many)", () => {
    const invalid = {
      ...validContent,
      players: [...validContent.players, createPlayer("SUB", "Extra")],
    };
    const result = startingXIContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty match_name", () => {
    const invalid = { ...validContent, match_name: "" };
    const result = startingXIContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty team", () => {
    const invalid = { ...validContent, team: "" };
    const result = startingXIContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts all valid formations", () => {
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
    formations.forEach((formation) => {
      const withFormation = { ...validContent, formation };
      expect(() => startingXIContentSchema.parse(withFormation)).not.toThrow();
    });
  });
});

// ============================================================================
// CONTENT SCHEMA MAP & HELPERS
// ============================================================================

describe("contentSchemaMap", () => {
  it("has entry for all game modes", () => {
    GAME_MODES.forEach((mode) => {
      expect(contentSchemaMap).toHaveProperty(mode);
      expect(contentSchemaMap[mode]).toBeDefined();
    });
  });

  it("career_path and career_path_pro use same schema", () => {
    expect(contentSchemaMap.career_path).toBe(contentSchemaMap.career_path_pro);
  });
});

describe("getContentSchema", () => {
  it("returns correct schema for each mode", () => {
    expect(getContentSchema("career_path")).toBe(careerPathContentSchema);
    expect(getContentSchema("the_grid")).toBe(theGridContentSchema);
    expect(getContentSchema("guess_the_transfer")).toBe(transferGuessContentSchema);
    expect(getContentSchema("guess_the_goalscorers")).toBe(goalscorerRecallContentSchema);
    expect(getContentSchema("topical_quiz")).toBe(topicalQuizContentSchema);
    expect(getContentSchema("top_tens")).toBe(topTensContentSchema);
    expect(getContentSchema("starting_xi")).toBe(startingXIContentSchema);
  });
});

describe("validateContent", () => {
  it("returns success for valid content", () => {
    const validCareerPath = {
      answer: "Test",
      career_steps: [
        { type: "club", text: "A", year: "2020" },
        { type: "club", text: "B", year: "2021" },
        { type: "club", text: "C", year: "2022" },
      ],
    };
    const result = validateContent("career_path", validCareerPath);
    expect(result.success).toBe(true);
  });

  it("returns error for invalid content", () => {
    const invalidCareerPath = { answer: "", career_steps: [] };
    const result = validateContent("career_path", invalidCareerPath);
    expect(result.success).toBe(false);
  });
});
