"use client";

import { useMemo } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Pencil, Calendar, Crown, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DailyPuzzle } from "@/types/supabase";
import {
  GAME_MODE_DISPLAY_NAMES,
  PREMIUM_MODES,
  type GameMode,
} from "@/lib/constants";
import { isRequiredOnDate } from "@/lib/scheduler";

interface BacklogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  puzzles: DailyPuzzle[];
  isLoading: boolean;
  selectedDate: string | null;
  onAssign: (puzzleId: string, date: string) => void;
  onEdit: (puzzle: DailyPuzzle) => void;
  isAssigning?: boolean;
}

/**
 * Get a preview title for a puzzle based on its content.
 */
function getPuzzleTitle(puzzle: DailyPuzzle): string {
  const content = puzzle.content as Record<string, unknown>;

  switch (puzzle.game_mode) {
    case "career_path":
    case "career_path_pro":
      return (content.answer as string) || "Untitled Career Path";
    case "guess_the_transfer":
      return (content.answer as string) || "Untitled Transfer";
    case "guess_the_goalscorers": {
      const home = content.home_team as string;
      const away = content.away_team as string;
      return home && away ? `${home} vs ${away}` : "Untitled Match";
    }
    case "topical_quiz":
      return "Topical Quiz";
    case "top_tens":
      return (content.title as string) || "Untitled Top Tens";
    case "starting_xi": {
      const matchName = content.match_name as string;
      return matchName || "Untitled Starting XI";
    }
    case "the_grid":
      return "The Grid";
    default:
      return "Untitled Puzzle";
  }
}

interface BacklogPuzzleCardProps {
  puzzle: DailyPuzzle;
  selectedDate: string | null;
  onAssign: (puzzleId: string, date: string) => void;
  onEdit: (puzzle: DailyPuzzle) => void;
  isAssigning: boolean;
}

function BacklogPuzzleCard({
  puzzle,
  selectedDate,
  onAssign,
  onEdit,
  isAssigning,
}: BacklogPuzzleCardProps) {
  // Check if this puzzle's mode is required on the selected date
  const canAssign = useMemo(() => {
    if (!selectedDate) return false;
    return isRequiredOnDate(puzzle.game_mode as GameMode, parseISO(selectedDate));
  }, [selectedDate, puzzle.game_mode]);

  const title = getPuzzleTitle(puzzle);
  const createdAt = puzzle.created_at
    ? formatDistanceToNow(parseISO(puzzle.created_at), { addSuffix: true })
    : "Unknown";

  return (
    <div className="bg-white/5 rounded-lg p-3 mb-2 border border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-floodlight truncate">
            {title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {createdAt}
          </p>
          {puzzle.difficulty && (
            <Badge variant="outline" className="mt-1 text-[10px]">
              {puzzle.difficulty}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(puzzle)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {selectedDate && (
            <Button
              variant="default"
              size="sm"
              disabled={!canAssign || isAssigning}
              onClick={() => onAssign(puzzle.id, selectedDate)}
              className="h-8 text-xs"
              title={
                canAssign
                  ? `Assign to ${format(parseISO(selectedDate), "MMM d")}`
                  : `${GAME_MODE_DISPLAY_NAMES[puzzle.game_mode as GameMode]} is not scheduled for ${format(parseISO(selectedDate), "EEEE")}`
              }
            >
              {isAssigning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Calendar className="h-3 w-3 mr-1" />
                  Assign
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BacklogSheet({
  isOpen,
  onClose,
  puzzles,
  isLoading,
  selectedDate,
  onAssign,
  onEdit,
  isAssigning = false,
}: BacklogSheetProps) {
  // Group puzzles by game mode
  const groupedByMode = useMemo(() => {
    return puzzles.reduce(
      (acc, puzzle) => {
        const mode = puzzle.game_mode as GameMode;
        if (!acc[mode]) {
          acc[mode] = [];
        }
        acc[mode].push(puzzle);
        return acc;
      },
      {} as Record<GameMode, DailyPuzzle[]>
    );
  }, [puzzles]);

  const modes = Object.keys(groupedByMode) as GameMode[];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Puzzle Backlog
            <Badge variant="secondary" className="ml-1">
              {puzzles.length}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Puzzles waiting to be scheduled
            {selectedDate && (
              <span className="block mt-1">
                <Badge
                  variant="outline"
                  className="bg-pitch-green/10 text-pitch-green border-pitch-green/30"
                >
                  Assigning to {format(parseISO(selectedDate), "MMM d, yyyy")}
                </Badge>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-4 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : puzzles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No puzzles in backlog</p>
              <p className="text-xs mt-1">
                Create puzzles without a date to add them here
              </p>
            </div>
          ) : (
            modes.map((mode) => (
              <div key={mode} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-medium text-floodlight">
                    {GAME_MODE_DISPLAY_NAMES[mode]}
                  </h4>
                  {PREMIUM_MODES.includes(mode) && (
                    <Crown className="h-3 w-3 text-card-yellow" />
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {groupedByMode[mode].length}
                  </Badge>
                </div>

                {groupedByMode[mode].map((puzzle) => (
                  <BacklogPuzzleCard
                    key={puzzle.id}
                    puzzle={puzzle}
                    selectedDate={selectedDate}
                    onAssign={onAssign}
                    onEdit={onEdit}
                    isAssigning={isAssigning}
                  />
                ))}
              </div>
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
