"use client";

import { useMemo } from "react";
import { ArchiveCard } from "./ArchiveCard";
import { isWithinFreeWindow, getTodayDateString } from "@/lib/archive/freeWindow";
import { usePremium } from "@/lib/billing/usePremium";
import { isSubscriptionsEnabled } from "@/lib/billing/config";

export interface ArchiveListEntry {
  date: string;
  isPremium: boolean;
}

interface ArchiveListProps {
  modeSlug: string;
  accentColor: string;
  entries: ArchiveListEntry[];
  /** Stable "today" string passed from the server to avoid hydration drift. */
  today: string;
}

interface MonthGroup {
  label: string;
  entries: ArchiveListEntry[];
}

export function ArchiveList({
  modeSlug,
  accentColor,
  entries,
  today,
}: ArchiveListProps) {
  const premium = usePremium();
  const subscriptionsEnabled = isSubscriptionsEnabled();
  const groups = useMemo(() => groupByMonth(entries), [entries]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-12">
        No archived puzzles yet. Check back tomorrow.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="font-bebas text-2xl tracking-wider text-slate-300">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.entries.map((entry) => {
              const isToday = entry.date === today;
              // A puzzle is locked when subscriptions are live AND it's
              // outside the free window (or flagged premium) AND the user
              // hasn't unlocked premium. Today is always free.
              const inFreeWindow = isWithinFreeWindow(entry.date, today);
              const locked =
                subscriptionsEnabled &&
                !premium.isPremium &&
                (!inFreeWindow || entry.isPremium);
              return (
                <ArchiveCard
                  key={entry.date}
                  modeSlug={modeSlug}
                  date={entry.date}
                  label={formatDayLabel(entry.date)}
                  locked={locked}
                  isToday={isToday}
                  accentColor={accentColor}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByMonth(entries: ArchiveListEntry[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const entry of entries) {
    const date = new Date(`${entry.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(key, { label, entries: [entry] });
    }
  }
  return Array.from(groups.values());
}

function formatDayLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Re-exported so server components can avoid re-importing freeWindow directly.
export { getTodayDateString };
