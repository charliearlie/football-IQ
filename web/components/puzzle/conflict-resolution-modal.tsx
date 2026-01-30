"use client";

import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  Star,
  ArrowRight,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";
import type { ConflictInfo, AvailableSlot } from "@/lib/displacement";

export type ConflictResolution =
  | { type: "cancel" }
  | { type: "add_as_bonus" }
  | { type: "displace"; targetDate: string }
  | { type: "swap" };

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: ConflictInfo;
  incomingPuzzleTitle: string;
  nextAvailableSlot: AvailableSlot | null;
  onResolve: (resolution: ConflictResolution) => void;
  isResolving?: boolean;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflict,
  incomingPuzzleTitle,
  nextAvailableSlot,
  onResolve,
  isResolving = false,
}: ConflictResolutionModalProps) {
  const formattedDate = format(parseISO(conflict.date), "EEEE, MMM d");
  const modeName = GAME_MODE_DISPLAY_NAMES[conflict.gameMode];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-stadium-navy border-white/10">
        <DialogHeader>
          <div className="flex items-center gap-2 text-card-yellow">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Schedule Conflict</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2">
            <strong>{modeName}</strong> already has content scheduled for{" "}
            <strong>{formattedDate}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Conflict details */}
        <div className="space-y-3 py-4">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              Existing puzzle:
            </p>
            <p className="font-medium text-floodlight">
              {conflict.existingPuzzleTitle}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              Incoming puzzle:
            </p>
            <p className="font-medium text-floodlight">{incomingPuzzleTitle}</p>
          </div>
        </div>

        {/* Resolution options */}
        <div className="space-y-2">
          {/* Add as Bonus */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 border-white/10 hover:border-card-yellow/50 hover:bg-card-yellow/5"
            onClick={() => onResolve({ type: "add_as_bonus" })}
            disabled={isResolving}
          >
            <Star className="h-4 w-4 mr-3 text-card-yellow flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium">Add as Bonus</p>
              <p className="text-xs text-muted-foreground">
                Keep both puzzles. The new one won&apos;t count toward daily
                requirements.
              </p>
            </div>
          </Button>

          {/* Displace Existing */}
          {nextAvailableSlot && (
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 border-white/10 hover:border-pitch-green/50 hover:bg-pitch-green/5"
              onClick={() =>
                onResolve({ type: "displace", targetDate: nextAvailableSlot.date })
              }
              disabled={isResolving}
            >
              <ArrowRight className="h-4 w-4 mr-3 text-pitch-green flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium">Displace Existing</p>
                <p className="text-xs text-muted-foreground">
                  Move &quot;{conflict.existingPuzzleTitle}&quot; to{" "}
                  {format(parseISO(nextAvailableSlot.date), "MMM d")}
                  {nextAvailableSlot.isScheduledDay && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-[10px] py-0 px-1 border-pitch-green/30 text-pitch-green"
                    >
                      Scheduled day
                    </Badge>
                  )}
                </p>
              </div>
            </Button>
          )}

          {/* No available slot warning */}
          {!nextAvailableSlot && (
            <div className="w-full py-3 px-4 border border-white/10 rounded-md bg-white/[0.02] opacity-50">
              <div className="flex items-start gap-3">
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-muted-foreground">
                    Displace Existing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No available slot found within 90 days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Swap */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 border-white/10 hover:border-blue-400/50 hover:bg-blue-400/5"
            onClick={() => onResolve({ type: "swap" })}
            disabled={isResolving}
          >
            <ArrowLeftRight className="h-4 w-4 mr-3 text-blue-400 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium">Swap Dates</p>
              <p className="text-xs text-muted-foreground">
                Exchange dates between the two puzzles.
              </p>
            </div>
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={() => onResolve({ type: "cancel" })}
            disabled={isResolving}
          >
            Cancel
          </Button>
        </DialogFooter>

        {/* Loading overlay */}
        {isResolving && (
          <div className="absolute inset-0 bg-stadium-navy/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Resolving conflict...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
