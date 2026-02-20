"use client";

import Link from "next/link";
import { CheckCircle, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { hasPlayedToday, getPlayResult } from "@/lib/playSession";
import type { PlayResult } from "@/lib/playSession";

type CardStatus = "available" | "completed" | "no_puzzle" | "app_only";

interface GameHubCardProps {
  title: string;
  description: string;
  slug?: string;
  hasLivePuzzle: boolean;
  accentColor: string;
  isAppOnly?: boolean;
  featured?: boolean;
}

export function GameHubCard({
  title,
  description,
  slug,
  hasLivePuzzle,
  accentColor,
  isAppOnly = false,
  featured = false,
}: GameHubCardProps) {
  const [playedToday, setPlayedToday] = useState(false);
  const [playResult, setPlayResult] = useState<{ won: boolean; shareText: string } | null>(null);

  useEffect(() => {
    if (slug) {
      const played = hasPlayedToday(slug);
      setPlayedToday(played);
      if (played) {
        const result: PlayResult | null = getPlayResult(slug);
        if (result) {
          setPlayResult({ won: result.won, shareText: result.shareText });
        }
      }
    }
  }, [slug]);

  const status: CardStatus = isAppOnly
    ? "app_only"
    : !hasLivePuzzle
      ? "no_puzzle"
      : playedToday
        ? "completed"
        : "available";

  const isClickable = status === "available" || status === "completed";

  const card = (
    <div
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all",
        featured && status === "available" && "min-h-[140px] flex flex-col justify-between",
        featured && "col-span-2",
        isClickable && "hover:border-white/20 hover:bg-white/[0.04] cursor-pointer",
        status === "available" && "border-white/10 bg-white/[0.02]",
        status === "completed" && "border-pitch-green/30 bg-pitch-green/[0.04]",
        status === "no_puzzle" && "border-white/5 bg-white/[0.01] opacity-60",
        status === "app_only" && "border-white/5 bg-white/[0.01] opacity-50"
      )}
    >
      {/* Accent color strip */}
      {!isAppOnly && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
          style={{ backgroundColor: status === "app_only" ? "#334155" : accentColor }}
        />
      )}

      <div className="pl-5 p-5">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-2">
          {status === "available" && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: accentColor }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: accentColor }}
                />
              </span>
              LIVE
            </span>
          )}
          {status === "completed" && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pitch-green">
              <CheckCircle className="w-3 h-3" />
              PLAYED TODAY
            </span>
          )}
          {status === "no_puzzle" && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Clock className="w-3 h-3" />
              NEXT PUZZLE SOON
            </span>
          )}
          {status === "app_only" && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Lock className="w-3 h-3" />
              APP ONLY
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-bebas text-lg tracking-wide mb-1"
          style={{ color: status === "app_only" ? "#64748B" : accentColor }}
        >
          {title.toUpperCase()}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>

        {/* Score preview on completed cards */}
        {status === "completed" && playResult && (
          <p className="text-xs text-slate-500 mt-1">
            {playResult.won ? "Correct!" : "Better luck tomorrow"}
          </p>
        )}

        {/* CTA */}
        {status === "available" && (
          <div className="mt-3">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: accentColor }}
            >
              Play today&apos;s game &rarr;
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (isClickable && slug) {
    return <Link href={`/play/${slug}`}>{card}</Link>;
  }

  return card;
}
