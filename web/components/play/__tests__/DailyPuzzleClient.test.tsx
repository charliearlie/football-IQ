import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyPuzzleClient } from "../DailyPuzzleClient";

let premiumState = { ready: true, isPremium: false, source: "fallback" as const };

vi.mock("@/lib/playSession", () => ({
  hasPlayedToday: () => false,
  getPlayResult: () => null,
  copyToClipboard: vi.fn(),
  getConsecutiveStreak: () => 0,
}));

vi.mock("@/lib/billing/usePremium", () => ({
  usePremium: () => premiumState,
}));

vi.mock("@/components/billing/PaywallModal", () => ({
  Paywall: ({ headline }: { headline?: string }) => (
    <div data-testid="paywall-stub">{headline ?? "paywall"}</div>
  ),
}));

describe("DailyPuzzleClient", () => {
  beforeEach(() => {
    premiumState = { ready: true, isPremium: false, source: "fallback" };
  });

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

  it("renders the paywall when the puzzle is flagged premium and the user is free", () => {
    premiumState = { ready: true, isPremium: false, source: "fallback" };
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
        puzzleIsPremium
      />
    );
    expect(screen.getByTestId("paywall-stub")).toBeInTheDocument();
  });

  it("renders the game (not the paywall) for a premium user on a premium puzzle", () => {
    premiumState = { ready: true, isPremium: true, source: "rc" as never };
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
        puzzleIsPremium
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
