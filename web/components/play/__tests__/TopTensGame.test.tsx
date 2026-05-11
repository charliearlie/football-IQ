import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopTensGame } from "@/components/play/games/top-tens/TopTensGame";
import type { TopTensContent } from "@/lib/top-tens/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: TopTensContent = {
  title: "Top 10 Premier League All-Time Goalscorers",
  category: "Premier League",
  answers: [
    { name: "Alan Shearer", aliases: ["Shearer"], info: "260 goals" },
    { name: "Harry Kane", aliases: ["Kane"], info: "213 goals" },
    { name: "Wayne Rooney", aliases: ["Rooney"], info: "208 goals" },
    { name: "Andy Cole", aliases: [], info: "187 goals" },
    { name: "Sergio Agüero", aliases: ["Aguero"], info: "184 goals" },
    { name: "Frank Lampard", aliases: [], info: "177 goals" },
    { name: "Thierry Henry", aliases: ["Henry"], info: "175 goals" },
    { name: "Mohamed Salah", aliases: ["Salah"], info: "169 goals" },
    { name: "Robbie Fowler", aliases: [], info: "163 goals" },
    { name: "Jermain Defoe", aliases: ["Defoe"], info: "162 goals" },
  ],
};

describe("TopTensGame", () => {
  it("renders the title, 10 ranked slots, and the guess input", () => {
    render(
      <TopTensGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Top 10 Premier League/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a name/i)).toBeInTheDocument();
    // Each rank number 1-10 should be visible
    for (let n = 1; n <= 10; n++) {
      expect(screen.getByText(String(n))).toBeInTheDocument();
    }
  });

  it("reveals a slot on a correct guess and disables Submit when input is empty", () => {
    render(
      <TopTensGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    const submit = screen.getByRole("button", { name: /^Submit$/i });
    expect(submit).toBeDisabled();

    const input = screen.getByPlaceholderText(/Type a name/i);
    fireEvent.change(input, { target: { value: "Shearer" } });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    expect(screen.getByText("Alan Shearer")).toBeInTheDocument();
  });

  it("shows the found/wrong counter", () => {
    render(
      <TopTensGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Found 0\/10/)).toBeInTheDocument();
  });
});
