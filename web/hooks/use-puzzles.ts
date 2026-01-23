"use client";

import useSWR from "swr";
import type { DailyPuzzle } from "@/types/supabase";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fetchPuzzlesForCalendar } from "@/app/(dashboard)/calendar/actions";

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
  // Use server action with admin client to bypass RLS
  // This ensures draft puzzles are visible in the CMS
  const result = await fetchPuzzlesForCalendar({ startDate, endDate });

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch puzzles");
  }

  return result.data.puzzles;
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
