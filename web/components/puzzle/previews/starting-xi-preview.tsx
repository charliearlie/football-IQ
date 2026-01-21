"use client";

import { Badge } from "@/components/ui/badge";
import type { StartingXIContent } from "@/lib/schemas";

interface StartingXIPreviewProps {
  content: unknown;
}

// Position coordinates (x: 0-100 left-right, y: 0-100 top-bottom)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  // Goalkeeper
  GK: { x: 50, y: 90 },
  // Defenders
  RB: { x: 85, y: 75 },
  RCB: { x: 65, y: 78 },
  CB: { x: 50, y: 78 },
  LCB: { x: 35, y: 78 },
  LB: { x: 15, y: 75 },
  RWB: { x: 88, y: 65 },
  LWB: { x: 12, y: 65 },
  // Defensive Midfield
  CDM: { x: 50, y: 60 },
  RCDM: { x: 60, y: 58 },
  LCDM: { x: 40, y: 58 },
  // Central Midfield
  RCM: { x: 65, y: 48 },
  CM: { x: 50, y: 45 },
  LCM: { x: 35, y: 48 },
  RM: { x: 88, y: 45 },
  LM: { x: 12, y: 45 },
  // Attacking Midfield
  CAM: { x: 50, y: 32 },
  RCAM: { x: 60, y: 30 },
  LCAM: { x: 40, y: 30 },
  // Forwards
  RW: { x: 85, y: 20 },
  LW: { x: 15, y: 20 },
  ST: { x: 50, y: 15 },
  RST: { x: 60, y: 15 },
  LST: { x: 40, y: 15 },
  CF: { x: 50, y: 22 },
};

export function StartingXIPreview({ content }: StartingXIPreviewProps) {
  const data = content as StartingXIContent;

  if (!data?.players?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add players to see preview
      </div>
    );
  }

  const hiddenCount = data.players.filter((p) => p.is_hidden).length;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-floodlight">Starting XI</h3>
        <p className="text-sm text-card-yellow font-medium">
          {data.match_name || "Match Name"}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {data.competition || "Competition"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {data.match_date || "Date"}
          </span>
        </div>
      </div>

      {/* Formation Badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="secondary">{data.team || "Team"}</Badge>
        <Badge variant="outline">{data.formation}</Badge>
        <Badge variant={hiddenCount > 0 ? "warning" : "outline"}>
          {hiddenCount} hidden
        </Badge>
      </div>

      {/* Pitch Visualization */}
      <div className="relative bg-pitch-green/20 rounded-lg overflow-hidden aspect-[3/4] border border-pitch-green/30">
        {/* Pitch Markings */}
        <div className="absolute inset-0">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full" />
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
          {/* Penalty areas */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b border-l border-r border-white/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t border-l border-r border-white/20" />
        </div>

        {/* Players */}
        {data.players.map((player, index) => {
          const coords =
            player.override_x && player.override_y
              ? { x: player.override_x, y: player.override_y }
              : POSITION_COORDS[player.position_key] || { x: 50, y: 50 };

          return (
            <div
              key={index}
              className="absolute flex flex-col items-center"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Player Marker */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                  player.is_hidden
                    ? "bg-white/20 text-white/50 border-2 border-dashed border-white/40"
                    : "bg-floodlight text-stadium-navy"
                }`}
              >
                {player.is_hidden ? "?" : player.position_key.slice(0, 2)}
              </div>

              {/* Player Name */}
              <span
                className={`text-[10px] mt-1 text-center max-w-[60px] truncate ${
                  player.is_hidden
                    ? "text-white/40"
                    : "text-floodlight font-medium"
                }`}
              >
                {player.is_hidden
                  ? "Hidden"
                  : player.player_name?.split(" ").pop() || "Player"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scoring Info */}
      <div className="text-center text-xs text-muted-foreground">
        {hiddenCount > 0 ? (
          <span>
            Max Score: {hiddenCount} + 3 bonus = {hiddenCount + 3} points
          </span>
        ) : (
          <span>Add hidden players for users to guess</span>
        )}
      </div>
    </div>
  );
}
