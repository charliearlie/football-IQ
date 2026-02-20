import { describe, it, expect } from "vitest";
import {
  generateCareerPathShareText,
  generateTransferGuessShareText,
  generateConnectionsEmojiGrid,
  generateConnectionsShareText,
  generateQuizEmojiGrid,
  generateTopicalQuizShareText,
  type CareerPathResult,
  type TransferGuessResult,
  type ConnectionsGuessResult,
  type ConnectionsGroupInfo,
  type QuizAnswerResult,
} from "../shareText";

// ============================================================================
// generateCareerPathShareText
// ============================================================================

describe("generateCareerPathShareText", () => {
  const puzzleDate = "2026-02-19";

  it("includes the correct header line", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 3, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("Football IQ - Career Path");
  });

  it("formats the date as '19 Feb'", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 3, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("19 Feb");
  });

  it("won in 3/6 clues produces the solved line and correct emoji row", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 3, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("Solved in 3/6 clues");
    expect(text).toContain("🔓🔓🔓🔒🔒🔒");
  });

  it("won in 1/6 clues produces the single-clue line and correct emoji row", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 1, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("Solved in 1/6 clues");
    expect(text).toContain("🔓🔒🔒🔒🔒🔒");
  });

  it("won in 6/6 clues shows all unlocked emojis", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 6, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("Solved in 6/6 clues");
    expect(text).toContain("🔓🔓🔓🔓🔓🔓");
  });

  it("lost shows the 'clues revealed' result line", () => {
    const result: CareerPathResult = { won: false, cluesUsed: 6, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("6/6 clues revealed");
    expect(text).not.toContain("Solved");
  });

  it("lost shows all open-lock emojis", () => {
    const result: CareerPathResult = { won: false, cluesUsed: 6, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("🔓🔓🔓🔓🔓🔓");
  });

  it("includes the correct share URL", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 3, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    expect(text).toContain("footballiq.app/play/career-path");
  });

  it("lines are joined with newlines", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 3, totalClues: 6 };
    const text = generateCareerPathShareText(result, puzzleDate);
    const lines = text.split("\n");
    expect(lines.length).toBe(5);
  });
});

// ============================================================================
// generateTransferGuessShareText
// ============================================================================

describe("generateTransferGuessShareText", () => {
  const puzzleDate = "2026-02-19";

  it("includes the correct header line", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("Football IQ - Transfer Guess");
  });

  it("formats the date as '19 Feb'", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("19 Feb");
  });

  it("won with 1 hint shows the singular hint line", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("Guessed with 1 hint");
  });

  it("won with 2 hints shows the plural hint line", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 2, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("Guessed with 2 hints");
  });

  it("won with 1 hint produces correct emoji row: ✅🔍⬜⬜", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("✅ 🔍⬜⬜");
  });

  it("won with 3 hints produces all hint emojis revealed", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 3, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("✅ 🔍🔍🔍");
  });

  it("lost shows 'Did not guess correctly'", () => {
    const result: TransferGuessResult = { won: false, hintsRevealed: 3, guessCount: 3 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("Did not guess correctly");
    expect(text).not.toContain("Guessed with");
  });

  it("lost shows the failure status emoji ❌", () => {
    const result: TransferGuessResult = { won: false, hintsRevealed: 3, guessCount: 3 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("❌");
  });

  it("includes the correct share URL", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    expect(text).toContain("footballiq.app/play/transfer-guess");
  });

  it("lines are joined with newlines", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, puzzleDate);
    const lines = text.split("\n");
    expect(lines.length).toBe(5);
  });
});

// ============================================================================
// generateConnectionsEmojiGrid
// ============================================================================

