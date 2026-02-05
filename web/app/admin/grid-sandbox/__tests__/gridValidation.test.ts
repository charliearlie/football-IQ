import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkGridCell,
  checkCategoryMatchSupabase,
} from "../_lib/gridValidation";
import type { GridCategory } from "../_lib/types";

// ============================================================================
// SETUP — Mock Supabase client
// ============================================================================

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn(() => mockQueryBuilder),
};

type MockClient = typeof mockSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryBuilder.select.mockReturnThis();
  mockQueryBuilder.eq.mockReturnThis();
  mockQueryBuilder.ilike.mockReturnThis();
  mockQueryBuilder.limit.mockReturnThis();
});

// ============================================================================
// HELPERS
// ============================================================================

/** Set up mock for a player_appearances join query (club check) */
function mockClubMatch(hasMatch: boolean) {
  mockQueryBuilder.limit.mockResolvedValueOnce({
    data: hasMatch ? [{ club_id: "Q123" }] : [],
    error: null,
  });
}

/** Set up mock for a players nationality query */
function mockNationMatch(hasMatch: boolean) {
  mockQueryBuilder.limit.mockResolvedValueOnce({
    data: hasMatch ? [{ id: "Q170095" }] : [],
    error: null,
  });
}

/** Set up mock for a players stats_cache query */
function mockStatsCache(statsCache: Record<string, number> | null) {
  mockQueryBuilder.single.mockResolvedValueOnce({
    data: statsCache ? { stats_cache: statsCache } : null,
    error: statsCache ? null : { message: "not found" },
  });
}

// ============================================================================
// checkCategoryMatchSupabase — Individual category checks
// ============================================================================

