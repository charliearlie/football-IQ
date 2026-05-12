"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import confetti from "canvas-confetti";
import { ChevronRight, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GameProps } from "@/lib/play/types";
import type { WhoAmIContent } from "@/lib/schemas/puzzle-schemas";
import {
  createInitialState,
  whoAmIReducer,
  type WhoAmIState,
} from "@/lib/who-am-i/types";
import { generateWhoAmIShareText } from "@/lib/who-am-i/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import {
  PlayerSearchInput,
  type SearchedPlayer,
} from "@/components/play/games/whos-that/PlayerSearchInput";
import { ClueCard } from "./ClueCard";

export function WhoAmIGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<WhoAmIContent>) {
  const [state, dispatch] = useReducer(whoAmIReducer, createInitialState());
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const { trackGameCompleted } = useGameTracking("who-am-i", puzzleDate);

  const totalClues = content.clues.length;
  const visibleClues = content.clues.slice(0, state.cluesRevealed);
  const isGameOver = state.gameStatus !== "playing";
  const canRevealMore = state.gameStatus === "playing" && state.cluesRevealed < totalClues;

  const handlePlayerSelect = useCallback(
    (player: SearchedPlayer) => {
      if (isGameOver) return;
      const isCorrect = player.id === content.correct_player_id;
      dispatch({
        type: "SUBMIT_GUESS",
        payload: { playerName: player.name, isCorrect, totalClues },
      });
    },
    [content.correct_player_id, isGameOver, totalClues]
  );

  const handleRevealClue = useCallback(() => {
    if (!canRevealMore) return;
    dispatch({ type: "REVEAL_NEXT_CLUE", payload: { totalClues } });
  }, [canRevealMore, totalClues]);

  const handleGiveUp = useCallback(() => {
    if (state.gameStatus !== "playing") return;
    dispatch({ type: "GIVE_UP", payload: { totalClues } });
    setConfirmGiveUp(false);
  }, [state.gameStatus, totalClues]);

  // Clear shake after a short delay.
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;
    const timer = setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 500);
    return () => clearTimeout(timer);
  }, [state.lastGuessIncorrect]);

  // Report completion to the orchestrator.
  useEffect(() => {
    if (state.gameStatus === "playing" || !state.score) return;
    const won = state.gameStatus === "won";

    if (won) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    trackGameCompleted(won ? "won" : "lost", `${state.score.points}/${state.score.maxPoints}`);

    onComplete({
      won,
      answer: content.correct_player_name,
      shareText: generateWhoAmIShareText(state.score, puzzleDate),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  return (
    <div className="space-y-3">
      {visibleClues.map((clue, idx) => (
        <ClueCard
          key={clue.number}
          clue={clue}
          isLatest={idx === visibleClues.length - 1 && !isGameOver}
        />
      ))}

      {state.guesses.length > 0 && !isGameOver && (
        <p className="text-xs text-red-card/80">
          Incorrect: {state.guesses.join(", ")}
        </p>
      )}

      {isGameOver && state.score && !state.score.won && (
        <div className="rounded-lg border border-pitch-green/25 bg-pitch-green/[0.08] p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-white/50">The answer was</p>
          <p className="mt-1 text-xl font-bold text-pitch-green">
            {content.correct_player_name}
          </p>
          {content.fun_fact && (
            <p className="mt-2 text-xs text-white/60">{content.fun_fact}</p>
          )}
        </div>
      )}

      {!isGameOver && (
        <div className="space-y-3">
          <PlayerSearchInput
            onSelect={handlePlayerSelect}
            placeholder="Search players (3+ letters)..."
          />

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Clue {state.cluesRevealed} of {totalClues}
            </p>

            {canRevealMore ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRevealClue}
              >
                Next clue
                <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : confirmGiveUp ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmGiveUp(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleGiveUp}
                >
                  Confirm
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmGiveUp(true)}
              >
                <Flag className="mr-1 size-4" />
                Give up
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
