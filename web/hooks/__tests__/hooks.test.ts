import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCalendarData } from "../use-calendar-data";
import { usePuzzles, useMonthPuzzles } from "../use-puzzles";
import type { DailyPuzzle } from "@/types/supabase";
import { GAME_MODES } from "@/lib/constants";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  }),
}));

// Mock SWR
vi.mock("swr", () => ({
  default: vi.fn((key, fetcher, options) => {
    // Return loading state by default
    return {
      data: undefined,
      error: null,
      isLoading: true,
      mutate: vi.fn(),
    };
  }),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockPuzzles: DailyPuzzle[] = [
  {
    id: "puzzle-1",
    puzzle_date: "2024-01-15",
    game_mode: "career_path",
    content: { answer: "Test", career_steps: [] },
    status: "live",
    difficulty: "medium",
    source: "cms",
    triggered_by: null,
    is_premium: false,
    created_at: "2024-01-14T10:00:00Z",
    updated_at: "2024-01-14T10:00:00Z",
  },
  {
    id: "puzzle-2",
    puzzle_date: "2024-01-15",
    game_mode: "the_grid",
    content: { xAxis: [], yAxis: [], valid_answers: {} },
    status: "draft",
    difficulty: "hard",
    source: "cms",
    triggered_by: null,
    is_premium: false,
    created_at: "2024-01-14T10:00:00Z",
    updated_at: "2024-01-14T10:00:00Z",
  },
  {
    id: "puzzle-3",
    puzzle_date: "2024-01-16",
    game_mode: "career_path",
    content: { answer: "Another", career_steps: [] },
    status: "live",
    difficulty: null,
    source: "cms",
    triggered_by: null,
    is_premium: false,
    created_at: "2024-01-14T10:00:00Z",
    updated_at: "2024-01-14T10:00:00Z",
  },
];

// ============================================================================
// USE CALENDAR DATA TESTS
// ============================================================================

describe("useCalendarData", () => {
  it("returns calendar structure with weeks", () => {
    const month = new Date(2024, 0, 15); // January 2024
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    expect(result.current.weeks).toBeDefined();
    expect(result.current.weeks.length).toBeGreaterThan(0);
  });

  it("returns month in result", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    expect(result.current.month).toEqual(month);
  });

  it("returns stats for the month", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    expect(result.current.stats).toHaveProperty("totalDays");
    expect(result.current.stats).toHaveProperty("fullyPopulatedDays");
    expect(result.current.stats).toHaveProperty("partiallyPopulatedDays");
    expect(result.current.stats).toHaveProperty("emptyDays");
    expect(result.current.stats).toHaveProperty("upcomingGaps");
  });

  it("calculates totalDays as days in the month", () => {
    const month = new Date(2024, 0, 15); // January has 31 days
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    expect(result.current.stats.totalDays).toBe(31);
  });

  it("each week has 7 days", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    result.current.weeks.forEach((week) => {
      expect(week.days.length).toBe(7);
    });
  });

  it("marks days with isCurrentMonth correctly", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    const januaryDays = allDays.filter((d) => d.date.startsWith("2024-01"));

    januaryDays.forEach((day) => {
      expect(day.isCurrentMonth).toBe(true);
    });
  });

  it("calculates totalPopulated for each day", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    const jan15 = allDays.find((d) => d.date === "2024-01-15");

    // Jan 15 has 2 puzzles (career_path and the_grid)
    expect(jan15?.totalPopulated).toBe(2);
  });

  it("calculates totalMissing for each day", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    const jan15 = allDays.find((d) => d.date === "2024-01-15");

    // Jan 15 has 2 puzzles, so missing = 8 - 2 = 6
    expect(jan15?.totalMissing).toBe(GAME_MODES.length - 2);
  });

  it("includes game mode status for each day", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    const jan15 = allDays.find((d) => d.date === "2024-01-15");

    expect(jan15?.gameModes).toHaveLength(GAME_MODES.length);

    const careerPathMode = jan15?.gameModes.find((gm) => gm.mode === "career_path");
    expect(careerPathMode?.hasContent).toBe(true);
    expect(careerPathMode?.status).toBe("live");
    expect(careerPathMode?.difficulty).toBe("medium");
  });

  it("handles empty puzzles array", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData([], month));

    expect(result.current.weeks.length).toBeGreaterThan(0);
    expect(result.current.stats.emptyDays).toBe(31);
    expect(result.current.stats.fullyPopulatedDays).toBe(0);
  });

  it("counts partially populated days", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    // Jan 15 has 2 puzzles (partial), Jan 16 has 1 puzzle (partial)
    expect(result.current.stats.partiallyPopulatedDays).toBe(2);
  });

  it("memoizes result for same inputs", () => {
    const month = new Date(2024, 0, 15);
    const { result, rerender } = renderHook(
      ({ puzzles, month }) => useCalendarData(puzzles, month),
      { initialProps: { puzzles: mockPuzzles, month } }
    );

    const firstResult = result.current;
    rerender({ puzzles: mockPuzzles, month });
    const secondResult = result.current;

    // Same reference due to memoization
    expect(firstResult).toBe(secondResult);
  });

  it("recomputes when puzzles change", () => {
    const month = new Date(2024, 0, 15);
    const { result, rerender } = renderHook(
      ({ puzzles, month }) => useCalendarData(puzzles, month),
      { initialProps: { puzzles: mockPuzzles, month } }
    );

    const firstResult = result.current;
    rerender({ puzzles: [...mockPuzzles], month }); // New array reference
    const secondResult = result.current;

    // Different reference due to new puzzles array
    expect(firstResult).not.toBe(secondResult);
  });
});

