"use client";

import { useState, useCallback } from "react";
import { addMonths, subMonths, startOfMonth, startOfWeek, format } from "date-fns";
import { toast } from "sonner";
import { useMonthPuzzles } from "@/hooks/use-puzzles";
import { useCalendarData } from "@/hooks/use-calendar-data";
import { useBacklogPuzzles } from "@/hooks/use-backlog-puzzles";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { MonthHeader } from "@/components/calendar/month-header";
import { Legend } from "@/components/calendar/legend";
import { StatsBar } from "@/components/calendar/stats-bar";
import { QuickViewSheet } from "@/components/puzzle/quick-view-sheet";
import { PuzzleEditorModal } from "@/components/puzzle/puzzle-editor-modal";
import { BacklogSheet } from "@/components/puzzle/backlog-sheet";
import { AdhocPuzzleModal } from "@/components/puzzle/adhoc-puzzle-modal";
import {
  ConflictResolutionModal,
  type ConflictResolution,
} from "@/components/puzzle/conflict-resolution-modal";
import { OracleModal, type OracleGameMode } from "@/components/calendar/oracle-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { findNextGap } from "@/lib/scheduler";
import type { ConflictInfo, AvailableSlot } from "@/lib/displacement";
import {
  initializeWeek,
  assignPuzzleDate,
  toggleBonusPuzzle,
  checkSlotConflict,
  displacePuzzle,
  assignPuzzleDateWithConflictHandling,
  deletePuzzle,
  publishPuzzle,
} from "./actions";
import type { GameMode } from "@/lib/constants";
import type { DailyPuzzle } from "@/types/supabase";

interface EditorState {
  isOpen: boolean;
  gameMode: GameMode | null;
  puzzle: DailyPuzzle | null;
  puzzleDate: string | null;
}

