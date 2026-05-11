import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyPuzzleClient } from "../DailyPuzzleClient";

vi.mock("@/lib/playSession", () => ({
  hasPlayedToday: () => false,
  getPlayResult: () => null,
  copyToClipboard: vi.fn(),
  getConsecutiveStreak: () => 0,
}));

describe("DailyPuzzleClient", () => {
  it("renders the registered game's title in the shell", () => {
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    expect(screen.getByText(/career path/i)).toBeInTheDocument();
  });

  it("falls back to the registry's fallbackContent when content is null", () => {
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    // Fallback puzzle answer is "Bukayo Saka" — Arsenal step is in fallback.
    expect(screen.getByText(/Arsenal/i)).toBeInTheDocument();
  });

  it("returns null for an unregistered mode", () => {
    const { container } = render(
      <DailyPuzzleClient
        mode="not-a-real-mode"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
