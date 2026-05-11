import { describe, it, expect } from "vitest";
import { calculateHigherLowerScore, formatHigherLowerScore } from "../scoring";

describe("calculateHigherLowerScore", () => {
  it("counts correct answers", () => {
    expect(calculateHigherLowerScore([true, true, false, true, false])).toEqual({
      points: 3,
      maxPoints: 10,
      won: false,
    });
  });

  it("marks won=true only when all 10 are correct", () => {
    const tenCorrect = Array(10).fill(true);
    expect(calculateHigherLowerScore(tenCorrect)).toEqual({
      points: 10,
      maxPoints: 10,
      won: true,
    });
  });

  it("handles all-wrong", () => {
    expect(calculateHigherLowerScore(Array(10).fill(false))).toEqual({
      points: 0,
      maxPoints: 10,
      won: false,
    });
  });

  it("uses provided totalRounds for maxPoints + won when puzzle has fewer pairs", () => {
    const eightCorrect = Array(8).fill(true);
    expect(calculateHigherLowerScore(eightCorrect, 8)).toEqual({
      points: 8,
      maxPoints: 8,
      won: true,
    });
  });

  it("won is false when totalRounds is 0", () => {
    expect(calculateHigherLowerScore([], 0)).toEqual({
      points: 0,
      maxPoints: 0,
      won: false,
    });
  });
});

describe("formatHigherLowerScore", () => {
  it("formats as X/Y", () => {
    expect(
      formatHigherLowerScore({ points: 7, maxPoints: 10, won: false })
    ).toBe("7/10");
  });
});
