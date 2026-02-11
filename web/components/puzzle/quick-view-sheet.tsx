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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  GAME_MODES,
  GAME_MODE_DISPLAY_NAMES,
  PREMIUM_MODES,
  type GameMode,
} from "@/lib/constants";
import { isRequiredOnDate } from "@/lib/scheduler";
import type { CalendarDay } from "@/hooks/use-calendar-data";
import { Crown, ChevronDown, ChevronRight, Pencil, Plus, Star, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import type { DailyPuzzle } from "@/types/supabase";

interface QuickViewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDay | null;
  puzzles: DailyPuzzle[];
  isLoading?: boolean;
  onEditPuzzle?: (gameMode: GameMode, puzzle?: DailyPuzzle) => void;
  onToggleBonus?: (puzzleId: string, isBonus: boolean) => void;
  onDeletePuzzle?: (puzzleId: string) => void;
  onPublishPuzzle?: (puzzleId: string) => void;
}

interface GameModeCardProps {
  mode: GameMode;
  puzzle: DailyPuzzle | undefined;
  isMandatory: boolean;
  isExpanded: boolean;
  onToggleExpand: (puzzleId: string) => void;
  onEditPuzzle?: (gameMode: GameMode, puzzle?: DailyPuzzle) => void;
  onToggleBonus?: (puzzleId: string, isBonus: boolean) => void;
  onDeletePuzzle?: (puzzleId: string) => void;
  onPublishPuzzle?: (puzzleId: string) => void;
}

