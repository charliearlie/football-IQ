import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HigherLowerGame } from "@/components/play/games/higher-lower/HigherLowerGame";
import type { HigherLowerContent } from "@/lib/higher-lower/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: HigherLowerContent = {
  players: [
    { name: "Neymar", context: "Barcelona → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 222 },
    { name: "Mbappé", context: "Monaco → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 180 },
    { name: "Coutinho", context: "Liverpool → Barcelona", statLabel: "Transfer Fee", statType: "transfer_fee", value: 145 },
  ],
};

describe("HigherLowerGame", () => {
  it("renders the round counter and first round's player cards", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Round 1 of/i)).toBeInTheDocument();
    expect(screen.getByText("Neymar")).toBeInTheDocument();
    expect(screen.getByText("Mbappé")).toBeInTheDocument();
  });

  it("shows higher/lower buttons before an answer is submitted", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /^Higher$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Lower$/i })).toBeInTheDocument();
  });

  it("hides the second player's stat value until an answer is submitted", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    // Neymar's value is shown
    expect(screen.getByText("€222m")).toBeInTheDocument();
    // Mbappé's value is hidden behind "?"
    expect(screen.queryByText("€180m")).not.toBeInTheDocument();
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("reveals the second player's stat and shows a next-round button after an answer", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^Lower$/i }));
    expect(screen.getByText("€180m")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next round/i })).toBeInTheDocument();
  });
});
