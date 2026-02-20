"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { APP_STORE_URL, WEB_PLAYABLE_GAMES } from "@/lib/constants";
import {
  copyToClipboard,
  markPlayed,
  getDaysPlayed,
  hasPlayedToday,
  getConsecutiveStreak,
} from "@/lib/playSession";

interface PostGameCTAProps {
  won: boolean;
  answer: string;
  shareText: string;
  gameSlug: string;
}

function getCTACopy(daysPlayed: number): string {
  if (daysPlayed >= 30) {
    return `${daysPlayed} puzzles completed. The app would have tracked them all — with ranks, streaks, and achievements.`;
  }
  if (daysPlayed >= 7) {
    return `You've played ${daysPlayed} days on the web. The app protects your streak and unlocks 7 more game modes.`;
  }
  return "The app makes your score permanent — track stats, earn IQ points, and climb from Intern to The Gaffer.";
}

export function PostGameCTA({
  won,
  answer,
  shareText,
  gameSlug,
}: PostGameCTAProps) {
  const [copied, setCopied] = useState(false);
  const [daysPlayed, setDaysPlayed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [allPlayed, setAllPlayed] = useState(false);
  const [unplayedGames, setUnplayedGames] = useState(
    WEB_PLAYABLE_GAMES.filter((g) => g.slug !== gameSlug)
  );

  useEffect(() => {
    markPlayed(gameSlug, { won, shareText });
    setDaysPlayed(getDaysPlayed());
    setStreak(getConsecutiveStreak());

    const otherGames = WEB_PLAYABLE_GAMES.filter((g) => g.slug !== gameSlug);
    const unplayed = otherGames.filter((g) => !hasPlayedToday(g.slug));
    setUnplayedGames(unplayed.length > 0 ? unplayed : otherGames);
    setAllPlayed(
      otherGames.length > 0 && otherGames.every((g) => hasPlayedToday(g.slug))
    );
  }, [gameSlug, won, shareText]);

  const handleShare = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

      {/* Streak display */}
      {streak > 1 && (
        <div className="text-center py-2">
          <p className="text-sm text-slate-300">
            <span className="text-pitch-green font-bold">{streak}-day streak</span>{" "}
            on the web
          </p>
        </div>
      )}

      {/* Next game button — prominent CTA for the first unplayed game */}
      {!allPlayed && unplayedGames.length > 0 && (
        <Link
          href={`/play/${unplayedGames[0].slug}`}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-colors border-2"
          style={{
            borderColor: unplayedGames[0].accentColor,
            color: unplayedGames[0].accentColor,
          }}
        >
          NEXT: {unplayedGames[0].title.toUpperCase()} &rarr;
        </Link>
      )}

      {/* Remaining games list (when 2+ unplayed) */}
      {allPlayed ? (
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-pitch-green font-bebas text-xl tracking-wide mb-2">
            ALL DONE FOR TODAY!
          </p>
          <p className="text-slate-400 text-sm">
            Come back tomorrow for fresh puzzles. Or get 11 modes in the app.
          </p>
        </div>
      ) : unplayedGames.length > 1 ? (
        <div className="border-t border-white/10 pt-6">
          <p className="text-slate-500 text-xs uppercase tracking-wider text-center mb-3">
            More games
          </p>
          <div className="flex flex-col gap-2">
            {unplayedGames.slice(1).map((game) => (
              <Link
                key={game.slug}
                href={`/play/${game.slug}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-pitch-green/50 hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: game.accentColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-floodlight">
                    {game.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {game.description}
                  </p>
                </div>
                <span className="text-xs text-pitch-green font-bold shrink-0">
                  PLAY
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

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
    </div>
  );
}
