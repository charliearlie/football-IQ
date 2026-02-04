"use client";

export function StreakBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber/20 to-coral/20 border border-amber/30 animate-glow-pulse">
      <span className="text-xl animate-wiggle inline-block">🔥</span>
      <span className="text-sm font-semibold text-floodlight">
        Join <span className="text-amber">10,000+</span> on a streak
      </span>
    </div>
  );
}
