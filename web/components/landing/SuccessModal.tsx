"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";
import { CheckCircle } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
}

export function SuccessModal({ open, onClose, playerName }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-stadium-navy border-pitch-green max-w-sm text-center overflow-hidden">
        {/* Success icon with bounce-in animation */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-pitch-green to-grass-shadow flex items-center justify-center mb-4 animate-bounce-in shadow-lg shadow-pitch-green/30">
          <CheckCircle className="w-10 h-10 text-stadium-navy" />
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="font-bebas text-3xl tracking-wide text-pitch-green text-center animate-bounce-in text-shadow-fun" style={{ animationDelay: "0.1s" }}>
            GENIUS! 🎉
          </DialogTitle>
        </DialogHeader>

        <p className="text-floodlight text-xl font-semibold mb-2 animate-bounce-in" style={{ animationDelay: "0.15s" }}>
          {playerName}
        </p>

        <p className="text-muted-foreground text-sm mb-6 animate-bounce-in" style={{ animationDelay: "0.2s" }}>
          You nailed it! Play 6 puzzles daily in the app and prove you&apos;re a true football genius!
        </p>

        {/* Store badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 animate-bounce-in" style={{ animationDelay: "0.25s" }}>
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
            className="transition-all hover:opacity-80 hover:scale-105"
          >
            <Image
              src="/images/app-store.svg"
              alt="Download on the App Store"
              width={135}
              height={45}
              className="h-[45px] w-auto"
            />
          </Link>
          <Link
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get it on Google Play"
            className="transition-all hover:opacity-80 hover:scale-105"
          >
            <Image
              src="/images/play-store.svg"
              alt="Get it on Google Play"
              width={151}
              height={45}
              className="h-[45px] w-auto"
            />
          </Link>
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
