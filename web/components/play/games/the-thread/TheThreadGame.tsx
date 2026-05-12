"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import confetti from "canvas-confetti";
import { Eye, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateGuess } from "@/lib/validation";
import type { GameProps } from "@/lib/play/types";
import type { TheThreadContent } from "@/lib/schemas/puzzle-schemas";
import {
  createInitialState,
  theThreadReducer,
} from "@/lib/the-thread/types";
import { generateThreadShareText } from "@/lib/the-thread/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { BrandTimeline } from "./BrandTimeline";

export function TheThreadGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<TheThreadContent>) {
  const [state, dispatch] = useReducer(theThreadReducer, createInitialState());
  const [currentGuess, setCurrentGuess] = useState("");
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const { trackGameCompleted } = useGameTracking("the-thread", puzzleDate);

  const totalHidden = useMemo(
    () => content.path.filter((b) => b.is_hidden).length,
    [content.path]
  );
  const isGameOver = state.gameStatus !== "playing";
  const canRevealHint = state.gameStatus === "playing" && state.hintsRevealed < totalHidden;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isGameOver) return;
      const guess = currentGuess.trim();
      if (!guess) return;

      const { isMatch } = validateGuess(guess, content.correct_club_name);
      dispatch({
        type: "SUBMIT_GUESS",
        payload: {
          club: { id: isMatch ? content.correct_club_id : guess, name: guess },
          isCorrect: isMatch,
        },
      });
      setCurrentGuess("");
    },
    [currentGuess, content.correct_club_id, content.correct_club_name, isGameOver]
  );

  const handleRevealHint = useCallback(() => {
    if (!canRevealHint) return;
    dispatch({ type: "REVEAL_HINT", payload: { totalHidden } });
  }, [canRevealHint, totalHidden]);

  const handleGiveUp = useCallback(() => {
    if (state.gameStatus !== "playing") return;
    dispatch({ type: "GIVE_UP" });
    setConfirmGiveUp(false);
  }, [state.gameStatus]);

  // Clear shake after a short delay.
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 600);
    return () => clearTimeout(t);
  }, [state.lastGuessIncorrect]);

  // Fire completion when game ends.
  useEffect(() => {
    if (state.gameStatus === "playing" || !state.score) return;
    const won = state.gameStatus === "won";

    if (won) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    trackGameCompleted(
      won ? "won" : "lost",
      `${state.score.points}/${state.score.maxPoints}`
    );

    onComplete({
      won,
      answer: content.correct_club_name,
      shareText: generateThreadShareText(state.score, content.thread_type, puzzleDate),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  const threadTypeLabel = content.thread_type === "sponsor" ? "Kit Sponsor" : "Kit Supplier";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-white/50">{threadTypeLabel} thread</p>
        <p className="text-sm text-white/70 mt-1">
          Which club has had these {threadTypeLabel.toLowerCase()}s over the years?
        </p>
      </div>

      <BrandTimeline
        brands={content.path}
        hintsRevealed={state.hintsRevealed}
        gameOver={isGameOver}
      />

      {state.guesses.length > 0 && !isGameOver && (
        <p className="text-xs text-red-card/80">
          Wrong: {state.guesses.map((g) => g.name).join(", ")}
        </p>
      )}

      {isGameOver && state.score && !state.score.won && (
        <div className="rounded-lg border border-pitch-green/25 bg-pitch-green/[0.08] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-white/50">The answer was</p>
          <p className="mt-1 text-xl font-bold text-pitch-green">
            {content.correct_club_name}
          </p>
          <p className="mt-2 text-xs text-white/60">{content.kit_lore.fun_fact}</p>
        </div>
      )}

      {!isGameOver && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value)}
            placeholder="Type a club name..."
            className={cn(
              "bg-white/5 border-white/10 text-floodlight placeholder:text-slate-500",
              state.lastGuessIncorrect && "border-red-card animate-pulse"
            )}
            aria-label="Club guess"
            autoComplete="off"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="submit"
              disabled={!currentGuess.trim()}
              className="h-11 bg-pitch-green text-stadium-navy hover:bg-pitch-green/90 disabled:opacity-50"
            >
              Guess
            </Button>
            {canRevealHint ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRevealHint}
                className="h-11 border-white/10 text-slate-300 hover:bg-white/5"
              >
                <Eye className="mr-1 size-4" />
                Reveal hint ({state.hintsRevealed}/{totalHidden})
              </Button>
            ) : confirmGiveUp ? (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 flex-1"
                  onClick={() => setConfirmGiveUp(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 flex-1"
                  onClick={handleGiveUp}
                >
                  Confirm
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmGiveUp(true)}
                className="h-11 border-white/10 text-slate-400 hover:bg-white/5"
              >
                <Flag className="mr-1 size-4" />
                Give up
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">
            Hints used: {state.hintsRevealed}/{totalHidden} · 0 hints = 10 pts · each hint costs points
          </p>
        </form>
      )}
    </div>
  );
}
