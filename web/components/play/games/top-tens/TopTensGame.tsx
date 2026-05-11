"use client";

import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { GameProps } from "@/lib/play/types";
import type {
  TopTensContent,
  TopTensState,
  TopTensAction,
  RankIndex,
} from "@/lib/top-tens/types";
import { createInitialState } from "@/lib/top-tens/types";
import { findMatchingAnswer } from "@/lib/top-tens/validation";
import { calculateTopTensScore } from "@/lib/top-tens/scoring";
import { generateTopTensShareText } from "@/lib/top-tens/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RankGrid } from "./RankGrid";

function reducer(state: TopTensState, action: TopTensAction): TopTensState {
  switch (action.type) {
    case "CORRECT_GUESS": {
      const { rankIndex, answer } = action.payload;
      const newSlots = state.rankSlots.map((slot, i) =>
        i === rankIndex ? { ...slot, found: true, answer } : slot
      );
      const newFoundCount = state.foundCount + 1;
      const won = newFoundCount === 10;
      return {
        ...state,
        rankSlots: newSlots,
        foundCount: newFoundCount,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
        gameStatus: won ? "won" : "playing",
      };
    }
    case "INCORRECT_GUESS":
      return {
        ...state,
        wrongGuessCount: state.wrongGuessCount + 1,
        lastGuessIncorrect: true,
        lastGuessDuplicate: false,
      };
    case "DUPLICATE_GUESS":
      return { ...state, lastGuessDuplicate: true, lastGuessIncorrect: false };
    case "CLEAR_FEEDBACK":
      return { ...state, lastGuessIncorrect: false, lastGuessDuplicate: false };
    case "GIVE_UP": {
      const { answers } = action.payload;
      const newSlots = state.rankSlots.map((slot, i) =>
        slot.found ? slot : { ...slot, autoRevealed: true, answer: answers[i] }
      );
      return { ...state, rankSlots: newSlots, gameStatus: "lost" };
    }
    case "RESET":
      return createInitialState();
  }
}

export function TopTensGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<TopTensContent>) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [currentGuess, setCurrentGuess] = useState("");
  const { trackGameCompleted } = useGameTracking("top-tens", puzzleDate);

  const foundIndices = useMemo(() => {
    const set = new Set<RankIndex>();
    state.rankSlots.forEach((slot, i) => {
      if (slot.found) set.add(i as RankIndex);
    });
    return set;
  }, [state.rankSlots]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (state.gameStatus !== "playing") return;
      const guess = currentGuess.trim();
      if (!guess) return;

      const result = findMatchingAnswer(guess, content.answers, foundIndices);

      if (result.isMatch && result.matchedIndex !== null) {
        const answer = content.answers[result.matchedIndex];
        dispatch({
          type: "CORRECT_GUESS",
          payload: { rankIndex: result.matchedIndex, answer },
        });
        setCurrentGuess("");
      } else {
        // Check if it would have been a duplicate (matches an already-found entry).
        const dupResult = findMatchingAnswer(guess, content.answers, new Set());
        if (dupResult.isMatch && dupResult.matchedIndex !== null && foundIndices.has(dupResult.matchedIndex)) {
          dispatch({ type: "DUPLICATE_GUESS" });
        } else {
          dispatch({ type: "INCORRECT_GUESS" });
        }
      }
    },
    [state.gameStatus, currentGuess, content.answers, foundIndices]
  );

  const handleGiveUp = useCallback(() => {
    if (state.gameStatus !== "playing") return;
    dispatch({ type: "GIVE_UP", payload: { answers: content.answers } });
  }, [state.gameStatus, content.answers]);

  // Clear shake/duplicate feedback after a short timeout.
  useEffect(() => {
    if (!state.lastGuessIncorrect && !state.lastGuessDuplicate) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_FEEDBACK" }), 700);
    return () => clearTimeout(t);
  }, [state.lastGuessIncorrect, state.lastGuessDuplicate]);

  // Fire completion once when game ends.
  useEffect(() => {
    if (state.gameStatus === "playing") return;
    const won = state.gameStatus === "won";
    const score = calculateTopTensScore(state.foundCount, state.wrongGuessCount, won);
    const shareText = generateTopTensShareText(content.title, state.rankSlots, score, puzzleDate);

    if (won) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    trackGameCompleted(
      won ? "won" : "lost",
      `${score.foundCount}/10`
    );

    onComplete({
      won,
      answer: content.title,
      shareText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  const isPlaying = state.gameStatus === "playing";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-floodlight font-semibold text-base text-center mb-0.5">
          {content.title}
        </p>
        {content.category && (
          <p className="text-slate-400 text-xs text-center">{content.category}</p>
        )}
      </div>

      <RankGrid slots={state.rankSlots} />

      {isPlaying && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value)}
            placeholder="Type a name..."
            className={cn(
              "bg-white/5 border-white/10 text-floodlight placeholder:text-slate-500",
              state.lastGuessIncorrect && "border-red-card animate-pulse",
              state.lastGuessDuplicate && "border-card-yellow"
            )}
            aria-label="Guess input"
            autoComplete="off"
          />
          {state.lastGuessDuplicate && (
            <p className="text-xs text-card-yellow">Already found — try a different player.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="submit"
              disabled={!currentGuess.trim()}
              className="h-11 bg-pitch-green text-stadium-navy hover:bg-pitch-green/90 disabled:opacity-50"
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGiveUp}
              className="h-11 border-white/10 text-slate-400 hover:bg-white/5"
            >
              Give up
            </Button>
          </div>
          <p className="text-slate-500 text-xs text-center">
            Found {state.foundCount}/10 · Wrong guesses: {state.wrongGuessCount}
          </p>
        </form>
      )}
    </div>
  );
}
