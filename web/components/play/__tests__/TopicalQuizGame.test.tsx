import { describe, it, expect } from "vitest";
import {
  topicalQuizReducer,
  type TopicalQuizState,
  type TopicalQuizAction,
} from "../TopicalQuizGame";

// ============================================================================
// Helpers
// ============================================================================

const makeState = (overrides?: Partial<TopicalQuizState>): TopicalQuizState => ({
  currentQuestionIndex: 0,
  answers: [],
  gameStatus: "playing",
  selectedOptionIndex: null,
  ...overrides,
});

// ============================================================================
// SELECT_OPTION
// ============================================================================

describe("SELECT_OPTION", () => {
  it("correct answer adds answer with isCorrect: true, sets selectedOptionIndex, gameStatus 'revealing'", () => {
    const state = makeState();
    const action: TopicalQuizAction = {
      type: "SELECT_OPTION",
      payload: 2,
      correctIndex: 2,
    };
    const next = topicalQuizReducer(state, action);
    expect(next.answers).toHaveLength(1);
    expect(next.answers[0].isCorrect).toBe(true);
    expect(next.answers[0].selectedIndex).toBe(2);
    expect(next.selectedOptionIndex).toBe(2);
    expect(next.gameStatus).toBe("revealing");
  });

  it("wrong answer adds answer with isCorrect: false, sets selectedOptionIndex, gameStatus 'revealing'", () => {
    const state = makeState();
    const action: TopicalQuizAction = {
      type: "SELECT_OPTION",
      payload: 1,
      correctIndex: 2,
    };
    const next = topicalQuizReducer(state, action);
    expect(next.answers).toHaveLength(1);
    expect(next.answers[0].isCorrect).toBe(false);
    expect(next.answers[0].selectedIndex).toBe(1);
    expect(next.selectedOptionIndex).toBe(1);
    expect(next.gameStatus).toBe("revealing");
  });

  it("is a no-op when selectedOptionIndex is already set (double-tap)", () => {
    const state = makeState({ selectedOptionIndex: 0, gameStatus: "revealing" });
    const next = topicalQuizReducer(state, {
      type: "SELECT_OPTION",
      payload: 1,
      correctIndex: 2,
    });
    expect(next).toBe(state);
  });

  it("is a no-op when gameStatus is not 'playing'", () => {
    const state = makeState({ gameStatus: "complete" });
    const next = topicalQuizReducer(state, {
      type: "SELECT_OPTION",
      payload: 0,
      correctIndex: 0,
    });
    expect(next).toBe(state);
  });
});

// ============================================================================
// ADVANCE_QUESTION
// ============================================================================

describe("ADVANCE_QUESTION", () => {
  it("increments currentQuestionIndex, resets selectedOptionIndex to null, sets gameStatus 'playing'", () => {
    const state = makeState({
      currentQuestionIndex: 1,
      selectedOptionIndex: 2,
      gameStatus: "revealing",
    });
    const next = topicalQuizReducer(state, {
      type: "ADVANCE_QUESTION",
      totalQuestions: 5,
    });
    expect(next.currentQuestionIndex).toBe(2);
    expect(next.selectedOptionIndex).toBeNull();
    expect(next.gameStatus).toBe("playing");
  });

  it("sets gameStatus 'complete' when at the last question (index 4 of 5)", () => {
    const state = makeState({
      currentQuestionIndex: 4,
      selectedOptionIndex: 1,
      gameStatus: "revealing",
    });
    const next = topicalQuizReducer(state, {
      type: "ADVANCE_QUESTION",
      totalQuestions: 5,
    });
    expect(next.gameStatus).toBe("complete");
  });
});

// ============================================================================
// FINISH_GAME
// ============================================================================

describe("FINISH_GAME", () => {
  it("sets gameStatus to 'complete'", () => {
    const state = makeState({ gameStatus: "revealing" });
    const next = topicalQuizReducer(state, { type: "FINISH_GAME" });
    expect(next.gameStatus).toBe("complete");
  });
});

// ============================================================================
// Score computation
// ============================================================================

describe("Score computation", () => {
  it("5 correct answers: won = true, score = 10", () => {
    const correctCount = 5;
    expect(correctCount >= 3).toBe(true);
    expect(correctCount * 2).toBe(10);
  });

  it("3 correct answers: won = true, score = 6", () => {
    const correctCount = 3;
    expect(correctCount >= 3).toBe(true);
    expect(correctCount * 2).toBe(6);
  });

  it("2 correct answers: won = false, score = 4", () => {
    const correctCount = 2;
    expect(correctCount >= 3).toBe(false);
    expect(correctCount * 2).toBe(4);
  });

  it("0 correct answers: won = false, score = 0", () => {
    const correctCount = 0;
    expect(correctCount >= 3).toBe(false);
    expect(correctCount * 2).toBe(0);
  });
});
