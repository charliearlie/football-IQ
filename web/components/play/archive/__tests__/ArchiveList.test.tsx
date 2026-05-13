import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let premiumState = { ready: true, isPremium: false, source: "fallback" as const };

vi.mock("@/lib/billing/usePremium", () => ({
  usePremium: () => premiumState,
}));

import { ArchiveList } from "@/components/play/archive/ArchiveList";

const TODAY = "2026-05-13";

describe("ArchiveList", () => {
  beforeEach(() => {
    premiumState = { ready: true, isPremium: false, source: "fallback" };
  });

  it("groups entries by month and labels each group", () => {
    render(
      <ArchiveList
        modeSlug="career-path"
        accentColor="#2EFC5D"
        today={TODAY}
        entries={[
          { date: "2026-05-13", isPremium: false },
          { date: "2026-05-01", isPremium: false },
          { date: "2026-04-20", isPremium: false },
        ]}
      />
    );
    expect(screen.getByText("May 2026")).toBeInTheDocument();
    expect(screen.getByText("April 2026")).toBeInTheDocument();
  });

  it("renders an empty state when there are no entries", () => {
    render(
      <ArchiveList
        modeSlug="career-path"
        accentColor="#2EFC5D"
        today={TODAY}
        entries={[]}
      />
    );
    expect(screen.getByText(/no archived puzzles/i)).toBeInTheDocument();
  });

  it("marks days outside the free window as PRO for free users", () => {
    render(
      <ArchiveList
        modeSlug="career-path"
        accentColor="#2EFC5D"
        today={TODAY}
        entries={[
          { date: "2026-05-13", isPremium: false }, // today
          { date: "2026-05-12", isPremium: false }, // in free window
          { date: "2026-05-01", isPremium: false }, // locked
        ]}
      />
    );
    // Only the locked day gets a PRO pill — there should be exactly 1.
    expect(screen.getAllByText("PRO")).toHaveLength(1);
  });

  it("never shows a PRO pill for premium users", () => {
    premiumState = { ready: true, isPremium: true, source: "rc" as never };
    render(
      <ArchiveList
        modeSlug="career-path"
        accentColor="#2EFC5D"
        today={TODAY}
        entries={[
          { date: "2026-05-13", isPremium: false },
          { date: "2026-05-01", isPremium: false },
          { date: "2026-04-20", isPremium: true },
        ]}
      />
    );
    expect(screen.queryByText("PRO")).not.toBeInTheDocument();
  });

  it("highlights today's puzzle with a Play today CTA", () => {
    render(
      <ArchiveList
        modeSlug="career-path"
        accentColor="#2EFC5D"
        today={TODAY}
        entries={[
          { date: TODAY, isPremium: false },
          { date: "2026-05-12", isPremium: false },
        ]}
      />
    );
    expect(screen.getByText(/play today/i)).toBeInTheDocument();
  });
});
