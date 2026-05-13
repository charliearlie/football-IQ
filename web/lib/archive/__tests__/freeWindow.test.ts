import { describe, it, expect } from "vitest";
import {
  isWithinFreeWindow,
  isPuzzleLocked,
  FREE_WINDOW_DAYS,
} from "@/lib/archive/freeWindow";

const TODAY = "2026-05-13";
const YESTERDAY = "2026-05-12";
const TWO_DAYS_AGO = "2026-05-11";
const THREE_DAYS_AGO = "2026-05-10";
const A_WEEK_AGO = "2026-05-06";
const TOMORROW = "2026-05-14";

describe("isWithinFreeWindow", () => {
  it("counts today as in-window", () => {
    expect(isWithinFreeWindow(TODAY, TODAY)).toBe(true);
  });

  it("counts yesterday as in-window", () => {
    expect(isWithinFreeWindow(YESTERDAY, TODAY)).toBe(true);
  });

  it("counts two days ago as in-window (free window is 3 days)", () => {
    expect(isWithinFreeWindow(TWO_DAYS_AGO, TODAY)).toBe(true);
  });

  it("rejects three days ago — that's the first locked day", () => {
    expect(isWithinFreeWindow(THREE_DAYS_AGO, TODAY)).toBe(false);
  });

  it("rejects a week ago", () => {
    expect(isWithinFreeWindow(A_WEEK_AGO, TODAY)).toBe(false);
  });

  it("rejects future dates (clock skew safety)", () => {
    expect(isWithinFreeWindow(TOMORROW, TODAY)).toBe(false);
  });

  it("respects a custom window size", () => {
    expect(isWithinFreeWindow(A_WEEK_AGO, TODAY, 14)).toBe(true);
  });

  it("rejects malformed dates rather than crashing", () => {
    expect(isWithinFreeWindow("not-a-date", TODAY)).toBe(false);
  });

  it("exports a window default of 3 days", () => {
    expect(FREE_WINDOW_DAYS).toBe(3);
  });
});

describe("isPuzzleLocked", () => {
  it("locks an old puzzle for a free user", () => {
    expect(
      isPuzzleLocked({ puzzleDate: A_WEEK_AGO, isPremium: false, today: TODAY }),
    ).toBe(true);
  });

  it("unlocks an old puzzle for a premium user", () => {
    expect(
      isPuzzleLocked({ puzzleDate: A_WEEK_AGO, isPremium: true, today: TODAY }),
    ).toBe(false);
  });

  it("unlocks a recent puzzle for a free user (free window)", () => {
    expect(
      isPuzzleLocked({ puzzleDate: YESTERDAY, isPremium: false, today: TODAY }),
    ).toBe(false);
  });

  it("never locks a puzzle the user has already completed", () => {
    expect(
      isPuzzleLocked({
        puzzleDate: A_WEEK_AGO,
        isPremium: false,
        today: TODAY,
        hasCompletedAttempt: true,
      }),
    ).toBe(false);
  });
});
