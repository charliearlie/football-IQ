"use client";

import Image from "next/image";
import Link from "next/link";
import { Smartphone, Lock } from "lucide-react";
import { APP_ONLY_GAMES, APP_STORE_URL } from "@/lib/constants";

export function AppDownloadCTA() {
  return (
    <div className="border-t border-white/10 pt-6 space-y-5">
      {/* Heading */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Smartphone className="w-4 h-4 text-pitch-green" />
          <p className="text-floodlight font-bold text-base">
            You played 1 of 11 daily modes
          </p>
        </div>
        <p className="text-slate-400 text-sm">Get the app for all 11</p>
      </div>

      {/* App-only mode cards */}
      <div className="grid grid-cols-2 gap-2">
        {APP_ONLY_GAMES.map((game) => (
          <div
            key={game.title}
            className="relative flex flex-col gap-1 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-500 shrink-0" />
              <p className="text-xs font-semibold text-floodlight truncate">
                {game.title}
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-snug line-clamp-2">
              {game.description}
            </p>
          </div>
        ))}
      </div>

      {/* Store badges */}
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
        <div className="relative flex flex-col items-center">
          <Image
            src="/images/play-store.svg"
            alt="Google Play — Coming Soon"
            width={180}
            height={48}
            className="h-[48px] w-auto opacity-50"
          />
          <span className="text-xs text-slate-500 mt-1">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