describe("checkCategoryMatchSupabase", () => {
  const playerQid = "Q170095"; // Zidane

  it("returns true for club match when player has appearances", async () => {
    mockClubMatch(true);
    const cat: GridCategory = { type: "club", value: "Real Madrid" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("player_appearances");
  });

  it("returns false for club match when player has no appearances", async () => {
    mockClubMatch(false);
    const cat: GridCategory = { type: "club", value: "Arsenal" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(false);
  });

  it("returns true for nation match when player has correct nationality", async () => {
    mockNationMatch(true);
    const cat: GridCategory = { type: "nation", value: "France" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("nationality_code", "FR");
  });

  it("returns false for nation match when player has different nationality", async () => {
    mockNationMatch(false);
    const cat: GridCategory = { type: "nation", value: "Brazil" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(false);
  });

  it("returns false for unknown country name", async () => {
    const cat: GridCategory = { type: "nation", value: "Narnia" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(false);
    // Should not query Supabase at all
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it("returns true for trophy match when stats_cache has the trophy", async () => {
    mockStatsCache({ ucl_titles: 1, world_cup_titles: 1 });
    const cat: GridCategory = { type: "trophy", value: "Champions League" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
  });

  it("returns false for trophy match when stats_cache lacks the trophy", async () => {
    mockStatsCache({ ucl_titles: 0, world_cup_titles: 1 });
    const cat: GridCategory = { type: "trophy", value: "Champions League" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(false);
  });

  it("returns false when player has no stats_cache", async () => {
    mockStatsCache(null);
    const cat: GridCategory = { type: "trophy", value: "Champions League" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(false);
  });

  // --- Kopa Trophy edge case ---
  it("returns true for Kopa Trophy when stats_cache has kopa_trophy_count", async () => {
    mockStatsCache({ kopa_trophy_count: 1 });
    const cat: GridCategory = { type: "trophy", value: "Kopa Trophy" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
  });

  // --- Yashin Trophy edge case ---
  it("returns true for Yashin Trophy when stats_cache has yashin_trophy_count", async () => {
    mockStatsCache({ yashin_trophy_count: 2 });
    const cat: GridCategory = { type: "trophy", value: "Yashin Trophy" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
  });

  // --- Stat expression checks ---
  it("returns true for stat match at exact threshold", async () => {
    mockStatsCache({ ballon_dor_count: 5 });
    const cat: GridCategory = { type: "stat", value: "5+ Ballon d'Ors" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
  });

  it("returns false for stat match below threshold", async () => {
    mockStatsCache({ ballon_dor_count: 4 });
    const cat: GridCategory = { type: "stat", value: "5+ Ballon d'Ors" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(false);
  });

  it("returns true for stat match above threshold", async () => {
    mockStatsCache({ ballon_dor_count: 8 });
    const cat: GridCategory = { type: "stat", value: "5+ Ballon d'Ors" };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
  });

  it("returns true for Champions League stat threshold", async () => {
    mockStatsCache({ ucl_titles: 3 });
    const cat: GridCategory = {
      type: "stat",
      value: "3+ Champions League titles",
    };
    const result = await checkCategoryMatchSupabase(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      cat
    );
    expect(result).toBe(true);
  });
});

// ============================================================================
// checkGridCell — Relational Triangle (both criteria)
// ============================================================================

describe("checkGridCell", () => {
  const playerQid = "Q170095"; // Zidane

  it("returns valid when both club and nation match", async () => {
    mockClubMatch(true); // Real Madrid
    mockNationMatch(true); // France

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "club", value: "Real Madrid" },
      { type: "nation", value: "France" }
    );

    expect(result).toEqual({
      isValid: true,
      matchedA: true,
      matchedB: true,
    });
  });

  it("returns invalid when only first criterion matches", async () => {
    mockClubMatch(true); // Real Madrid
    mockNationMatch(false); // Not Brazilian

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "club", value: "Real Madrid" },
      { type: "nation", value: "Brazil" }
    );

    expect(result).toEqual({
      isValid: false,
      matchedA: true,
      matchedB: false,
    });
  });

  it("returns invalid when only second criterion matches", async () => {
    mockClubMatch(false); // Not Arsenal
    mockNationMatch(true); // French

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "club", value: "Arsenal" },
      { type: "nation", value: "France" }
    );

    expect(result).toEqual({
      isValid: false,
      matchedA: false,
      matchedB: true,
    });
  });

  it("returns invalid when neither criterion matches", async () => {
    mockClubMatch(false);
    mockNationMatch(false);

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "club", value: "Arsenal" },
      { type: "nation", value: "Brazil" }
    );

    expect(result).toEqual({
      isValid: false,
      matchedA: false,
      matchedB: false,
    });
  });

  it("validates club x club intersection", async () => {
    mockClubMatch(true); // Man United
    mockClubMatch(true); // Real Madrid

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "club", value: "Manchester United" },
      { type: "club", value: "Real Madrid" }
    );

    expect(result.isValid).toBe(true);
  });

  it("validates club x trophy intersection", async () => {
    mockClubMatch(true); // Liverpool
    mockStatsCache({ ucl_titles: 2 }); // Champions League winner

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "club", value: "Liverpool" },
      { type: "trophy", value: "Champions League" }
    );

    expect(result.isValid).toBe(true);
  });

  it("validates nation x trophy intersection", async () => {
    mockNationMatch(true); // France
    mockStatsCache({ world_cup_titles: 1 }); // World Cup winner

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "nation", value: "France" },
      { type: "trophy", value: "World Cup" }
    );

    expect(result.isValid).toBe(true);
  });

  it("validates trophy x stat intersection", async () => {
    mockStatsCache({ ucl_titles: 4 }); // UCL winner
    mockStatsCache({ ballon_dor_count: 8 }); // 3+ Ballon d'Ors

    const result = await checkGridCell(
      mockSupabaseClient as unknown as MockClient,
      playerQid,
      { type: "trophy", value: "Champions League" },
      { type: "stat", value: "3+ Ballon d'Ors" }
    );

    expect(result.isValid).toBe(true);
  });
});
