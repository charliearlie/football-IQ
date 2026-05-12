import { describe, it, expect } from "vitest";
import {
  createInitialState,
  theThreadReducer,
  type TheThreadState,
} from "../types";

const initial = (): TheThreadState => createInitialState();
const liverpool = { id: "Q1130849", name: "Liverpool" };
const arsenal = { id: "Q9617", name: "Arsenal" };

describe("theThreadReducer", () => {
  describe("SUBMIT_GUESS", () => {
    it("transitions to 'won' with a 10-point score on a 0-hint correct guess", () => {
      const next = theThreadReducer(initial(), {
        type: "SUBMIT_GUESS",
        payload: { club: liverpool, isCorrect: true },
      });
      expect(next.gameStatus).toBe("won");
      expect(next.score?.points).toBe(10);
      expect(next.score?.hintsRevealed).toBe(0);
      expect(next.guesses).toHaveLength(1);
    });

    it("records an incorrect guess + sets shake flag, stays playing", () => {
      const next = theThreadReducer(initial(), {
        type: "SUBMIT_GUESS",
        payload: { club: arsenal, isCorrect: false },
      });
      expect(next.gameStatus).toBe("playing");
      expect(next.guesses).toEqual([arsenal]);
      expect(next.lastGuessIncorrect).toBe(true);
    });

    it("threads hintsRevealed into the score on a correct guess", () => {
      const afterTwoHints: TheThreadState = { ...initial(), hintsRevealed: 2 };
      const next = theThreadReducer(afterTwoHints, {
        type: "SUBMIT_GUESS",
        payload: { club: liverpool, isCorrect: true },
      });
      expect(next.score?.points).toBe(4);
      expect(next.score?.hintsRevealed).toBe(2);
    });
  });

  describe("REVEAL_HINT", () => {
    it("increments hintsRevealed up to the totalHidden cap", () => {
      let s = initial();
      s = theThreadReducer(s, { type: "REVEAL_HINT", payload: { totalHidden: 3 } });
      s = theThreadReducer(s, { type: "REVEAL_HINT", payload: { totalHidden: 3 } });
      s = theThreadReducer(s, { type: "REVEAL_HINT", payload: { totalHidden: 3 } });
      // One more reveal should be a no-op (capped at 3).
      const capped = theThreadReducer(s, { type: "REVEAL_HINT", payload: { totalHidden: 3 } });
      expect(capped.hintsRevealed).toBe(3);
    });

    it("is a no-op once the game ends", () => {
      const won: TheThreadState = { ...initial(), gameStatus: "won" };
      const next = theThreadReducer(won, { type: "REVEAL_HINT", payload: { totalHidden: 3 } });
      expect(next.hintsRevealed).toBe(0);
    });
  });

  describe("GIVE_UP", () => {
    it("transitions to 'revealed' with a 0-point score and preserves hints used", () => {
      const state: TheThreadState = { ...initial(), hintsRevealed: 2 };
      const next = theThreadReducer(state, { type: "GIVE_UP" });
      expect(next.gameStatus).toBe("revealed");
      expect(next.score?.points).toBe(0);
      expect(next.score?.hintsRevealed).toBe(2);
    });

    it("is a no-op when the game is not in progress", () => {
      const won: TheThreadState = { ...initial(), gameStatus: "won" };
      const next = theThreadReducer(won, { type: "GIVE_UP" });
      expect(next).toBe(won);
    });
  });

  it("CLEAR_SHAKE clears the shake flag", () => {
    const shaken: TheThreadState = { ...initial(), lastGuessIncorrect: true };
    expect(theThreadReducer(shaken, { type: "CLEAR_SHAKE" }).lastGuessIncorrect).toBe(false);
  });

  it("RESET returns a fresh initial state", () => {
    const dirty: TheThreadState = {
      guesses: [arsenal],
      gameStatus: "won",
      score: { points: 6, maxPoints: 10, guessCount: 1, won: true, hintsRevealed: 1 },
      lastGuessIncorrect: false,
      hintsRevealed: 2,
    };
    expect(theThreadReducer(dirty, { type: "RESET" })).toEqual(initial());
  });
});
