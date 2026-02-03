"use client";

import useSWR from "swr";
import { fetchPlayerRapSheet } from "@/app/(dashboard)/admin/actions";

export function usePlayerRapSheet(playerQid: string | null) {
  const { data, error, isLoading } = useSWR(
    playerQid ? ["player-rap-sheet", playerQid] : null,
    () => fetchPlayerRapSheet(playerQid!),
    { revalidateOnFocus: false }
  );

  return {
    player: data?.data?.player ?? null,
    appearances: data?.data?.appearances ?? [],
    modesSummary: data?.data?.modesSummary ?? {},
    isLoading,
    error: error || (data && !data.success ? new Error(data.error) : null),
  };
}
