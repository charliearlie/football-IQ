import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CareerPathProGame } from "@/components/play/games/career-path-pro/CareerPathProGame";
import type { CareerPathContent } from "@/lib/schemas/puzzle-schemas";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: CareerPathContent = {
  answer: "Cristiano Ronaldo",
  career_steps: [
    { type: "club", text: "Sporting CP", year: "2002-2003", apps: 25, goals: 5 },
    { type: "club", text: "Manchester United", year: "2003-2009", apps: 196, goals: 84 },
    { type: "club", text: "Real Madrid", year: "2009-2018", apps: 292, goals: 311 },
    { type: "club", text: "Juventus", year: "2018-2021", apps: 98, goals: 81 },
    { type: "club", text: "Manchester United", year: "2021-2022", apps: 41, goals: 18 },
    { type: "club", text: "Al-Nassr", year: "2023-present", apps: 60, goals: 50 },
    { type: "club", text: "Sporting CP Academy", year: "1997-2002" },
    { type: "club", text: "Andorinha (youth)", year: "1992-1995" },
  ],
};

describe("CareerPathProGame", () => {
  it("renders the Career Path engine with the 8-step Pro chain", () => {
    render(
      <CareerPathProGame
        content={fakeContent}
        puzzleDate="2026-05-12"
        onComplete={vi.fn()}
      />
    );
    // Step counter reflects an 8-step chain
    expect(screen.getByText(/Step 1 of 8/i)).toBeInTheDocument();
    // Only step 1 (Sporting CP) is visible on mount
    expect(screen.getByText("Sporting CP")).toBeInTheDocument();
  });
});
