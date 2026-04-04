"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Smartphone } from "lucide-react";
import { appStoreUrl } from "@/lib/constants";

export function PostGameDownloadBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-xl border border-pitch-green/25 bg-gradient-to-br from-pitch-green/10 via-white/[0.03] to-transparent p-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss download prompt"
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content row */}
      <div className="flex items-center gap-3 pr-6">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-pitch-green/15 border border-pitch-green/20 flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-pitch-green" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-snug">
            Want more? The app has 8 more modes plus the full puzzle archive.
          </p>
        </div>
      </div>

      {/* Store button row */}
      <div className="mt-3 flex items-center gap-3 pl-[3rem]">
        <Link
          href={appStoreUrl("web_postgame")}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-all hover:opacity-90 hover:scale-[1.03] active:scale-[0.98]"
        >
          <Image
            src="/images/app-store.svg"
            alt="Download on the App Store"
            width={120}
            height={36}
            className="h-[36px] w-auto"
          />
        </Link>

        <div className="flex flex-col items-start">
          <Image
            src="/images/play-store.svg"
            alt="Google Play — Coming Soon"
            width={134}
            height={36}
            className="h-[36px] w-auto opacity-40"
          />
          <span className="text-[10px] text-slate-600 mt-0.5 pl-0.5">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
