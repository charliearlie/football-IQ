"use client";

import useSWR from "swr";
import type { GameMode } from "@/lib/constants";
import { fetchPuzzleArchive } from "@/app/(dashboard)/admin/actions";

interface UseAdminPuzzlesOptions {
  gameMode: GameMode | GameMode[];
  page: number;
  pageSize?: number;
  status?: string | null;
}

export function useAdminPuzzles(options: UseAdminPuzzlesOptions) {
  const { gameMode, page, pageSize = 25, status = null } = options;

  const { data, error, isLoading, mutate } = useSWR(
    ["admin-puzzles", gameMode, page, pageSize, status],
    () =>
      fetchPuzzleArchive({
        gameMode,
        page,
        pageSize,
        status,
      }),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return {
    rows: data?.data?.rows ?? [],
    totalCount: data?.data?.totalCount ?? 0,
    page: data?.data?.page ?? page,
    pageSize: data?.data?.pageSize ?? pageSize,
    isLoading,
    error: error || (data && !data.success ? new Error(data.error) : null),
    mutate,
  };
}
