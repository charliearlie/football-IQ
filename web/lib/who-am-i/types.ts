import type { WhoAmIContent } from "@/lib/schemas/puzzle-schemas";
import type { WhoAmIScore } from "./scoring";

export type { WhoAmIContent };

export type WhoAmIGameStatus = "playing" | "won" | "lost" | "revealed";

export interface WhoAmIState {
  cluesRevealed: number;
  guesses: string[];
  gameStatus: WhoAmIGameStatus;
  score: WhoAmIScore | null;
  lastGuessIncorrect: boolean;
}

export type WhoAmIAction =
  | { type: "SUBMIT_GUESS"; payload: { playerName: string; isCorrect: boolean; totalClues: number } }
  | { type: "REVEAL_NEXT_CLUE"; payload: { totalClues: number } }
  | { type: "GIVE_UP"; payload: { totalClues: number } }
  | { type: "CLEAR_SHAKE" }
  | { type: "RESET" };

export function createInitialState(): WhoAmIState {
  return {
    cluesRevealed: 1,
    guesses: [],
    gameStatus: "playing",
    score: null,
    lastGuessIncorrect: false,
  };
}

import { calculateWhoAmIScore } from "./scoring";

export function whoAmIReducer(state: WhoAmIState, action: WhoAmIAction): WhoAmIState {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { playerName, isCorrect, totalClues } = action.payload;
      if (isCorrect) {
        return {
          ...state,
          gameStatus: "won",
          score: calculateWhoAmIScore(totalClues, state.cluesRevealed, true),
          lastGuessIncorrect: false,
        };
      }
      return {
        ...state,
        guesses: [...state.guesses, playerName],
        lastGuessIncorrect: true,
      };
    }
    case "REVEAL_NEXT_CLUE": {
      if (state.gameStatus !== "playing") return state;
      const next = state.cluesRevealed + 1;
      if (next > action.payload.totalClues) return state;
      return { ...state, cluesRevealed: next };
    }
    case "GIVE_UP": {
      if (state.gameStatus !== "playing") return state;
      return {
        ...state,
        gameStatus: "revealed",
        score: calculateWhoAmIScore(action.payload.totalClues, state.cluesRevealed, false),
      };
    }
    case "CLEAR_SHAKE":
      return { ...state, lastGuessIncorrect: false };
    case "RESET":
      return createInitialState();
  }
}
