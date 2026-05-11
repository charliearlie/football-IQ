import { describe, it, expect } from "vitest";
import { generateWhosThatEmojiGrid, generateWhosThatShareText } from "../share";
import type { GuessFeedback } from "../types";

const sampleGuess: GuessFeedback = {
  playerName: "Sadio Mane",
  club: { value: "Al-Nassr", color: "red" },
  league: { value: "Saudi Pro League", color: "red" },
  nationality: { value: "Senegal", color: "yellow" },
  position: { value: "Left Winger", color: "yellow" },
  birthYear: { value: "1992", color: "green" },
};

describe("generateWhosThatEmojiGrid", () => {
  it("renders one row of 5 colour squares per guess", () => {
    const grid = generateWhosThatEmojiGrid([sampleGuess]);
    expect(grid).toBe("🟥🟥🟨🟨🟩");
  });

  it("joins multiple rows with newlines", () => {
    const grid = generateWhosThatEmojiGrid([sampleGuess, sampleGuess]);
    expect(grid).toBe("🟥🟥🟨🟨🟩\n🟥🟥🟨🟨🟩");
  });
});

describe("generateWhosThatShareText", () => {
  it("includes brand header, score, emoji grid, and play URL", () => {
    const text = generateWhosThatShareText(
      { points: 5, maxPoints: 6, guessCount: 2, won: true },
      [sampleGuess],
      "2026-05-10"
    );
    expect(text).toContain("Football IQ — Who's That?");
    expect(text).toContain("Got it in 2/6 guesses");
    expect(text).toContain("🟥🟥🟨🟨🟩");
    expect(text).toContain("5/6 IQ");
    expect(text).toContain("https://football-iq.app/play/whos-that?ref=share&mode=whos-that&date=2026-05-10");
  });

  it("uses 'Got it in one!' phrasing for a single-guess win", () => {
    const text = generateWhosThatShareText(
      { points: 6, maxPoints: 6, guessCount: 1, won: true },
      [sampleGuess]
    );
    expect(text).toContain("Got it in one!");
  });

  it("uses loss phrasing when the player did not win", () => {
    const text = generateWhosThatShareText(
      { points: 0, maxPoints: 6, guessCount: 6, won: false },
      [sampleGuess]
    );
    expect(text).toContain("Couldn't crack it in 6 tries");
  });
});
