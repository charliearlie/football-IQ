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
import { Skeleton } from "@/components/ui/skeleton";
import { findNextGap } from "@/lib/scheduler";
import { initializeWeek, assignPuzzleDate } from "./actions";
import type { GameMode } from "@/lib/constants";
import type { DailyPuzzle } from "@/types/supabase";

interface EditorState {
  isOpen: boolean;
  gameMode: GameMode | null;
  puzzle: DailyPuzzle | null;
  puzzleDate: string | null;
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

  // Assign backlog puzzle to a date
  const handleAssignPuzzle = useCallback(
    async (puzzleId: string, targetDate: string) => {
      try {
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
    [mutate, backlogData]
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
        backlogCount={backlogData.count}
        isInitializing={isInitializing}
      />

      {/* Stats bar */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <StatsBar stats={calendarData.stats} />
      )}

      {/* Main content area */}
      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
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

        {/* Legend sidebar */}
        <div className="w-72 shrink-0">
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
    </div>
  );
}
