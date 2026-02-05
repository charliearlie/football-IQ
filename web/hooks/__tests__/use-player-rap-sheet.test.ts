import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlayerRapSheet } from "../use-player-rap-sheet";

// Mock SWR
const mockSwr = vi.fn((_key: unknown, _fetcher: unknown, _options: unknown) => ({
  data: undefined,
  error: null,
  isLoading: true,
}));

vi.mock("swr", () => ({
  default: (key: unknown, fetcher: unknown, options: unknown) => mockSwr(key, fetcher, options),
}));

// Mock the server action
vi.mock("@/app/(dashboard)/admin/actions", () => ({
  fetchPlayerRapSheet: vi.fn(),
}));

describe("usePlayerRapSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwr.mockImplementation((_key: unknown) => ({
      data: undefined,
      error: null,
      isLoading: true,
    }));
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => usePlayerRapSheet("Q11571"));

    expect(result.current.isLoading).toBe(true);
  });

  it("returns null player when no QID provided", () => {
    const { result } = renderHook(() => usePlayerRapSheet(null));

    expect(result.current.player).toBeNull();
    expect(result.current.appearances).toEqual([]);
    expect(result.current.modesSummary).toEqual({});
  });

  it("skips fetch when playerQid is null (conditional SWR key)", () => {
    renderHook(() => usePlayerRapSheet(null));

    // SWR should be called with null key
    expect(mockSwr).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object)
    );
  });

  it("uses non-null SWR key when QID provided", () => {
    renderHook(() => usePlayerRapSheet("Q11571"));

    expect(mockSwr).toHaveBeenCalledWith(
      ["player-rap-sheet", "Q11571"],
      expect.any(Function),
      expect.any(Object)
    );
  });

  it("returns empty appearances when loading", () => {
    const { result } = renderHook(() => usePlayerRapSheet("Q11571"));

    expect(result.current.appearances).toEqual([]);
  });

  it("returns empty modesSummary when loading", () => {
    const { result } = renderHook(() => usePlayerRapSheet("Q11571"));

    expect(result.current.modesSummary).toEqual({});
  });
});
