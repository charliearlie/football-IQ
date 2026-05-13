"use client";

import Link from "next/link";
import { Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveCardProps {
  /** URL slug, e.g. "career-path". */
  modeSlug: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Human-readable date label, e.g. "Mon 12 May". */
  label: string;
  /** Whether the day is paywalled (outside free window AND user is free). */
  locked: boolean;
  /** Whether this is today's puzzle (visual emphasis). */
  isToday: boolean;
  /** Mode accent colour for live highlights. */
  accentColor: string;
}

export function ArchiveCard({
  modeSlug,
  date,
  label,
  locked,
  isToday,
  accentColor,
}: ArchiveCardProps) {
  // Locked cards still link to /play/[mode]?date=… — the orchestrator's
  // paywall renders in place of the game, so the experience is consistent
  // with clicking Career Path Pro as a free user.
  const href = isToday ? `/play/${modeSlug}` : `/play/${modeSlug}?date=${date}`;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all",
        "hover:border-white/20 hover:bg-white/[0.05]",
        isToday
          ? "border-pitch-green/40 bg-pitch-green/[0.07]"
          : "border-white/10 bg-white/[0.025]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: isToday ? accentColor : "rgba(255,255,255,0.15)" }}
        />
        <div className="min-w-0">
          <p
            className="font-bebas text-base tracking-wide leading-none"
            style={{ color: isToday ? accentColor : undefined }}
          >
            {label}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isToday ? "Today" : date}
          </p>
        </div>
      </div>

      {locked ? (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-card-yellow bg-card-yellow/15 px-2 py-1 rounded">
          <Lock className="w-3 h-3" />
          PRO
        </span>
      ) : isToday ? (
        <span
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: accentColor }}
        >
          <CheckCircle className="w-3 h-3" />
          PLAY TODAY
        </span>
      ) : (
        <span className="text-xs font-semibold text-slate-400">Play →</span>
      )}
    </Link>
  );
}
