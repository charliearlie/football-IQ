"use client";

import { StatCard } from "./stat-card";
import { useAdminFunnel } from "@/hooks/use-admin-funnel";
import { Skeleton } from "@/components/ui/skeleton";

export function FunnelCards() {
  const { funnel, isLoading } = useAdminFunnel();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    );
  }

  if (!funnel) return null;

  const pct = (n: number) =>
    funnel.registered > 0
      ? `${((n / funnel.registered) * 100).toFixed(1)}%`
      : "0%";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Registered" value={funnel.registered} />
      <StatCard
        label="Ever Played"
        value={funnel.everPlayed}
        subtext={`${pct(funnel.everPlayed)} of registered`}
      />
      <StatCard
        label="Active 7d"
        value={funnel.active7d}
        subtext={`${pct(funnel.active7d)} of registered`}
        variant={funnel.active7d < 10 ? "warning" : undefined}
      />
      <StatCard
        label="Premium"
        value={funnel.premium}
        subtext={`${pct(funnel.premium)} of registered`}
        variant="success"
      />
    </div>
  );
}
