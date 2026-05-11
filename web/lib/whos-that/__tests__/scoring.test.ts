import { describe, it, expect } from "vitest";
import { calculateWhosThatScore, formatWhosThatScore } from "../scoring";

describe("calculateWhosThatScore", () => {
  it("awards 6 points for getting it on attempt 1", () => {
    expect(calculateWhosThatScore(1, true)).toEqual({
      points: 6, maxPoints: 6, guessCount: 1, won: true,
    });
  });
  it("awards 1 point for getting it on the last (6th) attempt", () => {
    expect(calculateWhosThatScore(6, true).points).toBe(1);
  });
  it("awards 0 points when the player loses", () => {
    expect(calculateWhosThatScore(6, false).points).toBe(0);
  });
});

describe("formatWhosThatScore", () => {
  it("formats as X/Y", () => {
    expect(formatWhosThatScore({ points: 4, maxPoints: 6, guessCount: 3, won: true })).toBe("4/6");
  });
});
