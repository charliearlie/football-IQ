"use client";

import { useReducer, useCallback } from "react";
import confetti from "canvas-confetti";
import { ArrowRight, Lock } from "lucide-react";
import type { TransferGuessContent } from "@/lib/schemas/puzzle-schemas";
import { validateGuess } from "@/lib/validation";
import { generateTransferGuessShareText } from "@/lib/shareText";
import { Input } from "@/components/ui/input";
import { CTAButton } from "@/components/landing/CTAButton";
import { FlagIcon } from "@/components/ui/flag-icon";
import { cn } from "@/lib/utils";
import { useGameComplete } from "./GamePageShell";

// ============================================================================
// TYPES & REDUCER
// ============================================================================

export interface TransferGuessState {
  gameStatus: "playing" | "won" | "lost";
  currentGuess: string;
  incorrectGuesses: string[];
  hintsRevealed: number;
  isShaking: boolean;
}

export type TransferGuessAction =
  | { type: "SET_GUESS"; payload: string }
  | { type: "GUESS"; answer: string }
  | { type: "REVEAL_HINT" }
  | { type: "GIVE_UP" }
  | { type: "CLEAR_SHAKE" };

export function transferGuessReducer(
  state: TransferGuessState,
  action: TransferGuessAction
): TransferGuessState {
  switch (action.type) {
    case "SET_GUESS":
      return { ...state, currentGuess: action.payload };

    case "GUESS": {
      if (!state.currentGuess.trim() || state.gameStatus !== "playing") {
        return state;
      }

      const { isMatch } = validateGuess(state.currentGuess, action.answer);

      if (isMatch) {
        return {
          ...state,
          currentGuess: "",
          gameStatus: "won",
          hintsRevealed: 3,
          isShaking: false,
        };
      }

      const newIncorrectGuesses = [...state.incorrectGuesses, state.currentGuess];

      if (newIncorrectGuesses.length >= 3) {
        return {
          ...state,
          incorrectGuesses: newIncorrectGuesses,
          currentGuess: "",
          gameStatus: "lost",
          isShaking: true,
        };
      }

      return {
        ...state,
        incorrectGuesses: newIncorrectGuesses,
        currentGuess: "",
        isShaking: true,
      };
    }

    case "REVEAL_HINT": {
      if (state.gameStatus !== "playing" || state.hintsRevealed >= 3) {
        return state;
      }
      return { ...state, hintsRevealed: state.hintsRevealed + 1 };
    }

    case "GIVE_UP": {
      if (state.gameStatus !== "playing") {
        return state;
      }
      return { ...state, gameStatus: "lost" };
    }

    case "CLEAR_SHAKE":
      return { ...state, isShaking: false };

    default:
      return state;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

interface TransferGuessGameProps {
  content: TransferGuessContent;
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

const HINT_LABELS = ["Year", "Position", "Nationality"] as const;

export function TransferGuessGame({ content, puzzleDate }: TransferGuessGameProps) {
  const onGameComplete = useGameComplete();
  const [state, dispatch] = useReducer(transferGuessReducer, {
    gameStatus: "playing",
    currentGuess: "",
    incorrectGuesses: [],
    hintsRevealed: 0,
    isShaking: false,
  });

  const handleGuess = useCallback(() => {
    const prevStatus = state.gameStatus;
    const currentGuess = state.currentGuess;
    const incorrectGuesses = state.incorrectGuesses;

    dispatch({ type: "GUESS", answer: content.answer });

    if (prevStatus !== "playing") return;

    const { isMatch } = validateGuess(currentGuess, content.answer);

    if (isMatch) {
      triggerConfetti();
      const shareText = generateTransferGuessShareText(
        {
          won: true,
          hintsRevealed: state.hintsRevealed,
          guessCount: incorrectGuesses.length + 1,
        },
        puzzleDate
      );
      onGameComplete({ won: true, answer: content.answer, shareText });
    } else {
      const newIncorrectCount = incorrectGuesses.length + 1;
      if (newIncorrectCount >= 3) {
        const shareText = generateTransferGuessShareText(
          {
            won: false,
            hintsRevealed: state.hintsRevealed,
            guessCount: newIncorrectCount,
          },
          puzzleDate
        );
        onGameComplete({ won: false, answer: content.answer, shareText });
      }
      setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 500);
    }
  }, [
    state.currentGuess,
    state.incorrectGuesses,
    state.hintsRevealed,
    state.gameStatus,
    content.answer,
    puzzleDate,
    onGameComplete,
  ]);

  const handleRevealHint = useCallback(() => {
    dispatch({ type: "REVEAL_HINT" });
  }, []);

  return (
    <div>
      {/* Transfer card */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
        <p className="text-center text-xs text-slate-500 uppercase tracking-wider mb-4">
          Who made this transfer?
        </p>
        <div className="flex items-center justify-between gap-3">
          {/* From club circle */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: content.from_club_color || "#374151" }}
            >
              {content.from_club_abbreviation ||
                content.from_club.slice(0, 3).toUpperCase()}
            </div>
            <span className="text-xs text-slate-400 max-w-[80px] text-center truncate">
              {content.from_club}
            </span>
          </div>

          {/* Arrow + fee */}
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="w-5 h-5 text-slate-500" />
            <span className="font-bebas text-card-yellow text-lg">
              {content.fee}
            </span>
          </div>

          {/* To club circle */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: content.to_club_color || "#374151" }}
            >
              {content.to_club_abbreviation ||
                content.to_club.slice(0, 3).toUpperCase()}
            </div>
            <span className="text-xs text-slate-400 max-w-[80px] text-center truncate">
              {content.to_club}
            </span>
          </div>
        </div>
      </div>

      {/* Hint slots - 3 slots */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {HINT_LABELS.map((label, index) => {
          const isRevealed = index < state.hintsRevealed;
          const hintValue = content.hints[index];

          return (
            <div
              key={label}
              className={cn(
                "rounded-lg border p-3 flex flex-col items-center gap-2 min-h-[72px] justify-center",
                isRevealed
                  ? "border-white/20 bg-white/5"
                  : "border-white/10 bg-white/[0.02]"
              )}
            >
              {isRevealed ? (
                <>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {label}
                  </span>
                  {index === 2 ? (
                    <div className="flex flex-col items-center gap-1">
                      <FlagIcon code={hintValue} size={20} />
                      <span className="text-xs text-slate-400">{hintValue}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-floodlight font-semibold">
                      {hintValue}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span className="text-xs text-slate-600">{label}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Reveal hint button */}
      {state.hintsRevealed < 3 && state.gameStatus === "playing" && (
        <button
          onClick={handleRevealHint}
          className="w-full text-center text-sm text-amber mt-2 mb-4 hover:text-card-yellow transition-colors"
        >
          Reveal hint ({3 - state.hintsRevealed} remaining)
        </button>
      )}

      {/* Incorrect guesses */}
      {state.incorrectGuesses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {state.incorrectGuesses.map((guess, i) => (
            <span key={i} className="text-sm text-red-card/70 line-through">
              {guess}
            </span>
          ))}
        </div>
      )}

      {/* Guess input (only when playing) */}
      {state.gameStatus === "playing" && (
        <div className={cn("flex gap-2", state.isShaking && "animate-shake")}>
          <Input
            value={state.currentGuess}
            onChange={(e) =>
              dispatch({ type: "SET_GUESS", payload: e.target.value })
            }
            placeholder="Enter player name..."
            onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            className="flex-1 bg-white/5 border-white/10 text-floodlight placeholder:text-muted-foreground"
          />
          <CTAButton
            onClick={handleGuess}
            disabled={!state.currentGuess.trim()}
          >
            GUESS
          </CTAButton>
        </div>
      )}

      {/* Guesses remaining indicator */}
      {state.gameStatus === "playing" && (
        <p className="text-center text-muted-foreground text-xs mt-4">
          {3 - state.incorrectGuesses.length} guesses remaining
        </p>
      )}

      {/* Win display */}
      {state.gameStatus === "won" && (
        <div className="text-center py-4">
          <p className="text-pitch-green font-bebas text-2xl tracking-wide">
            GENIUS!
          </p>
          <p className="text-floodlight text-lg font-semibold">
            {content.answer}
          </p>
        </div>
      )}

      {/* Loss display */}
      {state.gameStatus === "lost" && (
        <div className="text-center py-4">
          <p className="text-red-card font-semibold mb-1">Out of guesses!</p>
          <p className="text-slate-400 text-sm">
            The answer was{" "}
            <span className="text-pitch-green font-semibold">
              {content.answer}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
