"use client";

import {
  GAME_MODES,
  GAME_MODE_SHORT_NAMES,
  GAME_MODE_DISPLAY_NAMES,
  type GameMode,
} from "@/lib/constants";

export function Legend() {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-floodlight mb-3">Legend</h3>

      {/* Status indicators */}
      <div className="space-y-2 mb-4">
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
          <span className="text-xs text-muted-foreground">Mandatory Gap</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot status-dot-success ring-1 ring-card-yellow ring-offset-1 ring-offset-stadium-navy" />
          <span className="text-xs text-muted-foreground">Extra Content</span>
        </div>
      </div>

      {/* Schedule note */}
      <div className="border-t border-white/10 pt-3 mb-4">
        <p className="text-[10px] text-muted-foreground">
          Only scheduled game modes appear as dots. Days show 3-5 modes
          depending on the weekly schedule.
        </p>
      </div>

      {/* Game mode abbreviations */}
      <div className="grid grid-cols-2 gap-2">
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
