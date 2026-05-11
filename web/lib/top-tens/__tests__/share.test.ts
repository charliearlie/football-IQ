import { describe, it, expect } from "vitest";
import { generateTopTensShareText } from "../share";
import type { RankSlotState, TopTensScore } from "../types";

const playedSlots: RankSlotState[] = Array.from({ length: 10 }, (_, i) => ({
  rank: i + 1,
  found: i < 4,
  autoRevealed: i >= 4,
  answer: { name: `Player ${i + 1}` },
}));

describe("generateTopTensShareText", () => {
  it("renders ✅ for found and ⬜ for unfound, plus the title and play URL", () => {
    const score: TopTensScore = { points: 2, maxPoints: 8, foundCount: 4, wrongGuessCount: 1, won: false };
    const text = generateTopTensShareText(
      "Top 10 PL Goalscorers",
      playedSlots,
      score,
      "2026-05-11"
    );
    expect(text).toContain("Top 10 PL Goalscorers");
    expect(text).toContain("✅✅✅✅⬜⬜⬜⬜⬜⬜");
    expect(text).toContain("4/10 found");
    expect(text).toContain("2/8 IQ");
    expect(text).toContain("https://football-iq.app/play/top-tens?ref=share&date=2026-05-11");
  });

  it("uses Jackpot phrasing when won", () => {
    const allFound: RankSlotState[] = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      found: true,
      autoRevealed: false,
      answer: { name: `Player ${i + 1}` },
    }));
    const score: TopTensScore = { points: 8, maxPoints: 8, foundCount: 10, wrongGuessCount: 0, won: true };
    const text = generateTopTensShareText("Top 10 Test", allFound, score, "2026-05-11");
    expect(text).toContain("Jackpot!");
    expect(text).toContain("✅".repeat(10));
    expect(text).toContain("8/8 IQ");
  });
});
