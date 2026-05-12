import { describe, it, expect } from "vitest";
import {
  generateWhoAmIEmojiGrid,
  generateWhoAmIShareText,
} from "../share";
import type { WhoAmIScore } from "../scoring";

const won1: WhoAmIScore = { points: 5, maxPoints: 5, cluesRevealed: 1, won: true };
const won3: WhoAmIScore = { points: 3, maxPoints: 5, cluesRevealed: 3, won: true };
const lost: WhoAmIScore = { points: 0, maxPoints: 5, cluesRevealed: 5, won: false };

describe("generateWhoAmIEmojiGrid", () => {
  it("renders one green winning square + whitespace fillers", () => {
    expect(generateWhoAmIEmojiGrid(won1)).toBe("🟩⬜⬜⬜⬜");
  });

  it("renders yellow for revealed clues before the winning one", () => {
    expect(generateWhoAmIEmojiGrid(won3)).toBe("🟨🟨🟩⬜⬜");
  });

  it("renders all yellows for a loss (no green)", () => {
    expect(generateWhoAmIEmojiGrid(lost)).toBe("🟨🟨🟨🟨🟨");
  });
});

describe("generateWhoAmIShareText", () => {
  it("includes the win headline + score + emoji grid + play URL", () => {
    const text = generateWhoAmIShareText(won3, "2026-05-12");
    expect(text).toContain("after just 3 clues");
    expect(text).toContain("3/5 IQ");
    expect(text).toContain("🟨🟨🟩⬜⬜");
    expect(text).toContain("https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i&date=2026-05-12");
  });

  it("uses singular 'clue' when the player won on clue 1", () => {
    const text = generateWhoAmIShareText(won1, "2026-05-12");
    expect(text).toContain("after just 1 clue!");
    expect(text).not.toContain("1 clues");
  });

  it("uses a stumped headline on a loss", () => {
    const text = generateWhoAmIShareText(lost, "2026-05-12");
    expect(text).toContain("stumped me completely");
    expect(text).toContain("0/5 IQ");
  });

  it("falls back to a no-date URL when puzzleDate is omitted", () => {
    const text = generateWhoAmIShareText(won1);
    expect(text).toContain("Today");
    expect(text).toContain("https://football-iq.app/play/who-am-i?ref=share&mode=who-am-i");
    expect(text).not.toContain("date=");
  });
});
