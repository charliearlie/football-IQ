import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAdminPuzzles } from "../use-admin-puzzles";

// Mock SWR
vi.mock("swr", () => ({
  default: vi.fn((_key: unknown, _fetcher: unknown, _options: unknown) => ({
    data: undefined,
    error: null,
    isLoading: true,
    mutate: vi.fn(),
  })),
}));

// Mock the server action
vi.mock("@/app/(dashboard)/admin/actions", () => ({
  fetchPuzzleArchive: vi.fn(),
}));

describe("useAdminPuzzles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({ gameMode: "career_path", page: 1 })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("returns empty rows when loading", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({ gameMode: "career_path", page: 1 })
    );

    expect(result.current.rows).toEqual([]);
  });

  it("returns default pagination values when loading", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({ gameMode: "career_path", page: 1 })
    );

    expect(result.current.totalCount).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
  });

  it("returns mutate function", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({ gameMode: "career_path", page: 1 })
    );

    expect(typeof result.current.mutate).toBe("function");
  });

  it("returns null error initially", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({ gameMode: "career_path", page: 1 })
    );

    expect(result.current.error).toBeNull();
  });

  it("accepts array of game modes", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({
        gameMode: ["career_path", "career_path_pro"],
        page: 1,
      })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("accepts custom pageSize", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({ gameMode: "career_path", page: 1, pageSize: 50 })
    );

    expect(result.current.pageSize).toBe(50);
  });

  it("accepts status filter", () => {
    const { result } = renderHook(() =>
      useAdminPuzzles({
        gameMode: "career_path",
        page: 1,
        status: "live",
      })
    );

    expect(result.current.isLoading).toBe(true);
  });
});
