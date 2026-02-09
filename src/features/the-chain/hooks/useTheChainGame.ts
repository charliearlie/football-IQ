/**
 * The Chain Game Hook
 *
 * Main game state management for The Chain game mode.
 * Uses reducer pattern for predictable state updates.
 * Validates player links via Supabase RPC.
 */

import { useReducer, useEffect, useCallback, useRef, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Crypto from "expo-crypto";
import { ParsedLocalPuzzle } from "@/types/database";
import { saveAttempt, getAttemptByPuzzleId } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { usePuzzleContext } from "@/features/puzzles";
import { useAuth } from "@/features/auth";
import { useHaptics } from "@/hooks/useHaptics";
import { UnifiedPlayer } from "@/services/oracle/types";
import {
  TheChainState,
  TheChainAction,
  ChainLink,
  CheckPlayersLinkedResult,
  TheChainAttemptMetadata,
  createInitialState,
  parseTheChainContent,
} from "../types/theChain.types";
import {
  calculateChainScore,
  generateChainEmojiGrid,
} from "../utils/scoring";
import { shareTheChainResult, ShareResult } from "../utils/share";

/**
 * Reducer for The Chain game state.
 */
function theChainReducer(
  state: TheChainState,
  action: TheChainAction
): TheChainState {
  switch (action.type) {
    case "OPEN_SEARCH":
      if (state.gameStatus !== "playing") return state;
      return { ...state, isSearchOpen: true, lastLinkInvalid: false };

    case "CLOSE_SEARCH":
      return { ...state, isSearchOpen: false };

    case "START_VALIDATION":
      return { ...state, isValidating: true, lastLinkInvalid: false };

    case "VALID_LINK":
      return {
        ...state,
        chain: [...state.chain, action.payload.link],
        isSearchOpen: false,
        isValidating: false,
        lastLinkInvalid: false,
        showSuccessBurst: true,
        burstOrigin: action.payload.burstOrigin ?? null,
      };

    case "INVALID_LINK":
      return { ...state, isValidating: false, lastLinkInvalid: true };

    case "CLEAR_INVALID":
      return { ...state, lastLinkInvalid: false };

    case "GAME_COMPLETE":
      return {
        ...state,
        gameStatus: "complete",
        score: action.payload,
        isSearchOpen: false,
      };

    case "GIVE_UP":
      return {
        ...state,
        gameStatus: "gave_up",
        score: action.payload,
        isSearchOpen: false,
      };

    case "SET_ATTEMPT_ID":
      return { ...state, attemptId: action.payload };

    case "RESTORE_PROGRESS":
      return {
        ...state,
        chain: action.payload.chain,
        attemptId: action.payload.attemptId,
      };

    case "MARK_ATTEMPT_SAVED":
      return { ...state, attemptSaved: true };

    case "CLEAR_SUCCESS_BURST":
      return { ...state, showSuccessBurst: false, burstOrigin: null };

    case "UNDO_LAST_LINK":
      if (state.chain.length <= 1) return state; // Can't undo start player
      return {
        ...state,
        chain: state.chain.slice(0, -1),
        lastLinkInvalid: false,
        isSearchOpen: false,
      };

    case "RESET_GAME":
      return createInitialState(action.payload);

    default:
      return state;
  }
}

/**
 * Main hook for The Chain game.
 *
 * @param puzzle - The puzzle to play
 * @returns Game state and actions
 */
export function useTheChainGame(puzzle: ParsedLocalPuzzle | null) {
  // Parse content first to get start player
  const chainContent = useMemo(() => {
    if (!puzzle) return null;
    return parseTheChainContent(puzzle.content);
  }, [puzzle]);

  // Create initial state with start player
  const initialState = useMemo(() => {
    if (!chainContent) return createInitialState({ qid: "", name: "" });
    return createInitialState(chainContent.start_player);
  }, [chainContent]);

  const [state, dispatch] = useReducer(theChainReducer, initialState);
  const { syncAttempts } = usePuzzleContext();
  const { refreshLocalIQ } = useAuth();
  const { triggerSuccess, triggerError, triggerCompletion } = useHaptics();

  // Keep a ref for async callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Get the last player in the chain (for validation)
  const lastPlayer = useMemo(() => {
    return state.chain[state.chain.length - 1]?.player ?? null;
  }, [state.chain]);

  // Current step count (chain length minus start player)
  const stepsTaken = state.chain.length - 1;

  // Generate attempt ID on first action
  useEffect(() => {
    if (!state.attemptId && state.gameStatus === "playing" && puzzle) {
      dispatch({ type: "SET_ATTEMPT_ID", payload: Crypto.randomUUID() });
    }
  }, [state.attemptId, state.gameStatus, puzzle]);

  // Reset state when puzzle changes
  useEffect(() => {
    if (chainContent) {
      dispatch({ type: "RESET_GAME", payload: chainContent.start_player });
    }
  }, [puzzle?.id]);

  // Check for resume on mount
  useEffect(() => {
    async function checkForResume() {
      if (!puzzle) return;

      try {
        const existingAttempt = await getAttemptByPuzzleId(puzzle.id);

        if (existingAttempt && !existingAttempt.completed && existingAttempt.metadata) {
          const metadata = existingAttempt.metadata as TheChainAttemptMetadata;
          if (metadata.chain && Array.isArray(metadata.chain)) {
            dispatch({
              type: "RESTORE_PROGRESS",
              payload: {
                chain: metadata.chain,
                attemptId: existingAttempt.id,
              },
            });
          }
        }
      } catch (error) {
        console.warn("[TheChain] Failed to check for resume:", error);
      }
    }

    checkForResume();
  }, [puzzle?.id]);

  // Clear invalid state after delay
  useEffect(() => {
    if (!state.lastLinkInvalid) return;

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_INVALID" });
    }, 2500);

    return () => clearTimeout(timer);
  }, [state.lastLinkInvalid]);

  // Clear success burst after animation
  useEffect(() => {
    if (!state.showSuccessBurst) return;

    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_SUCCESS_BURST" });
    }, 700);

    return () => clearTimeout(timer);
  }, [state.showSuccessBurst]);

  // Save attempt on game complete or give up
  useEffect(() => {
    if (
      (state.gameStatus !== "complete" && state.gameStatus !== "gave_up") ||
      state.attemptSaved ||
      !puzzle ||
      !chainContent
    ) {
      return;
    }

    const currentPuzzle = puzzle;
    const currentContent = chainContent;

    async function saveCompletedAttempt() {
      if (!stateRef.current.score || !stateRef.current.attemptId) return;

      const metadata: TheChainAttemptMetadata = {
        chain: stateRef.current.chain,
        stepsTaken: stateRef.current.score.stepsTaken,
        par: currentContent.par,
        ...(stateRef.current.gameStatus === "gave_up" && { gaveUp: true }),
      };

      const scoreDisplay = generateChainEmojiGrid(stateRef.current.score);

      try {
        await saveAttempt({
          id: stateRef.current.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 1,
          score: stateRef.current.score.points,
          score_display: scoreDisplay,
          metadata: JSON.stringify(metadata),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          synced: 0,
        });

        dispatch({ type: "MARK_ATTEMPT_SAVED" });

        // Refresh local IQ for immediate UI update
        refreshLocalIQ().catch((err) => {
          console.error("[TheChain] Failed to refresh local IQ:", err);
        });

        // Fire-and-forget cloud sync
        syncAttempts().catch((err) => {
          console.error("[TheChain] Cloud sync failed:", err);
        });
      } catch (error) {
        console.error("[TheChain] Failed to save attempt:", error);
      }
    }

    saveCompletedAttempt();
  }, [state.gameStatus, state.attemptSaved, puzzle, chainContent, syncAttempts, refreshLocalIQ]);

  // Save progress on app background
  useEffect(() => {
    if (!puzzle || !chainContent) return;

    const currentPuzzle = puzzle;
    const currentContent = chainContent;

    async function saveProgress() {
      const currentState = stateRef.current;

      // Only save if game is in progress and has an attempt ID
      if (currentState.gameStatus !== "playing" || !currentState.attemptId) return;

      // Only save if there's progress beyond start player
      if (currentState.chain.length <= 1) return;

      const metadata: TheChainAttemptMetadata = {
        chain: currentState.chain,
        stepsTaken: currentState.chain.length - 1,
        par: currentContent.par,
      };

      try {
        await saveAttempt({
          id: currentState.attemptId,
          puzzle_id: currentPuzzle.id,
          completed: 0,
          score: 0,
          score_display: null,
          metadata: JSON.stringify(metadata),
          started_at: new Date().toISOString(),
          completed_at: null,
          synced: 0,
        });
      } catch (error) {
        console.warn("[TheChain] Failed to save progress:", error);
      }
    }

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "background") {
          saveProgress();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [puzzle, chainContent]);

  // Save progress when screen unmounts (in-app navigation back)
  useEffect(() => {
    if (!puzzle || !chainContent) return;

    const currentPuzzle = puzzle;
    const currentContent = chainContent;

    return () => {
      const currentState = stateRef.current;

      // Only save if game is in progress and has an attempt ID
      if (currentState.gameStatus !== "playing" || !currentState.attemptId) return;

      // Only save if there's progress beyond start player
      if (currentState.chain.length <= 1) return;

      const metadata: TheChainAttemptMetadata = {
        chain: currentState.chain,
        stepsTaken: currentState.chain.length - 1,
        par: currentContent.par,
      };

      // Fire and forget - can't await in cleanup
      saveAttempt({
        id: currentState.attemptId,
        puzzle_id: currentPuzzle.id,
        completed: 0,
        score: 0,
        score_display: null,
        metadata: JSON.stringify(metadata),
        started_at: new Date().toISOString(),
        completed_at: null,
        synced: 0,
      }).catch((error) => {
        console.warn("[TheChain] Failed to save progress on unmount:", error);
      });
    };
  }, [puzzle?.id, chainContent]);

  // Actions
  const openSearch = useCallback(() => {
    dispatch({ type: "OPEN_SEARCH" });
  }, []);

  const closeSearch = useCallback(() => {
    dispatch({ type: "CLOSE_SEARCH" });
  }, []);

  /**
   * Validate and add a player link.
   * Calls Supabase RPC to check if players shared a club with overlapping years.
   */
  const submitPlayerSelection = useCallback(
    async (
      player: UnifiedPlayer,
      burstOrigin?: { x: number; y: number }
    ) => {
      if (!lastPlayer || !chainContent) return;

      // Capture chain length at START of function (before any dispatches)
      // This ensures a stable value throughout the async operation
      const chainLengthBeforeAction = stateRef.current.chain.length;

      // Check if player is already in the chain (prevent repetition)
      const isPlayerAlreadyInChain = stateRef.current.chain.some(
        (link) => link.player.qid === player.id
      );
      if (isPlayerAlreadyInChain) {
        triggerError();
        dispatch({ type: "INVALID_LINK" });
        return;
      }

      dispatch({ type: "START_VALIDATION" });

      try {
        // Call Supabase RPC to check link
        const { data, error } = await (supabase.rpc as CallableFunction)(
          "check_players_linked",
          {
            player_a_qid: lastPlayer.qid,
            player_b_qid: player.id,
          }
        );

        if (error) throw error;

        // RPC returns array with single result
        const result = (Array.isArray(data) ? data[0] : data) as
          | CheckPlayersLinkedResult
          | undefined;

        if (!result?.is_linked) {
          triggerError();
          dispatch({ type: "INVALID_LINK" });
          return;
        }

        // Valid link - create ChainLink
        const newLink: ChainLink = {
          player: {
            qid: player.id,
            name: player.name,
            nationality_code: player.nationality_code ?? undefined,
          },
          shared_club_name: result.shared_club_name ?? "Unknown Club",
          shared_club_id: result.shared_club_id ?? undefined,
          overlap_start: result.overlap_start ?? 0,
          overlap_end: result.overlap_end ?? new Date().getFullYear(),
        };

        triggerSuccess();
        dispatch({ type: "VALID_LINK", payload: { link: newLink, burstOrigin } });

        // Calculate step count using captured value (not stale stateRef)
        const newChainLength = chainLengthBeforeAction + 1;
        const newStepsTaken = newChainLength - 1;

        if (player.id === chainContent.end_player.qid) {
          triggerCompletion();
          const score = calculateChainScore(newStepsTaken, chainContent.par, true);
          dispatch({ type: "GAME_COMPLETE", payload: score });
          return;
        }

        // Also check if the newly added player links to the goal
        // This enables auto-completion when user adds a player that connects to goal
        const { data: goalLinkData, error: goalLinkError } = await (
          supabase.rpc as CallableFunction
        )("check_players_linked", {
          player_a_qid: player.id,
          player_b_qid: chainContent.end_player.qid,
        });

        if (!goalLinkError) {
          const goalLink = (
            Array.isArray(goalLinkData) ? goalLinkData[0] : goalLinkData
          ) as CheckPlayersLinkedResult | undefined;

          if (goalLink?.is_linked) {
            // Auto-add the goal as final link and complete
            const finalLink: ChainLink = {
              player: chainContent.end_player,
              shared_club_name: goalLink.shared_club_name ?? "Unknown Club",
              shared_club_id: goalLink.shared_club_id ?? undefined,
              overlap_start: goalLink.overlap_start ?? 0,
              overlap_end: goalLink.overlap_end ?? new Date().getFullYear(),
            };

            dispatch({ type: "VALID_LINK", payload: { link: finalLink } });
            triggerCompletion();

            // Don't add +1 for auto-completed goal - only count user selections
            const finalStepsTaken = newStepsTaken;
            const score = calculateChainScore(
              finalStepsTaken,
              chainContent.par,
              true
            );
            dispatch({ type: "GAME_COMPLETE", payload: score });
          }
        }
      } catch (error) {
        console.error("[TheChain] Validation error:", error);
        triggerError();
        dispatch({ type: "INVALID_LINK" });
      }
    },
    [lastPlayer, chainContent, triggerSuccess, triggerError, triggerCompletion]
  );

  const undoLastLink = useCallback(() => {
    if (state.chain.length > 1 && state.gameStatus === "playing") {
      dispatch({ type: "UNDO_LAST_LINK" });
    }
  }, [state.chain.length, state.gameStatus]);

  const giveUp = useCallback(() => {
    if (state.gameStatus !== "playing" || !chainContent) return;
    const score = calculateChainScore(stepsTaken, chainContent.par, false);
    dispatch({ type: "GIVE_UP", payload: score });
  }, [state.gameStatus, stepsTaken, chainContent]);

  const shareResult = useCallback(async (): Promise<ShareResult> => {
    if (!state.score || !chainContent) {
      return {
        success: false,
        method: "clipboard",
        error: new Error("No score to share"),
      };
    }

    return shareTheChainResult(state.score, chainContent.par, puzzle?.puzzle_date);
  }, [state.score, chainContent, puzzle?.puzzle_date]);

  return {
    state,
    chainContent,
    lastPlayer,
    stepsTaken,
    openSearch,
    closeSearch,
    submitPlayerSelection,
    undoLastLink,
    giveUp,
    shareResult,
  };
}
