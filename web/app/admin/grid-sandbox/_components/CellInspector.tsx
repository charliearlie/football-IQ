"use client";

import { useState, useEffect, useTransition } from "react";
import { getValidPlayersForCell } from "../actions";
import { getFlagEmoji } from "../_lib/types";
import type { GridCategory, RarityPlayer } from "../_lib/types";

interface CellInspectorProps {
  cellIndex: number;
  criteriaA: GridCategory;
  criteriaB: GridCategory;
}

export function CellInspector({
  cellIndex,
  criteriaA,
  criteriaB,
}: CellInspectorProps) {
  const [players, setPlayers] = useState<RarityPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch when criteria change
  useEffect(() => {
    setError(null);
    startTransition(async () => {
      const res = await getValidPlayersForCell(criteriaA, criteriaB);
      if (res.success && res.data) {
        setPlayers(res.data);
      } else {
        setError(res.error ?? "Failed to load");
        setPlayers([]);
      }
    });
  }, [cellIndex, criteriaA, criteriaB]);

  const typeLabel = (cat: GridCategory) => {
    const colors: Record<string, string> = {
      club: "text-blue-300",
      nation: "text-green-300",
      trophy: "text-yellow-300",
      stat: "text-purple-300",
    };
    return (
      <span className={colors[cat.type] ?? "text-slate-300"}>
        {cat.value}
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-300">
          Cell {cellIndex} — Rarity Leaderboard
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {typeLabel(criteriaA)} <span className="text-slate-600">×</span>{" "}
          {typeLabel(criteriaB)}
        </p>
      </div>

      {isPending && (
        <div className="text-xs text-slate-500 py-4 text-center">
          Loading valid players...
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!isPending && !error && players.length === 0 && (
        <p className="text-xs text-slate-600 py-4 text-center">
          No valid players found for this intersection
        </p>
      )}

      {!isPending && players.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left py-1.5 pr-2">#</th>
                <th className="text-left py-1.5">Player</th>
                <th className="text-right py-1.5 px-2">Rank</th>
                <th className="text-right py-1.5">Rarity</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.qid}
                  className="border-b border-slate-800/50 hover:bg-slate-800/50"
                >
                  <td className="py-1.5 pr-2 text-slate-600 font-mono">
                    {i + 1}
                  </td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <span>{getFlagEmoji(p.nationalityCode)}</span>
                      <span className="font-medium text-slate-200">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {p.positionCategory ?? ""}
                        {p.birthYear ? `, ${p.birthYear}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-500 font-mono">
                    {p.scoutRank}
                  </td>
                  <td className="py-1.5 text-right font-mono">
                    <span
                      className={
                        p.rarityScore >= 80
                          ? "text-[#58CC02]"
                          : p.rarityScore >= 50
                            ? "text-[#FACC15]"
                            : "text-slate-400"
                      }
                    >
                      {p.rarityScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-slate-600 mt-2 text-right">
            {players.length} valid player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
