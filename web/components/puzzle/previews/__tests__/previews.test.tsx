import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CareerPathPreview } from "../career-path-preview";
import { TransferGuessPreview } from "../transfer-guess-preview";
import { GoalscorerRecallPreview } from "../goalscorer-recall-preview";
import { TheGridPreview } from "../the-grid-preview";
import { TopicalQuizPreview } from "../topical-quiz-preview";
import { TopTensPreview } from "../top-tens-preview";
import { StartingXIPreview } from "../starting-xi-preview";

// ============================================================================
// TEST DATA
// ============================================================================

const careerPathData = {
  answer: "Cristiano Ronaldo",
  career_steps: [
    { type: "club" as const, text: "Sporting CP", year: "2002-2003", apps: 31, goals: 5 },
    { type: "club" as const, text: "Manchester United", year: "2003-2009", apps: 292, goals: 118 },
    { type: "club" as const, text: "Real Madrid", year: "2009-2018", apps: 438, goals: 450 },
  ],
};

const transferGuessData = {
  answer: "Neymar",
  from_club: "Barcelona",
  to_club: "PSG",
  fee: "€222M",
  hints: ["2017", "ATT", "BR"],
};

const goalscorerRecallData = {
  home_team: "Liverpool",
  away_team: "Barcelona",
  home_score: 4,
  away_score: 0,
  competition: "Champions League Semi-Final",
  match_date: "7 May 2019",
  goals: [
    { scorer: "Origi", minute: 7, team: "home" as const, isOwnGoal: false },
    { scorer: "Wijnaldum", minute: 54, team: "home" as const, isOwnGoal: false },
    { scorer: "Wijnaldum", minute: 56, team: "home" as const, isOwnGoal: false },
    { scorer: "Origi", minute: 79, team: "home" as const, isOwnGoal: false },
  ],
};

const theGridData = {
  xAxis: [
    { type: "club" as const, value: "Man United" },
    { type: "club" as const, value: "Chelsea" },
    { type: "club" as const, value: "Arsenal" },
  ],
  yAxis: [
    { type: "nation" as const, value: "England" },
    { type: "nation" as const, value: "France" },
    { type: "nation" as const, value: "Spain" },
  ],
  valid_answers: {
    "0": ["Wayne Rooney"],
    "1": ["John Terry"],
    "2": ["Tony Adams"],
    "3": [],
    "4": [],
    "5": [],
    "6": [],
    "7": [],
    "8": [],
  },
};

const topicalQuizData = {
  questions: [
    {
      id: "q1",
      question: "Who won the 2022 World Cup?",
      options: ["Brazil", "Argentina", "France", "Germany"],
      correctIndex: 1,
      imageUrl: "",
    },
    {
      id: "q2",
      question: "Who is the top scorer in Premier League history?",
      options: ["Wayne Rooney", "Alan Shearer", "Harry Kane", "Thierry Henry"],
      correctIndex: 1,
      imageUrl: "https://example.com/image.jpg",
    },
    {
      id: "q3",
      question: "Test question 3",
      options: ["A", "B", "C", "D"],
      correctIndex: 0,
      imageUrl: "",
    },
    {
      id: "q4",
      question: "Test question 4",
      options: ["A", "B", "C", "D"],
      correctIndex: 2,
      imageUrl: "",
    },
    {
      id: "q5",
      question: "Test question 5",
      options: ["A", "B", "C", "D"],
      correctIndex: 3,
      imageUrl: "",
    },
  ],
};

const topTensData = {
  title: "Premier League All-Time Goalscorers",
  category: "Premier League",
  answers: [
    { name: "Alan Shearer", aliases: [], info: "260 goals" },
    { name: "Wayne Rooney", aliases: ["Wazza"], info: "208 goals" },
    { name: "Andrew Cole", aliases: ["Andy Cole"], info: "187 goals" },
    { name: "Sergio Aguero", aliases: ["Kun"], info: "184 goals" },
    { name: "Frank Lampard", aliases: [], info: "177 goals" },
    { name: "Thierry Henry", aliases: [], info: "175 goals" },
    { name: "Robbie Fowler", aliases: [], info: "163 goals" },
    { name: "Jermain Defoe", aliases: [], info: "162 goals" },
    { name: "Michael Owen", aliases: [], info: "150 goals" },
    { name: "Les Ferdinand", aliases: [], info: "149 goals" },
  ],
};

