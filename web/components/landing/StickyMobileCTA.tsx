"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

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

  // Detect platform for appropriate store link
  const isAndroid =
    typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const storeUrl = isAndroid ? PLAY_STORE_URL : APP_STORE_URL;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-stadium-navy/95 backdrop-blur-md border-t border-white/10 px-4 py-3 animate-in slide-in-from-bottom fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bebas text-lg text-floodlight tracking-wide">
            FOOTBALL IQ
          </p>
          <p className="text-xs text-slate-400">Free download</p>
        </div>
        <Link
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-pitch-green text-stadium-navy font-bebas text-lg tracking-wider rounded-lg shadow-[0_2px_0_0_#46A302]"
        >
          GET THE APP
        </Link>
      </div>
    </div>
  );
}
