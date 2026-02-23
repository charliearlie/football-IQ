"use client";

import { useReducer, useCallback, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import { Shuffle, X, ChevronRight } from "lucide-react";
import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";
import {
  generateConnectionsShareText,
  type ConnectionsGuessResult,
  type ConnectionsGroupInfo,
} from "@/lib/shareText";
import { cn } from "@/lib/utils";
import { useGameComplete } from "./GamePageShell";
import { useGameTracking } from "@/hooks/use-game-tracking";

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionsGroupWeb {
  category: string;
  difficulty: "yellow" | "green" | "blue" | "purple";
  players: [string, string, string, string];
}

interface ConnectionsGuessWeb {
  players: string[];
  correct: boolean;
  matchCount?: number;
  matchedDifficulty?: "yellow" | "green" | "blue" | "purple";
}

export interface ConnectionsState {
  selectedPlayers: string[];
  solvedGroups: ConnectionsGroupWeb[];
  remainingPlayers: string[];
  mistakes: number;
  guesses: ConnectionsGuessWeb[];
  gameStatus: "playing" | "won" | "lost";
  lastGuessResult: "correct" | "incorrect" | "close" | null;
  revealingGroup: ConnectionsGroupWeb | null;
}

export type ConnectionsAction =
  | { type: "TOGGLE_PLAYER"; payload: string }
  | { type: "SUBMIT_GUESS"; groups: ConnectionsGroupWeb[] }
  | { type: "SHUFFLE_REMAINING" }
  | { type: "DESELECT_ALL" }
  | { type: "GIVE_UP"; groups: ConnectionsGroupWeb[] }
  | { type: "CLEAR_FEEDBACK" };

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if a guess matches a group.
 * Returns match info for feedback.
 */
export function checkGuess(
  selected: string[],
  groups: ConnectionsGroupWeb[],
  solvedGroups: ConnectionsGroupWeb[]
): {
  correct: boolean;
  matchedGroup?: ConnectionsGroupWeb;
  matchCount?: number;
} {
  // Only check unsolved groups
  const unsolved = groups.filter(
    (g) => !solvedGroups.some((s) => s.category === g.category)
  );

  for (const group of unsolved) {
    const matches = selected.filter((p) => group.players.includes(p));
    if (matches.length === 4) {
      return { correct: true, matchedGroup: group };
    }
  }

  // Find best partial match for "close" feedback (3 out of 4)
  let bestMatch = 0;
  let bestGroup: ConnectionsGroupWeb | undefined;
  for (const group of unsolved) {
    const matches = selected.filter((p) => group.players.includes(p));
    if (matches.length > bestMatch) {
      bestMatch = matches.length;
      bestGroup = group;
    }
  }

  return { correct: false, matchedGroup: bestGroup, matchCount: bestMatch };
}

// ============================================================================
// REDUCER
// ============================================================================

export function connectionsReducer(
  state: ConnectionsState,
  action: ConnectionsAction
): ConnectionsState {
  switch (action.type) {
    case "TOGGLE_PLAYER": {
      if (state.gameStatus !== "playing") return state;

      const player = action.payload;
      const isSelected = state.selectedPlayers.includes(player);

      if (isSelected) {
        return {
          ...state,
          selectedPlayers: state.selectedPlayers.filter((p) => p !== player),
          lastGuessResult: null,
        };
      } else {
        if (state.selectedPlayers.length >= 4) return state;
        return {
          ...state,
          selectedPlayers: [...state.selectedPlayers, player],
          lastGuessResult: null,
        };
      }
    }

    case "SUBMIT_GUESS": {
      if (
        state.selectedPlayers.length !== 4 ||
        state.gameStatus !== "playing"
      ) {
        return state;
      }

      const guessResult = checkGuess(
        state.selectedPlayers,
        action.groups,
        state.solvedGroups
      );

      if (guessResult.correct && guessResult.matchedGroup) {
        const guess: ConnectionsGuessWeb = {
          players: [...state.selectedPlayers],
          correct: true,
          matchedDifficulty: guessResult.matchedGroup.difficulty,
        };

        const newSolvedGroups = [...state.solvedGroups, guessResult.matchedGroup];
        const newRemainingPlayers = state.remainingPlayers.filter(
          (p) => !guessResult.matchedGroup!.players.includes(p)
        );
        const newGuesses = [...state.guesses, guess];

        if (newSolvedGroups.length === 4) {
          return {
            ...state,
            selectedPlayers: [],
            solvedGroups: newSolvedGroups,
            remainingPlayers: newRemainingPlayers,
            guesses: newGuesses,
            gameStatus: "won",
            lastGuessResult: "correct",
            revealingGroup: guessResult.matchedGroup,
          };
        }

        return {
          ...state,
          selectedPlayers: [],
          solvedGroups: newSolvedGroups,
          remainingPlayers: newRemainingPlayers,
          guesses: newGuesses,
          lastGuessResult: "correct",
          revealingGroup: guessResult.matchedGroup,
        };
      } else {
        const newMistakes = state.mistakes + 1;
        const guess: ConnectionsGuessWeb = {
          players: [...state.selectedPlayers],
          correct: false,
          matchCount: guessResult.matchCount,
        };
        const newGuesses = [...state.guesses, guess];

        if (newMistakes >= 4) {
          const allUnsolved = action.groups.filter(
            (g) => !state.solvedGroups.some((s) => s.category === g.category)
          );
          return {
            ...state,
            selectedPlayers: [],
            remainingPlayers: [],
            solvedGroups: [...state.solvedGroups, ...allUnsolved],
            mistakes: newMistakes,
            guesses: newGuesses,
            gameStatus: "lost",
            lastGuessResult: guessResult.matchCount === 3 ? "close" : "incorrect",
            revealingGroup: null,
          };
        }

        return {
          ...state,
          selectedPlayers: guessResult.matchCount === 3 ? state.selectedPlayers : [],
          mistakes: newMistakes,
          guesses: newGuesses,
          lastGuessResult: guessResult.matchCount === 3 ? "close" : "incorrect",
        };
      }
    }

    case "SHUFFLE_REMAINING": {
      return {
        ...state,
        remainingPlayers: shuffleArray(state.remainingPlayers),
        lastGuessResult: null,
      };
    }

    case "DESELECT_ALL": {
      return {
        ...state,
        selectedPlayers: [],
        lastGuessResult: null,
      };
    }

    case "GIVE_UP": {
      if (state.gameStatus !== "playing") return state;

      const allUnsolved = action.groups.filter(
        (g) => !state.solvedGroups.some((s) => s.category === g.category)
      );

      return {
        ...state,
        selectedPlayers: [],
        remainingPlayers: [],
        solvedGroups: [...state.solvedGroups, ...allUnsolved],
        gameStatus: "lost",
      };
    }

    case "CLEAR_FEEDBACK": {
      return {
        ...state,
        lastGuessResult: null,
        revealingGroup: null,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIFFICULTY_BG_CLASSES: Record<string, string> = {
  yellow: "bg-card-yellow",
  green: "bg-pitch-green",
  blue: "bg-sky-blue",
  purple: "bg-white/10 border border-white/20",
};

const DIFFICULTY_TEXT_CLASSES: Record<string, string> = {
  yellow: "text-stadium-navy",
  green: "text-stadium-navy",
  blue: "text-white",
  purple: "text-white",
};

// ============================================================================
// COMPONENT
// ============================================================================

interface ConnectionsGameProps {
  content: ConnectionsContent;
  puzzleDate: string;
}

function triggerConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

  const fire = (ratio: number, opts: confetti.Options) =>
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });

  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2, y: 0.7 } });
  fire(0.2, { spread: 60, origin: { x: 0.5, y: 0.7 } });
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8, y: 0.7 } });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function ConnectionsGame({ content, puzzleDate }: ConnectionsGameProps) {
  const onGameComplete = useGameComplete();
  const { trackGameStarted, trackGameCompleted } = useGameTracking(
    "connections",
    puzzleDate
  );

  const groups = useMemo(
    () => content.groups as unknown as ConnectionsGroupWeb[],
    [content.groups]
  );

  const initialPlayers = useMemo(() => {
    const allPlayers = groups.flatMap((g) => g.players);
    return shuffleArray(allPlayers);
  }, [groups]);

  const [state, dispatch] = useReducer(connectionsReducer, {
    selectedPlayers: [],
    solvedGroups: [],
    remainingPlayers: initialPlayers,
    mistakes: 0,
    guesses: [],
    gameStatus: "playing",
    lastGuessResult: null,
    revealingGroup: null,
  } satisfies ConnectionsState);

  useEffect(() => {
    trackGameStarted();
  }, [trackGameStarted]);

  // Clear feedback after 1.5s
  useEffect(() => {
    if (state.lastGuessResult === null) return;
    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_FEEDBACK" });
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.lastGuessResult]);

  // Trigger side effects when game ends
  useEffect(() => {
    if (state.gameStatus !== "won" && state.gameStatus !== "lost") return;

    const guessResults: ConnectionsGuessResult[] = state.guesses.map((g) => ({
      players: g.players,
      correct: g.correct,
      matchedDifficulty: g.matchedDifficulty,
    }));
    const groupInfos: ConnectionsGroupInfo[] = content.groups.map((g) => ({
      difficulty: g.difficulty,
      players: [...g.players],
    }));
    const shareText = generateConnectionsShareText(
      guessResults,
      groupInfos,
      state.mistakes,
      puzzleDate
    );

    if (state.gameStatus === "won") {
      triggerConfetti();
      trackGameCompleted("won", `${state.solvedGroups.length}/4`);
      onGameComplete({ won: true, answer: "Connections", shareText });
    } else {
      trackGameCompleted("lost", `${state.solvedGroups.length}/4`);
      onGameComplete({ won: false, answer: "Connections", shareText });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  const handleSubmit = useCallback(() => {
    dispatch({ type: "SUBMIT_GUESS", groups });
  }, [groups]);

  return (
    <div>
      {/* Game status bar */}
      <div className="flex justify-between items-end border-b border-white/5 pb-4 mb-4">
        <div>
          <p className="text-pitch-green text-[10px] font-bold uppercase tracking-widest mb-1">
            Objective
          </p>
          <p className="text-white text-sm font-medium opacity-90">
            Find groups of four
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
            Mistakes Left
          </p>
          <div className="flex gap-2 justify-end">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  i < 4 - state.mistakes
                    ? "bg-pitch-green shadow-[0_0_6px_#58CC02]"
                    : "border border-white/20 bg-transparent scale-75"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Solved groups */}
      <div className="space-y-3 mb-3">
        {state.solvedGroups.map((group) => {
          const bgClass =
            DIFFICULTY_BG_CLASSES[group.difficulty] || "bg-white/10";
          const textClass =
            DIFFICULTY_TEXT_CLASSES[group.difficulty] || "text-white";

          return (
            <div
              key={group.category}
              className={cn(
                "w-full rounded-xl p-4 shadow-glow animate-merge flex flex-col items-center justify-center text-center relative overflow-hidden transition-all hover:scale-[1.02]",
                bgClass
              )}
            >
              <div className="shimmer-overlay" />
              <div className="relative z-10 flex flex-col items-center">
                <h3
                  className={cn(
                    "font-bebas text-2xl tracking-widest mb-1",
                    textClass
                  )}
                >
                  {group.category}
                </h3>
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.15em] opacity-80",
                    textClass
                  )}
                >
                  {group.players.join(" \u2022 ")}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20" />
            </div>
          );
        })}
      </div>

      {/* 4x4 player grid with 3D tiles */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {state.remainingPlayers.map((name) => {
          const isSelected = state.selectedPlayers.includes(name);
          const isError =
            state.lastGuessResult === "incorrect" && isSelected;

          return (
            <button
              key={name}
              onClick={() =>
                dispatch({ type: "TOGGLE_PLAYER", payload: name })
              }
              disabled={state.gameStatus !== "playing"}
              className={cn(
                "game-tile rounded-xl p-1 font-bebas tracking-wide text-center min-h-[72px] sm:min-h-[80px] select-none flex items-center justify-center outline-none",
                isError
                  ? "game-tile-error animate-shake"
                  : isSelected
                    ? "game-tile-selected"
                    : "game-tile-default"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none drop-shadow-md relative z-10",
                  name.length > 8 ? "text-[13px] leading-4" : "text-lg"
                )}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* "One away!" feedback */}
      {state.lastGuessResult === "close" && (
        <p className="text-center text-amber font-semibold text-sm mb-3 animate-pulse">
          One away!
        </p>
      )}

      {/* Footer controls */}
      {state.gameStatus === "playing" && (
        <div className="glass-card rounded-t-2xl border-t border-white/10 p-4 -mx-4 -mb-6">
          {/* Shuffle & Deselect */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={() => dispatch({ type: "SHUFFLE_REMAINING" })}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <Shuffle className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              SHUFFLE
            </button>
            <button
              onClick={() => dispatch({ type: "DESELECT_ALL" })}
              disabled={state.selectedPlayers.length === 0}
              className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-30"
            >
              <X className="w-3.5 h-3.5 group-hover:text-red-card transition-colors" />
              DESELECT
            </button>
          </div>

          {/* Submit button with glow */}
          <div className="relative group">
            <div
              className={cn(
                "absolute -inset-1 bg-pitch-green rounded-2xl blur transition duration-500",
                state.selectedPlayers.length === 4
                  ? "opacity-60"
                  : "opacity-0"
              )}
            />
            <button
              onClick={handleSubmit}
              disabled={state.selectedPlayers.length !== 4}
              className={cn(
                "relative w-full h-14 rounded-xl font-bebas text-2xl tracking-[0.15em] transition-all transform overflow-hidden flex items-center justify-center gap-2",
                state.selectedPlayers.length === 4
                  ? "bg-pitch-green text-stadium-navy shadow-[0_6px_0_#3a8501] active:translate-y-[6px] active:shadow-[0_0_0_#3a8501]"
                  : "bg-white/10 text-white/30 opacity-40 cursor-not-allowed"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                SUBMIT
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Win display */}
      {state.gameStatus === "won" && (
        <div className="text-center py-4">
          <p className="text-pitch-green font-bebas text-2xl tracking-wide">
            WELL PLAYED!
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {state.mistakes === 0
              ? "Perfect — no mistakes!"
              : `${state.mistakes} mistake${state.mistakes > 1 ? "s" : ""}`}
          </p>
        </div>
      )}

      {/* Loss display */}
      {state.gameStatus === "lost" && (
        <div className="text-center py-4">
          <p className="text-red-card font-semibold mb-1">
            Better luck tomorrow!
          </p>
          <p className="text-slate-400 text-sm">
            {state.solvedGroups.length}/4 groups found
          </p>
        </div>
      )}
    </div>
  );
}
