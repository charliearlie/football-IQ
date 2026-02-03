import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CleanupPanel } from "../cleanup-panel";

// Mock the server action
const mockFetchPuzzlesMissingQid = vi.fn();
vi.mock("@/app/(dashboard)/admin/actions", () => ({
  fetchPuzzlesMissingQid: (...args: unknown[]) =>
    mockFetchPuzzlesMissingQid(...args),
  updatePuzzleAnswerQid: vi.fn(() =>
    Promise.resolve({ success: true })
  ),
}));

// Mock calendar actions for player search
vi.mock("@/app/(dashboard)/calendar/actions", () => ({
  searchPlayersForForm: vi.fn(() =>
    Promise.resolve({ success: true, data: [] })
  ),
}));

describe("CleanupPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockFetchPuzzlesMissingQid.mockReturnValue(
      new Promise(() => {}) // Never resolves = loading
    );

    render(<CleanupPanel gameMode="career_path" />);

    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders puzzles missing QID", async () => {
    mockFetchPuzzlesMissingQid.mockResolvedValue({
      success: true,
      data: [
        {
          id: "p1",
          puzzle_date: "2026-01-10",
          game_mode: "career_path",
          answer: "Some Player",
          status: "live",
        },
        {
          id: "p2",
          puzzle_date: "2026-01-11",
          game_mode: "career_path",
          answer: "Another Player",
          status: "draft",
        },
      ],
    });

    render(<CleanupPanel gameMode="career_path" />);

    // Wait for data to load
    expect(await screen.findByText("Some Player")).toBeDefined();
    expect(await screen.findByText("Another Player")).toBeDefined();
  });

  it("renders empty state when no missing QIDs", async () => {
    mockFetchPuzzlesMissingQid.mockResolvedValue({
      success: true,
      data: [],
    });

    render(<CleanupPanel gameMode="career_path" />);

    expect(
      await screen.findByText("All puzzles have answer QIDs")
    ).toBeDefined();
  });

  it("renders Resolve button per row", async () => {
    mockFetchPuzzlesMissingQid.mockResolvedValue({
      success: true,
      data: [
        {
          id: "p1",
          puzzle_date: "2026-01-10",
          game_mode: "career_path",
          answer: "Some Player",
          status: "live",
        },
      ],
    });

    render(<CleanupPanel gameMode="career_path" />);

    expect(await screen.findByText("Resolve")).toBeDefined();
  });

  it("shows count of missing puzzles", async () => {
    mockFetchPuzzlesMissingQid.mockResolvedValue({
      success: true,
      data: [
        {
          id: "p1",
          puzzle_date: "2026-01-10",
          game_mode: "career_path",
          answer: "Player 1",
          status: "live",
        },
        {
          id: "p2",
          puzzle_date: "2026-01-11",
          game_mode: "career_path",
          answer: "Player 2",
          status: "draft",
        },
      ],
    });

    render(<CleanupPanel gameMode="career_path" />);

    expect(await screen.findByText("2 puzzles missing QID")).toBeDefined();
  });
});
