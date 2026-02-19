"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_STORE_URL } from "@/lib/constants";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
  revealedCount: number;
  totalSteps: number;
}

export function SuccessModal({ open, onClose, playerName, revealedCount, totalSteps }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-stadium-navy border-pitch-green max-w-sm text-center overflow-hidden">
        {/* Success icon with bounce-in animation */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-pitch-green to-grass-shadow flex items-center justify-center mb-4 animate-bounce-in shadow-lg shadow-pitch-green/30">
          <CheckCircle className="w-10 h-10 text-stadium-navy" />
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="font-bebas text-3xl tracking-wide text-pitch-green text-center animate-bounce-in text-shadow-fun" style={{ animationDelay: "0.1s" }}>
            GENIUS!
          </DialogTitle>
        </DialogHeader>

        <p className="text-floodlight text-xl font-semibold mb-1 animate-bounce-in" style={{ animationDelay: "0.15s" }}>
          {playerName}
        </p>

        <p className="text-pitch-green font-bebas text-lg tracking-wide mb-4 animate-bounce-in" style={{ animationDelay: "0.18s" }}>
          {revealedCount} / {totalSteps} CLUBS REVEALED
        </p>

        <p className="text-slate-400 text-sm mb-6 animate-bounce-in" style={{ animationDelay: "0.2s" }}>
          Play all 11 modes in the app — free to download
        </p>

        {/* Store badges - primary CTAs */}
        <div className="flex flex-col items-center gap-3 mb-4 animate-bounce-in" style={{ animationDelay: "0.25s" }}>
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
            className="transition-all hover:opacity-90 hover:scale-105"
          >
            <Image
              src="/images/app-store.svg"
              alt="Download on the App Store"
              width={180}
              height={54}
              className="h-[54px] w-auto"
            />
          </Link>
          <div className="relative">
            <Image
              src="/images/play-store.svg"
              alt="Google Play — Coming Soon"
              width={200}
              height={54}
              className="h-[54px] w-auto opacity-50"
            />
            <span className="absolute left-0 right-0 text-center text-xs text-slate-500 mt-1">Coming Soon</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-floodlight transition-colors"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
