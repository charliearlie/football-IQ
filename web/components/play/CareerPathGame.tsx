"use client";

import { useReducer, useCallback } from "react";
import confetti from "canvas-confetti";
import { Shield, PlaneTakeoff, Lock, Search, Lightbulb, Footprints, Circle } from "lucide-react";
import type { CareerStep } from "@/types/careerPath";
import { validateGuess } from "@/lib/validation";
import { generateCareerPathShareText } from "@/lib/shareText";
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
      {/* Step counter */}
      {state.gameStatus === "playing" && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-[10px] bg-pitch-green text-stadium-navy font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Lvl {state.revealedCount}
          </span>
          <span className="font-bebas text-lg text-slate-400 tracking-widest">
            Step {state.revealedCount} of {careerSteps.length}
          </span>
        </div>
      )}

      {/* Timeline container */}
      <div className="relative pl-10 mb-6">
        {/* The continuous vertical line */}
        <div className="absolute left-0 top-0 bottom-0 w-10">
          <div className="timeline-line" />
        </div>

        {/* Career nodes */}
        {careerSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isRevealed = stepNumber <= state.revealedCount;
          const isLatest =
            stepNumber === state.revealedCount && state.gameStatus === "playing";
          const isLoan = step.type === "loan";

          if (!isRevealed) {
            return (
              <div
                key={index}
                className="relative mb-3 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Timeline dot (dimmed) */}
                <div className="absolute -left-[24px] top-[18px] w-3 h-3 bg-stadium-navy border-2 border-white/20 rounded-full z-10" />
                {/* Locked card */}
                <div className="glass-card p-3 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-stadium-navy/70 backdrop-blur-sm z-10" />
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center border border-white/10">
                      <Lock className="w-4 h-4 text-white/30" />
                    </div>
                    <span className="text-sm text-white/30 font-medium">???</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={cn(
                "relative mb-3 opacity-0 animate-fade-in-up",
                isLatest && "mb-8"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Timeline dot */}
              {isLatest ? (
                <>
                  <div className="absolute -left-[26px] top-[16px] w-4 h-4 rounded-full bg-pitch-green/30 animate-ping z-0" />
                  <div className="absolute -left-[24px] top-[18px] w-3 h-3 bg-pitch-green border-2 border-white rounded-full z-20 shadow-[0_0_12px_#58CC02]" />
                </>
              ) : (
                <div className="absolute -left-[24px] top-[18px] w-3 h-3 bg-stadium-navy border-2 border-pitch-green rounded-full z-10 shadow-[0_0_8px_#58CC02]" />
              )}

              {/* Card */}
              <div
                className={cn(
                  "glass-card p-3 rounded-xl flex items-center gap-3 relative shadow-card-depth transition-colors",
                  isLoan && "border-l-[3px] border-l-card-yellow",
                  isLatest &&
                    "shadow-glow border-pitch-green/40 bg-gradient-to-r from-pitch-green/10 to-transparent"
                )}
              >
                {/* Logo placeholder */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border shadow-inner",
                    isLoan
                      ? "bg-gradient-to-br from-card-yellow/10 to-transparent border-card-yellow/20"
                      : isLatest
                        ? "bg-pitch-green/20 border-pitch-green/30"
                        : "bg-gradient-to-br from-white/10 to-white/5 border-white/10"
                  )}
                >
                  {isLoan ? (
                    <PlaneTakeoff className="w-4 h-4 text-card-yellow/80" />
                  ) : (
                    <Shield
                      className={cn(
                        "w-4 h-4",
                        isLatest ? "text-pitch-green" : "text-white/40"
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Top row: Name + Year or LOAN badge */}
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-semibold text-sm text-white truncate pr-2">
                      {step.text}
                    </h3>
                    {isLoan ? (
                      <span className="bg-card-yellow text-stadium-navy text-[9px] font-bebas px-1.5 py-0.5 rounded leading-none tracking-wider">
                        LOAN
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {isLatest && (
                          <span className="w-1.5 h-1.5 bg-pitch-green rounded-full animate-pulse" />
                        )}
                        <span
                          className={cn(
                            "font-bebas text-sm tracking-wide whitespace-nowrap",
                            isLatest
                              ? "text-pitch-green"
                              : "text-pitch-green opacity-90"
                          )}
                        >
                          {step.year}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom row: Stats (and year for loans) */}
                  <div
                    className={cn(
                      "flex items-center text-[10px] text-slate-400",
                      isLoan ? "justify-between" : "gap-3"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {step.apps != null && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-1.5 py-0.5 rounded",
                            isLatest
                              ? "bg-pitch-green/10 border border-pitch-green/20 text-white"
                              : "bg-white/5"
                          )}
                        >
                          <Footprints
                            className={cn(
                              "w-2.5 h-2.5",
                              isLatest ? "text-pitch-green" : "text-white/40"
                            )}
                          />
                          <span>{step.apps}</span>
                        </div>
                      )}
                      {step.goals != null && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-1.5 py-0.5 rounded",
                            isLatest
                              ? "bg-pitch-green/10 border border-pitch-green/20 text-white"
                              : "bg-white/5"
                          )}
                        >
                          <Circle
                            className={cn(
                              "w-2.5 h-2.5",
                              isLatest ? "text-pitch-green" : "text-white/40"
                            )}
                          />
                          <span>{step.goals}</span>
                        </div>
                      )}
                    </div>
                    {isLoan && (
                      <span className="font-bebas text-white/50 tracking-wide">
                        {step.year}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guess input */}
      {state.gameStatus === "playing" && (
        <div className="glass-card p-3 border-t border-white/10">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold opacity-70">
              Guess the player
            </span>
            {cluesRemaining > 0 && (
              <button
                onClick={handleRevealNext}
                className="text-[10px] text-card-yellow cursor-pointer hover:text-white transition-colors flex items-center gap-1 bg-card-yellow/10 px-2 py-0.5 rounded-full border border-card-yellow/20"
              >
                <Lightbulb className="w-3 h-3" /> Reveal Next Step
              </button>
            )}
          </div>

          <div className={cn("flex gap-2", state.isShaking && "animate-shake")}>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-white/30" />
              </div>
              <Input
                value={state.currentGuess}
                onChange={(e) =>
                  dispatch({ type: "SET_GUESS", payload: e.target.value })
                }
                placeholder="Type player name..."
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                className="flex-1 pl-9 h-11 bg-stadium-navy/50 border-white/10 text-white text-sm placeholder:text-white/20 focus:border-pitch-green focus:bg-white/5 transition-all"
              />
            </div>
            <CTAButton
              onClick={handleGuess}
              disabled={!state.currentGuess.trim()}
            >
              SUBMIT
            </CTAButton>
          </div>
        </div>
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
    </div>
  );
}
