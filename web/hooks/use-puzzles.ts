"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { DailyPuzzle } from "@/types/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface UsePuzzlesOptions {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface UsePuzzlesResult {
  puzzles: DailyPuzzle[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

async function fetchPuzzles({ startDate, endDate }: UsePuzzlesOptions): Promise<DailyPuzzle[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("*")
    .gte("puzzle_date", startDate)
    .lte("puzzle_date", endDate)
    .order("puzzle_date", { ascending: true })
    .order("game_mode", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function usePuzzles(options: UsePuzzlesOptions): UsePuzzlesResult {
  const { data, error, isLoading, mutate } = useSWR(
    ["puzzles", options.startDate, options.endDate],
    () => fetchPuzzles(options),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    puzzles: data || [],
    isLoading,
    error: error || null,
    mutate,
  };
}

// Convenience hook for fetching a month's puzzles
export function useMonthPuzzles(date: Date): UsePuzzlesResult {
  const startDate = format(startOfMonth(date), "yyyy-MM-dd");
  const endDate = format(endOfMonth(date), "yyyy-MM-dd");

  return usePuzzles({ startDate, endDate });
}
