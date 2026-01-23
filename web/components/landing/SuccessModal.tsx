"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CTAButton } from "./CTAButton";
import { APP_STORE_URL } from "@/lib/constants";
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

        <DialogHeader>
          <DialogTitle className="font-bebas text-2xl tracking-wide text-pitch-green">
            CORRECT!
          </DialogTitle>
        </DialogHeader>

        <p className="text-floodlight text-lg font-semibold mb-2">
          {playerName}
        </p>

        <p className="text-muted-foreground text-sm mb-6">
          Play 6 puzzles daily in the app and track your Football IQ!
        </p>

        <CTAButton
          onClick={() => window.open(APP_STORE_URL, "_blank")}
          className="w-full"
        >
          GET THE APP
        </CTAButton>

        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-floodlight transition-colors mt-4"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