const startingXIData = {
  match_name: "Liverpool vs Man City",
  competition: "Premier League",
  match_date: "10 Nov 2019",
  formation: "4-3-3" as const,
  team: "Liverpool",
  players: [
    { position_key: "GK" as const, player_name: "Alisson", is_hidden: false, override_x: null, override_y: null },
    { position_key: "RB" as const, player_name: "Alexander-Arnold", is_hidden: true, override_x: null, override_y: null },
    { position_key: "RCB" as const, player_name: "Lovren", is_hidden: false, override_x: null, override_y: null },
    { position_key: "LCB" as const, player_name: "Van Dijk", is_hidden: false, override_x: null, override_y: null },
    { position_key: "LB" as const, player_name: "Robertson", is_hidden: true, override_x: null, override_y: null },
    { position_key: "RCM" as const, player_name: "Henderson", is_hidden: false, override_x: null, override_y: null },
    { position_key: "CM" as const, player_name: "Fabinho", is_hidden: true, override_x: null, override_y: null },
    { position_key: "LCM" as const, player_name: "Wijnaldum", is_hidden: false, override_x: null, override_y: null },
    { position_key: "RW" as const, player_name: "Salah", is_hidden: false, override_x: null, override_y: null },
    { position_key: "ST" as const, player_name: "Firmino", is_hidden: false, override_x: null, override_y: null },
    { position_key: "LW" as const, player_name: "Mane", is_hidden: false, override_x: null, override_y: null },
  ],
};

// ============================================================================
// CAREER PATH PREVIEW
// ============================================================================

describe("CareerPathPreview", () => {
  it("shows placeholder when no career steps", () => {
    render(<CareerPathPreview content={{}} />);
    expect(screen.getByText(/add career steps to see preview/i)).toBeInTheDocument();
  });

  it("shows placeholder when career_steps is empty", () => {
    render(<CareerPathPreview content={{ career_steps: [] }} />);
    expect(screen.getByText(/add career steps to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText("Career Path")).toBeInTheDocument();
  });

  it("renders career steps", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText("Sporting CP")).toBeInTheDocument();
    expect(screen.getByText("Manchester United")).toBeInTheDocument();
    expect(screen.getByText("Real Madrid")).toBeInTheDocument();
  });

  it("renders step numbers", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders years", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText("2002-2003")).toBeInTheDocument();
    expect(screen.getByText("2003-2009")).toBeInTheDocument();
    expect(screen.getByText("2009-2018")).toBeInTheDocument();
  });

  it("renders apps and goals when present", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText(/31 apps/)).toBeInTheDocument();
    expect(screen.getByText(/5 goals/)).toBeInTheDocument();
  });

  it("renders answer when present", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText("Cristiano Ronaldo")).toBeInTheDocument();
    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("shows loan badge for loan steps", () => {
    const dataWithLoan = {
      ...careerPathData,
      career_steps: [
        { type: "loan" as const, text: "West Ham", year: "2020", apps: 16, goals: 9 },
      ],
    };
    render(<CareerPathPreview content={dataWithLoan} />);
    expect(screen.getByText("Loan")).toBeInTheDocument();
  });

  it("displays max score", () => {
    render(<CareerPathPreview content={careerPathData} />);
    expect(screen.getByText(/max score: 3 points/i)).toBeInTheDocument();
  });
});

// ============================================================================
// TRANSFER GUESS PREVIEW
// ============================================================================

