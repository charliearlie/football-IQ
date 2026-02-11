"use client";

import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import type { CalendarData } from "@/hooks/use-calendar-data";

interface StatsBarProps {
  stats: CalendarData["stats"];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <StatCard
        icon={CheckCircle}
        label="Complete Days"
        value={stats.fullyPopulatedDays}
        total={stats.totalDays}
        color="text-pitch-green"
        bgColor="bg-pitch-green/10"
      />
      <StatCard
        icon={AlertTriangle}
        label="Partial Days"
        value={stats.partiallyPopulatedDays}
        total={stats.totalDays}
        color="text-card-yellow"
        bgColor="bg-card-yellow/10"
      />
      <StatCard
        icon={XCircle}
        label="Empty Days"
        value={stats.emptyDays}
        total={stats.totalDays}
        color="text-red-card"
        bgColor="bg-red-card/10"
      />
      <StatCard
        icon={Clock}
        label="Next 7 Days Gaps"
        value={stats.upcomingGaps}
        color={stats.upcomingGaps > 0 ? "text-red-card" : "text-pitch-green"}
        bgColor={stats.upcomingGaps > 0 ? "bg-red-card/10" : "bg-pitch-green/10"}
        highlight={stats.upcomingGaps > 0}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  total?: number;
  color: string;
  bgColor: string;
  highlight?: boolean;
}

function StatCard({ icon: Icon, label, value, total, color, bgColor, highlight }: StatCardProps) {
  return (
    <div
      className={`glass-card p-3 md:p-4 ${highlight ? "ring-1 ring-red-card/50" : ""}`}
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`p-1.5 md:p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${color}`} />
        </div>
        <div>
          <div className={`text-xl md:text-2xl font-bold ${color}`}>
            {value}
            {total !== undefined && (
              <span className="text-xs md:text-sm text-muted-foreground font-normal">
                /{total}
              </span>
            )}
          </div>
          <div className="text-[10px] md:text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
