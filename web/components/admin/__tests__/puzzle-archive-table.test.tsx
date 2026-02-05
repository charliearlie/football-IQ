import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PuzzleArchiveTable } from "../puzzle-archive-table";
import type { ArchiveRow } from "@/app/(dashboard)/admin/actions";

// Mock the hook
const mockUseAdminPuzzles = vi.fn();
vi.mock("@/hooks/use-admin-puzzles", () => ({
  useAdminPuzzles: (...args: unknown[]) => mockUseAdminPuzzles(...args),
}));

// Mock FlagIcon
vi.mock("@/components/ui/flag-icon", () => ({
  FlagIcon: ({ code }: { code: string }) => (
    <span data-testid={`flag-${code}`}>{code}</span>
  ),
}));

const mockRows: ArchiveRow[] = [
  {
    id: "p1",
    puzzle_date: "2026-01-15",
    game_mode: "career_path",
    status: "live",
    answer: "Lionel Messi",
    answer_qid: "Q11571",
    nationality_code: "AR",
    usage_count: 2,
  },
  {
    id: "p2",
    puzzle_date: "2026-01-14",
    game_mode: "career_path",
    status: "draft",
    answer: "Cristiano Ronaldo",
    answer_qid: "Q11571",
    nationality_code: "PT",
    usage_count: 1,
  },
  {
    id: "p3",
    puzzle_date: null,
    game_mode: "career_path",
    status: "draft",
    answer: "Neymar",
    answer_qid: null,
    nationality_code: null,
    usage_count: 1,
  },
];

describe("PuzzleArchiveTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table headers", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows,
      totalCount: 3,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("Date")).toBeDefined();
    expect(screen.getByText("Answer")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Uses")).toBeDefined();
  });

  it("renders loading state", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      isLoading: true,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders rows with formatted dates", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows,
      totalCount: 3,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("Lionel Messi")).toBeDefined();
    expect(screen.getByText("Cristiano Ronaldo")).toBeDefined();
  });

  it("renders FlagIcon when nationality_code present", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows,
      totalCount: 3,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByTestId("flag-AR")).toBeDefined();
    expect(screen.getByTestId("flag-PT")).toBeDefined();
  });

  it("renders status badges", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows,
      totalCount: 3,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("live")).toBeDefined();
    // Two drafts
    expect(screen.getAllByText("draft")).toHaveLength(2);
  });

  it("renders Backlog badge for null dates", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows,
      totalCount: 3,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("Backlog")).toBeDefined();
  });

  it("renders usage counts", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows.slice(0, 1),
      totalCount: 1,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("2")).toBeDefined();
  });

  it("renders pagination controls", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: mockRows,
      totalCount: 50,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("Previous")).toBeDefined();
    expect(screen.getByText("Next")).toBeDefined();
  });

  it("renders empty state when no rows", () => {
    mockUseAdminPuzzles.mockReturnValue({
      rows: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
    });

    render(<PuzzleArchiveTable gameMode="career_path" />);

    expect(screen.getByText("No puzzles found")).toBeDefined();
  });
});