// ============================================================================
// USE PUZZLES TESTS
// ============================================================================

describe("usePuzzles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() =>
      usePuzzles({ startDate: "2024-01-01", endDate: "2024-01-31" })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.puzzles).toEqual([]);
  });

  it("returns empty puzzles array when loading", () => {
    const { result } = renderHook(() =>
      usePuzzles({ startDate: "2024-01-01", endDate: "2024-01-31" })
    );

    expect(result.current.puzzles).toEqual([]);
  });

  it("returns null error initially", () => {
    const { result } = renderHook(() =>
      usePuzzles({ startDate: "2024-01-01", endDate: "2024-01-31" })
    );

    expect(result.current.error).toBeNull();
  });

  it("returns mutate function", () => {
    const { result } = renderHook(() =>
      usePuzzles({ startDate: "2024-01-01", endDate: "2024-01-31" })
    );

    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("useMonthPuzzles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useMonthPuzzles(new Date(2024, 0, 15)));

    expect(result.current.isLoading).toBe(true);
  });

  it("returns empty puzzles array when loading", () => {
    const { result } = renderHook(() => useMonthPuzzles(new Date(2024, 0, 15)));

    expect(result.current.puzzles).toEqual([]);
  });

  it("returns mutate function", () => {
    const { result } = renderHook(() => useMonthPuzzles(new Date(2024, 0, 15)));

    expect(typeof result.current.mutate).toBe("function");
  });
});

// ============================================================================
// CALENDAR DAY PROPERTIES
// ============================================================================

describe("CalendarDay properties", () => {
  it("includes date in YYYY-MM-DD format", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    allDays.forEach((day) => {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("includes dayNumber", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    const jan15 = allDays.find((d) => d.date === "2024-01-15");

    expect(jan15?.dayNumber).toBe(15);
  });

  it("marks isToday correctly for current date", () => {
    const today = new Date();
    const month = today;
    const { result } = renderHook(() => useCalendarData([], month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    const todayDay = allDays.find((d) => d.isToday);

    expect(todayDay).toBeDefined();
  });

  it("includes gameModes array for all game modes", () => {
    const month = new Date(2024, 0, 15);
    const { result } = renderHook(() => useCalendarData(mockPuzzles, month));

    const allDays = result.current.weeks.flatMap((w) => w.days);
    allDays.forEach((day) => {
      expect(day.gameModes.length).toBe(GAME_MODES.length);
      GAME_MODES.forEach((mode) => {
        const gmStatus = day.gameModes.find((gm) => gm.mode === mode);
        expect(gmStatus).toBeDefined();
      });
    });
  });
});
