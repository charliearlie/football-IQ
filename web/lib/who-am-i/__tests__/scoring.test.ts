import { describe, it, expect } from "vitest";
import {
  calculateWhoAmIScore,
  formatWhoAmIScore,
  normalizeWhoAmIScore,
} from "../scoring";

describe("calculateWhoAmIScore", () => {
  it("returns max points when guessed on clue 1", () => {
    expect(calculateWhoAmIScore(5, 1, true)).toEqual({
      points: 5,
      maxPoints: 5,
      cluesRevealed: 1,
      won: true,
    });
  });

  it("decrements one point per extra clue revealed", () => {
    expect(calculateWhoAmIScore(5, 2, true).points).toBe(4);
    expect(calculateWhoAmIScore(5, 3, true).points).toBe(3);
    expect(calculateWhoAmIScore(5, 4, true).points).toBe(2);
    expect(calculateWhoAmIScore(5, 5, true).points).toBe(1);
  });

  it("returns 0 points on a loss regardless of clues revealed", () => {
    expect(calculateWhoAmIScore(5, 5, false).points).toBe(0);
    expect(calculateWhoAmIScore(5, 1, false).points).toBe(0);
  });

  it("respects custom totalClues for puzzles with fewer clues", () => {
    expect(calculateWhoAmIScore(3, 1, true).points).toBe(3);
    expect(calculateWhoAmIScore(3, 3, true).points).toBe(1);
  });
});

describe("formatWhoAmIScore", () => {
  it("formats as 'X/Y'", () => {
    expect(formatWhoAmIScore({ points: 4, maxPoints: 5, cluesRevealed: 2, won: true })).toBe("4/5");
    expect(formatWhoAmIScore({ points: 0, maxPoints: 5, cluesRevealed: 5, won: false })).toBe("0/5");
  });
});

describe("normalizeWhoAmIScore", () => {
  it("returns 0-100 ratio rounded", () => {
    expect(normalizeWhoAmIScore({ points: 5, maxPoints: 5, cluesRevealed: 1, won: true })).toBe(100);
    expect(normalizeWhoAmIScore({ points: 3, maxPoints: 5, cluesRevealed: 3, won: true })).toBe(60);
    expect(normalizeWhoAmIScore({ points: 0, maxPoints: 5, cluesRevealed: 5, won: false })).toBe(0);
  });

  it("guards against divide-by-zero", () => {
    expect(normalizeWhoAmIScore({ points: 0, maxPoints: 0, cluesRevealed: 0, won: false })).toBe(0);
  });
});