describe("TransferGuessPreview", () => {
  it("shows placeholder when no clubs", () => {
    render(<TransferGuessPreview content={{}} />);
    expect(screen.getByText(/add transfer details to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<TransferGuessPreview content={transferGuessData} />);
    expect(screen.getByText("Transfer Guess")).toBeInTheDocument();
  });

  it("renders from and to clubs", () => {
    render(<TransferGuessPreview content={transferGuessData} />);
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
    expect(screen.getByText("PSG")).toBeInTheDocument();
  });

  it("renders fee", () => {
    render(<TransferGuessPreview content={transferGuessData} />);
    expect(screen.getByText("€222M")).toBeInTheDocument();
  });

  it("renders hints section", () => {
    render(<TransferGuessPreview content={transferGuessData} />);
    expect(screen.getByText("Nationality")).toBeInTheDocument();
    expect(screen.getByText("Position")).toBeInTheDocument();
    expect(screen.getByText("Achievement")).toBeInTheDocument();
  });

  it("renders hint values", () => {
    render(<TransferGuessPreview content={transferGuessData} />);
    expect(screen.getByText("2017")).toBeInTheDocument();
    expect(screen.getByText("ATT")).toBeInTheDocument();
    // Nationality hint (BR) renders as FlagIcon SVG, not text
  });

  it("renders answer when present", () => {
    render(<TransferGuessPreview content={transferGuessData} />);
    expect(screen.getByText("Neymar")).toBeInTheDocument();
    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("renders with partial data", () => {
    render(<TransferGuessPreview content={{ from_club: "Chelsea" }} />);
    expect(screen.getByText("Chelsea")).toBeInTheDocument();
    expect(screen.getByText("To Club")).toBeInTheDocument();
  });
});

// ============================================================================
// GOALSCORER RECALL PREVIEW
// ============================================================================

describe("GoalscorerRecallPreview", () => {
  it("shows placeholder when no teams", () => {
    render(<GoalscorerRecallPreview content={{}} />);
    expect(screen.getByText(/add match details to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    expect(screen.getByText("Goalscorer Recall")).toBeInTheDocument();
  });

  it("renders teams and score", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
    expect(screen.getByText("4 - 0")).toBeInTheDocument();
  });

  it("renders competition and date", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    expect(screen.getByText("Champions League Semi-Final")).toBeInTheDocument();
    expect(screen.getByText("7 May 2019")).toBeInTheDocument();
  });

  it("renders timer display", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    expect(screen.getByText("60s")).toBeInTheDocument();
  });

  it("renders goalscorers", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    expect(screen.getAllByText(/Origi/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Wijnaldum/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders goal minutes", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    expect(screen.getByText("7'")).toBeInTheDocument();
    expect(screen.getByText("54'")).toBeInTheDocument();
    expect(screen.getByText("56'")).toBeInTheDocument();
    expect(screen.getByText("79'")).toBeInTheDocument();
  });

  it("displays goals to find count", () => {
    render(<GoalscorerRecallPreview content={goalscorerRecallData} />);
    // 2 unique scorers (Origi and Wijnaldum)
    expect(screen.getByText(/goals to find: 2/i)).toBeInTheDocument();
  });

  it("shows own goal marker", () => {
    const dataWithOwnGoal = {
      ...goalscorerRecallData,
      goals: [{ scorer: "Suarez", minute: 30, team: "away" as const, isOwnGoal: true }],
    };
    render(<GoalscorerRecallPreview content={dataWithOwnGoal} />);
    expect(screen.getByText(/\(OG\)/)).toBeInTheDocument();
  });
});

// ============================================================================
// THE GRID PREVIEW
// ============================================================================

describe("TheGridPreview", () => {
  it("shows placeholder when no axes", () => {
    render(<TheGridPreview content={{}} />);
    expect(screen.getByText(/add categories to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<TheGridPreview content={theGridData} />);
    expect(screen.getByText("The Grid")).toBeInTheDocument();
  });

  it("renders column headers (x-axis)", () => {
    render(<TheGridPreview content={theGridData} />);
    expect(screen.getByText("Man United")).toBeInTheDocument();
    expect(screen.getByText("Chelsea")).toBeInTheDocument();
    expect(screen.getByText("Arsenal")).toBeInTheDocument();
  });

  it("renders row headers (y-axis)", () => {
    render(<TheGridPreview content={theGridData} />);
    expect(screen.getByText("England")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    expect(screen.getByText("Spain")).toBeInTheDocument();
  });

  it("renders category type badges", () => {
    render(<TheGridPreview content={theGridData} />);
    // 3 club badges for x-axis, 3 nation badges for y-axis
    const clubBadges = screen.getAllByText("club");
    const nationBadges = screen.getAllByText("nation");
    expect(clubBadges).toHaveLength(3);
    expect(nationBadges).toHaveLength(3);
  });

  it("displays answer counts in cells", () => {
    render(<TheGridPreview content={theGridData} />);
    // Cells with answers show count, empty cells show "?"
    expect(screen.getAllByText("?").length).toBeGreaterThanOrEqual(1);
  });

  it("shows valid answers summary per cell", () => {
    render(<TheGridPreview content={theGridData} />);
    // Cell 0 has 1 answer, Cell 1 has 1 answer, rest have 0
    expect(screen.getByText("Cell 0: 1")).toBeInTheDocument();
    expect(screen.getByText("Cell 1: 1")).toBeInTheDocument();
    expect(screen.getByText("Cell 2: 1")).toBeInTheDocument();
  });

  it("displays max score", () => {
    render(<TheGridPreview content={theGridData} />);
    expect(screen.getByText(/max score: 100 points/i)).toBeInTheDocument();
  });
});

// ============================================================================
// TOPICAL QUIZ PREVIEW
// ============================================================================

describe("TopicalQuizPreview", () => {
  it("shows placeholder when no questions", () => {
    render(<TopicalQuizPreview content={{}} />);
    expect(screen.getByText(/add questions to see preview/i)).toBeInTheDocument();
  });

  it("shows placeholder when questions array is empty", () => {
    render(<TopicalQuizPreview content={{ questions: [] }} />);
    expect(screen.getByText(/add questions to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<TopicalQuizPreview content={topicalQuizData} />);
    expect(screen.getByText("Topical Quiz")).toBeInTheDocument();
  });

  it("renders question badges", () => {
    render(<TopicalQuizPreview content={topicalQuizData} />);
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q2")).toBeInTheDocument();
    expect(screen.getByText("Q3")).toBeInTheDocument();
    expect(screen.getByText("Q4")).toBeInTheDocument();
    expect(screen.getByText("Q5")).toBeInTheDocument();
  });

  it("renders question text", () => {
    render(<TopicalQuizPreview content={topicalQuizData} />);
    expect(screen.getByText("Who won the 2022 World Cup?")).toBeInTheDocument();
    expect(screen.getByText("Who is the top scorer in Premier League history?")).toBeInTheDocument();
  });

  it("renders options with letters", () => {
    render(<TopicalQuizPreview content={topicalQuizData} />);
    expect(screen.getByText("Brazil")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
  });

  it("shows image badge when question has image", () => {
    render(<TopicalQuizPreview content={topicalQuizData} />);
    expect(screen.getByText("Has Image")).toBeInTheDocument();
  });

  it("displays max score", () => {
    render(<TopicalQuizPreview content={topicalQuizData} />);
    expect(screen.getByText(/max score: 10 points/i)).toBeInTheDocument();
  });
});

// ============================================================================
// TOP TENS PREVIEW
// ============================================================================

describe("TopTensPreview", () => {
  it("shows placeholder when no answers", () => {
    render(<TopTensPreview content={{}} />);
    expect(screen.getByText(/add answers to see preview/i)).toBeInTheDocument();
  });

  it("shows placeholder when answers array is empty", () => {
    render(<TopTensPreview content={{ answers: [] }} />);
    expect(screen.getByText(/add answers to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText("Top Tens")).toBeInTheDocument();
  });

  it("renders list title", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText("Premier League All-Time Goalscorers")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText("Premier League")).toBeInTheDocument();
  });

  it("renders all 10 answers", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText("Alan Shearer")).toBeInTheDocument();
    expect(screen.getByText("Wayne Rooney")).toBeInTheDocument();
    expect(screen.getByText("Andrew Cole")).toBeInTheDocument();
    expect(screen.getByText("Les Ferdinand")).toBeInTheDocument();
  });

  it("renders rank badges 1-10", () => {
    render(<TopTensPreview content={topTensData} />);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it("renders info for answers", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText("260 goals")).toBeInTheDocument();
    expect(screen.getByText("208 goals")).toBeInTheDocument();
  });

  it("renders aliases when present", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText(/Also: Wazza/)).toBeInTheDocument();
    expect(screen.getByText(/Also: Andy Cole/)).toBeInTheDocument();
    expect(screen.getByText(/Also: Kun/)).toBeInTheDocument();
  });

  it("shows jackpot for #10", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText("Jackpot!")).toBeInTheDocument();
  });

  it("displays progressive scoring info", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText(/progressive scoring: 1, 1, 2, 2, 3, 3, 4, 4, 5, 8/i)).toBeInTheDocument();
  });

  it("displays max score", () => {
    render(<TopTensPreview content={topTensData} />);
    expect(screen.getByText(/max score: 30 points/i)).toBeInTheDocument();
  });
});

