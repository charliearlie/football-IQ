/**
 * The Thread Game Hook
 *
 * Main game state management for The Thread game mode.
 * Uses reducer pattern for predictable state updates.
 *
 * Players guess a football club from a chronological list of kit sponsors or suppliers.
 * Some brands are hidden and can be revealed as hints (costs points).
 *
 * Scoring (hint-based): 10/6/4/2/0 based on hints revealed.
 */

import { useReducer, useEffect, useCallback, useMemo } from "react";
import { ParsedLocalPuzzle } from "@/types/database";
import { validateGuess } from "@/lib/validation";
import { usePuzzleContext } from "@/features/puzzles";
import { useAuth } from "@/features/auth";
import { useHaptics } from "@/hooks/useHaptics";
import { useGamePersistence } from "@/hooks/useGamePersistence";
import { UnifiedClub } from "@/services/club/types";
import {
  TheThreadState,
  TheThreadAction,
  TheThreadAttemptMetadata,
  createInitialState,
  parseTheThreadContent,
} from "../types/theThread.types";
import {
  calculateThreadScore,
  generateThreadEmojiGrid,
} from "../utils/scoring";

/**
 * Reducer for The Thread game state.
 */
function theThreadReducer(
  state: TheThreadState,
  action: TheThreadAction
): TheThreadState {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { club, isCorrect } = action.payload;
      const newGuesses = [...state.guesses, club];

      if (isCorrect) {
        const score = calculateThreadScore(newGuesses.length, true, state.hintsRevealed);
        return {
          ...state,
          guesses: newGuesses,
          gameStatus: "won",
          score,
          lastGuessIncorrect: false,
        };
      }

      return {
        ...state,
        guesses: newGuesses,
        lastGuessIncorrect: true,
      };
    }

    case "GIVE_UP": {
      const score = calculateThreadScore(state.guesses.length, false, state.hintsRevealed);
      return {
        ...state,
        gameStatus: "revealed",
        score,
      };
    }

    case "REVEAL_HINT":
      return {
        ...state,
        hintsRevealed: state.hintsRevealed + 1,
      };

    case "CLEAR_SHAKE":
      return { ...state, lastGuessIncorrect: false };

    case "SET_ATTEMPT_ID":
      return { ...state, attemptId: action.payload };

    case "RESTORE_PROGRESS": {
      const payload = action.payload;
      return {
        ...state,
        guesses: payload.guesses,
        attemptId: payload.attemptId,
        startedAt: payload.startedAt,
        hintsRevealed: payload.hintsRevealed ?? 0,
      };
    }

    case "ATTEMPT_SAVED":
      return { ...state, attemptSaved: true };

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

// Export reducer for testing
export { theThreadReducer };

/**
 * Share result type
 */
export interface ShareResult {
  success: boolean;
  method: "share" | "clipboard";
  error?: Error;
}

