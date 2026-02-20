"use client";

import { useReducer, useCallback } from "react";
import confetti from "canvas-confetti";
import type { CareerStep } from "@/types/careerPath";
import { validateGuess } from "@/lib/validation";
import { generateCareerPathShareText } from "@/lib/shareText";
import { CareerStepCard } from "@/components/landing/CareerStepCard";
import { LockedStepCard } from "@/components/landing/LockedStepCard";
import { Input } from "@/components/ui/input";
import { CTAButton } from "@/components/landing/CTAButton";
import { cn } from "@/lib/utils";
import { useGameComplete } from "./GamePageShell";

// ============================================================================
// TYPES & REDUCER
// ============================================================================

interface CareerPathState {
  revealedCount: number;
  currentGuess: string;
  gameStatus: "playing" | "won" | "lost";
  isShaking: boolean;
}

type CareerPathAction =
  | { type: "SET_GUESS"; payload: string }
  | { type: "GUESS"; answer: string; totalSteps: number }
  | { type: "REVEAL_NEXT"; totalSteps: number }
  | { type: "CLEAR_SHAKE" };

function careerPathReducer(
  state: CareerPathState,
  action: CareerPathAction
): CareerPathState {
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
          revealedCount: action.totalSteps,
          currentGuess: "",
          gameStatus: "won",
          isShaking: false,
        };
      }

      // Wrong guess — reveal next step
      const newRevealed = state.revealedCount + 1;
      if (newRevealed >= action.totalSteps) {
        // All steps revealed and still wrong
        return {
          ...state,
          revealedCount: newRevealed,
          currentGuess: "",
          gameStatus: "lost",
          isShaking: true,
        };
      }

      return {
        ...state,
        revealedCount: newRevealed,
        currentGuess: "",
        isShaking: true,
      };
    }

    case "REVEAL_NEXT": {
      if (
        state.gameStatus !== "playing" ||
        state.revealedCount >= action.totalSteps
      ) {
        return state;
      }
      return { ...state, revealedCount: state.revealedCount + 1 };
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

interface CareerPathGameProps {
  careerSteps: CareerStep[];
  answer: string;
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

export function CareerPathGame({
  careerSteps,
  answer,
  puzzleDate,
}: CareerPathGameProps) {
  const onGameComplete = useGameComplete();
  const [state, dispatch] = useReducer(careerPathReducer, {
    revealedCount: 1,
    currentGuess: "",
    gameStatus: "playing",
    isShaking: false,
  });

  const handleGuess = useCallback(() => {
    const prevStatus = state.gameStatus;
    dispatch({
      type: "GUESS",
      answer,
      totalSteps: careerSteps.length,
    });

    // Check result after dispatch
    if (prevStatus !== "playing") return;

    const { isMatch } = validateGuess(state.currentGuess, answer);
    if (isMatch) {
      triggerConfetti();
      const shareText = generateCareerPathShareText(
        { won: true, cluesUsed: state.revealedCount, totalClues: careerSteps.length },
        puzzleDate
      );
      onGameComplete({ won: true, answer, shareText });
    } else {
      // Check if this guess causes game over
      const newRevealed = state.revealedCount + 1;
      if (newRevealed >= careerSteps.length) {
        const shareText = generateCareerPathShareText(
          { won: false, cluesUsed: careerSteps.length, totalClues: careerSteps.length },
          puzzleDate
        );
        onGameComplete({ won: false, answer, shareText });
      }
      setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 500);
    }
  }, [state.currentGuess, state.revealedCount, state.gameStatus, answer, careerSteps.length, puzzleDate, onGameComplete]);

  const handleRevealNext = useCallback(() => {
    dispatch({ type: "REVEAL_NEXT", totalSteps: careerSteps.length });
  }, [careerSteps.length]);

  const cluesRemaining = careerSteps.length - state.revealedCount;

  return (
    <div>
      {/* Career steps list */}
      <div className="space-y-3 mb-6">
        {careerSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isRevealed = stepNumber <= state.revealedCount;

          return isRevealed ? (
            <CareerStepCard
              key={index}
              step={step}
              stepNumber={stepNumber}
              isLatest={stepNumber === state.revealedCount}
            />
          ) : (
            <LockedStepCard key={index} stepNumber={stepNumber} />
          );
        })}
      </div>

      {/* Guess input */}
      {state.gameStatus === "playing" && (
        <>
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

          {cluesRemaining > 0 && (
            <button
              onClick={handleRevealNext}
              className="w-full text-center text-sm text-amber mt-4 hover:text-card-yellow transition-colors"
            >
              Reveal next club ({cluesRemaining} remaining)
            </button>
          )}
        </>
      )}

      {/* Game over display */}
      {state.gameStatus === "won" && (
        <div className="text-center py-4">
          <p className="text-pitch-green font-bebas text-2xl tracking-wide">
            GENIUS!
          </p>
          <p className="text-floodlight text-lg font-semibold">{answer}</p>
          <p className="text-slate-400 text-sm mt-1">
            {state.revealedCount} / {careerSteps.length} clubs revealed
          </p>
        </div>
      )}

      {state.gameStatus === "lost" && (
        <div className="text-center py-4">
          <p className="text-red-card font-semibold mb-1">Out of clues!</p>
          <p className="text-slate-400 text-sm">
            The answer was{" "}
            <span className="text-pitch-green font-semibold">{answer}</span>
          </p>
        </div>
      )}

      {state.gameStatus === "playing" && (
        <p className="text-center text-muted-foreground text-xs mt-6">
          Think you know the answer? Type your guess above.
        </p>
      )}
    </div>
  );
}