// ============================================================================
// STARTING XI PREVIEW
// ============================================================================

describe("StartingXIPreview", () => {
  it("shows placeholder when no players", () => {
    render(<StartingXIPreview content={{}} />);
    expect(screen.getByText(/add players to see preview/i)).toBeInTheDocument();
  });

  it("shows placeholder when players array is empty", () => {
    render(<StartingXIPreview content={{ players: [] }} />);
    expect(screen.getByText(/add players to see preview/i)).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<StartingXIPreview content={startingXIData} />);
    expect(screen.getByText("Starting XI")).toBeInTheDocument();
  });

  it("renders match name", () => {
    render(<StartingXIPreview content={startingXIData} />);
    expect(screen.getByText("Liverpool vs Man City")).toBeInTheDocument();
  });

  it("renders competition and date", () => {
    render(<StartingXIPreview content={startingXIData} />);
    expect(screen.getByText("Premier League")).toBeInTheDocument();
    expect(screen.getByText("10 Nov 2019")).toBeInTheDocument();
  });

  it("renders team and formation badges", () => {
    render(<StartingXIPreview content={startingXIData} />);
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
    expect(screen.getByText("4-3-3")).toBeInTheDocument();
  });

  it("renders hidden count badge", () => {
    render(<StartingXIPreview content={startingXIData} />);
    // 3 hidden players in test data
    expect(screen.getByText("3 hidden")).toBeInTheDocument();
  });

  it("renders visible player names", () => {
    render(<StartingXIPreview content={startingXIData} />);
    // Check for last names of visible players
    expect(screen.getByText("Alisson")).toBeInTheDocument();
    expect(screen.getByText("Dijk")).toBeInTheDocument(); // Van Dijk -> last name
    expect(screen.getByText("Salah")).toBeInTheDocument();
    expect(screen.getByText("Mane")).toBeInTheDocument();
  });

  it("shows Hidden for hidden players", () => {
    render(<StartingXIPreview content={startingXIData} />);
    expect(screen.getAllByText("Hidden").length).toBe(3);
  });

  it("shows ? marker for hidden players", () => {
    render(<StartingXIPreview content={startingXIData} />);
    expect(screen.getAllByText("?").length).toBe(3);
  });

  it("displays max score with hidden players", () => {
    render(<StartingXIPreview content={startingXIData} />);
    // 3 hidden + 3 bonus = 6 points
    expect(screen.getByText(/max score: 3 \+ 3 bonus = 6 points/i)).toBeInTheDocument();
  });

  it("shows instruction when no hidden players", () => {
    const dataNoHidden = {
      ...startingXIData,
      players: startingXIData.players.map((p) => ({ ...p, is_hidden: false })),
    };
    render(<StartingXIPreview content={dataNoHidden} />);
    expect(screen.getByText("0 hidden")).toBeInTheDocument();
    expect(screen.getByText(/add hidden players for users to guess/i)).toBeInTheDocument();
  });
});

