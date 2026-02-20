"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { APP_STORE_URL, WEB_PLAYABLE_GAMES } from "@/lib/constants";
import { copyToClipboard, markPlayed, getDaysPlayed } from "@/lib/playSession";

interface PostGameCTAProps {
  won: boolean;
  answer: string;
  shareText: string;
  gameSlug: string;
}

function getCTACopy(daysPlayed: number): string {
  if (daysPlayed >= 30) {
    return `${daysPlayed} puzzles without a home for your score. Track everything in the app.`;
  }
  if (daysPlayed >= 7) {
    return `You've played ${daysPlayed} days on the web — imagine your streak in the app.`;
  }
  return "Your score doesn't count without an account. In the app, earn IQ points, build a streak, climb from Intern to The Gaffer.";
}

export function PostGameCTA({
  won,
  answer,
  shareText,
  gameSlug,
}: PostGameCTAProps) {
  const [copied, setCopied] = useState(false);
  const [daysPlayed, setDaysPlayed] = useState(0);

  useEffect(() => {
    markPlayed(gameSlug, { won, shareText });
    setDaysPlayed(getDaysPlayed());
  }, [gameSlug, won, shareText]);

  const handleShare = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const otherGames = WEB_PLAYABLE_GAMES.filter((g) => g.slug !== gameSlug);

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6 pt-6">
      {/* Result */}
      <div className="text-center">
        {won ? (
          <p className="text-pitch-green font-bebas text-2xl tracking-wide">
            WELL PLAYED!
          </p>
        ) : (
          <p className="text-slate-400 text-sm">
            The answer was{" "}
            <span className="text-pitch-green font-semibold">{answer}</span>
          </p>
        )}
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 bg-pitch-green text-stadium-navy font-bold py-3 px-6 rounded-xl hover:bg-pitch-green/90 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            COPIED!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            SHARE RESULT
          </>
        )}
      </button>

      {/* App download pitch */}
      <div className="border-t border-white/10 pt-6 text-center">
        <p className="text-slate-300 text-sm mb-4">{getCTACopy(daysPlayed)}</p>

        <div className="flex flex-col items-center gap-3">
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all hover:opacity-90 hover:scale-105"
          >
            <Image
              src="/images/app-store.svg"
              alt="Download on the App Store"
              width={160}
              height={48}
              className="h-[48px] w-auto"
            />
          </Link>
          <div className="relative">
            <Image
              src="/images/play-store.svg"
              alt="Google Play — Coming Soon"
              width={180}
              height={48}
              className="h-[48px] w-auto opacity-50"
            />
            <span className="absolute left-0 right-0 text-center text-xs text-slate-500 mt-1">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Other games */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-slate-500 text-xs uppercase tracking-wider text-center mb-3">
          Also try
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {otherGames.map((game) => (
            <Link
              key={game.slug}
              href={`/play/${game.slug}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 text-slate-300 hover:border-pitch-green hover:text-pitch-green transition-colors"
            >
              {game.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
