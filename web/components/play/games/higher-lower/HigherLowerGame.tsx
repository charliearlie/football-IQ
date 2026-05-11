"use client";

import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { GameProps } from "@/lib/play/types";
import type {
  HigherLowerContent,
  HigherLowerState,
  HigherLowerAction,
} from "@/lib/higher-lower/types";
import { createInitialState } from "@/lib/higher-lower/types";
import { parseHigherLowerContent } from "@/lib/higher-lower/content";
import { calculateHigherLowerScore } from "@/lib/higher-lower/scoring";
import { generateHigherLowerShareText } from "@/lib/higher-lower/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "./PlayerCard";

const ROUNDS_PER_GAME = 10;

function reducer(state: HigherLowerState, action: HigherLowerAction): HigherLowerState {
  switch (action.type) {
    case "SUBMIT_ANSWER": {
      const { answer, isCorrect } = action.payload;
      return {
        ...state,
        answers: [...state.answers, answer],
        results: [...state.results, isCorrect],
        showingResult: true,
      };
    }
    case "ADVANCE_ROUND": {
      const nextRound = state.currentRound + 1;
      if (nextRound >= state.totalRounds) {
        const won = state.results.every(Boolean);
        return { ...state, currentRound: nextRound, showingResult: false, gameStatus: won ? "won" : "lost" };
      }
      return { ...state, currentRound: nextRound, showingResult: false };
    }
    case "RESET":
      return createInitialState(state.totalRounds);
  }
}

export function HigherLowerGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<HigherLowerContent>) {
  const parsed = useMemo(() => parseHigherLowerContent(content), [content]);
  // Cap to ROUNDS_PER_GAME to respect the "always 10 rounds" rule. If the puzzle
  // has fewer pairs, play all of them.
  const pairs = useMemo(() => (parsed?.pairs ?? []).slice(0, ROUNDS_PER_GAME), [parsed]);
  const totalRounds = pairs.length;

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createInitialState(totalRounds)
  );
  const { trackGameCompleted } = useGameTracking("higher-lower", puzzleDate);
  const [transitioning, setTransitioning] = useState(false);

  const currentPair = pairs[state.currentRound];

  const handleAnswer = useCallback(
    (answer: "higher" | "lower") => {
      if (!currentPair || state.showingResult || transitioning) return;
      const { value: v1 } = currentPair.player1;
      const { value: v2 } = currentPair.player2;
      // Ties resolve as "higher" (matches mobile behaviour: equal values are not
      // a valid puzzle state, but if they appear we treat the answer "higher" as correct).
      const isCorrect = answer === "higher" ? v2 >= v1 : v2 < v1;
      dispatch({ type: "SUBMIT_ANSWER", payload: { answer, isCorrect } });
    },
    [currentPair, state.showingResult, transitioning]
  );

  const handleNext = useCallback(() => {
    if (!state.showingResult || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      dispatch({ type: "ADVANCE_ROUND" });
      setTransitioning(false);
    }, 100);
  }, [state.showingResult, transitioning]);

  // Fire completion once when game ends.
  useEffect(() => {
    if (state.gameStatus === "playing") return;
    const won = state.gameStatus === "won";
    const score = calculateHigherLowerScore(state.results, state.totalRounds);
    const shareText = generateHigherLowerShareText(score, state.results, puzzleDate);

    if (won) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    trackGameCompleted(
      won ? "won" : "lost",
      `${score.points}/${score.maxPoints}`
    );

    onComplete({
      won,
      answer: `${score.points}/${score.maxPoints}`,
      shareText,
    });
    // Intentionally only watch gameStatus — results and other deps are
    // captured at the moment of game-end transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  if (!parsed || pairs.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        Could not load today&apos;s puzzle. Please try again later.
      </div>
    );
  }

  // After all rounds played, render a brief "loading results..." placeholder
  // until the orchestrator's PostGameCTA renders via onComplete.
  if (state.gameStatus !== "playing") {
    return null;
  }

  // currentPair is guaranteed to exist while gameStatus === "playing"
  if (!currentPair) return null;

  const lastResult = state.showingResult ? state.results[state.results.length - 1] : undefined;
  const highlight: "correct" | "wrong" | undefined = state.showingResult
    ? lastResult
      ? "correct"
      : "wrong"
    : undefined;

  return (
    <div className="space-y-4">
      <p className="text-center text-slate-400 text-sm">
        Round {state.currentRound + 1} of {totalRounds}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <PlayerCard entry={currentPair.player1} revealed={true} />
        <PlayerCard
          entry={currentPair.player2}
          revealed={state.showingResult}
          resultHighlight={highlight}
        />
      </div>

      {!state.showingResult ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => handleAnswer("higher")}
            variant="outline"
            className="border-pitch-green/50 text-pitch-green hover:bg-pitch-green/10 h-14"
            aria-label="Higher"
          >
            <ChevronUp className="size-5 mr-2" />
            Higher
          </Button>
          <Button
            type="button"
            onClick={() => handleAnswer("lower")}
            variant="outline"
            className="border-red-card/50 text-red-card hover:bg-red-card/10 h-14"
            aria-label="Lower"
          >
            <ChevronDown className="size-5 mr-2" />
            Lower
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleNext}
          disabled={transitioning}
          className="w-full h-12 bg-pitch-green text-stadium-navy hover:bg-pitch-green/90"
          aria-label="Next round"
        >
          {state.currentRound + 1 < totalRounds ? "Next round" : "See your score"}
        </Button>
      )}

      <p className="text-center text-slate-500 text-xs">
        Correct so far: {state.results.filter(Boolean).length} / {state.results.length}
      </p>
    </div>
  );
}