// ============================================================================
// EDGE CASES AND PARTIAL DATA
// ============================================================================

describe("Preview Edge Cases", () => {
  it("CareerPathPreview handles missing answer gracefully", () => {
    const data = { career_steps: [{ type: "club" as const, text: "Test Club", year: "2020", apps: null, goals: null }] };
    render(<CareerPathPreview content={data} />);
    expect(screen.getByText("Test Club")).toBeInTheDocument();
    expect(screen.queryByText("Answer")).not.toBeInTheDocument();
  });

  it("TransferGuessPreview handles missing hints gracefully", () => {
    const data = { from_club: "Barcelona", to_club: "Real Madrid" };
    render(<TransferGuessPreview content={data} />);
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
    expect(screen.getByText("Real Madrid")).toBeInTheDocument();
  });

  it("GoalscorerRecallPreview handles empty goals array", () => {
    const data = { home_team: "Liverpool", away_team: "Arsenal", goals: [] };
    render(<GoalscorerRecallPreview content={data} />);
    expect(screen.getByText("Liverpool")).toBeInTheDocument();
    expect(screen.getAllByText("No goals")).toHaveLength(2);
  });

  it("TheGridPreview handles empty valid_answers", () => {
    const data = {
      xAxis: theGridData.xAxis,
      yAxis: theGridData.yAxis,
      valid_answers: {},
    };
    render(<TheGridPreview content={data} />);
    expect(screen.getAllByText("?").length).toBeGreaterThanOrEqual(1);
  });

  it("TopicalQuizPreview handles empty option text", () => {
    const data = {
      questions: [
        { id: "q1", question: "Test?", options: ["", "", "", ""], correctIndex: 0, imageUrl: "" },
      ],
    };
    render(<TopicalQuizPreview content={data} />);
    expect(screen.getByText("Test?")).toBeInTheDocument();
  });

  it("TopTensPreview handles empty answer names", () => {
    const data = {
      title: "Test Title",
      answers: [{ name: "", aliases: [], info: "" }],
    };
    render(<TopTensPreview content={data} />);
    expect(screen.getByText("Answer 1")).toBeInTheDocument();
  });

  it("StartingXIPreview handles missing player names", () => {
    const data = {
      ...startingXIData,
      players: startingXIData.players.map((p) => ({ ...p, player_name: "" })),
    };
    render(<StartingXIPreview content={data} />);
    // Should show "Player" for empty names
    expect(screen.getAllByText("Player").length).toBeGreaterThanOrEqual(1);
  });
});
