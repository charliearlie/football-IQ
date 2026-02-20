import Link from "next/link";
import { Download } from "lucide-react";
import { APP_STORE_URL } from "@/lib/constants";

export function HeroStrip() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-stadium-navy/90 backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-2xl flex items-center justify-between h-14">
        {/* Logo */}
        <div className="font-bebas text-2xl tracking-wider text-floodlight">
          FOOTBALL IQ
        </div>

        {/* GET APP pill */}
        <Link
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-pitch-green text-stadium-navy text-xs font-bold px-3 py-1.5 rounded-full hover:bg-pitch-green/90 transition-colors"
        >
          <Download className="w-3 h-3" />
          GET APP
        </Link>
      </div>
    </header>
  );
}
