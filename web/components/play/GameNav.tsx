"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_STORE_URL } from "@/lib/constants";

interface GameNavProps {
  title: string;
}

export function GameNav({ title }: GameNavProps) {
  return (
    <nav className="sticky top-0 z-50 h-14 bg-stadium-navy/95 backdrop-blur-sm border-b border-white/5 px-4 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-floodlight transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">ALL GAMES</span>
      </Link>

      <h1 className="font-bebas text-xl tracking-wider text-floodlight absolute left-1/2 -translate-x-1/2">
        {title.toUpperCase()}
      </h1>

      <Link
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-pitch-green text-stadium-navy text-xs font-bold px-3 py-1.5 rounded-full hover:bg-pitch-green/90 transition-colors"
      >
        GET APP
      </Link>
    </nav>
  );
}