describe("generateConnectionsEmojiGrid", () => {
  const allGroups: ConnectionsGroupInfo[] = [
    { difficulty: "yellow", players: ["Alice", "Bob", "Carol", "Dave"] },
    { difficulty: "green", players: ["Eve", "Frank", "Grace", "Hank"] },
    { difficulty: "blue", players: ["Ivy", "Jack", "Kate", "Leo"] },
    { difficulty: "purple", players: ["Mary", "Nick", "Olivia", "Paul"] },
  ];

  it("maps a correct yellow guess to four 🟨 emojis", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Alice", "Bob", "Carol", "Dave"], correct: true, matchedDifficulty: "yellow" },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("🟨🟨🟨🟨");
  });

  it("maps a correct green guess to four 🟩 emojis", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Eve", "Frank", "Grace", "Hank"], correct: true, matchedDifficulty: "green" },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("🟩🟩🟩🟩");
  });

  it("maps a correct blue guess to four 🟦 emojis", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Ivy", "Jack", "Kate", "Leo"], correct: true, matchedDifficulty: "blue" },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("🟦🟦🟦🟦");
  });

  it("maps a correct purple guess to four 🟪 emojis", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Mary", "Nick", "Olivia", "Paul"], correct: true, matchedDifficulty: "purple" },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("🟪🟪🟪🟪");
  });

  it("shows mixed emojis for an incorrect guess spanning multiple groups", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Alice", "Eve", "Ivy", "Mary"], correct: false },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("🟨🟩🟦🟪");
  });

  it("uses ⬜ for players not found in any group", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Unknown1", "Bob", "Carol", "Dave"], correct: false },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("⬜🟨🟨🟨");
  });

  it("each guess row is on a separate line", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Alice", "Bob", "Carol", "Dave"], correct: true, matchedDifficulty: "yellow" },
      { players: ["Eve", "Frank", "Grace", "Hank"], correct: true, matchedDifficulty: "green" },
    ];
    const grid = generateConnectionsEmojiGrid(guesses, allGroups);
    expect(grid).toBe("🟨🟨🟨🟨\n🟩🟩🟩🟩");
  });

  it("returns an empty string when there are no guesses", () => {
    const grid = generateConnectionsEmojiGrid([], allGroups);
    expect(grid).toBe("");
  });
});

// ============================================================================
// generateConnectionsShareText
// ============================================================================

describe("generateConnectionsShareText", () => {
  const puzzleDate = "2026-02-19";

  const allGroups: ConnectionsGroupInfo[] = [
    { difficulty: "yellow", players: ["Alice", "Bob", "Carol", "Dave"] },
    { difficulty: "green", players: ["Eve", "Frank", "Grace", "Hank"] },
    { difficulty: "blue", players: ["Ivy", "Jack", "Kate", "Leo"] },
    { difficulty: "purple", players: ["Mary", "Nick", "Olivia", "Paul"] },
  ];

  it("includes the correct header line", () => {
    const text = generateConnectionsShareText([], allGroups, 0, puzzleDate);
    expect(text).toContain("Football IQ - Connections");
  });

  it("formats the date as '19 Feb'", () => {
    const text = generateConnectionsShareText([], allGroups, 0, puzzleDate);
    expect(text).toContain("19 Feb");
  });

  it("includes the emoji grid in the output", () => {
    const guesses: ConnectionsGuessResult[] = [
      { players: ["Alice", "Bob", "Carol", "Dave"], correct: true, matchedDifficulty: "yellow" },
    ];
    const text = generateConnectionsShareText(guesses, allGroups, 0, puzzleDate);
    expect(text).toContain("🟨🟨🟨🟨");
  });

  it("shows singular '1 mistake' for exactly one mistake", () => {
    const text = generateConnectionsShareText([], allGroups, 1, puzzleDate);
    expect(text).toContain("1 mistake");
    expect(text).not.toContain("1 mistakes");
  });

  it("shows plural 'N mistakes' for two or more mistakes", () => {
    const text = generateConnectionsShareText([], allGroups, 2, puzzleDate);
    expect(text).toContain("2 mistakes");
  });

  it("shows '0 mistakes' for a perfect game", () => {
    const text = generateConnectionsShareText([], allGroups, 0, puzzleDate);
    expect(text).toContain("0 mistakes");
  });

  it("includes the correct share URL", () => {
    const text = generateConnectionsShareText([], allGroups, 0, puzzleDate);
    expect(text).toContain("footballiq.app/play/connections");
  });
});

// ============================================================================
// generateQuizEmojiGrid
// ============================================================================