interface ConflictState {
  isOpen: boolean;
  conflict: ConflictInfo | null;
  incomingPuzzleId: string | null;
  incomingPuzzleTitle: string;
  nextAvailableSlot: AvailableSlot | null;
  targetDate: string | null;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    isOpen: false,
    gameMode: null,
    puzzle: null,
    puzzleDate: null,
  });

  // Backlog state
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Ad-hoc creation modal state
  const [adhocModalOpen, setAdhocModalOpen] = useState(false);

  // Oracle modal state
  const [oracleModal, setOracleModal] = useState<{
    isOpen: boolean;
    gameMode: OracleGameMode | null;
    gapDates: string[];
  }>({ isOpen: false, gameMode: null, gapDates: [] });

  // Conflict resolution state
  const [conflictState, setConflictState] = useState<ConflictState>({
    isOpen: false,
    conflict: null,
    incomingPuzzleId: null,
    incomingPuzzleTitle: "",
    nextAvailableSlot: null,
    targetDate: null,
  });
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  const { puzzles, isLoading, error, mutate } = useMonthPuzzles(currentMonth);
  const calendarData = useCalendarData(puzzles, currentMonth);
  const backlogData = useBacklogPuzzles();

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
    setSelectedDate(null);
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(startOfMonth(new Date()));
    setSelectedDate(null);
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const handleEditPuzzle = useCallback(
    (gameMode: GameMode, puzzle?: DailyPuzzle) => {
      setEditorState({
        isOpen: true,
        gameMode,
        puzzle: puzzle || null,
        puzzleDate: selectedDate,
      });
    },
    [selectedDate]
  );

  const handleCloseEditor = useCallback(() => {
    setEditorState({
      isOpen: false,
      gameMode: null,
      puzzle: null,
      puzzleDate: null,
    });
  }, []);

  const handleSaveSuccess = useCallback(
    (savedPuzzle: DailyPuzzle) => {
      // Revalidate the puzzles data
      mutate();
      // Revalidate backlog if it was a backlog puzzle
      if (!savedPuzzle.puzzle_date) {
        backlogData.mutate();
      }
    },
    [mutate, backlogData]
  );

  // Handle "Save & Next Gap" - save and open next missing puzzle
  const handleSaveAndNextGap = useCallback(
    (savedPuzzle: DailyPuzzle) => {
      // Revalidate the puzzles data
      mutate();

      // Find the next gap starting from the saved puzzle's date
      if (!savedPuzzle.puzzle_date) {
        handleCloseEditor();
        return;
      }

      const nextGap = findNextGap(savedPuzzle.puzzle_date, puzzles);

      if (nextGap) {
        // Open editor for the next gap
        setEditorState({
          isOpen: true,
          gameMode: nextGap.gameMode,
          puzzle: null,
          puzzleDate: nextGap.date,
        });
      } else {
        // No more gaps found
        handleCloseEditor();
        toast.success("All gaps filled for the next 30 days!");
      }
    },
    [mutate, puzzles, handleCloseEditor]
  );

  // Toggle backlog sheet
  const handleToggleBacklog = useCallback(() => {
    setBacklogOpen((prev) => !prev);
  }, []);

  // Open ad-hoc creation modal
  const handleCreateAdhoc = useCallback(() => {
    setAdhocModalOpen(true);
  }, []);

  // Handle ad-hoc modal confirm - opens editor with selected date and mode
  const handleAdhocConfirm = useCallback((date: string, gameMode: GameMode) => {
    setAdhocModalOpen(false);
    setEditorState({
      isOpen: true,
      gameMode,
      puzzle: null,
      puzzleDate: date,
    });
  }, []);

  // Initialize week with draft placeholders
  const handleInitializeWeek = useCallback(async () => {
    // Get the Monday of the current month view and format as string
    const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, "yyyy-MM-dd");

    setIsInitializing(true);
    try {
      const result = await initializeWeek(weekStartStr);

      if (!result.success) {
        toast.error(result.error || "Failed to initialize week");
        return;
      }

      const created = result.data?.created || 0;
      if (created === 0) {
        toast.info("Week already fully initialized");
      } else {
        toast.success(`Created ${created} draft puzzle${created === 1 ? "" : "s"}`);
      }

      // Revalidate puzzles
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initialize week");
    } finally {
      setIsInitializing(false);
    }
  }, [currentMonth, mutate]);

  // Handle Oracle fill - opens modal with gap dates
  const handleOracleFill = useCallback(
    (gameMode: OracleGameMode) => {
      // Find gap dates for this game mode in the current month view
      const gapDates: string[] = [];
      for (const week of calendarData.weeks) {
        for (const day of week.days) {
          if (!day.isCurrentMonth) continue;
          // Check if this day needs the game mode and doesn't have it
          const modeStatus = day.displayModes.find((m) => m.mode === gameMode);
          if (modeStatus && !modeStatus.hasContent && modeStatus.isScheduled) {
            gapDates.push(day.date);
          }
        }
      }

      if (gapDates.length === 0) {
        toast.info(`No ${gameMode === "career_path" ? "Career Path" : "Career Path Pro"} gaps found in this month`);
        return;
      }

      // Open Oracle modal with the gap dates
      setOracleModal({
        isOpen: true,
        gameMode,
        gapDates,
      });
    },
    [calendarData.weeks]
  );

  // Handle Oracle modal completion
  const handleOracleComplete = useCallback(() => {
    mutate();
    toast.success("Oracle operation completed");
  }, [mutate]);

  // Helper to get puzzle title from content
  const getPuzzleTitle = useCallback((puzzle: DailyPuzzle): string => {
    const c = puzzle.content as Record<string, unknown>;
    switch (puzzle.game_mode) {
      case "career_path":
      case "career_path_pro":
        return (c.answer as string) || "Untitled Career Path";
      case "guess_the_transfer":
        return (c.answer as string) || "Untitled Transfer";
      case "guess_the_goalscorers":
        return `${c.home_team || "?"} vs ${c.away_team || "?"}`;
      case "topical_quiz":
        return "Topical Quiz";
      case "top_tens":
        return (c.title as string) || "Untitled Top Tens";
      case "starting_xi":
        return (c.match_name as string) || "Untitled Starting XI";
      case "the_grid":
        return "The Grid";
      default:
        return "Untitled Puzzle";
    }
  }, []);

  // Toggle bonus status on a puzzle
  const handleToggleBonus = useCallback(
    async (puzzleId: string, isBonus: boolean) => {
      try {
        const result = await toggleBonusPuzzle(puzzleId, isBonus);

        if (!result.success) {
          toast.error(result.error || "Failed to update bonus status");
          return;
        }

        toast.success(isBonus ? "Marked as bonus content" : "Removed bonus status");
        mutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update bonus status");
      }
    },
    [mutate]
  );

  // Delete a puzzle
  const handleDeletePuzzle = useCallback(
    async (puzzleId: string) => {
      if (!window.confirm("Are you sure you want to delete this puzzle? This cannot be undone.")) {
        return;
      }

      try {
        const result = await deletePuzzle(puzzleId);

        if (!result.success) {
          toast.error(result.error || "Failed to delete puzzle");
          return;
        }

        toast.success("Puzzle deleted");
        mutate();
        backlogData.mutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete puzzle");
      }
    },
    [mutate, backlogData]
  );

  // Publish a puzzle (change status to live)
  const handlePublishPuzzle = useCallback(
    async (puzzleId: string) => {
      try {
        const result = await publishPuzzle(puzzleId);

        if (!result.success) {
          toast.error(result.error || "Failed to publish puzzle");
          return;
        }

        toast.success("Puzzle published");
        mutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to publish puzzle");
      }
    },
    [mutate]
  );

  // Handle conflict resolution
  const handleConflictResolution = useCallback(
    async (resolution: ConflictResolution) => {
      if (!conflictState.conflict || !conflictState.incomingPuzzleId || !conflictState.targetDate) {
        setConflictState((prev) => ({ ...prev, isOpen: false }));
        return;
      }

      setIsResolvingConflict(true);

      try {
        switch (resolution.type) {
          case "cancel":
            setConflictState((prev) => ({ ...prev, isOpen: false }));
            break;

          case "add_as_bonus": {
            // Assign with forceAsBonus flag
            const result = await assignPuzzleDateWithConflictHandling(
              conflictState.incomingPuzzleId,
              conflictState.targetDate,
              { forceAsBonus: true }
            );

            if (!result.success) {
              toast.error(result.error || "Failed to assign as bonus");
              return;
            }

            toast.success("Puzzle added as bonus content");
            mutate();
            backlogData.mutate();
            setConflictState((prev) => ({ ...prev, isOpen: false }));
            break;
          }

          case "displace": {
            // First displace the existing puzzle
            const displaceResult = await displacePuzzle(
              conflictState.conflict.existingPuzzleId,
              resolution.targetDate
            );

            if (!displaceResult.success) {
              toast.error(displaceResult.error || "Failed to displace puzzle");
              return;
            }

            // Then assign the incoming puzzle
            const assignResult = await assignPuzzleDate(
              conflictState.incomingPuzzleId,
              conflictState.targetDate
            );

            if (!assignResult.success) {
              toast.error(assignResult.error || "Failed to assign puzzle");
              return;
            }

            const moveCount = displaceResult.data?.moves.length || 0;
            toast.success(
              moveCount > 1
                ? `Displaced ${moveCount} puzzle${moveCount > 1 ? "s" : ""} and assigned new puzzle`
                : "Displaced existing puzzle and assigned new puzzle"
            );
            mutate();
            backlogData.mutate();
            setConflictState((prev) => ({ ...prev, isOpen: false }));
            break;
          }

          case "swap": {
            // Find the incoming puzzle to get its current date (should be null for backlog)
            const incomingPuzzle = backlogData.puzzles.find(
              (p) => p.id === conflictState.incomingPuzzleId
            );

            if (!incomingPuzzle) {
              toast.error("Could not find incoming puzzle");
              return;
            }

            // For backlog puzzles (no date), we can't really swap
            // Instead, assign the backlog puzzle and move existing to backlog
            // This is a special case - just use displacement instead
            toast.info("For backlog puzzles, use 'Displace' instead of 'Swap'");
            return;
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to resolve conflict");
      } finally {
        setIsResolvingConflict(false);
      }
    },
    [conflictState, mutate, backlogData]
  );

  // Assign backlog puzzle to a date (with conflict detection)
  const handleAssignPuzzle = useCallback(
    async (puzzleId: string, targetDate: string) => {
      try {
        // Find the puzzle to get its game mode and title
        const puzzle = backlogData.puzzles.find((p) => p.id === puzzleId);
        if (!puzzle) {
          toast.error("Puzzle not found");
          return;
        }

        // Check for conflict first
        const conflictResult = await checkSlotConflict(
          puzzle.game_mode as GameMode,
          targetDate
        );

        if (!conflictResult.success) {
          toast.error(conflictResult.error || "Failed to check for conflicts");
          return;
        }

        const { conflict, nextSlot } = conflictResult.data!;

        if (conflict) {
          // Show conflict resolution modal
          setConflictState({
            isOpen: true,
            conflict,
            incomingPuzzleId: puzzleId,
            incomingPuzzleTitle: getPuzzleTitle(puzzle),
            nextAvailableSlot: nextSlot,
            targetDate,
          });
          return;
        }

        // No conflict - proceed with assignment
        const result = await assignPuzzleDate(puzzleId, targetDate);

        if (!result.success) {
          toast.error(result.error || "Failed to assign puzzle");
          return;
        }

        toast.success("Puzzle assigned to date");

        // Revalidate both puzzles and backlog
        mutate();
        backlogData.mutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to assign puzzle");
      }
    },
    [mutate, backlogData, getPuzzleTitle]
  );

  // Edit a backlog puzzle
  const handleEditBacklogPuzzle = useCallback((puzzle: DailyPuzzle) => {
    setEditorState({
      isOpen: true,
      gameMode: puzzle.game_mode as GameMode,
      puzzle,
      puzzleDate: null, // Backlog puzzles have no date
    });
  }, []);

  // Find selected day data
  const selectedDay = selectedDate
    ? calendarData.weeks
        .flatMap((w) => w.days)
        .find((d) => d.date === selectedDate) || null
    : null;

  // Filter puzzles for selected date
  const selectedDatePuzzles = selectedDate
    ? puzzles.filter((p) => p.puzzle_date === selectedDate)
    : [];

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-card mb-2">Failed to load puzzles</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month header with navigation */}
      <MonthHeader
        month={currentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onInitializeWeek={handleInitializeWeek}
        onToggleBacklog={handleToggleBacklog}
        onCreateAdhoc={handleCreateAdhoc}
        onOracleFill={handleOracleFill}
        backlogCount={backlogData.count}
        isInitializing={isInitializing}
      />

      {/* Stats bar */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <StatsBar stats={calendarData.stats} />
      )}

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="glass-card p-4">
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <CalendarGrid
              weeks={calendarData.weeks}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>

        {/* Legend sidebar - hidden on mobile/tablet */}
        <div className="hidden lg:block w-72 shrink-0">
          <Legend />
        </div>
      </div>

      {/* Quick view sheet */}
      <QuickViewSheet
        isOpen={!!selectedDate}
        onClose={handleCloseSheet}
        day={selectedDay}
        puzzles={selectedDatePuzzles}
        isLoading={isLoading}
        onEditPuzzle={handleEditPuzzle}
        onToggleBonus={handleToggleBonus}
        onDeletePuzzle={handleDeletePuzzle}
        onPublishPuzzle={handlePublishPuzzle}
      />

      {/* Puzzle editor modal */}
      {editorState.gameMode && (
        <PuzzleEditorModal
          isOpen={editorState.isOpen}
          onClose={handleCloseEditor}
          gameMode={editorState.gameMode}
          puzzle={editorState.puzzle}
          puzzleDate={editorState.puzzleDate}
          onSaveSuccess={handleSaveSuccess}
          showNextGapButton={!!editorState.puzzleDate} // Only show for scheduled puzzles
          onSaveAndNextGap={handleSaveAndNextGap}
        />
      )}

      {/* Backlog sheet */}
      <BacklogSheet
        isOpen={backlogOpen}
        onClose={() => setBacklogOpen(false)}
        puzzles={backlogData.puzzles}
        isLoading={backlogData.isLoading}
        selectedDate={selectedDate}
        onAssign={handleAssignPuzzle}
        onEdit={handleEditBacklogPuzzle}
      />

      {/* Conflict resolution modal */}
      {conflictState.conflict && conflictState.targetDate && (
        <ConflictResolutionModal
          isOpen={conflictState.isOpen}
          onClose={() => setConflictState((prev) => ({ ...prev, isOpen: false }))}
          conflict={conflictState.conflict}
          incomingPuzzleTitle={conflictState.incomingPuzzleTitle}
          nextAvailableSlot={conflictState.nextAvailableSlot}
          onResolve={handleConflictResolution}
          isResolving={isResolvingConflict}
        />
      )}

      {/* Ad-hoc puzzle creation modal */}
      <AdhocPuzzleModal
        isOpen={adhocModalOpen}
        onClose={() => setAdhocModalOpen(false)}
        onConfirm={handleAdhocConfirm}
      />

      {/* Oracle modal */}
      {oracleModal.gameMode && (
        <OracleModal
          isOpen={oracleModal.isOpen}
          onClose={() => setOracleModal({ isOpen: false, gameMode: null, gapDates: [] })}
          gameMode={oracleModal.gameMode}
          gapDates={oracleModal.gapDates}
          onComplete={handleOracleComplete}
        />
      )}
    </div>
  );
}
