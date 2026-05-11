export type { TopTensContent, TopTenAnswer } from "@/lib/schemas/puzzle-schemas";

import type { TopTenAnswer } from "@/lib/schemas/puzzle-schemas";

/** Rank indices 0-9 (representing display ranks 1-10). */
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** State for a single rank slot in the grid. */
export interface RankSlotState {
  /** Display rank (1-10). */
  rank: number;
  /** Whether this slot has been found. */
  found: boolean;
  /** Whether this slot was auto-revealed on give-up. */
  autoRevealed: boolean;
  /** The answer (revealed when found). */
  answer: TopTenAnswer | null;
}

/** Score structure. */
export interface TopTensScore {
  /** Points earned (0-8, flat tier scoring). */
  points: number;
  /** Maximum possible points (always 8). */
  maxPoints: 8;
  /** Number of answers found (0-10). */
  foundCount: number;
  /** Number of incorrect guesses made. */
  wrongGuessCount: number;
  /** Whether player found all answers (won). */
  won: boolean;
}

export type TopTensGameStatus = "playing" | "won" | "lost";

/** Game state. */
export interface TopTensState {
  gameStatus: TopTensGameStatus;
  rankSlots: RankSlotState[];
  foundCount: number;
  wrongGuessCount: number;
  /** Triggers shake animation on incorrect guess. */
  lastGuessIncorrect: boolean;
  /** Triggers duplicate feedback (already found). */
  lastGuessDuplicate: boolean;
}

export type TopTensAction =
  | { type: "CORRECT_GUESS"; payload: { rankIndex: RankIndex; answer: TopTenAnswer } }
  | { type: "INCORRECT_GUESS" }
  | { type: "DUPLICATE_GUESS" }
  | { type: "CLEAR_FEEDBACK" }
  | { type: "GIVE_UP"; payload: { answers: TopTenAnswer[] } }
  | { type: "RESET" };

export function createInitialState(): TopTensState {
  return {
    gameStatus: "playing",
    rankSlots: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      found: false,
      autoRevealed: false,
      answer: null,
    })),
    foundCount: 0,
    wrongGuessCount: 0,
    lastGuessIncorrect: false,
    lastGuessDuplicate: false,
  };
}
