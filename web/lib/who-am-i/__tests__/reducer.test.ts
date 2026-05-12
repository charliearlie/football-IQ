import { describe, it, expect } from "vitest";
import {
  createInitialState,
  whoAmIReducer,
  type WhoAmIState,
} from "../types";

const initial = (): WhoAmIState => createInitialState();

describe("whoAmIReducer", () => {
  describe("SUBMIT_GUESS", () => {
    it("transitions to 'won' with a score when correct", () => {
      const next = whoAmIReducer(initial(), {
        type: "SUBMIT_GUESS",
        payload: { playerName: "Messi", isCorrect: true, totalClues: 5 },
      });
      expect(next.gameStatus).toBe("won");
      expect(next.score).toEqual({ points: 5, maxPoints: 5, cluesRevealed: 1, won: true });
      expect(next.lastGuessIncorrect).toBe(false);
    });

    it("records an incorrect guess and sets shake flag", () => {
      const next = whoAmIReducer(initial(), {
        type: "SUBMIT_GUESS",
        payload: { playerName: "Ronaldo", isCorrect: false, totalClues: 5 },
      });
      expect(next.gameStatus).toBe("playing");
      expect(next.guesses).toEqual(["Ronaldo"]);
      expect(next.lastGuessIncorrect).toBe(true);
    });

    it("uses cluesRevealed in score calculation", () => {
      const after2Clues: WhoAmIState = { ...initial(), cluesRevealed: 3 };
      const next = whoAmIReducer(after2Clues, {
        type: "SUBMIT_GUESS",
        payload: { playerName: "Messi", isCorrect: true, totalClues: 5 },
      });
      expect(next.score?.points).toBe(3);
    });
  });

  describe("REVEAL_NEXT_CLUE", () => {
    it("increments cluesRevealed", () => {
      const next = whoAmIReducer(initial(), {
        type: "REVEAL_NEXT_CLUE",
        payload: { totalClues: 5 },
      });
      expect(next.cluesRevealed).toBe(2);
    });

    it("does not exceed totalClues", () => {
      const atMax: WhoAmIState = { ...initial(), cluesRevealed: 5 };
      const next = whoAmIReducer(atMax, {
        type: "REVEAL_NEXT_CLUE",
        payload: { totalClues: 5 },
      });
      expect(next.cluesRevealed).toBe(5);
    });

    it("is a no-op once the game ended", () => {
      const won: WhoAmIState = { ...initial(), gameStatus: "won" };
      const next = whoAmIReducer(won, {
        type: "REVEAL_NEXT_CLUE",
        payload: { totalClues: 5 },
      });
      expect(next.cluesRevealed).toBe(1);
    });
  });

  describe("GIVE_UP", () => {
    it("transitions to 'revealed' with a 0-point score", () => {
      const state: WhoAmIState = { ...initial(), cluesRevealed: 3 };
      const next = whoAmIReducer(state, {
        type: "GIVE_UP",
        payload: { totalClues: 5 },
      });
      expect(next.gameStatus).toBe("revealed");
      expect(next.score).toEqual({ points: 0, maxPoints: 5, cluesRevealed: 3, won: false });
    });

    it("is a no-op when the game is not in progress", () => {
      const won: WhoAmIState = { ...initial(), gameStatus: "won" };
      const next = whoAmIReducer(won, {
        type: "GIVE_UP",
        payload: { totalClues: 5 },
      });
      expect(next).toBe(won);
    });
  });

  describe("CLEAR_SHAKE / RESET", () => {
    it("clears the shake flag", () => {
      const shaken: WhoAmIState = { ...initial(), lastGuessIncorrect: true };
      expect(whoAmIReducer(shaken, { type: "CLEAR_SHAKE" }).lastGuessIncorrect).toBe(false);
    });

    it("RESET returns a fresh initial state", () => {
      const dirty: WhoAmIState = {
        cluesRevealed: 4,
        guesses: ["a", "b"],
        gameStatus: "won",
        score: { points: 2, maxPoints: 5, cluesRevealed: 4, won: true },
        lastGuessIncorrect: true,
      };
      expect(whoAmIReducer(dirty, { type: "RESET" })).toEqual(initial());
    });
  });
});
