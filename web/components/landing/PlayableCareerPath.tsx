"use client";

import { useState, useCallback } from "react";
import type { CareerStep } from "@/types/careerPath";
import { validateGuess } from "@/lib/validation";
import { CareerStepCard } from "./CareerStepCard";
import { LockedStepCard } from "./LockedStepCard";
import { SuccessModal } from "./SuccessModal";
import { Input } from "@/components/ui/input";
import { CTAButton } from "./CTAButton";
import { cn } from "@/lib/utils";

interface PlayableCareerPathProps {
  careerSteps: CareerStep[];
  answer: string;
}

export function PlayableCareerPath({
  careerSteps,
  answer,
}: PlayableCareerPathProps) {
  const [revealedCount, setRevealedCount] = useState(1);
  const [currentGuess, setCurrentGuess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const handleGuess = useCallback(() => {
    if (!currentGuess.trim() || gameOver) return;

    const { isMatch } = validateGuess(currentGuess, answer);

    if (isMatch) {
      setShowSuccess(true);
      setGameOver(true);
    } else {
      // Reveal next step on incorrect guess
      if (revealedCount < careerSteps.length) {
        setRevealedCount((prev) => prev + 1);
      } else {
        // All steps revealed and still wrong - game over
        setGameOver(true);
      }
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setCurrentGuess("");
    }
  }, [currentGuess, answer, revealedCount, careerSteps.length, gameOver]);

  const handleRevealNext = useCallback(() => {
    if (revealedCount < careerSteps.length && !gameOver) {
      setRevealedCount((prev) => prev + 1);
    }
  }, [revealedCount, careerSteps.length, gameOver]);

  const cluesRemaining = careerSteps.length - revealedCount;

  return (
    <section id="demo" className="py-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Section header */}
        <h2 className="font-bebas text-4xl text-center mb-2 tracking-wide">
          TRY TODAY&apos;S PUZZLE
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Guess the player from their career history
        </p>

        {/* Career steps list */}
        <div className="space-y-3 mb-6">
          {careerSteps.map((step, index) => {
            const stepNumber = index + 1;
            const isRevealed = stepNumber <= revealedCount;

            return isRevealed ? (
              <CareerStepCard
                key={index}
                step={step}
                stepNumber={stepNumber}
                isLatest={stepNumber === revealedCount}
              />
            ) : (
              <LockedStepCard key={index} stepNumber={stepNumber} />
            );
          })}
        </div>

        {/* Guess input */}
        {!gameOver && (
          <>
            <div className={cn("flex gap-2", isShaking && "animate-shake")}>
              <Input
                value={currentGuess}
                onChange={(e) => setCurrentGuess(e.target.value)}
                placeholder="Enter player name..."
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                className="flex-1 bg-white/5 border-white/10 text-floodlight placeholder:text-muted-foreground"
              />
              <CTAButton onClick={handleGuess} disabled={!currentGuess.trim()}>
                GUESS
              </CTAButton>
            </div>

            {/* Reveal hint button */}
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

        {/* Game over state (lost) */}
        {gameOver && !showSuccess && (
          <div className="text-center">
            <p className="text-red-card font-semibold mb-2">Out of clues!</p>
            <p className="text-muted-foreground text-sm mb-4">
              The answer was:{" "}
              <span className="text-pitch-green font-semibold">{answer}</span>
            </p>
            <CTAButton
              onClick={() => {
                setRevealedCount(1);
                setCurrentGuess("");
                setGameOver(false);
              }}
              variant="secondary"
            >
              TRY AGAIN
            </CTAButton>
          </div>
        )}

        {/* Hint text */}
        {!gameOver && (
          <p className="text-center text-muted-foreground text-xs mt-6">
            Think you know the answer? Type your guess above.
          </p>
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        playerName={answer}
      />
    </section>
  );
}
