import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WhoAmIGame } from "@/components/play/games/who-am-i/WhoAmIGame";
import type { WhoAmIContent } from "@/lib/schemas/puzzle-schemas";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

const fakeContent: WhoAmIContent = {
  clues: [
    { number: 1, text: "Clue one." },
    { number: 2, text: "Clue two." },
    { number: 3, text: "Clue three." },
    { number: 4, text: "Clue four." },
    { number: 5, text: "Clue five." },
  ],
  correct_player_name: "Test Player",
  correct_player_id: "Q123",
};

describe("WhoAmIGame", () => {
  it("renders only the first clue and the search input on mount", () => {
    render(
      <WhoAmIGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText("Clue one.")).toBeInTheDocument();
    expect(screen.queryByText("Clue two.")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search players/i)).toBeInTheDocument();
    expect(screen.getByText(/Clue 1 of 5/i)).toBeInTheDocument();
  });

  it("reveals the next clue when 'Next clue' is clicked", () => {
    render(
      <WhoAmIGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Next clue/i }));
    expect(screen.getByText("Clue two.")).toBeInTheDocument();
    expect(screen.getByText(/Clue 2 of 5/i)).toBeInTheDocument();
  });

  it("swaps Next-clue for Give-up after the last clue is revealed", () => {
    render(
      <WhoAmIGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    const nextBtn = screen.getByRole("button", { name: /Next clue/i });
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(screen.queryByRole("button", { name: /Next clue/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Give up/i })).toBeInTheDocument();
  });
});
