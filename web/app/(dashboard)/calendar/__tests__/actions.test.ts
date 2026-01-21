import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createPuzzle,
  updatePuzzle,
  deletePuzzle,
  copyFromPreviousDay,
  upsertPuzzle,
} from "../actions";

// ============================================================================
// SETUP
// ============================================================================

// Mock Supabase client for testing
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn(() => mockQueryBuilder),
};

// Override the setup.ts mock with specific implementations for these tests
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chain methods
  mockQueryBuilder.select.mockReturnThis();
  mockQueryBuilder.insert.mockReturnThis();
  mockQueryBuilder.update.mockReturnThis();
  mockQueryBuilder.delete.mockReturnThis();
  mockQueryBuilder.eq.mockReturnThis();
});

// ============================================================================
// TEST DATA
// ============================================================================

const validCareerPathContent = {
  answer: "Test Player",
  career_steps: [
    { type: "club", text: "Club A", year: "2020" },
    { type: "club", text: "Club B", year: "2021" },
    { type: "club", text: "Club C", year: "2022" },
  ],
};

const validCreateInput = {
  puzzle_date: "2024-01-15",
  game_mode: "career_path" as const,
  content: validCareerPathContent,
  status: "draft" as const,
  difficulty: "medium",
  source: "cms",
};

// ============================================================================
// CREATE PUZZLE TESTS
// ============================================================================

describe("createPuzzle", () => {
  it("validates content before creating", async () => {
    const invalidInput = {
      ...validCreateInput,
      content: { answer: "", career_steps: [] }, // Invalid content
    };

    const result = await createPuzzle(invalidInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation failed");
  });

  it("checks for existing puzzle before creating", async () => {
    // Mock that no existing puzzle found
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });
    // Mock successful insert
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { id: "new-id", ...validCreateInput },
      error: null,
    });

    await createPuzzle(validCreateInput);

    // Verify that it checked for existing
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("daily_puzzles");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("puzzle_date", "2024-01-15");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("game_mode", "career_path");
  });

  it("returns error if puzzle already exists", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { id: "existing-id" },
      error: null,
    });

    const result = await createPuzzle(validCreateInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("creates puzzle successfully", async () => {
    const newPuzzle = { id: "new-id", ...validCreateInput };
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null }); // No existing
    mockQueryBuilder.single.mockResolvedValueOnce({ data: newPuzzle, error: null }); // Insert success

    const result = await createPuzzle(validCreateInput);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newPuzzle);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/calendar");
  });

  it("returns error on Supabase insert failure", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null }); // No existing
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    });

    const result = await createPuzzle(validCreateInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database error");
  });

  it("sets source to cms by default", async () => {
    const inputWithoutSource = { ...validCreateInput, source: undefined };
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });
    mockQueryBuilder.single.mockResolvedValueOnce({ data: { id: "new-id" }, error: null });

    await createPuzzle(inputWithoutSource);

    expect(mockQueryBuilder.insert).toHaveBeenCalled();
    const insertCall = (mockQueryBuilder.insert as Mock).mock.calls[0][0];
    expect(insertCall.source).toBe("cms");
    expect(insertCall.triggered_by).toBe("manual");
  });
});

// ============================================================================
// UPDATE PUZZLE TESTS
// ============================================================================

describe("updatePuzzle", () => {
  it("validates content if provided", async () => {
    const result = await updatePuzzle("test-id", "career_path", {
      content: { answer: "", career_steps: [] },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation failed");
  });

  it("updates puzzle successfully", async () => {
    const updatedPuzzle = { id: "test-id", status: "live" };
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: updatedPuzzle,
      error: null,
    });

    const result = await updatePuzzle("test-id", "career_path", {
      status: "live",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updatedPuzzle);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/calendar");
  });

  it("handles partial updates", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { id: "test-id" },
      error: null,
    });

    await updatePuzzle("test-id", "career_path", {
      difficulty: "hard",
    });

    expect(mockQueryBuilder.update).toHaveBeenCalled();
    const updateCall = (mockQueryBuilder.update as Mock).mock.calls[0][0];
    expect(updateCall.difficulty).toBe("hard");
  });

  it("returns error on Supabase update failure", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Update failed" },
    });

    const result = await updatePuzzle("test-id", "career_path", {
      status: "live",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Update failed");
  });
});

// ============================================================================
// DELETE PUZZLE TESTS
// ============================================================================

