"use client";

import { useReducer, useCallback, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";
import {
  generateConnectionsShareText,
  type ConnectionsGuessResult,
  type ConnectionsGroupInfo,
} from "@/lib/shareText";
import { cn } from "@/lib/utils";
import { useGameComplete } from "./GamePageShell";

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

const DIFFICULTY_COLORS: Record<string, string> = {
  yellow: "#FACC15",
  green: "#58CC02",
  blue: "#3B82F6",
  purple: "#A855F7",
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

  // Clear feedback after 1.5s
  useEffect(() => {
    if (state.lastGuessResult === null) return;
    // Don't clear "close" immediately — it should stay visible briefly
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
      onGameComplete({ won: true, answer: "Connections", shareText });
    } else {
      onGameComplete({ won: false, answer: "Connections", shareText });
    }
    // We only want this to fire once when gameStatus transitions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  const handleSubmit = useCallback(() => {
    dispatch({ type: "SUBMIT_GUESS", groups });
  }, [groups]);

  return (
    <div>
      {/* Solved groups — colored banners at top */}
      {state.solvedGroups.map((group) => (
        <div
          key={group.category}
          style={{ backgroundColor: DIFFICULTY_COLORS[group.difficulty] }}
          className="rounded-lg p-4 mb-2.5 text-center"
        >
          <p className="font-bebas text-base text-stadium-navy uppercase tracking-wider">
            {group.category}
          </p>
          <p className="text-xs font-medium text-stadium-navy/70">
            {group.players.join(" \u2022 ")}
          </p>
        </div>
      ))}

      {/* 4x4 player grid */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {state.remainingPlayers.map((name) => (
          <button
            key={name}
            onClick={() => dispatch({ type: "TOGGLE_PLAYER", payload: name })}
            disabled={state.gameStatus !== "playing"}
            className={cn(
              "rounded-lg p-3 font-bebas text-base tracking-wide text-center transition-all min-h-[72px] sm:min-h-[80px] select-none flex items-center justify-center",
              state.selectedPlayers.includes(name)
                ? "bg-pitch-green text-stadium-navy scale-95 border-2 border-pitch-green"
                : "bg-white/10 text-floodlight hover:bg-white/15 border-2 border-transparent"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Mistake dots */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        <span className="text-xs text-slate-400 mr-2">Mistakes remaining:</span>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              i < 4 - state.mistakes ? "bg-red-card" : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* "One away!" feedback */}
      {state.lastGuessResult === "close" && (
        <p className="text-center text-amber font-semibold text-sm mb-3 animate-pulse">
          One away!
        </p>
      )}

      {/* Action buttons */}
      {state.gameStatus === "playing" && (
        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: "SHUFFLE_REMAINING" })}
            className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            Shuffle
          </button>
          <button
            onClick={() => dispatch({ type: "DESELECT_ALL" })}
            disabled={state.selectedPlayers.length === 0}
            className="flex-1 py-2.5 px-3 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-30"
          >
            Deselect All
          </button>
          <button
            onClick={handleSubmit}
            disabled={state.selectedPlayers.length !== 4}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-colors",
              state.selectedPlayers.length === 4
                ? "bg-pitch-green text-stadium-navy hover:bg-pitch-green/90"
                : "bg-white/5 text-slate-500 cursor-not-allowed"
            )}
          >
            Submit
          </button>
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
