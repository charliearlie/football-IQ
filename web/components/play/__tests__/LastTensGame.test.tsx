import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LastTensGame } from "@/components/play/games/last-tens/LastTensGame";
import type { TopTensContent } from "@/lib/top-tens/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: TopTensContent = {
  title: "Last 10 Premier League Golden Boot Winners",
  category: "Premier League",
  answers: [
    { name: "Erling Haaland", aliases: ["Haaland"], info: "2023-24", alternates: [] },
    { name: "Erling Haaland", aliases: ["Haaland"], info: "2022-23", alternates: [] },
    { name: "Mohamed Salah", aliases: ["Salah"], info: "2021-22", alternates: [] },
    { name: "Harry Kane", aliases: ["Kane"], info: "2020-21", alternates: [] },
    { name: "Jamie Vardy", aliases: ["Vardy"], info: "2019-20", alternates: [] },
    { name: "Mohamed Salah", aliases: ["Salah"], info: "2018-19", alternates: [] },
    { name: "Mohamed Salah", aliases: ["Salah"], info: "2017-18", alternates: [] },
    { name: "Harry Kane", aliases: ["Kane"], info: "2016-17", alternates: [] },
    { name: "Harry Kane", aliases: ["Kane"], info: "2015-16", alternates: [] },
    { name: "Sergio Agüero", aliases: ["Aguero"], info: "2014-15", alternates: [] },
  ],
};

describe("LastTensGame", () => {
  it("renders the title, 10 ranked slots, and the guess input (Top Tens engine)", () => {
    render(
      <LastTensGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Last 10 Premier League/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a name/i)).toBeInTheDocument();
    for (let n = 1; n <= 10; n++) {
      expect(screen.getByText(String(n))).toBeInTheDocument();
    }
  });

  it("threads correct guess into the slot when player matches", () => {
    render(
      <LastTensGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/Type a name/i), {
      target: { value: "Haaland" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/i }));
    expect(screen.getAllByText("Erling Haaland").length).toBeGreaterThan(0);
  });
});