function GameModeCard({
  mode,
  puzzle,
  isMandatory,
  isExpanded,
  onToggleExpand,
  onEditPuzzle,
  onToggleBonus,
  onDeletePuzzle,
  onPublishPuzzle,
}: GameModeCardProps) {
  const isPremium = PREMIUM_MODES.includes(mode);

  return (
    <div className={`glass-card overflow-hidden ${!isMandatory ? "opacity-75" : ""}`}>
      <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
        {/* Left side: clickable expand area (only if puzzle exists) */}
        <button
          onClick={() => {
            if (puzzle) {
              onToggleExpand(puzzle.id);
            }
          }}
          className="flex-1 flex items-center gap-2 text-left"
          disabled={!puzzle}
        >
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
            {GAME_MODE_DISPLAY_NAMES[mode]}
          </span>
          {isPremium && <Crown className="h-3.5 w-3.5 text-card-yellow" />}
        </button>

        {/* Right side: badges + edit button */}
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
                : isMandatory
                  ? "destructive"
                  : "secondary"
            }
          >
            {puzzle
              ? puzzle.status === "draft"
                ? "Draft"
                : "Live"
              : isMandatory
                ? "Gap"
                : "Not Set"}
          </Badge>
          {onEditPuzzle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-1"
              onClick={() => onEditPuzzle(mode, puzzle || undefined)}
            >
              {puzzle ? (
                <Pencil className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {puzzle && isExpanded && (
        <div className="border-t border-white/10 p-3 bg-white/[0.02]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>ID:</span>
              <span className="font-mono text-xs">{puzzle.id.slice(0, 8)}...</span>
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

            {/* Bonus toggle */}
            {onToggleBonus && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-card-yellow" />
                  <span className="text-muted-foreground">Bonus Content</span>
                </div>
                <Switch
                  checked={puzzle.is_bonus ?? false}
                  onCheckedChange={(checked) => onToggleBonus(puzzle.id, checked)}
                  className="data-[state=checked]:bg-card-yellow"
                />
              </div>
            )}
            {puzzle.is_bonus && (
              <p className="text-[10px] text-card-yellow">
                This puzzle won&apos;t count toward daily requirements.
              </p>
            )}

            <div className="pt-2">
              <span className="text-muted-foreground text-xs">Content Preview:</span>
              <pre className="mt-1 p-2 rounded bg-black/30 text-xs overflow-x-auto max-h-[200px] overflow-y-auto">
                {JSON.stringify(puzzle.content, null, 2)}
              </pre>
            </div>

            {/* Publish button (for drafts) */}
            {onPublishPuzzle && puzzle.status === "draft" && (
              <div className="pt-3 border-t border-white/10">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-pitch-green hover:bg-pitch-green/90"
                  onClick={() => onPublishPuzzle(puzzle.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                  Publish (Go Live)
                </Button>
              </div>
            )}

            {/* Delete button */}
            {onDeletePuzzle && (
              <div className={puzzle.status !== "draft" ? "pt-3 border-t border-white/10" : ""}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => onDeletePuzzle(puzzle.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Puzzle
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickViewSheet({
  isOpen,
  onClose,
  day,
  puzzles,
  isLoading,
  onEditPuzzle,
  onToggleBonus,
  onDeletePuzzle,
  onPublishPuzzle,
}: QuickViewSheetProps) {
  const [expandedPuzzle, setExpandedPuzzle] = useState<string | null>(null);

  // Memoize mode grouping based on day's schedule
  const { mandatoryModes, optionalModes } = useMemo(() => {
    if (!day) return { mandatoryModes: [], optionalModes: [] };
    const dateObj = parseISO(day.date);
    return {
      mandatoryModes: GAME_MODES.filter((mode) => isRequiredOnDate(mode, dateObj)),
      optionalModes: GAME_MODES.filter((mode) => !isRequiredOnDate(mode, dateObj)),
    };
  }, [day]);

  if (!day) return null;

  const puzzleMap = new Map(puzzles.map((p) => [p.game_mode, p]));
  const mandatoryPopulated = mandatoryModes.filter((mode) => puzzleMap.has(mode)).length;
  const optionalPopulated = optionalModes.filter((mode) => puzzleMap.has(mode)).length;

  const formattedDate = format(parseISO(day.date), "EEEE, MMMM d, yyyy");

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[400px] md:w-[540px] bg-stadium-navy border-white/10">
        <SheetHeader>
          <SheetTitle className="text-floodlight">{formattedDate}</SheetTitle>
          <SheetDescription>
            {mandatoryPopulated} of {mandatoryModes.length} mandatory
            {optionalPopulated > 0 && ` + ${optionalPopulated} extra`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mandatory Section */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Mandatory ({mandatoryPopulated}/{mandatoryModes.length})
                </h4>
                <div className="space-y-2">
                  {mandatoryModes.map((mode) => (
                    <GameModeCard
                      key={mode}
                      mode={mode}
                      puzzle={puzzleMap.get(mode)}
                      isMandatory={true}
                      isExpanded={expandedPuzzle === puzzleMap.get(mode)?.id}
                      onToggleExpand={(puzzleId) =>
                        setExpandedPuzzle(expandedPuzzle === puzzleId ? null : puzzleId)
                      }
                      onEditPuzzle={onEditPuzzle}
                      onToggleBonus={onToggleBonus}
                      onDeletePuzzle={onDeletePuzzle}
                      onPublishPuzzle={onPublishPuzzle}
                    />
                  ))}
                </div>
              </div>

              {/* Optional Section */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Optional ({optionalPopulated}/{optionalModes.length})
                </h4>
                <div className="space-y-2">
                  {optionalModes.map((mode) => (
                    <GameModeCard
                      key={mode}
                      mode={mode}
                      puzzle={puzzleMap.get(mode)}
                      isMandatory={false}
                      isExpanded={expandedPuzzle === puzzleMap.get(mode)?.id}
                      onToggleExpand={(puzzleId) =>
                        setExpandedPuzzle(expandedPuzzle === puzzleId ? null : puzzleId)
                      }
                      onEditPuzzle={onEditPuzzle}
                      onToggleBonus={onToggleBonus}
                      onDeletePuzzle={onDeletePuzzle}
                      onPublishPuzzle={onPublishPuzzle}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
