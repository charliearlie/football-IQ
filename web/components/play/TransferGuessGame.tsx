"use client";

import { useReducer, useCallback } from "react";
import confetti from "canvas-confetti";
import { ArrowRight, Lock, Search, Lightbulb, Calendar, Shirt, Flag } from "lucide-react";
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
const HINT_ICONS = [Calendar, Shirt, Flag] as const;

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

  const guessesLeft = 3 - state.incorrectGuesses.length;

  return (
    <div>
      {/* Transfer Stage Hero Card */}
      <div className="glass-card rounded-[20px] p-6 mb-6 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)] transfer-stage-shine">
        {/* Price tag */}
        <div className="text-center mb-4 relative z-10">
          <p className="text-[10px] uppercase tracking-[1.5px] text-card-yellow font-bold mb-1">
            Transfer Fee
          </p>
          <p
            className="font-bebas text-5xl text-floodlight leading-none"
            style={{ textShadow: "0 0 20px rgba(250, 204, 21, 0.2)" }}
          >
            {content.fee}
          </p>
        </div>

        {/* Clubs row with connector */}
        <div className="flex items-center justify-between relative z-10">
          {/* From club */}
          <div className="flex flex-col items-center w-[35%]">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 border-2 font-bebas text-2xl"
              style={{
                backgroundColor: content.from_club_color
                  ? `${content.from_club_color}15`
                  : "#1E293B",
                borderColor:
                  content.from_club_color || "rgba(255,255,255,0.1)",
                color:
                  content.from_club_color || "rgba(248,250,252,0.7)",
              }}
            >
              {content.from_club_abbreviation ||
                content.from_club.slice(0, 3).toUpperCase()}
            </div>
            <span className="font-bebas text-lg text-center leading-tight">
              {content.from_club.toUpperCase()}
            </span>
          </div>

          {/* Connector arrow */}
          <div className="transfer-connector mx-2 mb-6">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stadium-navy p-1 rounded-full border border-pitch-green">
              <ArrowRight className="w-4 h-4 text-pitch-green" />
            </div>
          </div>

          {/* To club */}
          <div className="flex flex-col items-center w-[35%]">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 border-2 font-bebas text-2xl"
              style={{
                backgroundColor: content.to_club_color
                  ? `${content.to_club_color}15`
                  : "#1E293B",
                borderColor:
                  content.to_club_color || "rgba(255,255,255,0.1)",
                color:
                  content.to_club_color || "rgba(248,250,252,0.7)",
              }}
            >
              {content.to_club_abbreviation ||
                content.to_club.slice(0, 3).toUpperCase()}
            </div>
            <span className="font-bebas text-lg text-center leading-tight">
              {content.to_club.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Game status / Lives */}
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          {guessesLeft} Guesses Left
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                i < guessesLeft
                  ? "bg-pitch-green shadow-[0_0_5px_#58CC02]"
                  : "bg-transparent border border-white/20 scale-75"
              )}
            />
          ))}
        </div>
      </div>

      {/* Clue grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {HINT_LABELS.map((label, index) => {
          const isRevealed = index < state.hintsRevealed;
          const hintValue = content.hints[index];
          const HintIcon = HINT_ICONS[index];

          return (
            <button
              key={label}
              onClick={() =>
                !isRevealed &&
                state.gameStatus === "playing" &&
                handleRevealHint()
              }
              disabled={isRevealed || state.gameStatus !== "playing"}
              className={cn(
                "rounded-xl border p-3 flex flex-col items-center justify-center min-h-[100px] relative overflow-hidden transition-all duration-300",
                isRevealed
                  ? "bg-pitch-green/10 border-pitch-green cursor-default"
                  : "bg-white/[0.03] border-white/10 cursor-pointer hover:bg-white/[0.06] active:scale-95"
              )}
            >
              {isRevealed ? (
                <>
                  <div className="animate-pop-in">
                    {index === 2 ? (
                      <FlagIcon code={hintValue} size={28} />
                    ) : (
                      <span className="font-bebas text-xl text-pitch-green">
                        {hintValue}
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-2 text-[10px] uppercase text-white/50 font-semibold tracking-wide">
                    {label}
                  </span>
                </>
              ) : (
                <>
                  <HintIcon className="w-5 h-5 text-slate-500 mb-1" />
                  <span className="font-bebas text-sm text-slate-500 tracking-wide">
                    {label.toUpperCase()}
                  </span>
                  <Lock className="w-3 h-3 text-slate-600 absolute top-1.5 right-1.5 opacity-50" />
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Incorrect guesses */}
      {state.incorrectGuesses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {state.incorrectGuesses.map((guess, i) => (
            <span
              key={i}
              className="text-sm text-red-card/70 line-through bg-red-card/10 px-2 py-0.5 rounded"
            >
              {guess}
            </span>
          ))}
        </div>
      )}

      {/* Search input + submit */}
      {state.gameStatus === "playing" && (
        <>
          <div className={cn("flex gap-3", state.isShaking && "animate-shake")}>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
              <Input
                value={state.currentGuess}
                onChange={(e) =>
                  dispatch({ type: "SET_GUESS", payload: e.target.value })
                }
                placeholder="Search player..."
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                className="pl-11 h-12 bg-secondary border-white/10 text-white text-base placeholder:text-white/30 rounded-xl focus:border-pitch-green transition-all"
              />
            </div>
            <CTAButton
              onClick={handleGuess}
              disabled={!state.currentGuess.trim()}
            >
              SUBMIT
            </CTAButton>
          </div>

          {/* Hint link */}
          {state.hintsRevealed < 3 && (
            <button
              onClick={handleRevealHint}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-card-yellow hover:text-white transition-colors mt-3"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>
                Reveal Hint {state.hintsRevealed + 1}
              </span>
            </button>
          )}
        </>
      )}

      {/* Win display */}
      {state.gameStatus === "won" && (
        <div className="text-center py-4">
          <p className="text-pitch-green font-bebas text-3xl tracking-wide">
            GOAL!
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
