"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRight, Route } from "lucide-react";
import type { TheChainContent } from "@/lib/schemas";

interface TheChainPreviewProps {
  content: unknown;
}

export function TheChainPreview({ content }: TheChainPreviewProps) {
  const data = content as TheChainContent;

  if (!data?.start_player?.name || !data?.end_player?.name) {
    return (
      <div className="text-center text-gray-400 py-8">
        Select start and end players to see preview
      </div>
    );
  }

  const par = data.par || 5;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">The Chain</h3>
        <p className="text-sm text-gray-400">
          Connect players through shared club history
        </p>
      </div>

      {/* Players Connection */}
      <div className="flex items-center justify-center gap-4">
        <PlayerCard
          player={data.start_player}
          label="START"
          variant="start"
        />
        <div className="flex flex-col items-center">
          <Route className="h-6 w-6 text-gray-400" />
          <Badge variant="outline" className="mt-1">
            PAR {par}
          </Badge>
        </div>
        <PlayerCard
          player={data.end_player}
          label="END"
          variant="end"
        />
      </div>

      {/* Solution Path (if available) */}
      {data.solution_path && data.solution_path.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-gray-400 text-center mb-3">
            Solution Path ({data.solution_path.length - 1} steps)
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {data.solution_path.map((player, i) => (
              <span key={player.qid} className="flex items-center gap-1">
                <span className="text-sm text-white">{player.name}</span>
                {i < data.solution_path!.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-gray-500" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hint Player (if available) */}
      {data.hint_player?.name && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-gray-400 text-center mb-2">
            Hint Player
          </p>
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              {data.hint_player.name}
            </Badge>
          </div>
        </div>
      )}

      {/* Scoring Info */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-gray-400 text-center mb-2">
          Scoring Preview
        </p>
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>
            <span className="text-[#58CC02]">🦅 Eagle</span> ({par - 2} steps): {par + 2} pts
          </p>
          <p>
            <span className="text-[#58CC02]">🐦 Birdie</span> ({par - 1} steps): {par + 1} pts
          </p>
          <p>
            <span className="text-white">⛳ Par</span> ({par} steps): {par} pts
          </p>
          <p>
            <span className="text-[#FACC15]">😐 Bogey</span> ({par + 1} steps): {par - 1} pts
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER CARD COMPONENT
// ============================================================================

interface PlayerCardProps {
  player: {
    name: string;
    qid: string;
    nationality_code?: string;
  };
  label: string;
  variant: "start" | "end";
}

function PlayerCard({ player, label, variant }: PlayerCardProps) {
  const bgClass =
    variant === "start"
      ? "bg-[#58CC02]/20 border-[#58CC02]/50"
      : "bg-[#EF4444]/20 border-[#EF4444]/50";

  const labelClass =
    variant === "start"
      ? "bg-[#58CC02]/20 text-[#58CC02] border-[#58CC02]/30"
      : "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30";

  return (
    <div
      className={`p-3 rounded-lg border ${bgClass} text-center min-w-[120px]`}
    >
      <Badge variant="outline" className={`text-[10px] mb-2 ${labelClass}`}>
        {label}
      </Badge>
      <p className="text-sm font-medium text-white">{player.name}</p>
      <p className="text-[10px] text-gray-400 mt-1">{player.qid}</p>
    </div>
  );
}