/**
 * Main hook for The Thread game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useTheThreadGame(puzzle: ParsedLocalPuzzle | null, isFocused: boolean = true) {
  // Parse content
  const threadContent = useMemo(() => {
    if (!puzzle) return null;
    return parseTheThreadContent(puzzle.content);
  }, [puzzle]);

  const [state, dispatch] = useReducer(theThreadReducer, undefined, createInitialState);
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Derived state
  const isGameOver = state.gameStatus !== "playing";
  const canShowKitLore =
    state.gameStatus === "won" || state.gameStatus === "revealed";

  // Game persistence (attemptId, progress restore, background save, completion save)
  useGamePersistence<TheThreadState, TheThreadAttemptMetadata>({
    puzzle,
    isFocused,
    state,
    dispatch: dispatch as unknown as import('@/hooks/useGamePersistence').PersistenceDispatch,
    hasProgressToSave: (s) => s.guesses.length > 0 || s.hintsRevealed > 0,
    serializeProgress: (s) => ({
      guesses: s.guesses.map((g) => ({ id: g.id, name: g.name })),
      guessCount: s.guesses.length,
      won: false,
      threadType: threadContent?.thread_type ?? "sponsor",
      hintsRevealed: s.hintsRevealed,
    }),
    hasRestoredProgress: (meta) =>
      (meta.guesses?.length ?? 0) > 0 || (meta.hintsRevealed ?? 0) > 0,
    deserializeProgress: (meta, attempt) => ({
      attemptId: attempt.id,
      startedAt: attempt.started_at ?? new Date().toISOString(),
      guesses: (meta.guesses ?? []).map(
        (g: { id: string; name: string }) => ({
          id: g.id,
          name: g.name,
          primary_color: "#000000",
          secondary_color: "#FFFFFF",
          source: "local" as const,
          relevance_score: 1.0,
          match_type: "name" as const,
        })
      ),
      hintsRevealed: meta.hintsRevealed ?? 0,
    }),
    buildFinalAttempt: (s, attemptId, completedAt) => {
      const score = s.score;
      if (!score) {
        throw new Error("Score must exist when building final attempt");
      }
      return {
        id: attemptId,
        completed: 1,
        score: score.points,
        score_display: generateThreadEmojiGrid(score),
        metadata: JSON.stringify({
          guesses: s.guesses.map((g) => ({ id: g.id, name: g.name })),
          guessCount: s.guesses.length,
          won: s.gameStatus === "won",
          threadType: threadContent?.thread_type ?? "sponsor",
          hintsRevealed: s.hintsRevealed,
          ...(s.gameStatus === "revealed" && { gaveUp: true }),
        }),
        started_at: s.startedAt,
        completed_at: completedAt,
        synced: 0,
      };
    },
    onAttemptSaved: syncAttempts,
    onLocalAttemptSaved: refreshLocalIQ,
  });

  // Reset state when puzzle changes
  useEffect(() => {
    if (puzzle) {
      dispatch({ type: "RESET" });
    }
  }, [puzzle?.id]);

  // Clear shake animation after delay
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_SHAKE" });
    }, 500);

    return () => clearTimeout(timer);
  }, [state.lastGuessIncorrect]);

  /**
   * Submit a club guess.
   * Validates against correct_club_id with fallback to fuzzy name matching.
   */
  const submitGuess = useCallback(
    (club: UnifiedClub) => {
      if (state.gameStatus !== "playing" || !threadContent) return;

      // Primary check: ID exact match (preferred)
      let isCorrect = club.id === threadContent.correct_club_id;

      // Fallback: fuzzy name matching if ID doesn't match
      // (handles edge cases where user selects club from search that has different QID)
      if (!isCorrect) {
        const { isMatch } = validateGuess(
          club.name,
          threadContent.correct_club_name
        );
        isCorrect = isMatch;
      }

      if (isCorrect) {
        triggerSuccess();
        // Trigger completion haptic since game is won
        triggerCompletion();
      } else {
        triggerError();
      }

      dispatch({
        type: "SUBMIT_GUESS",
        payload: { club, isCorrect },
      });
    },
    [
      state.gameStatus,
      threadContent,
      triggerSuccess,
      triggerError,
      triggerCompletion,
    ]
  );

  /**
   * Give up and reveal the answer.
   */
  const giveUp = useCallback(() => {
    if (state.gameStatus !== "playing") return;
    dispatch({ type: "GIVE_UP" });
  }, [state.gameStatus]);

  // Hint-related derived state
  const totalHiddenBrands = useMemo(() => {
    if (!threadContent) return 0;
    return threadContent.path.filter((b) => b.is_hidden).length;
  }, [threadContent]);

  const canRevealHint =
    state.gameStatus === "playing" && state.hintsRevealed < totalHiddenBrands;

  /**
   * Brands with visibility status.
   * Hidden brands are revealed in path order as hints are used.
   */
  const visibleBrands = useMemo(() => {
    if (!threadContent) return [];
    let hiddenSeen = 0;
    return threadContent.path.map((brand) => {
      if (!brand.is_hidden) {
        return { ...brand, visible: true };
      }
      hiddenSeen++;
      return { ...brand, visible: hiddenSeen <= state.hintsRevealed };
    });
  }, [threadContent, state.hintsRevealed]);

  /**
   * Reveal the next hidden brand as a hint.
   */
  const revealHint = useCallback(() => {
    if (!canRevealHint) return;
    dispatch({ type: "REVEAL_HINT" });
  }, [canRevealHint]);

  /**
   * Reset the game to initial state.
   */
  const resetGame = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  /**
   * Share the game result.
   */
  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !threadContent || !puzzle) {
      return {
        success: false,
        method: "clipboard",
        error: new Error("No score to share"),
      };
    }

    // @ts-expect-error - dynamic import supported at runtime by Metro bundler
    const { Share, Platform } = await import("react-native");
    // @ts-expect-error - dynamic import supported at runtime by Metro bundler
    const ExpoClipboard = await import("expo-clipboard");

    const emojiGrid = generateThreadEmojiGrid(state.score);
    const dateStr = puzzle.puzzle_date;
    const threadTypeDisplay =
      threadContent.thread_type === "sponsor" ? "Kit Sponsor" : "Kit Supplier";

    const shareText = `Football IQ - Threads (${threadTypeDisplay})
${dateStr}
${emojiGrid}
${state.score.points}/${state.score.maxPoints} points

Play at footballiq.app`;

    try {
      if (Platform.OS === "web") {
        // Web: copy to clipboard
        await ExpoClipboard.setStringAsync(shareText);
        return { success: true, method: "clipboard" };
      }

      // Mobile: use native share
      const result = await Share.share({ message: shareText });

      if (result.action === Share.sharedAction) {
        return { success: true, method: "share" };
      } else {
        // User dismissed
        return { success: false, method: "share" };
      }
    } catch (error) {
      console.error("[TheThread] Share failed:", error);
      // Fallback to clipboard
      try {
        await ExpoClipboard.setStringAsync(shareText);
        return { success: true, method: "clipboard" };
      } catch {
        return {
          success: false,
          method: "clipboard",
          error: error as Error,
        };
      }
    }
  }, [state.score, threadContent, puzzle]);

  return {
    // State
    state,
    dispatch,

    // Derived data from content
    threadContent,
    threadType: threadContent?.thread_type ?? null,
    brands: threadContent?.path ?? [],
    kitLore: threadContent?.kit_lore ?? null,

    // Derived state
    isGameOver,
    canShowKitLore,

    // Hint state
    visibleBrands,
    canRevealHint,
    totalHiddenBrands,
    hintsRevealed: state.hintsRevealed,

    // Actions
    submitGuess,
    giveUp,
    revealHint,
    resetGame,
    shareResult,
  };
}
