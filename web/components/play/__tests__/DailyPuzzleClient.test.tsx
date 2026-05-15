import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyPuzzleClient } from "../DailyPuzzleClient";

let premiumState = { ready: true, isPremium: false, source: "fallback" as const };
let dateInFreeWindow = true;

vi.mock("@/lib/playSession", () => ({
  hasPlayedToday: () => false,
  getPlayResult: () => null,
  copyToClipboard: vi.fn(),
  getConsecutiveStreak: () => 0,
}));

vi.mock("@/lib/billing/usePremium", () => ({
  usePremium: () => premiumState,
}));

vi.mock("@/lib/archive/freeWindow", () => ({
  isWithinFreeWindow: () => dateInFreeWindow,
}));

vi.mock("@/components/billing/PaywallModal", () => ({
  Paywall: ({ headline, source }: { headline?: string; source?: string }) => (
    <div data-testid="paywall-stub" data-source={source}>
      {headline ?? "paywall"}
    </div>
  ),
}));

describe("DailyPuzzleClient", () => {
  beforeEach(() => {
    premiumState = { ready: true, isPremium: false, source: "fallback" };
    dateInFreeWindow = true;
  });

  it("renders the registered game's title in the shell", () => {
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    expect(screen.getByRole("heading", { name: /career path/i })).toBeInTheDocument();
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

  it("renders the paywall when the puzzle is outside the free window for a free user", () => {
    dateInFreeWindow = false;
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-04-01"
      />
    );
    expect(screen.getByTestId("paywall-stub")).toHaveAttribute(
      "data-source",
      "archive_career-path",
    );
  });

  it("renders the archive game for a premium user even outside the free window", () => {
    dateInFreeWindow = false;
    premiumState = { ready: true, isPremium: true, source: "rc" as never };
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-04-01"
      />
    );
    expect(screen.getByText(/Arsenal/i)).toBeInTheDocument();
  });

  it("never shows the paywall when the subscriptions flag is off", () => {
    delete process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED;
    dateInFreeWindow = false;
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-04-01"
        puzzleIsPremium
      />
    );
    // Flag off → game renders even though it's a premium, out-of-window puzzle.
    expect(screen.queryByTestId("paywall-stub")).not.toBeInTheDocument();
    expect(screen.getByText(/Arsenal/i)).toBeInTheDocument();
    process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED = "true";
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
