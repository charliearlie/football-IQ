import { describe, it, expect } from "vitest";
import { generateThreadEmojiGrid, generateThreadShareText } from "../share";
import type { ThreadScore } from "../scoring";

const perfect: ThreadScore = { points: 10, maxPoints: 10, guessCount: 1, won: true, hintsRevealed: 0 };
const oneHint: ThreadScore = { points: 6, maxPoints: 10, guessCount: 1, won: true, hintsRevealed: 1 };
const allHints: ThreadScore = { points: 2, maxPoints: 10, guessCount: 1, won: true, hintsRevealed: 3 };
const lost: ThreadScore = { points: 0, maxPoints: 10, guessCount: 5, won: false, hintsRevealed: 2 };

describe("generateThreadEmojiGrid", () => {
  it("renders three locks when no hints used", () => {
    expect(generateThreadEmojiGrid(perfect)).toBe("🧵 🔒🔒🔒 Perfect!");
  });

  it("renders one unlock for one hint, two locks remaining", () => {
    expect(generateThreadEmojiGrid(oneHint)).toBe("🧵 🔓🔒🔒 Great!");
  });

  it("renders three unlocks when all hints used", () => {
    expect(generateThreadEmojiGrid(allHints)).toBe("🧵 🔓🔓🔓 Close!");
  });

  it("collapses to a DNF on a loss", () => {
    expect(generateThreadEmojiGrid(lost)).toBe("🧵 💀 DNF");
  });
});

describe("generateThreadShareText", () => {
  it("includes a win headline + emoji grid + score + URL with date", () => {
    const text = generateThreadShareText(perfect, "sponsor", "2026-05-12");
    expect(text).toContain("kit sponsor thread");
    expect(text).toContain("with 0 hints");
    expect(text).toContain("10/10 IQ");
    expect(text).toContain("🧵 🔒🔒🔒 Perfect!");
    expect(text).toContain("https://football-iq.app/play/the-thread?ref=share&date=2026-05-12");
  });

  it("uses 'Kit Supplier' wording for supplier threads", () => {
    const text = generateThreadShareText(oneHint, "supplier", "2026-05-12");
    expect(text).toContain("kit supplier thread");
  });

  it("uses singular 'hint' when exactly 1 hint revealed", () => {
    const text = generateThreadShareText(oneHint, "sponsor", "2026-05-12");
    expect(text).toContain("with 1 hint");
    expect(text).not.toContain("1 hints");
  });

  it("uses a stumped headline on a loss", () => {
    const text = generateThreadShareText(lost, "sponsor", "2026-05-12");
    expect(text).toContain("had me stumped");
    expect(text).toContain("0/10 IQ");
  });

  it("falls back to a no-date URL when puzzleDate is omitted", () => {
    const text = generateThreadShareText(perfect, "sponsor");
    expect(text).toContain("https://football-iq.app/play/the-thread?ref=share");
    expect(text).not.toContain("date=");
  });
});
