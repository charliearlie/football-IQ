import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPuzzleArchive,
  fetchPlayerRapSheet,
  fetchPuzzlesMissingQid,
  updatePuzzleAnswerQid,
} from "../actions";

// ============================================================================
// Mock Supabase
// ============================================================================

const mockData: Record<string, unknown>[] = [];
let mockCount = 0;
let mockError: { message: string } | null = null;
let mockSingleData: Record<string, unknown> | null = null;

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  containedBy: vi.fn().mockReturnThis(),
  range: vi.fn(function (this: typeof mockQueryBuilder) {
    return this;
  }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(() =>
    Promise.resolve({ data: mockSingleData, error: mockError })
  ),
  maybeSingle: vi.fn(() =>
    Promise.resolve({ data: mockSingleData, error: mockError })
  ),
};

// Make the query builder thenable (so await works)
// biome-ignore lint/suspicious/noThenProperty: required for mock thenable
Object.defineProperty(mockQueryBuilder, "then", {
  value: function (
    onFulfilled: (value: { data: unknown[]; error: typeof mockError; count: number }) => void
  ) {
    return Promise.resolve({
      data: mockData,
      error: mockError,
      count: mockCount,
    }).then(onFulfilled);
  },
  writable: true,
  configurable: true,
});

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
};

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ============================================================================
// TESTS
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockData.length = 0;
  mockCount = 0;
  mockError = null;
  mockSingleData = null;
});

describe("fetchPuzzleArchive", () => {
  it("returns paginated results with correct shape", async () => {
    mockData.push(
      {
        id: "p1",
        puzzle_date: "2026-01-15",
        game_mode: "career_path",
        status: "live",
        content: { answer: "Messi", answer_qid: "Q11571" },
      },
      {
        id: "p2",
        puzzle_date: "2026-01-14",
        game_mode: "career_path",
        status: "draft",
        content: { answer: "Ronaldo" },
      }
    );
    mockCount = 2;

    const result = await fetchPuzzleArchive({
      gameMode: "career_path",
      page: 1,
      pageSize: 25,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.rows).toHaveLength(2);
    expect(result.data!.page).toBe(1);
    expect(result.data!.pageSize).toBe(25);
    expect(result.data!.totalCount).toBe(2);
  });

  it("filters by game mode", async () => {
    mockData.push({
      id: "p1",
      puzzle_date: "2026-01-15",
      game_mode: "career_path",
      status: "live",
      content: { answer: "Messi" },
    });
    mockCount = 1;

    await fetchPuzzleArchive({
      gameMode: "career_path",
      page: 1,
      pageSize: 25,
    });

    // Should use .eq for single mode
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("game_mode", "career_path");
  });

  it("filters by array of game modes using .in()", async () => {
    mockCount = 0;

    await fetchPuzzleArchive({
      gameMode: ["career_path", "career_path_pro"],
      page: 1,
      pageSize: 25,
    });

    expect(mockQueryBuilder.in).toHaveBeenCalledWith("game_mode", [
      "career_path",
      "career_path_pro",
    ]);
  });

  it("filters by status when provided", async () => {
    mockCount = 0;

    await fetchPuzzleArchive({
      gameMode: "career_path",
      page: 1,
      pageSize: 25,
      status: "live",
    });

    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("status", "live");
  });

  it("extracts answer text from rows", async () => {
    mockData.push({
      id: "p1",
      puzzle_date: "2026-01-15",
      game_mode: "career_path",
      status: "live",
      content: { answer: "Lionel Messi", answer_qid: "Q11571" },
    });
    mockCount = 1;

    const result = await fetchPuzzleArchive({
      gameMode: "career_path",
      page: 1,
      pageSize: 25,
    });

    expect(result.data!.rows[0].answer).toBe("Lionel Messi");
    expect(result.data!.rows[0].answer_qid).toBe("Q11571");
  });

  it("handles Supabase errors", async () => {
    mockError = { message: "Database error" };

    const result = await fetchPuzzleArchive({
      gameMode: "career_path",
      page: 1,
      pageSize: 25,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Database error");
  });
});

describe("fetchPlayerRapSheet", () => {
  it("returns appearances grouped by mode", async () => {
    // First call: player lookup
    mockSingleData = { id: "Q11571", name: "Lionel Messi", nationality_code: "AR" };
    // Second call: puzzle appearances
    mockData.push(
      {
        id: "p1",
        puzzle_date: "2026-01-10",
        game_mode: "career_path",
        status: "live",
      },
      {
        id: "p2",
        puzzle_date: "2026-01-12",
        game_mode: "guess_the_transfer",
        status: "live",
      }
    );
    mockCount = 2;

    const result = await fetchPlayerRapSheet("Q11571");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.player.id).toBe("Q11571");
    expect(result.data!.appearances).toHaveLength(2);
    expect(result.data!.modesSummary).toBeDefined();
  });

  it("returns error for unknown QID", async () => {
    mockSingleData = null;

    const result = await fetchPlayerRapSheet("Q_UNKNOWN");

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});

describe("fetchPuzzlesMissingQid", () => {
  it("returns puzzles with null answer_qid", async () => {
    mockData.push(
      {
        id: "p1",
        puzzle_date: "2026-01-10",
        game_mode: "career_path",
        content: { answer: "Some Player" },
        status: "live",
      },
      {
        id: "p2",
        puzzle_date: "2026-01-11",
        game_mode: "career_path",
        content: { answer: "Another Player" },
        status: "draft",
      }
    );

    const result = await fetchPuzzlesMissingQid("career_path");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBe(2);
    expect(result.data![0].answer).toBe("Some Player");
  });

  it("handles array of game modes", async () => {
    mockData.length = 0;

    await fetchPuzzlesMissingQid(["career_path", "career_path_pro"]);

    expect(mockQueryBuilder.in).toHaveBeenCalledWith("game_mode", [
      "career_path",
      "career_path_pro",
    ]);
  });
});

describe("updatePuzzleAnswerQid", () => {
  it("patches content JSONB with answer_qid", async () => {
    mockSingleData = {
      id: "p1",
      content: { answer: "Messi", career_steps: [] },
    };

    const result = await updatePuzzleAnswerQid("p1", "Q11571");

    expect(result.success).toBe(true);
    expect(mockQueryBuilder.update).toHaveBeenCalled();
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "p1");
  });

  it("returns error when puzzle not found", async () => {
    mockSingleData = null;

    const result = await updatePuzzleAnswerQid("p_nonexistent", "Q11571");

    expect(result.success).toBe(false);
  });
});
