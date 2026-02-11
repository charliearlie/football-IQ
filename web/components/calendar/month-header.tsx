"use client";

import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Wand2,
  Archive,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export type OracleGameMode = "career_path" | "career_path_pro";

interface MonthHeaderProps {
  month: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onInitializeWeek?: () => void;
  onToggleBacklog?: () => void;
  onCreateAdhoc?: () => void;
  onOracleFill?: (gameMode: OracleGameMode) => void;
  backlogCount?: number;
  isInitializing?: boolean;
}

export function MonthHeader({
  month,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onInitializeWeek,
  onToggleBacklog,
  onCreateAdhoc,
  onOracleFill,
  backlogCount = 0,
  isInitializing = false,
}: MonthHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-floodlight">
          {format(month, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="hidden md:inline-flex text-xs"
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          Today
        </Button>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile: single Actions dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                Actions
                <ChevronRight className="h-3 w-3 ml-1 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onToday}>
                <CalendarDays className="h-4 w-4 mr-2" />
                Today
              </DropdownMenuItem>
              {onCreateAdhoc && (
                <DropdownMenuItem onClick={onCreateAdhoc}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Puzzle
                </DropdownMenuItem>
              )}
              {onToggleBacklog && (
                <DropdownMenuItem onClick={onToggleBacklog}>
                  <Archive className="h-4 w-4 mr-2" />
                  Backlog{backlogCount > 0 ? ` (${backlogCount})` : ""}
                </DropdownMenuItem>
              )}
              {onInitializeWeek && (
                <DropdownMenuItem onClick={onInitializeWeek} disabled={isInitializing}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isInitializing ? "Initializing..." : "Initialize Week"}
                </DropdownMenuItem>
              )}
              {onOracleFill && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Oracle
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onOracleFill("career_path")}>
                    <Sparkles className="h-4 w-4 mr-2 text-pitch-green" />
                    Fill Career Path
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOracleFill("career_path_pro")}>
                    <Sparkles className="h-4 w-4 mr-2 text-card-yellow" />
                    Fill CP Pro
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: individual action buttons */}
        <div className="hidden md:flex items-center gap-2">
          {/* Create Ad-hoc button */}
          {onCreateAdhoc && (
            <Button
              variant="default"
              size="sm"
              onClick={onCreateAdhoc}
              className="text-xs bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Puzzle
            </Button>
          )}

          {/* Oracle Fill button */}
          {onOracleFill && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Oracle
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  AI-Powered Gap Filling
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOracleFill("career_path")}>
                  <Sparkles className="h-4 w-4 mr-2 text-pitch-green" />
                  Fill Career Path Gaps
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOracleFill("career_path_pro")}>
                  <Sparkles className="h-4 w-4 mr-2 text-card-yellow" />
                  Fill Career Path Pro Gaps
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Backlog button */}
          {onToggleBacklog && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleBacklog}
              className="text-xs"
            >
              <Archive className="h-3 w-3 mr-1" />
              Backlog
              {backlogCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 px-1.5 text-[10px] bg-card-yellow/20 text-card-yellow"
                >
                  {backlogCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Initialize Week button */}
          {onInitializeWeek && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInitializeWeek}
              disabled={isInitializing}
              className="text-xs border-card-yellow/50 text-card-yellow hover:bg-card-yellow/10 hover:text-card-yellow"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              {isInitializing ? "Initializing..." : "Initialize Week"}
            </Button>
          )}
        </div>

        {/* Month nav arrows - always visible */}
        <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
