import { describe, it, expect } from "vitest";
import {
  transferGuessReducer,
  type TransferGuessState,
} from "../TransferGuessGame";

// ============================================================================
// Helpers
// ============================================================================

const makeState = (overrides?: Partial<TransferGuessState>): TransferGuessState => ({
  gameStatus: "playing",
  currentGuess: "",
  incorrectGuesses: [],
  hintsRevealed: 0,
  isShaking: false,
  ...overrides,
});

const ANSWER = "Philippe Coutinho";

// ============================================================================
// SET_GUESS
// ============================================================================

describe("SET_GUESS", () => {
  it("updates currentGuess", () => {
    const state = makeState();
    const next = transferGuessReducer(state, {
      type: "SET_GUESS",
      payload: "Coutinho",
    });
    expect(next.currentGuess).toBe("Coutinho");
  });
});

// ============================================================================
// GUESS
// ============================================================================

describe("GUESS", () => {
  it("sets gameStatus to won on correct fuzzy match (surname only)", () => {
    const state = makeState({ currentGuess: "Coutinho" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.gameStatus).toBe("won");
  });

  it("reveals all hints on correct answer", () => {
    const state = makeState({ currentGuess: "Coutinho", hintsRevealed: 1 });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.hintsRevealed).toBe(3);
  });

  it("clears currentGuess on correct answer", () => {
    const state = makeState({ currentGuess: "Coutinho" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.currentGuess).toBe("");
  });

  it("adds to incorrectGuesses on wrong answer", () => {
    const state = makeState({ currentGuess: "Messi" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.incorrectGuesses).toContain("Messi");
    expect(next.incorrectGuesses).toHaveLength(1);
  });

  it("sets isShaking true on wrong answer", () => {
    const state = makeState({ currentGuess: "Messi" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.isShaking).toBe(true);
  });

  it("clears currentGuess on wrong answer", () => {
    const state = makeState({ currentGuess: "Messi" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.currentGuess).toBe("");
  });

  it("is a no-op when currentGuess is empty", () => {
    const state = makeState({ currentGuess: "" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next).toBe(state);
  });

  it("is a no-op when currentGuess is whitespace only", () => {
    const state = makeState({ currentGuess: "   " });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next).toBe(state);
  });

  it("is a no-op when gameStatus is not playing", () => {
    const state = makeState({ currentGuess: "Messi", gameStatus: "won" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next).toBe(state);
  });

  it("is a no-op when gameStatus is lost", () => {
    const state = makeState({ currentGuess: "Messi", gameStatus: "lost" });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next).toBe(state);
  });

  it("sets gameStatus to lost on the 3rd wrong guess", () => {
    const state = makeState({
      currentGuess: "Ronaldo",
      incorrectGuesses: ["Messi", "Neymar"],
    });
    const next = transferGuessReducer(state, { type: "GUESS", answer: ANSWER });
    expect(next.gameStatus).toBe("lost");
    expect(next.incorrectGuesses).toHaveLength(3);
  });
});

// ============================================================================
// REVEAL_HINT
// ============================================================================

describe("REVEAL_HINT", () => {
  it("increments hintsRevealed", () => {
    const state = makeState({ hintsRevealed: 0 });
    const next = transferGuessReducer(state, { type: "REVEAL_HINT" });
    expect(next.hintsRevealed).toBe(1);
  });

  it("increments from 1 to 2", () => {
    const state = makeState({ hintsRevealed: 1 });
    const next = transferGuessReducer(state, { type: "REVEAL_HINT" });
    expect(next.hintsRevealed).toBe(2);
  });

  it("increments from 2 to 3", () => {
    const state = makeState({ hintsRevealed: 2 });
    const next = transferGuessReducer(state, { type: "REVEAL_HINT" });
    expect(next.hintsRevealed).toBe(3);
  });

  it("is a no-op when hintsRevealed is already 3", () => {
    const state = makeState({ hintsRevealed: 3 });
    const next = transferGuessReducer(state, { type: "REVEAL_HINT" });
    expect(next).toBe(state);
  });

  it("is a no-op when gameStatus is won", () => {
    const state = makeState({ hintsRevealed: 1, gameStatus: "won" });
    const next = transferGuessReducer(state, { type: "REVEAL_HINT" });
    expect(next).toBe(state);
  });

  it("is a no-op when gameStatus is lost", () => {
    const state = makeState({ hintsRevealed: 1, gameStatus: "lost" });
    const next = transferGuessReducer(state, { type: "REVEAL_HINT" });
    expect(next).toBe(state);
  });
});

// ============================================================================
// GIVE_UP
// ============================================================================

describe("GIVE_UP", () => {
  it("sets gameStatus to lost", () => {
    const state = makeState();
    const next = transferGuessReducer(state, { type: "GIVE_UP" });
    expect(next.gameStatus).toBe("lost");
  });

  it("is a no-op when already won", () => {
    const state = makeState({ gameStatus: "won" });
    const next = transferGuessReducer(state, { type: "GIVE_UP" });
    expect(next).toBe(state);
  });

  it("is a no-op when already lost", () => {
    const state = makeState({ gameStatus: "lost" });
    const next = transferGuessReducer(state, { type: "GIVE_UP" });
    expect(next).toBe(state);
  });
});

// ============================================================================
// CLEAR_SHAKE
// ============================================================================

describe("CLEAR_SHAKE", () => {
  it("sets isShaking to false", () => {
    const state = makeState({ isShaking: true });
    const next = transferGuessReducer(state, { type: "CLEAR_SHAKE" });
    expect(next.isShaking).toBe(false);
  });

  it("does not change other state fields", () => {
    const state = makeState({
      isShaking: true,
      currentGuess: "test",
      hintsRevealed: 2,
      incorrectGuesses: ["wrong"],
    });
    const next = transferGuessReducer(state, { type: "CLEAR_SHAKE" });
    expect(next.currentGuess).toBe("test");
    expect(next.hintsRevealed).toBe(2);
    expect(next.incorrectGuesses).toEqual(["wrong"]);
  });
});
