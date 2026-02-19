"use client";

import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import type { CareerStep } from "@/types/careerPath";
import { validateGuess } from "@/lib/validation";
import { APP_STORE_URL } from "@/lib/constants";
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

function triggerConfetti() {
  // Fire confetti from both sides
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Left side burst
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.2, y: 0.7 },
  });

  // Center burst
  fire(0.2, {
    spread: 60,
    origin: { x: 0.5, y: 0.7 },
  });

  // Right side burst
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.8, y: 0.7 },
  });

  // Extra sparkle
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
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
  const [hasWon, setHasWon] = useState(false);

  const handleGuess = useCallback(() => {
    if (!currentGuess.trim() || gameOver) return;

    const { isMatch } = validateGuess(currentGuess, answer);

    if (isMatch) {
      setRevealedCount(careerSteps.length); // Reveal all clubs
      setHasWon(true);
      setShowSuccess(true);
      setGameOver(true);
      // Trigger confetti celebration!
      triggerConfetti();
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

        {/* Game over state (won) */}
        {gameOver && hasWon && !showSuccess && (
          <div className="text-center">
            <p className="text-pitch-green font-semibold mb-2">You got it! 🎉</p>
            <p className="text-floodlight text-lg font-semibold mb-4">
              {answer}
            </p>
          </div>
        )}

        {/* Game over state (lost) */}
        {gameOver && !hasWon && (
          <div className="text-center">
            <p className="text-red-card font-semibold mb-2">Out of clues!</p>
            <p className="text-muted-foreground text-sm mb-1">
              The answer was:{" "}
              <span className="text-pitch-green font-semibold">{answer}</span>
            </p>
            <p className="text-slate-500 text-xs mb-4">
              {revealedCount} / {careerSteps.length} clubs revealed
            </p>
            <CTAButton
              onClick={() => {
                setRevealedCount(1);
                setCurrentGuess("");
                setGameOver(false);
                setHasWon(false);
              }}
              variant="secondary"
            >
              TRY AGAIN
            </CTAButton>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-400 text-sm font-medium mb-2">
                Play all 11 modes in the app — free to download
              </p>
              <p className="text-slate-500 text-xs mb-4">
                Track your stats, climb 10 tiers, and prove your Football IQ.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="transition-all hover:opacity-90 hover:scale-105">
                  <Image src="/images/app-store.svg" alt="App Store" width={160} height={48} className="h-[48px] w-auto" />
                </Link>
                <div className="relative">
                  <Image src="/images/play-store.svg" alt="Google Play — Coming Soon" width={180} height={48} className="h-[48px] w-auto opacity-50" />
                  <span className="absolute left-0 right-0 text-center text-xs text-slate-500 mt-1">Coming Soon</span>
                </div>
              </div>
            </div>
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
        revealedCount={revealedCount}
        totalSteps={careerSteps.length}
      />
    </section>
  );
}
