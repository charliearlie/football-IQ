import { describe, it, expect } from "vitest";
import {
  generateHigherLowerEmojiGrid,
  generateHigherLowerShareText,
} from "../share";

describe("generateHigherLowerEmojiGrid", () => {
  it("uses ✅ for correct and ❌ for wrong", () => {
    expect(generateHigherLowerEmojiGrid([true, false, true])).toBe("✅❌✅");
  });

  it("returns empty string for no results", () => {
    expect(generateHigherLowerEmojiGrid([])).toBe("");
  });
});

describe("generateHigherLowerShareText", () => {
  it("includes perfect-score phrasing on win and the emoji grid + play URL with date", () => {
    const text = generateHigherLowerShareText(
      { points: 10, maxPoints: 10, won: true },
      Array(10).fill(true),
      "2026-05-11"
    );
    expect(text).toContain("I got a perfect 10 in Higher/Lower!");
    expect(text).toContain("✅".repeat(10));
    expect(text).toContain("10/10 IQ");
    expect(text).toContain(
      "https://football-iq.app/play/higher-lower?ref=share&date=2026-05-11"
    );
  });

  it("uses score phrasing when not a perfect 10", () => {
    const text = generateHigherLowerShareText(
      { points: 7, maxPoints: 10, won: false },
      [true, true, false, true, true, true, false, true, true, false],
      "2026-05-11"
    );
    expect(text).toContain("I scored 7/10 in Higher/Lower!");
    expect(text).toContain("7/10 IQ");
  });
});
