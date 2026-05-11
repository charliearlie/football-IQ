// web/lib/whos-that/types.ts
export type { WhosThatContent } from "@/lib/schemas/puzzle-schemas";

/** Colour-coded feedback for a single attribute cell. */
export type FeedbackColor = "green" | "yellow" | "red";

export interface AttributeFeedback {
  /** Display value shown in the cell. */
  value: string;
  /** Colour indicating correctness. */
  color: FeedbackColor;
  /** Direction arrow for birth-year attribute. */
  direction?: "up" | "down";
}

/** Feedback for a single guess (one row in the grid). */
export interface GuessFeedback {
  playerName: string;
  club: AttributeFeedback;
  league: AttributeFeedback;
  nationality: AttributeFeedback;
  position: AttributeFeedback;
  birthYear: AttributeFeedback;
}

/** Attributes of a guessed player (input to feedback generation). */
export interface GuessInput {
  playerName: string;
  club: string;
  league: string;
  nationality: string;
  position: string;
  birthYear: number;
}

/** Game state. */
export interface WhosThatState {
  guesses: GuessFeedback[];
  maxGuesses: number;
  gameStatus: "playing" | "won" | "lost";
  lastGuessIncorrect: boolean;
}

export type WhosThatAction =
  | { type: "SUBMIT_GUESS"; payload: GuessFeedback & { isCorrect: boolean } }
  | { type: "CLEAR_SHAKE" }
  | { type: "RESET" };

export function createInitialState(): WhosThatState {
  return {
    guesses: [],
    maxGuesses: 6,
    gameStatus: "playing",
    lastGuessIncorrect: false,
  };
}