describe("deletePuzzle", () => {
  it("deletes puzzle successfully", async () => {
    mockQueryBuilder.eq.mockResolvedValueOnce({ error: null });

    const result = await deletePuzzle("test-id");

    expect(result.success).toBe(true);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("daily_puzzles");
    expect(mockQueryBuilder.delete).toHaveBeenCalled();
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "test-id");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/calendar");
  });

  it("returns error on Supabase delete failure", async () => {
    mockQueryBuilder.eq.mockResolvedValueOnce({
      error: { message: "Delete failed" },
    });

    const result = await deletePuzzle("test-id");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Delete failed");
  });
});

// ============================================================================
// COPY FROM PREVIOUS DAY TESTS
// ============================================================================

describe("copyFromPreviousDay", () => {
  it("returns content from previous day", async () => {
    const sourceContent = {
      content: validCareerPathContent,
      difficulty: "medium",
    };
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: sourceContent,
      error: null,
    });

    const result = await copyFromPreviousDay("2024-01-14", "career_path");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      content: validCareerPathContent,
      difficulty: "medium",
    });
  });

  it("returns error if no puzzle exists for previous day", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });

    const result = await copyFromPreviousDay("2024-01-14", "career_path");

    expect(result.success).toBe(false);
    expect(result.error).toContain("No career_path puzzle found");
    expect(result.error).toContain("2024-01-14");
  });

  it("queries correct date and game mode", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { content: {}, difficulty: null },
      error: null,
    });

    await copyFromPreviousDay("2024-01-14", "the_grid");

    expect(mockQueryBuilder.select).toHaveBeenCalledWith("content, difficulty");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("puzzle_date", "2024-01-14");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("game_mode", "the_grid");
  });
});

// ============================================================================
// UPSERT PUZZLE TESTS
// ============================================================================

describe("upsertPuzzle", () => {
  it("validates content before upserting", async () => {
    const invalidInput = {
      ...validCreateInput,
      content: { answer: "", career_steps: [] },
    };

    const result = await upsertPuzzle(invalidInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation failed");
  });

  it("creates new puzzle if none exists", async () => {
    const newPuzzle = { id: "new-id", ...validCreateInput };
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null }); // No existing
    mockQueryBuilder.single.mockResolvedValueOnce({ data: newPuzzle, error: null }); // Insert success

    const result = await upsertPuzzle(validCreateInput);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newPuzzle);
    expect(mockQueryBuilder.insert).toHaveBeenCalled();
  });

  it("updates existing puzzle if found", async () => {
    const existingPuzzle = { id: "existing-id" };
    const updatedPuzzle = { id: "existing-id", ...validCreateInput, status: "draft" };

    mockQueryBuilder.single.mockResolvedValueOnce({
      data: existingPuzzle,
      error: null,
    }); // Existing found
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: updatedPuzzle,
      error: null,
    }); // Update success

    const result = await upsertPuzzle(validCreateInput);

    expect(result.success).toBe(true);
    expect(mockQueryBuilder.update).toHaveBeenCalled();
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "existing-id");
  });

  it("revalidates path on success", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { id: "new-id" },
      error: null,
    });

    await upsertPuzzle(validCreateInput);

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/calendar");
  });

  it("returns error on Supabase failure", async () => {
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null }); // No existing
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    const result = await upsertPuzzle(validCreateInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Insert failed");
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe("error handling", () => {
  it("createPuzzle catches and returns unknown errors", async () => {
    (createAdminClient as Mock).mockRejectedValueOnce(new Error("Connection failed"));

    const result = await createPuzzle(validCreateInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Connection failed");
  });

  it("updatePuzzle catches and returns unknown errors", async () => {
    (createAdminClient as Mock).mockRejectedValueOnce(new Error("Connection failed"));

    const result = await updatePuzzle("test-id", "career_path", { status: "live" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Connection failed");
  });

  it("deletePuzzle catches and returns unknown errors", async () => {
    (createAdminClient as Mock).mockRejectedValueOnce(new Error("Connection failed"));

    const result = await deletePuzzle("test-id");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Connection failed");
  });

  it("copyFromPreviousDay catches and returns unknown errors", async () => {
    (createAdminClient as Mock).mockRejectedValueOnce(new Error("Connection failed"));

    const result = await copyFromPreviousDay("2024-01-14", "career_path");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Connection failed");
  });

  it("upsertPuzzle catches and returns unknown errors", async () => {
    (createAdminClient as Mock).mockRejectedValueOnce(new Error("Connection failed"));

    const result = await upsertPuzzle(validCreateInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Connection failed");
  });
});
