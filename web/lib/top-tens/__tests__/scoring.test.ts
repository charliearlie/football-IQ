import { describe, it, expect } from "vitest";
import {
  calculateTopTensScore,
  formatTopTensScore,
  getScoreProgression,
  MAX_POINTS,
} from "../scoring";

describe("calculateTopTensScore", () => {
  it("returns 0 points for 0 found", () => {
    expect(calculateTopTensScore(0, 0, false).points).toBe(0);
  });
  it("returns 1 point for 1-2 found", () => {
    expect(calculateTopTensScore(1, 0, false).points).toBe(1);
    expect(calculateTopTensScore(2, 0, false).points).toBe(1);
  });
  it("returns 2 points for 3-4 found", () => {
    expect(calculateTopTensScore(3, 0, false).points).toBe(2);
    expect(calculateTopTensScore(4, 0, false).points).toBe(2);
  });
  it("returns 3 points for 5-6 found", () => {
    expect(calculateTopTensScore(5, 0, false).points).toBe(3);
    expect(calculateTopTensScore(6, 0, false).points).toBe(3);
  });
  it("returns 4 points for 7-8 found", () => {
    expect(calculateTopTensScore(7, 0, false).points).toBe(4);
    expect(calculateTopTensScore(8, 0, false).points).toBe(4);
  });
  it("returns 5 points for 9 found", () => {
    expect(calculateTopTensScore(9, 0, false).points).toBe(5);
  });
  it("returns the jackpot 8 points for all 10 found", () => {
    expect(calculateTopTensScore(10, 0, true).points).toBe(8);
  });
  it("preserves foundCount, wrongGuessCount, and won in the result", () => {
    expect(calculateTopTensScore(7, 3, false)).toEqual({
      points: 4,
      maxPoints: 8,
      foundCount: 7,
      wrongGuessCount: 3,
      won: false,
    });
  });
  it("exports MAX_POINTS = 8", () => {
    expect(MAX_POINTS).toBe(8);
  });
});

describe("formatTopTensScore", () => {
  it("formats as X/Y", () => {
    expect(
      formatTopTensScore({
        points: 4,
        maxPoints: 8,
        foundCount: 7,
        wrongGuessCount: 0,
        won: false,
      })
    ).toBe("4/8");
  });
});

describe("getScoreProgression", () => {
  it("returns the flat tier ladder", () => {
    expect(getScoreProgression()).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 8]);
  });
});
