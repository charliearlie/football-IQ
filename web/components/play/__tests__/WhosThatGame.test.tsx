import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhosThatGame } from "@/components/play/games/whos-that/WhosThatGame";
import type { WhosThatContent } from "@/lib/whos-that/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: WhosThatContent = {
  answer: {
    player_name: "Mohamed Salah",
    player_id: "Q346551",
    club: "Liverpool",
    league: "Premier League",
    nationality: "Egypt",
    position: "Right Winger",
    birth_year: 1992,
  },
};

describe("WhosThatGame", () => {
  it("renders the player-search input while game is in progress", () => {
    render(
      <WhosThatGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(
      screen.getByPlaceholderText(/Search players/i)
    ).toBeInTheDocument();
  });

  it("shows the guess counter for the first guess", () => {
    render(
      <WhosThatGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Guess 1 of 6/i)).toBeInTheDocument();
  });
});
