"use client";

import { Fragment } from "react";
import type { GeneratedGrid } from "../_lib/types";

interface GridMatrixProps {
  grid: GeneratedGrid;
  selectedCell: number | null;
  onCellClick: (cellIndex: number) => void;
}

function CategoryLabel({ category }: { category: { type: string; value: string } }) {
  const typeColors: Record<string, string> = {
    club: "bg-blue-500/20 text-blue-300",
    nation: "bg-green-500/20 text-green-300",
    trophy: "bg-yellow-500/20 text-yellow-300",
    stat: "bg-purple-500/20 text-purple-300",
  };

  return (
    <div className="flex flex-col items-center gap-1 p-2">
      <span
        className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${typeColors[category.type] ?? "bg-slate-700 text-slate-300"}`}
      >
        {category.type}
      </span>
      <span className="text-xs text-center font-medium leading-tight">
        {category.value}
      </span>
    </div>
  );
}

export function GridMatrix({ grid, selectedCell, onCellClick }: GridMatrixProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      {/* Grid layout: 4 cols (label + 3 data), 4 rows (header + 3 data) */}
      <div className="grid grid-cols-4 gap-1">
        {/* Top-left empty corner */}
        <div />

        {/* Column headers (X-axis) */}
        {grid.xAxis.map((cat, i) => (
          <CategoryLabel key={`col-${i}`} category={cat} />
        ))}

        {/* Rows */}
        {grid.yAxis.map((rowCat, rowIdx) => (
          <Fragment key={`row-${rowIdx}`}>
            {/* Row header (Y-axis) */}
            <CategoryLabel category={rowCat} />

            {/* Cells */}
            {[0, 1, 2].map((colIdx) => {
              const cellIndex = rowIdx * 3 + colIdx;
              const count = grid.cellCounts[cellIndex] ?? 0;
              const isSelected = selectedCell === cellIndex;

              return (
                <button
                  key={`cell-${cellIndex}`}
                  onClick={() => onCellClick(cellIndex)}
                  className={`
                    relative flex flex-col items-center justify-center
                    min-h-[80px] rounded-md transition-all cursor-pointer
                    ${
                      isSelected
                        ? "bg-[#FACC15]/20 border-2 border-[#FACC15] shadow-lg shadow-yellow-500/10"
                        : "bg-slate-800 border border-slate-700 hover:border-slate-500"
                    }
                  `}
                >
                  <span
                    className={`text-2xl font-bold ${count > 0 ? "text-[#58CC02]" : "text-red-400"}`}
                  >
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    player{count !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
