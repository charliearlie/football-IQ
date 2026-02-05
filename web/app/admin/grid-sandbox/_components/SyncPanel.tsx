"use client";

import { useState, useTransition } from "react";
import { validateCell, forceSyncAchievements } from "../actions";
import type { GeneratedGrid, CellValidationResult } from "../_lib/types";

interface SyncPanelProps {
  player: { qid: string; name: string };
  grid: GeneratedGrid | null;
  selectedCell: number | null;
}

export function SyncPanel({ player, grid, selectedCell }: SyncPanelProps) {
  const [syncResult, setSyncResult] = useState<{
    count: number;
    statsCache?: Record<string, number>;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();

  const [cellResult, setCellResult] = useState<
    (CellValidationResult & { statsCache?: Record<string, number> }) | null
  >(null);
  const [cellError, setCellError] = useState<string | null>(null);
  const [isChecking, startCheckTransition] = useTransition();

  const handleSync = () => {
    setSyncError(null);
    setSyncResult(null);
    startSyncTransition(async () => {
      const res = await forceSyncAchievements(player.qid);
      if (res.success && res.data) {
        setSyncResult(res.data);
      } else {
        setSyncError(res.error ?? "Sync failed");
      }
    });
  };

  const handleCheckCell = (cellIndex: number) => {
    if (!grid) return;
    setCellError(null);
    setCellResult(null);

    const rowCat = grid.yAxis[Math.floor(cellIndex / 3)];
    const colCat = grid.xAxis[cellIndex % 3];

    startCheckTransition(async () => {
      const res = await validateCell(player.qid, rowCat, colCat);
      if (res.success && res.data) {
        setCellResult(res.data);
      } else {
        setCellError(res.error ?? "Validation failed");
      }
    });
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      {/* Player info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300">
          Selected Player
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-medium">{player.name}</span>
          <span className="text-xs font-mono text-slate-500">
            {player.qid}
          </span>
        </div>
      </div>

      {/* Sync achievements */}
      <div className="border-t border-slate-700 pt-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {isSyncing ? "Syncing..." : "Force Sync Achievements"}
        </button>

        {syncError && (
          <p className="text-xs text-red-400 mt-2">{syncError}</p>
        )}
        {syncResult && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-green-400">
              Synced {syncResult.count} achievement
              {syncResult.count !== 1 ? "s" : ""}
            </p>
            {syncResult.statsCache &&
              Object.keys(syncResult.statsCache).length > 0 && (
                <pre className="text-[10px] text-slate-400 bg-slate-800 rounded p-2 overflow-x-auto max-h-32">
                  {JSON.stringify(syncResult.statsCache, null, 2)}
                </pre>
              )}
          </div>
        )}
      </div>

      {/* Cell validation */}
      {grid && (
        <div className="border-t border-slate-700 pt-3">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">
            Check Against Grid Cells
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleCheckCell(i)}
                disabled={isChecking}
                className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                  selectedCell === i
                    ? "bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/50"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                } disabled:opacity-50`}
              >
                Cell {i}
              </button>
            ))}
          </div>

          {isChecking && (
            <p className="text-xs text-slate-500 mt-2">Checking...</p>
          )}
          {cellError && (
            <p className="text-xs text-red-400 mt-2">{cellError}</p>
          )}
          {cellResult && (
            <div className="mt-2 p-2 bg-slate-800 rounded text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold ${cellResult.isValid ? "text-[#58CC02]" : "text-red-400"}`}
                >
                  {cellResult.isValid ? "VALID" : "INVALID"}
                </span>
              </div>
              <div className="flex gap-4 text-slate-400">
                <span>
                  Row:{" "}
                  <span
                    className={
                      cellResult.matchedA ? "text-green-400" : "text-red-400"
                    }
                  >
                    {cellResult.matchedA ? "\u2713" : "\u2717"}
                  </span>
                </span>
                <span>
                  Col:{" "}
                  <span
                    className={
                      cellResult.matchedB ? "text-green-400" : "text-red-400"
                    }
                  >
                    {cellResult.matchedB ? "\u2713" : "\u2717"}
                  </span>
                </span>
              </div>
              {cellResult.statsCache &&
                Object.keys(cellResult.statsCache).length > 0 && (
                  <pre className="text-[10px] text-slate-500 mt-1 overflow-x-auto max-h-24">
                    {JSON.stringify(cellResult.statsCache, null, 2)}
                  </pre>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
