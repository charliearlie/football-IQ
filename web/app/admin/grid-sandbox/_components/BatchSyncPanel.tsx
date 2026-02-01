"use client";

import { useState, useTransition } from "react";
import { batchSyncAchievements } from "../actions";

const BATCH_SIZE = 50;

interface BatchResult {
  qid: string;
  name: string;
  count: number;
  error?: string;
}

export function BatchSyncPanel() {
  const [offset, setOffset] = useState(0);
  const [allResults, setAllResults] = useState<BatchResult[]>([]);
  const [totalSucceeded, setTotalSucceeded] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [batchesRun, setBatchesRun] = useState(0);
  const [lastBatchTotal, setLastBatchTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRunBatch = () => {
    setError(null);
    startTransition(async () => {
      const res = await batchSyncAchievements(BATCH_SIZE, offset);
      if (res.success && res.data) {
        setAllResults((prev) => [...prev, ...res.data!.results]);
        setTotalSucceeded((prev) => prev + res.data!.succeeded);
        setTotalFailed((prev) => prev + res.data!.failed);
        setBatchesRun((prev) => prev + 1);
        setLastBatchTotal(res.data.total);
        // Advance offset for next batch
        setOffset((prev) => prev + BATCH_SIZE);
      } else {
        setError(res.error ?? "Batch sync failed");
      }
    });
  };

  const handleReset = () => {
    setOffset(0);
    setAllResults([]);
    setTotalSucceeded(0);
    setTotalFailed(0);
    setBatchesRun(0);
    setLastBatchTotal(null);
    setError(null);
  };

  const recentResults = allResults.slice(-BATCH_SIZE);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300">
          Batch Sync Achievements
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Sync achievements from Wikidata for top players by scout rank.
          Processes {BATCH_SIZE} unsynced players per batch.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRunBatch}
          disabled={isPending}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Syncing..."
            : batchesRun === 0
              ? `Sync Top ${BATCH_SIZE} Players`
              : `Sync Next ${BATCH_SIZE} (offset ${offset})`}
        </button>
        {batchesRun > 0 && (
          <button
            onClick={handleReset}
            disabled={isPending}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-md transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Summary stats */}
      {batchesRun > 0 && (
        <div className="flex gap-4 text-xs">
          <span className="text-slate-400">
            Batches: <span className="text-slate-200 font-mono">{batchesRun}</span>
          </span>
          <span className="text-slate-400">
            Synced:{" "}
            <span className="text-green-400 font-mono">{totalSucceeded}</span>
          </span>
          <span className="text-slate-400">
            Failed:{" "}
            <span className="text-red-400 font-mono">{totalFailed}</span>
          </span>
          <span className="text-slate-400">
            Offset:{" "}
            <span className="text-slate-200 font-mono">{offset}</span>
          </span>
          {lastBatchTotal === 0 && (
            <span className="text-yellow-400">
              All players in range already synced
            </span>
          )}
        </div>
      )}

      {/* Recent results */}
      {recentResults.length > 0 && (
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left py-1.5">Player</th>
                <th className="text-left py-1.5 px-2">QID</th>
                <th className="text-right py-1.5 px-2">Achievements</th>
                <th className="text-right py-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((r) => (
                <tr
                  key={r.qid}
                  className="border-b border-slate-800/50 hover:bg-slate-800/50"
                >
                  <td className="py-1.5 text-slate-200 font-medium">
                    {r.name}
                  </td>
                  <td className="py-1.5 px-2 text-slate-500 font-mono">
                    {r.qid}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-400">
                    {r.count}
                  </td>
                  <td className="py-1.5 text-right">
                    {r.error ? (
                      <span className="text-red-400" title={r.error}>
                        failed
                      </span>
                    ) : (
                      <span className="text-green-400">ok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
