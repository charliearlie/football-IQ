import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PuzzleEditorModal } from "../puzzle-editor-modal";
import type { DailyPuzzle } from "@/types/supabase";
import type { GameMode } from "@/lib/constants";

// Mock the server actions
vi.mock("@/app/(dashboard)/calendar/actions", () => ({
  upsertPuzzle: vi.fn(),
  copyFromPreviousDay: vi.fn(),
}));

import { upsertPuzzle, copyFromPreviousDay } from "@/app/(dashboard)/calendar/actions";

// ============================================================================
// TEST DATA
// ============================================================================

const mockPuzzle: DailyPuzzle = {
  id: "test-puzzle-id",
  puzzle_date: "2024-01-15",
  game_mode: "career_path",
  content: {
    answer: "Ronaldo",
    career_steps: [
      { type: "club", text: "Sporting CP", year: "2002", apps: null, goals: null },
      { type: "club", text: "Manchester United", year: "2003", apps: null, goals: null },
      { type: "club", text: "Real Madrid", year: "2009", apps: null, goals: null },
    ],
  },
  status: "draft",
  difficulty: "medium",
  source: "cms",
  triggered_by: null,
  created_at: "2024-01-14T10:00:00Z",
  updated_at: "2024-01-14T10:00:00Z",
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  puzzleDate: "2024-01-15",
  gameMode: "career_path" as GameMode,
  puzzle: null,
  onSaveSuccess: vi.fn(),
};

// ============================================================================
// TESTS
// ============================================================================

describe("PuzzleEditorModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders modal when open", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByText(/create career path/i)).toBeInTheDocument();
    });

    it("does not render content when closed", () => {
      render(<PuzzleEditorModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText(/create career path/i)).not.toBeInTheDocument();
    });

    it("shows 'Create' for new puzzle", () => {
      render(<PuzzleEditorModal {...defaultProps} puzzle={null} />);
      expect(screen.getByText(/create career path/i)).toBeInTheDocument();
    });

    it("shows 'Edit' for existing puzzle", () => {
      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} />);
      expect(screen.getByText(/edit career path/i)).toBeInTheDocument();
    });

    it("shows formatted date", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByText(/monday, jan 15, 2024/i)).toBeInTheDocument();
    });
  });

  describe("form rendering by game mode", () => {
    it("renders dialog for career_path", () => {
      render(<PuzzleEditorModal {...defaultProps} gameMode="career_path" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders dialog for the_grid", () => {
      render(<PuzzleEditorModal {...defaultProps} gameMode="the_grid" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders dialog for guess_the_transfer", () => {
      render(<PuzzleEditorModal {...defaultProps} gameMode="guess_the_transfer" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders dialog for top_tens", () => {
      render(<PuzzleEditorModal {...defaultProps} gameMode="top_tens" />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("difficulty selector", () => {
    it("renders difficulty dropdown", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByText("Difficulty")).toBeInTheDocument();
    });
  });

  describe("status display", () => {
    it("shows Draft status for new puzzle", () => {
      render(<PuzzleEditorModal {...defaultProps} puzzle={null} />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("shows Live status for live puzzle", () => {
      const livePuzzle = { ...mockPuzzle, status: "live" as const };
      render(<PuzzleEditorModal {...defaultProps} puzzle={livePuzzle} />);
      expect(screen.getByText("Live")).toBeInTheDocument();
    });
  });

  describe("buttons", () => {
    it("renders Cancel button", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("renders Save Draft button", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
    });

    it("renders Publish button", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();
    });

    it("renders Copy Yesterday button", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByRole("button", { name: /copy yesterday/i })).toBeInTheDocument();
    });
  });

  describe("cancel button", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<PuzzleEditorModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("save functionality", () => {
    it("calls upsertPuzzle with draft status when Save Draft is clicked", async () => {
      const user = userEvent.setup();
      (upsertPuzzle as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockPuzzle,
      });

      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} />);

      await user.click(screen.getByRole("button", { name: /save draft/i }));

      await waitFor(() => {
        expect(upsertPuzzle).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "draft",
            game_mode: "career_path",
            puzzle_date: "2024-01-15",
          })
        );
      });
    });

    it("calls upsertPuzzle with live status when Publish is clicked", async () => {
      const user = userEvent.setup();
      (upsertPuzzle as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockPuzzle,
      });

      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} />);

      await user.click(screen.getByRole("button", { name: /publish/i }));

      await waitFor(() => {
        expect(upsertPuzzle).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "live",
          })
        );
      });
    });

    it("calls onSaveSuccess after successful save", async () => {
      const user = userEvent.setup();
      const onSaveSuccess = vi.fn();
      (upsertPuzzle as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockPuzzle,
      });

      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} onSaveSuccess={onSaveSuccess} />);

      await user.click(screen.getByRole("button", { name: /save draft/i }));

      await waitFor(() => {
        expect(onSaveSuccess).toHaveBeenCalledWith(mockPuzzle);
      });
    });

    it("displays error message on save failure", async () => {
      const user = userEvent.setup();
      (upsertPuzzle as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Failed to save puzzle",
      });

      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} />);

      await user.click(screen.getByRole("button", { name: /save draft/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save puzzle/i)).toBeInTheDocument();
      });
    });
  });

  describe("copy from yesterday", () => {
    it("calls copyFromPreviousDay when Copy Yesterday is clicked", async () => {
      const user = userEvent.setup();
      (copyFromPreviousDay as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { content: mockPuzzle.content, difficulty: "hard" },
      });

      render(<PuzzleEditorModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /copy yesterday/i }));

      await waitFor(() => {
        expect(copyFromPreviousDay).toHaveBeenCalledWith("2024-01-14", "career_path");
      });
    });

    it("displays error on copy failure", async () => {
      const user = userEvent.setup();
      (copyFromPreviousDay as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "No puzzle found for previous day",
      });

      render(<PuzzleEditorModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /copy yesterday/i }));

      await waitFor(() => {
        expect(screen.getByText(/no puzzle found for previous day/i)).toBeInTheDocument();
      });
    });
  });

  describe("live preview", () => {
    it("shows Live Preview section", () => {
      render(<PuzzleEditorModal {...defaultProps} />);
      expect(screen.getByText("Live Preview")).toBeInTheDocument();
    });
  });

  describe("form population", () => {
    it("populates form with existing puzzle data", () => {
      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} />);
      expect(screen.getByDisplayValue("Ronaldo")).toBeInTheDocument();
    });

    it("populates career steps from existing puzzle", () => {
      render(<PuzzleEditorModal {...defaultProps} puzzle={mockPuzzle} />);
      expect(screen.getByDisplayValue("Sporting CP")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Manchester United")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Real Madrid")).toBeInTheDocument();
    });
  });
});
