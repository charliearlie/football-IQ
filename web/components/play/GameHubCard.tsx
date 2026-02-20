"use client";

import Link from "next/link";
import { CheckCircle, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { hasPlayedToday } from "@/lib/playSession";

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

  useEffect(() => {
    if (slug) {
      setPlayedToday(hasPlayedToday(slug));
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
        "relative rounded-xl border p-5 transition-all",
        featured && "col-span-2",
        isClickable && "hover:border-white/20 hover:bg-white/[0.04] cursor-pointer",
        status === "available" && "border-white/10 bg-white/[0.02]",
        status === "completed" && "border-pitch-green/30 bg-pitch-green/[0.04]",
        status === "no_puzzle" && "border-white/5 bg-white/[0.01] opacity-60",
        status === "app_only" && "border-white/5 bg-white/[0.01] opacity-50"
      )}
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-2">
        {status === "available" && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accentColor, color: "#0F172A" }}
          >
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
  );

  if (isClickable && slug) {
    return <Link href={`/play/${slug}`}>{card}</Link>;
  }

  return card;
}
