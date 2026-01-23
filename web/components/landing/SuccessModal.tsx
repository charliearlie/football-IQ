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
      <DialogContent className="bg-stadium-navy border-pitch-green max-w-sm text-center">
        {/* Success icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-pitch-green flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-stadium-navy" />
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="font-bebas text-2xl tracking-wide text-pitch-green text-center">
            CORRECT!
          </DialogTitle>
        </DialogHeader>

        <p className="text-floodlight text-lg font-semibold mb-2">
          {playerName}
        </p>

        <p className="text-muted-foreground text-sm mb-6">
          Play 6 puzzles daily in the app and track your Football IQ!
        </p>

        {/* Store badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on the App Store"
            className="transition-opacity hover:opacity-80"
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
            className="transition-opacity hover:opacity-80"
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
