import Link from "next/link";
import { Download } from "lucide-react";
import { appStoreUrl } from "@/lib/constants";

export function HeroStrip() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-stadium-navy/80 backdrop-blur-lg supports-[backdrop-filter]:bg-stadium-navy/70">
      <div className="container mx-auto px-4 max-w-2xl flex items-center justify-between h-14">
        {/* Logo with green dot */}
        <Link
          href="/"
          className="group flex items-center gap-2 font-bebas text-2xl tracking-wider text-floodlight transition-opacity hover:opacity-90"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-pitch-green opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch-green" />
          </span>
          FOOTBALL IQ
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/blog"
            className="hidden sm:inline-block text-sm font-medium text-slate-400 hover:text-floodlight transition-colors"
          >
            Daily Digest
          </Link>

          {/* GET APP pill — now glows + has press feedback */}
          <Link
            href={appStoreUrl("web_hero")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-pitch-green text-stadium-navy text-xs font-bold px-3.5 py-1.5 rounded-full shadow-glow-green hover:opacity-90 active:scale-[0.97] transition-all duration-150"
          >
            <Download className="w-3 h-3" />
            GET APP
          </Link>
        </div>
      </div>
    </header>
  );
}
