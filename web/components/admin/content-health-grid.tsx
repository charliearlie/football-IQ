"use client";

import useSWR from "swr";
import { fetchContentHealth } from "@/app/(dashboard)/admin/content/actions";
import type {
  GameModeHealth,
  HealthStatus,
} from "@/app/(dashboard)/admin/content/actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<
  HealthStatus,
  {
    badge: "success" | "warning" | "destructive";
    label: string;
    Icon: typeof CheckCircle2;
    borderColor: string;
  }
> = {
  ok: {
    badge: "success",
    label: "OK",
    Icon: CheckCircle2,
    borderColor: "border-pitch-green/30",
  },
  warning: {
    badge: "warning",
    label: "WARNING",
    Icon: AlertTriangle,
    borderColor: "border-card-yellow/30",
  },
  critical: {
    badge: "destructive",
    label: "CRITICAL",
    Icon: XCircle,
    borderColor: "border-red-card/30",
  },
};

export function ContentHealthGrid() {
  const { data, isLoading } = useSWR(
    "admin-content-health",
    () => fetchContentHealth(),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const health = data?.data;
  if (!health) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {health.modes.map((mode) => (
        <GameModeCard key={mode.game_mode} mode={mode} />
      ))}
    </div>
  );
}

function GameModeCard({ mode }: { mode: GameModeHealth }) {
  const config = STATUS_CONFIG[mode.status];

  return (
    <div
      className={`rounded-lg border ${config.borderColor} bg-white/5 p-4 space-y-2`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-floodlight">
          {mode.display_name}
        </h3>
        <Badge variant={config.badge}>{config.label}</Badge>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={`text-3xl font-bold font-[family-name:var(--font-bebas)] tracking-wide ${
            mode.status === "critical"
              ? "text-red-card"
              : mode.status === "warning"
                ? "text-card-yellow"
                : "text-pitch-green"
          }`}
        >
          {mode.days_coverage}
        </span>
        <span className="text-sm text-muted-foreground pb-1">
          {mode.days_coverage === 1 ? "puzzle" : "puzzles"} scheduled
        </span>
      </div>
      {mode.last_puzzle_date && (
        <p className="text-xs text-muted-foreground">
          Last scheduled:{" "}
          {new Date(mode.last_puzzle_date + "T00:00:00").toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "short", year: "numeric" }
          )}
        </p>
      )}
    </div>
  );
}
