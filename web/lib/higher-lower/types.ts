// web/lib/higher-lower/types.ts
export type { HigherLowerContent } from "@/lib/schemas/puzzle-schemas";

/** Known stat categories — drives value formatting. */
export type StatType =
  | "transfer_fee"
  | "league_appearances"
  | "international_caps"
  | "goals"
  | "assists"
  | "clean_sheets";

/** A single normalised entry — what the parser returns and what the UI consumes. */
export interface HigherLowerEntry {
  /** Player name. */
  name: string;
  /** Club or national team / transfer route. */
  context: string;
  /** Human-readable stat label, e.g. "League Appearances". */
  statLabel: string;
  /** Machine-readable stat category. */
  statType: StatType;
  /** Numeric stat value. */
  value: number;
}

/** One comparison pair (round N). */
export interface TransferPair {
  player1: HigherLowerEntry;
  player2: HigherLowerEntry;
}

/** Game state. */
export interface HigherLowerState {
  /** Current round index (0-based). */
  currentRound: number;
  /** Total rounds in the game. */
  totalRounds: number;
  /** User's answers per completed round. */
  answers: ("higher" | "lower")[];
  /** Whether each answer was correct. */
  results: boolean[];
  /** Current game status. */
  gameStatus: "playing" | "won" | "lost";
  /** True while showing the round's result before advancing. */
  showingResult: boolean;
}

export type HigherLowerAction =
  | { type: "SUBMIT_ANSWER"; payload: { answer: "higher" | "lower"; isCorrect: boolean } }
  | { type: "ADVANCE_ROUND" }
  | { type: "RESET" };

export function createInitialState(totalRounds: number): HigherLowerState {
  return {
    currentRound: 0,
    totalRounds,
    answers: [],
    results: [],
    gameStatus: "playing",
    showingResult: false,
  };
}
