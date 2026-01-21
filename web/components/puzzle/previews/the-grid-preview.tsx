"use client";

import { Badge } from "@/components/ui/badge";
import type { TheGridContent } from "@/lib/schemas";

interface TheGridPreviewProps {
  content: unknown;
}

export function TheGridPreview({ content }: TheGridPreviewProps) {
  const data = content as TheGridContent;

  if (!data?.xAxis || !data?.yAxis) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add categories to see preview
      </div>
    );
  }

  const getCellAnswerCount = (cellIndex: number) => {
    const answers = data.valid_answers?.[String(cellIndex)] || [];
    return answers.filter((a) => a.trim() !== "").length;
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-floodlight">The Grid</h3>
        <p className="text-sm text-muted-foreground">
          Fill the 3x3 grid with valid players
        </p>
      </div>

      {/* Grid Preview */}
      <div className="glass-card p-4">
        {/* Column Headers */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div /> {/* Empty corner */}
          {data.xAxis.map((cat, index) => (
            <div key={`x-${index}`} className="text-center">
              <Badge variant="outline" className="text-xs mb-1">
                {cat.type}
              </Badge>
              <p className="text-xs text-floodlight truncate">
                {cat.value || "..."}
              </p>
            </div>
          ))}
        </div>

        {/* Grid Rows */}
        {[0, 1, 2].map((rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-4 gap-2 mb-2">
            {/* Row Header */}
            <div className="flex flex-col items-center justify-center">
              <Badge variant="outline" className="text-xs mb-1">
                {data.yAxis[rowIndex]?.type}
              </Badge>
              <p className="text-xs text-floodlight truncate">
                {data.yAxis[rowIndex]?.value || "..."}
              </p>
            </div>

            {/* Cells */}
            {[0, 1, 2].map((colIndex) => {
              const cellIndex = rowIndex * 3 + colIndex;
              const answerCount = getCellAnswerCount(cellIndex);

              return (
                <div
                  key={`cell-${cellIndex}`}
                  className={`aspect-square rounded-lg flex items-center justify-center border ${
                    answerCount > 0
                      ? "bg-pitch-green/20 border-pitch-green"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {answerCount > 0 ? (
                    <span className="text-xs text-pitch-green font-medium">
                      {answerCount}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">?</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Valid Answers Summary */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Valid answers per cell
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIndex) => {
            const answers = data.valid_answers?.[String(cellIndex)] || [];
            const validAnswers = answers.filter((a) => a.trim() !== "");

            return (
              <div
                key={cellIndex}
                className="text-xs text-muted-foreground text-center"
              >
                Cell {cellIndex}: {validAnswers.length}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Info */}
      <div className="text-center text-xs text-muted-foreground">
        Max Score: 100 points (9/9 cells)
      </div>
    </div>
  );
}
