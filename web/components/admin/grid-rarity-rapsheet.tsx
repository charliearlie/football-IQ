"use client";

/**
 * GridRarityRapSheet Component
 *
 * Displays live rarity statistics for a published Grid puzzle.
 * Shows which cells are "too easy" (everyone picks the same players)
 * vs "deep cuts" (lots of variety in picks).
 *
 * Used in puzzle editor for published The Grid puzzles.
 */

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Users, TrendingUp } from "lucide-react";

interface CellRarityStats {
  cellIndex: number;
  totalSelections: number;
  uniquePlayers: number;
  topPlayerName: string | null;
  topPlayerPct: number;
  avgRarity: number;
}

interface GridRarityRapSheetProps {
  puzzleId: string;
}

/**
 * Get color class for average rarity percentage.
 * Higher avgRarity = more variety = healthier cell.
 */
function getRarityColorClass(avgRarity: number): string {
  if (avgRarity >= 30) return "bg-emerald-500/30 text-emerald-300"; // Healthy variety
  if (avgRarity >= 15) return "bg-yellow-500/30 text-yellow-300"; // Moderate
  return "bg-red-500/30 text-red-300"; // Too easy - everyone picks same player
}

export function GridRarityRapSheet({ puzzleId }: GridRarityRapSheetProps) {
  const [stats, setStats] = useState<CellRarityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcError } = await (supabase.rpc as any)(
          "get_grid_cell_stats",
          { p_puzzle_id: puzzleId }
        );

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        if (!data || data.length === 0) {
          setStats([]);
          return;
        }

        const formattedStats: CellRarityStats[] = data.map((row: {
          cell_index: number;
          total_selections: number;
          unique_players: number;
          top_player_name: string | null;
          top_player_pct: number;
          avg_rarity: number;
        }) => ({
          cellIndex: row.cell_index,
          totalSelections: row.total_selections,
          uniquePlayers: row.unique_players,
          topPlayerName: row.top_player_name,
          topPlayerPct: row.top_player_pct,
          avgRarity: row.avg_rarity,
        }));

        setStats(formattedStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    startTransition(() => {
      fetchStats();
    });
  }, [puzzleId]);

  // Calculate overall stats
  const totalPicks = stats.reduce((sum, s) => sum + s.totalSelections, 0);
  const avgVariety =
    stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.avgRarity, 0) / stats.length)
      : 0;

  if (loading || isPending) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <div className="text-sm text-slate-500 text-center py-4">
          Loading rarity stats...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">
            Live Rarity Stats
          </h3>
        </div>
        <p className="text-xs text-slate-500 text-center py-4">
          No submissions yet for this puzzle.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">
            Live Rarity Stats
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {totalPicks} picks
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={12} />
            {avgVariety}% avg variety
          </span>
        </div>
      </div>

      {/* 3x3 Heatmap Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIndex) => {
          const cellStat = stats.find((s) => s.cellIndex === cellIndex);

          if (!cellStat) {
            return (
              <div
                key={cellIndex}
                className="p-2 rounded bg-slate-800/50 text-center"
              >
                <div className="text-xs text-slate-600">Cell {cellIndex}</div>
                <div className="text-sm text-slate-600">-</div>
              </div>
            );
          }

          const colorClass = getRarityColorClass(cellStat.avgRarity);

          return (
            <div
              key={cellIndex}
              className={`p-2 rounded text-center ${colorClass}`}
              title={`Top: ${cellStat.topPlayerName} (${cellStat.topPlayerPct}%)`}
            >
              <div className="text-[10px] opacity-60">Cell {cellIndex}</div>
              <div className="text-lg font-mono font-bold">
                {cellStat.avgRarity.toFixed(0)}%
              </div>
              <div className="text-[10px] opacity-80">
                {cellStat.totalSelections} picks
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Picks Per Cell (collapsible) */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300">
          View Top Picks Per Cell
        </summary>
        <div className="mt-2 space-y-2 pl-2 border-l border-slate-800">
          {stats.map((cell) => (
            <div key={cell.cellIndex} className="text-xs">
              <span className="text-slate-500">Cell {cell.cellIndex}:</span>{" "}
              <span className="text-slate-300">{cell.topPlayerName ?? "-"}</span>
              <span className="text-slate-600 ml-1">
                ({cell.topPlayerPct.toFixed(1)}% of {cell.totalSelections} picks)
              </span>
            </div>
          ))}
        </div>
      </details>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
            30%+ = Healthy variety
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500/50" />
            15-30% = Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/50" />
            {"<15%"} = Too obvious
          </span>
        </div>
      </div>
    </div>
  );
}
