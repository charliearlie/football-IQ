"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-stadium-navy/95 backdrop-blur-md border-t border-white/10 px-4 py-3 animate-in slide-in-from-bottom fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bebas text-lg text-floodlight tracking-wide">
            FOOTBALL IQ
          </p>
          <p className="text-xs text-slate-400">Daily football puzzles</p>
        </div>
        <Link
          href="#games"
          className="px-6 py-2 bg-pitch-green text-stadium-navy font-bebas text-lg tracking-wider rounded-lg shadow-[0_2px_0_0_#1A9E38]"
        >
          PLAY TODAY&apos;S GAMES
        </Link>
      </div>
    </div>
  );
}
