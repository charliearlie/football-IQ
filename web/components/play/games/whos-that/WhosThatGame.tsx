// web/components/play/games/whos-that/WhosThatGame.tsx
"use client";

import { useReducer, useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { GameProps } from "@/lib/play/types";
import type {
  WhosThatContent,
  WhosThatState,
  WhosThatAction,
} from "@/lib/whos-that/types";
import { createInitialState } from "@/lib/whos-that/types";
import { generateFeedback } from "@/lib/whos-that/feedback";
import { nationalityCodeToName } from "@/lib/whos-that/nationalities";
import { calculateWhosThatScore } from "@/lib/whos-that/scoring";
import { generateWhosThatShareText } from "@/lib/whos-that/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { Grid } from "./Grid";
import { PlayerSearchInput, type SearchedPlayer } from "./PlayerSearchInput";

function whosThatReducer(state: WhosThatState, action: WhosThatAction): WhosThatState {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { isCorrect, ...feedback } = action.payload;
      const newGuesses = [...state.guesses, feedback];
      const guessCount = newGuesses.length;
      if (isCorrect) {
        return { ...state, guesses: newGuesses, gameStatus: "won", lastGuessIncorrect: false };
      }
      if (guessCount >= state.maxGuesses) {
        return { ...state, guesses: newGuesses, gameStatus: "lost", lastGuessIncorrect: true };
      }
      return { ...state, guesses: newGuesses, lastGuessIncorrect: true };
    }
    case "CLEAR_SHAKE":
      return { ...state, lastGuessIncorrect: false };
    case "RESET":
      return createInitialState();
  }
}

export function WhosThatGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<WhosThatContent>) {
  const [state, dispatch] = useReducer(whosThatReducer, createInitialState());
  const [fetchingAttrs, setFetchingAttrs] = useState(false);
  const [retiredPlayerName, setRetiredPlayerName] = useState<string | null>(null);
  const { trackGameCompleted } = useGameTracking("whos-that", puzzleDate);

  const isGameOver = state.gameStatus !== "playing";

  const handlePlayerSelect = useCallback(
    async (player: SearchedPlayer) => {
      if (isGameOver || fetchingAttrs) return;
      setRetiredPlayerName(null);
      setFetchingAttrs(true);
      try {
        const res = await fetch(
          `/api/games/whos-that/player/${encodeURIComponent(player.id)}`
        );

        // Distinguish HTTP errors (lookup failed) from valid "retired player"
        // responses (200 with empty club). On HTTP error, bail silently —
        // don't spend a guess and don't mislead with the retired-player warning.
        if (!res.ok) {
          return;
        }

        const attrs = (await res.json()) as {
          club: string;
          league: string;
          birth_year: number | null;
        };

        // Retired players (no current club) are rejected — mirrors mobile behavior.
        if (!attrs.club) {
          setRetiredPlayerName(player.name);
          return;
        }

        const nationalityName = nationalityCodeToName(player.nationality_code ?? "");
        const birthYear = attrs.birth_year ?? player.birth_year ?? 0;
        const position = player.position_category ?? "";

        const feedback = generateFeedback(
          {
            playerName: player.name,
            club: attrs.club,
            league: attrs.league,
            nationality: nationalityName,
            position,
            birthYear,
          },
          content.answer
        );

        const isCorrect = player.id === content.answer.player_id;

        dispatch({ type: "SUBMIT_GUESS", payload: { ...feedback, isCorrect } });
      } finally {
        setFetchingAttrs(false);
      }
    },
    [content.answer, isGameOver, fetchingAttrs]
  );

  // Clear shake after a short timeout so the user can guess again.
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 600);
    return () => clearTimeout(t);
  }, [state.lastGuessIncorrect]);

  // Report completion to the orchestrator.
  useEffect(() => {
    if (state.gameStatus === "playing") return;
    const won = state.gameStatus === "won";
    const score = calculateWhosThatScore(state.guesses.length, won);
    const shareText = generateWhosThatShareText(score, state.guesses, puzzleDate);

    if (won) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    trackGameCompleted(won ? "won" : "lost", `${state.guesses.length}/6`);

    onComplete({
      won,
      answer: content.answer.player_name,
      shareText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  return (
    <div className="space-y-4">
      <Grid guesses={state.guesses} />

      {!isGameOver && (
        <div className="space-y-2">
          <PlayerSearchInput
            onSelect={handlePlayerSelect}
            disabled={fetchingAttrs}
          />
          {fetchingAttrs && (
            <p className="text-xs text-slate-400">Looking up player...</p>
          )}
          {retiredPlayerName && (
            <p className="text-xs text-card-yellow">
              {retiredPlayerName} has no current club — pick an active player.
            </p>
          )}
          <p className="text-xs text-slate-500 text-center">
            Guess {state.guesses.length + 1} of {state.maxGuesses}
          </p>
        </div>
      )}

      {state.gameStatus === "lost" && (
        <p className="text-center text-floodlight">
          Out of guesses. The answer was <strong>{content.answer.player_name}</strong>.
        </p>
      )}
    </div>
  );
}
