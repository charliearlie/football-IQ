import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TheThreadGame } from "@/components/play/games/the-thread/TheThreadGame";
import type { TheThreadContent } from "@/lib/schemas/puzzle-schemas";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

const fakeContent: TheThreadContent = {
  thread_type: "supplier",
  path: [
    { brand_name: "Umbro", years: "1973-1985", is_hidden: false },
    { brand_name: "Adidas", years: "1985-1996", is_hidden: true },
    { brand_name: "Reebok", years: "1996-2006", is_hidden: false },
    { brand_name: "Adidas", years: "2006-2012", is_hidden: true },
    { brand_name: "Warrior", years: "2012-2015", is_hidden: false },
    { brand_name: "Nike", years: "2020-", is_hidden: true },
  ],
  correct_club_id: "Q1130849",
  correct_club_name: "Liverpool",
  kit_lore: {
    fun_fact: "Liverpool's 2020 Nike deal followed a public lawsuit with New Balance.",
  },
};

describe("TheThreadGame", () => {
  it("renders visible brands and masks hidden ones on mount", () => {
    render(
      <TheThreadGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText("Umbro")).toBeInTheDocument();
    expect(screen.getByText("Reebok")).toBeInTheDocument();
    expect(screen.getByText("Warrior")).toBeInTheDocument();
    // Adidas appears twice in the path but both are hidden — neither rendered.
    expect(screen.queryByText("Adidas")).not.toBeInTheDocument();
    expect(screen.queryByText("Nike")).not.toBeInTheDocument();
    // Three masked cells should show "???".
    expect(screen.getAllByText("???").length).toBe(3);
  });

  it("reveals one hidden brand at a time when 'Reveal hint' is clicked", () => {
    render(
      <TheThreadGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Reveal hint \(0\/3\)/i }));
    // First hidden brand (Adidas at index 1) is now visible.
    expect(screen.getAllByText("Adidas").length).toBe(1);
    expect(screen.getAllByText("???").length).toBe(2);
  });

  it("disables Guess while empty + accepts a correct guess", () => {
    const onComplete = vi.fn();
    render(
      <TheThreadGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={onComplete}
      />
    );
    const submit = screen.getByRole("button", { name: /^Guess$/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Type a club name/i), {
      target: { value: "Liverpool" },
    });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    // On a correct guess all hidden cells unmask, kit lore appears? No —
    // actually we only show kit lore on a LOSS. On a win the orchestrator
    // takes over and shows the share modal. We just verify onComplete fires.
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ won: true, answer: "Liverpool" })
    );
  });
});
