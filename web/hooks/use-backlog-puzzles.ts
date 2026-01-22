"use client";

import useSWR from "swr";
import type { DailyPuzzle } from "@/types/supabase";
import type { GameMode } from "@/lib/constants";
import { getBacklogPuzzles } from "@/app/(dashboard)/calendar/actions";

export interface UseBacklogPuzzlesResult {
  puzzles: DailyPuzzle[];
  /** Puzzles grouped by game mode */
  groupedByMode: Record<GameMode, DailyPuzzle[]>;
  /** Total count of backlog puzzles */
  count: number;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

async function fetchBacklogPuzzles(): Promise<DailyPuzzle[]> {
  const result = await getBacklogPuzzles();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch backlog puzzles");
  }

  return result.data || [];
}

/**
 * Hook to fetch and manage backlog puzzles (puzzles without a scheduled date).
 *
 * @example
 * const { puzzles, groupedByMode, count, isLoading, mutate } = useBacklogPuzzles();
 *
 * // After assigning a puzzle to a date:
 * mutate(); // Refresh the backlog
 */
export function useBacklogPuzzles(): UseBacklogPuzzlesResult {
  const { data, error, isLoading, mutate } = useSWR(
    "backlog-puzzles",
    fetchBacklogPuzzles,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const puzzles = data || [];

  // Group puzzles by game mode
  const groupedByMode = puzzles.reduce(
    (acc, puzzle) => {
      const mode = puzzle.game_mode as GameMode;
      if (!acc[mode]) {
        acc[mode] = [];
      }
      acc[mode].push(puzzle);
      return acc;
    },
    {} as Record<GameMode, DailyPuzzle[]>
  );

  return {
    puzzles,
    groupedByMode,
    count: puzzles.length,
    isLoading,
    error: error || null,
    mutate,
  };
}