describe("generateQuizEmojiGrid", () => {
  it("returns all ✅ for a perfect score", () => {
    const answers: QuizAnswerResult[] = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
    ];
    expect(generateQuizEmojiGrid(answers)).toBe("✅✅✅✅✅");
  });

  it("returns all ❌ for zero correct answers", () => {
    const answers: QuizAnswerResult[] = [
      { isCorrect: false },
      { isCorrect: false },
      { isCorrect: false },
      { isCorrect: false },
      { isCorrect: false },
    ];
    expect(generateQuizEmojiGrid(answers)).toBe("❌❌❌❌❌");
  });

  it("returns the correct mixed emoji sequence for 4/5 correct", () => {
    const answers: QuizAnswerResult[] = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: true },
    ];
    expect(generateQuizEmojiGrid(answers)).toBe("✅✅❌✅✅");
  });

  it("preserves answer order in the emoji sequence", () => {
    const answers: QuizAnswerResult[] = [
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: false },
    ];
    expect(generateQuizEmojiGrid(answers)).toBe("❌✅❌");
  });

  it("returns an empty string for no answers", () => {
    expect(generateQuizEmojiGrid([])).toBe("");
  });

  it("handles a single correct answer", () => {
    expect(generateQuizEmojiGrid([{ isCorrect: true }])).toBe("✅");
  });

  it("handles a single incorrect answer", () => {
    expect(generateQuizEmojiGrid([{ isCorrect: false }])).toBe("❌");
  });
});

// ============================================================================
// generateTopicalQuizShareText
// ============================================================================

describe("generateTopicalQuizShareText", () => {
  const puzzleDate = "2026-02-19";

  it("includes the correct header line", () => {
    const answers: QuizAnswerResult[] = [{ isCorrect: true }];
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("Football IQ - Quiz");
  });

  it("formats the date as '19 Feb'", () => {
    const answers: QuizAnswerResult[] = [{ isCorrect: true }];
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("19 Feb");
  });

  it("shows '5/5 correct' for a perfect score", () => {
    const answers: QuizAnswerResult[] = Array(5).fill({ isCorrect: true });
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("5/5 correct");
  });

  it("shows '4/5 correct' for 4 out of 5 correct", () => {
    const answers: QuizAnswerResult[] = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: true },
    ];
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("4/5 correct");
  });

  it("shows '0/5 correct' for all wrong answers", () => {
    const answers: QuizAnswerResult[] = Array(5).fill({ isCorrect: false });
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("0/5 correct");
  });

  it("includes the emoji grid in the output", () => {
    const answers: QuizAnswerResult[] = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: true },
    ];
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("✅✅❌✅✅");
  });

  it("perfect score produces all ✅ in the grid", () => {
    const answers: QuizAnswerResult[] = Array(5).fill({ isCorrect: true });
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("✅✅✅✅✅");
  });

  it("includes the correct share URL", () => {
    const answers: QuizAnswerResult[] = [{ isCorrect: true }];
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    expect(text).toContain("footballiq.app/play/topical-quiz");
  });

  it("lines are joined with newlines", () => {
    const answers: QuizAnswerResult[] = Array(5).fill({ isCorrect: true });
    const text = generateTopicalQuizShareText(answers, puzzleDate);
    const lines = text.split("\n");
    expect(lines.length).toBe(5);
  });
});

// ============================================================================
// Date formatting — shared helper via public surface
// ============================================================================

describe("date formatting across all share text generators", () => {
  it("career-path: 2026-01-01 formats as '1 Jan'", () => {
    const result: CareerPathResult = { won: true, cluesUsed: 3, totalClues: 6 };
    const text = generateCareerPathShareText(result, "2026-01-01");
    expect(text).toContain("1 Jan");
  });

  it("transfer-guess: 2025-12-31 formats as '31 Dec'", () => {
    const result: TransferGuessResult = { won: true, hintsRevealed: 1, guessCount: 1 };
    const text = generateTransferGuessShareText(result, "2025-12-31");
    expect(text).toContain("31 Dec");
  });

  it("topical-quiz: 2026-07-04 formats as '4 Jul'", () => {
    const answers: QuizAnswerResult[] = [{ isCorrect: true }];
    const text = generateTopicalQuizShareText(answers, "2026-07-04");
    expect(text).toContain("4 Jul");
  });
});
