import type { TheThreadContent } from "@/lib/schemas/puzzle-schemas";
import { calculateThreadScore, type ThreadScore } from "./scoring";

export type { TheThreadContent };
export type { ThreadScore };

/**
 * Minimal club shape we store in `guesses[]`. We don't need the full
 * UnifiedClub on web; just the id + display name.
 */
export interface ThreadGuess {
  id: string;
  name: string;
}

export type ThreadGameStatus = "playing" | "won" | "lost" | "revealed";

export interface TheThreadState {
  guesses: ThreadGuess[];
  gameStatus: ThreadGameStatus;
  score: ThreadScore | null;
  lastGuessIncorrect: boolean;
  hintsRevealed: number;
}

export type TheThreadAction =
  | { type: "SUBMIT_GUESS"; payload: { club: ThreadGuess; isCorrect: boolean } }
  | { type: "REVEAL_HINT"; payload: { totalHidden: number } }
  | { type: "GIVE_UP" }
  | { type: "CLEAR_SHAKE" }
  | { type: "RESET" };

export function createInitialState(): TheThreadState {
  return {
    guesses: [],
    gameStatus: "playing",
    score: null,
    lastGuessIncorrect: false,
    hintsRevealed: 0,
  };
}

export function theThreadReducer(
  state: TheThreadState,
  action: TheThreadAction
): TheThreadState {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { club, isCorrect } = action.payload;
      const newGuesses = [...state.guesses, club];
      if (isCorrect) {
        return {
          ...state,
          guesses: newGuesses,
          gameStatus: "won",
          score: calculateThreadScore(newGuesses.length, true, state.hintsRevealed),
          lastGuessIncorrect: false,
        };
      }
      return {
        ...state,
        guesses: newGuesses,
        lastGuessIncorrect: true,
      };
    }
    case "REVEAL_HINT": {
      if (state.gameStatus !== "playing") return state;
      if (state.hintsRevealed >= action.payload.totalHidden) return state;
      return { ...state, hintsRevealed: state.hintsRevealed + 1 };
    }
    case "GIVE_UP": {
      if (state.gameStatus !== "playing") return state;
      return {
        ...state,
        gameStatus: "revealed",
        score: calculateThreadScore(state.guesses.length, false, state.hintsRevealed),
      };
    }
    case "CLEAR_SHAKE":
      return { ...state, lastGuessIncorrect: false };
    case "RESET":
      return createInitialState();
  }
}
