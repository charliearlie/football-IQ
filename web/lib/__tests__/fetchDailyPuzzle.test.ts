import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDailyPuzzle } from "../fetchDailyPuzzle";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================================================
// Mock Supabase server module
// ============================================================================

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

// ============================================================================
// Helper — create a chainable query builder that resolves to a given outcome
// ============================================================================

function makeQueryBuilder(resolvedValue: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  return builder;
}

function makeSupabaseClient(resolvedValue: { data: unknown; error: unknown }) {
  const builder = makeQueryBuilder(resolvedValue);
  return {
    from: vi.fn().mockReturnValue(builder),
    _builder: builder,
  };
}

// ============================================================================
// fetchDailyPuzzle
// ============================================================================

describe("fetchDailyPuzzle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Happy path
  // --------------------------------------------------------------------------

  describe("when a live puzzle exists", () => {
    it("returns puzzle data with content and puzzle_date", async () => {
      const puzzleRow = {
        content: { answer: "Thierry Henry", career_steps: [] },
        puzzle_date: "2026-02-19",
      };

      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      const result = await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(result).not.toBeNull();
      expect(result!.content).toEqual(puzzleRow.content);
      expect(result!.puzzle_date).toBe("2026-02-19");
    });

    it("queries the 'daily_puzzles' table", async () => {
      const puzzleRow = { content: {}, puzzle_date: "2026-02-19" };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(client.from).toHaveBeenCalledWith("daily_puzzles");
    });

    it("selects content and puzzle_date columns", async () => {
      const puzzleRow = { content: {}, puzzle_date: "2026-02-19" };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(client._builder.select).toHaveBeenCalledWith("content, puzzle_date");
    });

    it("filters by game_mode", async () => {
      const puzzleRow = { content: {}, puzzle_date: "2026-02-19" };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("connections", "2026-02-19");

      expect(client._builder.eq).toHaveBeenCalledWith("game_mode", "connections");
    });

    it("filters by puzzle_date", async () => {
      const puzzleRow = { content: {}, puzzle_date: "2026-02-19" };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(client._builder.eq).toHaveBeenCalledWith("puzzle_date", "2026-02-19");
    });

    it("filters by status='live'", async () => {
      const puzzleRow = { content: {}, puzzle_date: "2026-02-19" };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(client._builder.eq).toHaveBeenCalledWith("status", "live");
    });

    it("calls .single() to fetch a single row", async () => {
      const puzzleRow = { content: {}, puzzle_date: "2026-02-19" };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(client._builder.single).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Error cases
  // --------------------------------------------------------------------------

  describe("when no puzzle exists", () => {
    it("returns null when Supabase returns an error", async () => {
      const client = makeSupabaseClient({
        data: null,
        error: { message: "No rows found", code: "PGRST116" },
      });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      const result = await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(result).toBeNull();
    });

    it("returns null when Supabase returns null data with no error", async () => {
      const client = makeSupabaseClient({ data: null, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      const result = await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Date handling
  // --------------------------------------------------------------------------

  describe("date parameter handling", () => {
    it("uses today's date when no date argument is provided", async () => {
      const today = new Date().toISOString().split("T")[0];
      const puzzleRow = { content: {}, puzzle_date: today };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path");

      expect(client._builder.eq).toHaveBeenCalledWith("puzzle_date", today);
    });

    it("uses the provided date when an explicit date is given", async () => {
      const explicitDate = "2026-01-15";
      const puzzleRow = { content: {}, puzzle_date: explicitDate };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("topical_quiz", explicitDate);

      expect(client._builder.eq).toHaveBeenCalledWith("puzzle_date", explicitDate);
    });

    it("does not use today's date when an explicit date is given", async () => {
      const today = new Date().toISOString().split("T")[0];
      const explicitDate = "2025-06-01";

      // Only proceed if the explicit date differs from today to avoid false negatives
      if (explicitDate === today) return;

      const puzzleRow = { content: {}, puzzle_date: explicitDate };
      const client = makeSupabaseClient({ data: puzzleRow, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("connections", explicitDate);

      // Should have been called with explicit date, not today
      const calls = client._builder.eq.mock.calls;
      const puzzleDateCall = calls.find((c: unknown[]) => c[0] === "puzzle_date");
      expect(puzzleDateCall).toBeDefined();
      expect(puzzleDateCall![1]).toBe(explicitDate);
      expect(puzzleDateCall![1]).not.toBe(today);
    });
  });

  // --------------------------------------------------------------------------
  // Different game modes
  // --------------------------------------------------------------------------

  describe("different game modes", () => {
    it("passes 'career_path' game mode to the query", async () => {
      const client = makeSupabaseClient({ data: { content: {}, puzzle_date: "2026-02-19" }, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("career_path", "2026-02-19");

      expect(client._builder.eq).toHaveBeenCalledWith("game_mode", "career_path");
    });

    it("passes 'connections' game mode to the query", async () => {
      const client = makeSupabaseClient({ data: { content: {}, puzzle_date: "2026-02-19" }, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("connections", "2026-02-19");

      expect(client._builder.eq).toHaveBeenCalledWith("game_mode", "connections");
    });

    it("passes 'topical_quiz' game mode to the query", async () => {
      const client = makeSupabaseClient({ data: { content: {}, puzzle_date: "2026-02-19" }, error: null });
      vi.mocked(createAdminClient).mockResolvedValue(client as never);

      await fetchDailyPuzzle("topical_quiz", "2026-02-19");

      expect(client._builder.eq).toHaveBeenCalledWith("game_mode", "topical_quiz");
    });
  });
});
