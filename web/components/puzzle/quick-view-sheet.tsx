"use client";

import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GAME_MODES,
  GAME_MODE_DISPLAY_NAMES,
  PREMIUM_MODES,
  type GameMode,
} from "@/lib/constants";
import type { CalendarDay } from "@/hooks/use-calendar-data";
import { Crown, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { DailyPuzzle } from "@/types/supabase";

interface QuickViewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDay | null;
  puzzles: DailyPuzzle[];
  isLoading?: boolean;
}

export function QuickViewSheet({
  isOpen,
  onClose,
  day,
  puzzles,
  isLoading,
}: QuickViewSheetProps) {
  const [expandedPuzzle, setExpandedPuzzle] = useState<string | null>(null);

  if (!day) return null;

  const puzzleMap = new Map(puzzles.map((p) => [p.game_mode, p]));

  const formattedDate = format(parseISO(day.date), "EEEE, MMMM d, yyyy");

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-stadium-navy border-white/10">
        <SheetHeader>
          <SheetTitle className="text-floodlight">{formattedDate}</SheetTitle>
          <SheetDescription>
            {day.totalPopulated} of {GAME_MODES.length} puzzles populated
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <div className="space-y-2">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))
            ) : (
              GAME_MODES.map((mode) => {
                const puzzle = puzzleMap.get(mode);
                const isPremium = PREMIUM_MODES.includes(mode as GameMode);
                const isExpanded = expandedPuzzle === puzzle?.id;

                return (
                  <div
                    key={mode}
                    className="glass-card overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        if (puzzle) {
                          setExpandedPuzzle(isExpanded ? null : puzzle.id);
                        }
                      }}
                      className="w-full p-3 text-left hover:bg-white/5 transition-colors"
                      disabled={!puzzle}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {puzzle ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                          ) : (
                            <div className="w-4" />
                          )}
                          <span className="font-medium text-floodlight">
                            {GAME_MODE_DISPLAY_NAMES[mode as GameMode]}
                          </span>
                          {isPremium && (
                            <Crown className="h-3.5 w-3.5 text-card-yellow" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {puzzle?.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {puzzle.difficulty}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              puzzle
                                ? puzzle.status === "draft"
                                  ? "warning"
                                  : "success"
                                : "destructive"
                            }
                          >
                            {puzzle
                              ? puzzle.status === "draft"
                                ? "Draft"
                                : "Live"
                              : "Empty"}
                          </Badge>
                        </div>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {puzzle && isExpanded && (
                      <div className="border-t border-white/10 p-3 bg-white/[0.02]">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>ID:</span>
                            <span className="font-mono text-xs">
                              {puzzle.id.slice(0, 8)}...
                            </span>
                          </div>
                          {puzzle.source && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Source:</span>
                              <span>{puzzle.source}</span>
                            </div>
                          )}
                          {puzzle.triggered_by && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Created by:</span>
                              <span>{puzzle.triggered_by}</span>
                            </div>
                          )}
                          <div className="pt-2">
                            <span className="text-muted-foreground text-xs">
                              Content Preview:
                            </span>
                            <pre className="mt-1 p-2 rounded bg-black/30 text-xs overflow-x-auto max-h-[200px] overflow-y-auto">
                              {JSON.stringify(puzzle.content, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
