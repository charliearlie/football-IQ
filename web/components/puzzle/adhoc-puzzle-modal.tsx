"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Crown, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GAME_MODES,
  GAME_MODE_DISPLAY_NAMES,
  PREMIUM_MODES,
  type GameMode,
} from "@/lib/constants";

interface AdhocPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, gameMode: GameMode) => void;
}

export function AdhocPuzzleModal({
  isOpen,
  onClose,
  onConfirm,
}: AdhocPuzzleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedMode, setSelectedMode] = useState<GameMode | "">("");

  const handleConfirm = () => {
    if (selectedMode && selectedDate) {
      onConfirm(selectedDate, selectedMode as GameMode);
      // Reset state
      setSelectedMode("");
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    }
  };

  const handleClose = () => {
    setSelectedMode("");
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px] bg-stadium-navy border-white/10">
        <DialogHeader>
          <DialogTitle className="text-floodlight flex items-center gap-2">
            <Plus className="h-5 w-5 text-pitch-green" />
            Create New Puzzle
          </DialogTitle>
          <DialogDescription>
            Choose a game mode and date for your new puzzle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Game Mode Selection */}
          <div className="space-y-2">
            <Label htmlFor="game-mode">Game Mode</Label>
            <Select
              value={selectedMode}
              onValueChange={(value) => setSelectedMode(value as GameMode)}
            >
              <SelectTrigger
                id="game-mode"
                className="w-full bg-white/5 border-white/10"
              >
                <SelectValue placeholder="Select a game mode" />
              </SelectTrigger>
              <SelectContent>
                {GAME_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    <div className="flex items-center gap-2">
                      <span>{GAME_MODE_DISPLAY_NAMES[mode]}</span>
                      {PREMIUM_MODES.includes(mode) && (
                        <Crown className="h-3 w-3 text-card-yellow" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="puzzle-date">Date</Label>
            <Input
              id="puzzle-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMode || !selectedDate}
            className="bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy"
          >
            Create Puzzle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
