"use client";

import { GAME_MODES, GAME_MODE_SHORT_NAMES, GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";

export function Legend() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-floodlight mb-3">Legend</h3>

      {/* Status indicators */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="status-dot status-dot-success" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot status-dot-draft" />
          <span className="text-xs text-muted-foreground">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot status-dot-empty" />
          <span className="text-xs text-muted-foreground">Empty</span>
        </div>
      </div>

      {/* Game mode abbreviations */}
      <div className="grid grid-cols-4 gap-2">
        {GAME_MODES.map((mode) => (
          <div key={mode} className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-pitch-green">
              {GAME_MODE_SHORT_NAMES[mode as GameMode]}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {GAME_MODE_DISPLAY_NAMES[mode as GameMode]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
