"use client";

import useSWR from "swr";
import {
  fetchPlayerCommandCenterData,
  fetchPlayerRapSheet,
} from "@/app/(dashboard)/admin/actions";
import type {
  ClubHistoryEntry,
  TrophyEntry,
  RapSheetEntry,
} from "@/app/(dashboard)/admin/actions";

interface UsePlayerCommandCenterReturn {
  player: {
    id: string;
    name: string;
    nationality_code: string | null;
    scout_rank: number;
  } | null;
  clubHistory: ClubHistoryEntry[];
  trophyCabinet: TrophyEntry[];
  appearances: RapSheetEntry[];
  modesSummary: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function usePlayerCommandCenter(
  playerQid: string | null
): UsePlayerCommandCenterReturn {
  // Fetch command center data (player details, club history, trophies)
  const {
    data: commandData,
    error: cmdError,
    isLoading: cmdLoading,
    mutate: mutateCmd,
  } = useSWR(
    playerQid ? ["player-command-center", playerQid] : null,
    () => fetchPlayerCommandCenterData(playerQid!),
    { revalidateOnFocus: false }
  );

  // Fetch rap sheet data (puzzle appearances)
  const {
    data: rapData,
    error: rapError,
    isLoading: rapLoading,
    mutate: mutateRap,
  } = useSWR(
    playerQid ? ["player-rap-sheet", playerQid] : null,
    () => fetchPlayerRapSheet(playerQid!),
    { revalidateOnFocus: false }
  );

  const mutate = () => {
    mutateCmd();
    mutateRap();
  };

  return {
    player: commandData?.data?.player ?? null,
    clubHistory: commandData?.data?.clubHistory ?? [],
    trophyCabinet: commandData?.data?.trophyCabinet ?? [],
    appearances: rapData?.data?.appearances ?? [],
    modesSummary: rapData?.data?.modesSummary ?? {},
    isLoading: cmdLoading || rapLoading,
    error:
      cmdError ||
      rapError ||
      (commandData && !commandData.success
        ? new Error(commandData.error)
        : null) ||
      (rapData && !rapData.success ? new Error(rapData.error) : null),
    mutate,
  };
}
