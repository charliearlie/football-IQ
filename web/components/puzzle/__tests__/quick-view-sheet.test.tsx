import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QuickViewSheet } from "../quick-view-sheet";
import type { DailyPuzzle } from "@/types/supabase";
import type { CalendarDay } from "@/hooks/use-calendar-data";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";

// ============================================================================
// TEST DATA
// ============================================================================

const mockDay: CalendarDay = {
  date: "2024-01-15",
  totalPopulated: 3,
  isCurrentMonth: true,
  isPast: false,
  isFuture: true,
  isToday: false,
};

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
    created_at: "2024-01-14T10:00:00Z",
    updated_at: "2024-01-14T10:00:00Z",
  },
  {
    id: "puzzle-3",
    puzzle_date: "2024-01-15",
    game_mode: "career_path_pro",
    content: { answer: "Pro Test", career_steps: [] },
    status: "live",
    difficulty: null,
    source: "cms",
    triggered_by: "admin",
    created_at: "2024-01-14T10:00:00Z",
    updated_at: "2024-01-14T10:00:00Z",
  },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  day: mockDay,
  puzzles: mockPuzzles,
  isLoading: false,
  onEditPuzzle: vi.fn(),
};

// ============================================================================
// TESTS
// ============================================================================

describe("QuickViewSheet", () => {
  describe("rendering", () => {
    it("renders sheet when open", () => {
      render(<QuickViewSheet {...defaultProps} />);
      expect(screen.getByText(/monday, january 15, 2024/i)).toBeInTheDocument();
    });

    it("renders nothing when day is null", () => {
      render(<QuickViewSheet {...defaultProps} day={null} />);
      expect(screen.queryByText(/monday, january 15, 2024/i)).not.toBeInTheDocument();
    });

    it("shows puzzle count in description", () => {
      render(<QuickViewSheet {...defaultProps} />);
      expect(screen.getByText(/3 of 8 puzzles populated/i)).toBeInTheDocument();
    });
  });

  describe("game modes list", () => {
    it("renders all game modes", () => {
      render(<QuickViewSheet {...defaultProps} />);

      GAME_MODES.forEach((mode) => {
        expect(screen.getByText(GAME_MODE_DISPLAY_NAMES[mode])).toBeInTheDocument();
      });
    });

    it("shows Live badge for live puzzles", () => {
      render(<QuickViewSheet {...defaultProps} />);
      // 2 live puzzles (career_path and career_path_pro)
      expect(screen.getAllByText("Live").length).toBe(2);
    });

    it("shows Draft badge for draft puzzles", () => {
      render(<QuickViewSheet {...defaultProps} />);
      // 1 draft puzzle (the_grid)
      expect(screen.getAllByText("Draft").length).toBe(1);
    });

    it("shows Empty badge for missing puzzles", () => {
      render(<QuickViewSheet {...defaultProps} />);
      // 8 total modes - 3 populated = 5 empty
      expect(screen.getAllByText("Empty").length).toBe(5);
    });

    it("shows difficulty badge when present", () => {
      render(<QuickViewSheet {...defaultProps} />);
      expect(screen.getByText("medium")).toBeInTheDocument();
      expect(screen.getByText("hard")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows skeletons when loading", () => {
      render(<QuickViewSheet {...defaultProps} isLoading={true} />);
      // Should not show actual game mode names while loading
      expect(screen.queryByText(GAME_MODE_DISPLAY_NAMES.career_path)).not.toBeInTheDocument();
    });
  });

  describe("edit buttons", () => {
    it("renders buttons when onEditPuzzle is provided", () => {
      render(<QuickViewSheet {...defaultProps} />);
      // Should have multiple buttons for game modes
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(8);
    });

    it("calls onEditPuzzle when edit button is clicked", async () => {
      const user = userEvent.setup();
      const onEditPuzzle = vi.fn();
      render(<QuickViewSheet {...defaultProps} onEditPuzzle={onEditPuzzle} />);

      // Find icon buttons (edit or plus)
      const allButtons = screen.getAllByRole("button");
      const iconButtons = allButtons.filter(
        (btn) => btn.querySelector("svg.lucide-pencil") || btn.querySelector("svg.lucide-plus")
      );

      expect(iconButtons.length).toBeGreaterThan(0);
      await user.click(iconButtons[0]);
      expect(onEditPuzzle).toHaveBeenCalled();
    });
  });

  describe("expand/collapse", () => {
    it("expands to show puzzle details on click", async () => {
      const user = userEvent.setup();
      render(<QuickViewSheet {...defaultProps} />);

      // Find the Career Path text and its expand button
      const careerPathText = screen.getByText(GAME_MODE_DISPLAY_NAMES.career_path);
      const expandButton = careerPathText.closest("button");

      expect(expandButton).toBeTruthy();
      if (expandButton) {
        await user.click(expandButton);
        // Should show puzzle ID
        expect(screen.getByText("ID:")).toBeInTheDocument();
      }
    });

    it("shows source in expanded details", async () => {
      const user = userEvent.setup();
      render(<QuickViewSheet {...defaultProps} />);

      const careerPathText = screen.getByText(GAME_MODE_DISPLAY_NAMES.career_path);
      const expandButton = careerPathText.closest("button");

      if (expandButton) {
        await user.click(expandButton);
        expect(screen.getByText("Source:")).toBeInTheDocument();
        expect(screen.getByText("cms")).toBeInTheDocument();
      }
    });

    it("shows content preview in expanded details", async () => {
      const user = userEvent.setup();
      render(<QuickViewSheet {...defaultProps} />);

      const careerPathText = screen.getByText(GAME_MODE_DISPLAY_NAMES.career_path);
      const expandButton = careerPathText.closest("button");

      if (expandButton) {
        await user.click(expandButton);
        expect(screen.getByText("Content Preview:")).toBeInTheDocument();
      }
    });

    it("collapses on second click", async () => {
      const user = userEvent.setup();
      render(<QuickViewSheet {...defaultProps} />);

      const careerPathText = screen.getByText(GAME_MODE_DISPLAY_NAMES.career_path);
      const expandButton = careerPathText.closest("button");

      if (expandButton) {
        // Expand
        await user.click(expandButton);
        expect(screen.getByText("ID:")).toBeInTheDocument();

        // Collapse
        await user.click(expandButton);
        expect(screen.queryByText("ID:")).not.toBeInTheDocument();
      }
    });
  });

  describe("empty state", () => {
    it("shows all modes as Empty when no puzzles", () => {
      render(<QuickViewSheet {...defaultProps} puzzles={[]} />);
      expect(screen.getAllByText("Empty").length).toBe(8);
    });
  });

  describe("triggered_by display", () => {
    it("shows Created by for puzzles with triggered_by", async () => {
      const user = userEvent.setup();
      render(<QuickViewSheet {...defaultProps} />);

      // Expand career_path_pro which has triggered_by
      const proText = screen.getByText(GAME_MODE_DISPLAY_NAMES.career_path_pro);
      const expandButton = proText.closest("button");

      if (expandButton) {
        await user.click(expandButton);
        expect(screen.getByText("Created by:")).toBeInTheDocument();
        expect(screen.getByText("admin")).toBeInTheDocument();
      }
    });
  });
});
