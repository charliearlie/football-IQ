"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { hasPlayedToday, getPlayResult } from "@/lib/playSession";
import { copyToClipboard } from "@/lib/playSession";
import { APP_STORE_URL, WEB_PLAYABLE_GAMES } from "@/lib/constants";

interface PlayedTodayGateProps {
  gameSlug: string;
  children: ReactNode;
}

export function PlayedTodayGate({ gameSlug, children }: PlayedTodayGateProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHasPlayed(hasPlayedToday(gameSlug));
    setIsLoading(false);
  }, [gameSlug]);

  // Show nothing while checking localStorage (prevents flash)
  if (isLoading) {
    return null;
  }

  // User hasn't played — show the game
  if (!hasPlayed) {
    return <>{children}</>;
  }

  // User has already played today
  const result = getPlayResult(gameSlug);
  const otherGames = WEB_PLAYABLE_GAMES.filter((g) => g.slug !== gameSlug);

  const handleShare = async () => {
    if (!result?.shareText) return;
    const success = await copyToClipboard(result.shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-12 px-4 space-y-8">
      <div className="mx-auto w-16 h-16 rounded-full bg-pitch-green/20 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-pitch-green" />
      </div>

      <div>
        <h2 className="font-bebas text-3xl tracking-wide text-floodlight mb-2">
          ALREADY PLAYED TODAY
        </h2>
        <p className="text-slate-400 text-sm">
          {result?.won ? "Great job!" : "Better luck tomorrow!"} Come back for a
          fresh puzzle.
        </p>
      </div>

      {result?.shareText && (
        <button
          onClick={handleShare}
          className="bg-pitch-green text-stadium-navy font-bold py-3 px-6 rounded-xl hover:bg-pitch-green/90 transition-colors"
        >
          {copied ? "COPIED!" : "SHARE RESULT"}
        </button>
      )}

      {/* Other games */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">
          Try another game
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {otherGames.map((game) => (
            <Link
              key={game.slug}
              href={`/play/${game.slug}`}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:border-pitch-green hover:text-pitch-green transition-colors"
            >
              {game.title}
            </Link>
          ))}
        </div>
      </div>

      {/* App download */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-slate-400 text-sm mb-4">
          Track your scores, build streaks, and climb the ranks in the app.
        </p>
        <Link
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-all hover:opacity-90 hover:scale-105 inline-block"
        >
          <Image
            src="/images/app-store.svg"
            alt="Download on the App Store"
            width={160}
            height={48}
            className="h-[48px] w-auto"
          />
        </Link>
      </div>
    </div>
  );
}
