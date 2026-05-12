import { describe, it, expect } from "vitest";
import { calculateThreadScore, formatThreadScore } from "../scoring";

describe("calculateThreadScore", () => {
  it("awards 10 points for a 0-hint win", () => {
    const s = calculateThreadScore(2, true, 0);
    expect(s.points).toBe(10);
    expect(s.maxPoints).toBe(10);
    expect(s.won).toBe(true);
  });

  it("decays with each hint: 1→6, 2→4, 3→2", () => {
    expect(calculateThreadScore(2, true, 1).points).toBe(6);
    expect(calculateThreadScore(2, true, 2).points).toBe(4);
    expect(calculateThreadScore(2, true, 3).points).toBe(2);
  });

  it("clamps hint count to [0, 3]", () => {
    expect(calculateThreadScore(2, true, -1).points).toBe(10);
    expect(calculateThreadScore(2, true, 99).points).toBe(2);
    expect(calculateThreadScore(2, true, 99).hintsRevealed).toBe(3);
  });

  it("returns 0 points on a loss regardless of hints", () => {
    expect(calculateThreadScore(0, false, 0).points).toBe(0);
    expect(calculateThreadScore(3, false, 3).points).toBe(0);
  });
});

describe("formatThreadScore", () => {
  it("formats as 'X/10'", () => {
    expect(formatThreadScore({ points: 6, maxPoints: 10, guessCount: 1, won: true, hintsRevealed: 1 })).toBe("6/10");
    expect(formatThreadScore({ points: 0, maxPoints: 10, guessCount: 0, won: false, hintsRevealed: 0 })).toBe("0/10");
  });
});
