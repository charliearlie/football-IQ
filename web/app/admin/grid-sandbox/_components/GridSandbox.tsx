"use client";

import { useState, useTransition } from "react";
import { GridMatrix } from "./GridMatrix";
import { CellInspector } from "./CellInspector";
import { PlayerAutocomplete } from "./PlayerAutocomplete";
import { SyncPanel } from "./SyncPanel";
import { BatchSyncPanel } from "./BatchSyncPanel";
import { ManualGridBuilder } from "./ManualGridBuilder";
import { PublishGridModal } from "./PublishGridModal";
import { generateGrid, pruneOrphanClubs } from "../actions";
import type { GridMode } from "../actions";
import type {
  GeneratedGrid,
  CellSolvability,
  GridCategory,
  AutocompletePlayer,
  PoolDebugInfo,
} from "../_lib/types";

type EntryMode = "manual" | "auto";

export function GridSandbox() {
  const [grid, setGrid] = useState<GeneratedGrid | null>(null);
  const [solvability, setSolvability] = useState<CellSolvability[]>([]);
  const [debugInfo, setDebugInfo] = useState<PoolDebugInfo | null>(null);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{
    qid: string;
    name: string;
  } | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState<GridMode>("clubs-nations");
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [isPending, startTransition] = useTransition();
  const [publishOpen, setPublishOpen] = useState(false);
  const [pruneResult, setPruneResult] = useState<{
    deleted: string[];
    remaining: number;
  } | null>(null);
  const [isPruning, startPruneTransition] = useTransition();

  const handleGenerate = () => {
    setGenerateError(null);
    setSelectedCell(null);
    startTransition(async () => {
      const result = await generateGrid(gridMode);
      if (result.success && result.data) {
        setGrid(result.data.grid);
        setSolvability(result.data.solvability);
        setDebugInfo(result.data.debug);
      } else {
        setGenerateError(result.error ?? "Generation failed");
        setGrid(null);
        setSolvability([]);
        setDebugInfo(null);
      }
    });
  };

  const handleManualGrid = (g: GeneratedGrid, s: CellSolvability[]) => {
    setGrid(g);
    setSolvability(s);
    setDebugInfo(null);
    setSelectedCell(null);
  };

  const handlePlayerSelect = (player: AutocompletePlayer) => {
    setSelectedPlayer({ qid: player.qid, name: player.name });
  };

  const isPublishable =
    grid !== null &&
    solvability.length === 9 &&
    solvability.every((s) => s.playerCount > 0);

  const handlePrune = () => {
    startPruneTransition(async () => {
      const result = await pruneOrphanClubs();
      if (result.success && result.data) {
        setPruneResult(result.data);
      }
    });
  };

  const selectedCriteria: { a: GridCategory; b: GridCategory } | null =
    selectedCell !== null && grid
      ? {
          a: grid.yAxis[Math.floor(selectedCell / 3)],
          b: grid.xAxis[selectedCell % 3],
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Entry mode toggle */}
      <div className="flex items-center gap-2">
        {(["manual", "auto"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setEntryMode(mode)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              entryMode === mode
                ? "bg-slate-700 text-slate-100"
                : "bg-slate-800/50 text-slate-500 hover:text-slate-300"
            }`}
          >
            {mode === "manual" ? "Manual Entry" : "Auto Generate"}
          </button>
        ))}
      </div>

      {/* Manual entry */}
      {entryMode === "manual" && (
        <ManualGridBuilder onGridValidated={handleManualGrid} />
      )}

      {/* Auto generation controls */}
      {entryMode === "auto" && (
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="px-6 py-2.5 bg-[#58CC02] hover:bg-[#46A302] text-[#0F172A] font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Generating..." : "Generate New Grid"}
          </button>
          <div className="flex items-center gap-1.5">
            {(["clubs-nations", "mixed"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setGridMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  gridMode === mode
                    ? "bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/50"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                }`}
              >
                {mode === "clubs-nations" ? "Clubs & Nations" : "Mixed (+ Trophies)"}
              </button>
            ))}
          </div>
          {generateError && (
            <span className="text-sm text-red-400">{generateError}</span>
          )}
          {debugInfo && (
            <span className="text-xs text-slate-500 font-mono">
              pools: {debugInfo.clubs}c {debugInfo.nations}n {debugInfo.trophies}t {debugInfo.stats}s
              {" "}| attempts: {debugInfo.attempts}
            </span>
          )}
        </div>
      )}

      {/* Grid Matrix */}
      {grid && (
        <>
          <GridMatrix
            grid={grid}
            selectedCell={selectedCell}
            onCellClick={setSelectedCell}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPublishOpen(true)}
              disabled={!isPublishable}
              className="px-5 py-2 bg-[#58CC02] hover:bg-[#46A302] text-[#0F172A] font-bold rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Publish Grid
            </button>
            {!isPublishable && solvability.length > 0 && (
              <span className="text-xs text-slate-500">
                Validate all 9 cells first
              </span>
            )}
          </div>
        </>
      )}

      {/* Bottom panels: Inspector + Player tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cell Inspector (Rarity Leaderboard) */}
        <div>
          {selectedCell !== null && selectedCriteria ? (
            <CellInspector
              cellIndex={selectedCell}
              criteriaA={selectedCriteria.a}
              criteriaB={selectedCriteria.b}
            />
          ) : grid ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 text-center text-slate-500">
              Click a cell above to inspect its rarity leaderboard
            </div>
          ) : null}
        </div>

        {/* Player Tools */}
        <div className="space-y-4">
          <PlayerAutocomplete onSelect={handlePlayerSelect} />

          {selectedPlayer && (
            <SyncPanel
              player={selectedPlayer}
              grid={grid}
              selectedCell={selectedCell}
            />
          )}
        </div>
      </div>

      {/* Batch Sync */}
      <BatchSyncPanel />

      {/* Admin Utilities */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Database Utilities
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrune}
            disabled={isPruning}
            className="px-4 py-2 bg-red-900/50 hover:bg-red-900/80 text-red-300 border border-red-800/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPruning ? "Pruning..." : "Prune Orphan Clubs"}
          </button>
          {pruneResult && (
            <span className="text-xs text-slate-400">
              {pruneResult.deleted.length === 0
                ? "No orphan clubs found."
                : `Deleted ${pruneResult.deleted.length} orphan club(s): ${pruneResult.deleted.join(", ")}. ${pruneResult.remaining} clubs remaining.`}
            </span>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      {grid && (
        <PublishGridModal
          grid={grid}
          solvability={solvability}
          open={publishOpen}
          onOpenChange={setPublishOpen}
        />
      )}
    </div>
  );
}
