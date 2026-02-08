/**
 * Tests for The Thread Scoring Logic
 *
 * Scoring System (hint-based, 10-point scale):
 * - 0 hints revealed: 10 points
 * - 1 hint revealed:   6 points
 * - 2 hints revealed:  4 points
 * - 3 hints revealed:  2 points
 * - Give up:           0 points
 *
 * Wrong guesses are free — score is purely based on hints revealed.
 */

import {
  calculateThreadScore,
  formatThreadScore,
  generateThreadEmojiGrid,
  ThreadScore,
} from "../scoring";

describe("calculateThreadScore", () => {
  describe("winning scenarios (hint-based)", () => {
    it("returns 10 points for 0 hints revealed", () => {
      const score = calculateThreadScore(1, true, 0);

      expect(score.points).toBe(10);
      expect(score.maxPoints).toBe(10);
      expect(score.guessCount).toBe(1);
      expect(score.won).toBe(true);
      expect(score.hintsRevealed).toBe(0);
    });

    it("returns 6 points for 1 hint revealed", () => {
      const score = calculateThreadScore(2, true, 1);

      expect(score.points).toBe(6);
      expect(score.hintsRevealed).toBe(1);
      expect(score.won).toBe(true);
    });

    it("returns 4 points for 2 hints revealed", () => {
      const score = calculateThreadScore(3, true, 2);

      expect(score.points).toBe(4);
      expect(score.hintsRevealed).toBe(2);
      expect(score.won).toBe(true);
    });

    it("returns 2 points for 3 hints revealed", () => {
      const score = calculateThreadScore(5, true, 3);

      expect(score.points).toBe(2);
      expect(score.hintsRevealed).toBe(3);
      expect(score.won).toBe(true);
    });

    it("score is independent of guess count (guesses are free)", () => {
      const score1 = calculateThreadScore(1, true, 0);
      const score5 = calculateThreadScore(5, true, 0);
      const score10 = calculateThreadScore(10, true, 0);

      expect(score1.points).toBe(10);
      expect(score5.points).toBe(10);
      expect(score10.points).toBe(10);
    });

    it("clamps hintsRevealed to 0-3 range", () => {
      const scoreLow = calculateThreadScore(1, true, -1);
      const scoreHigh = calculateThreadScore(1, true, 5);

      expect(scoreLow.points).toBe(10);
      expect(scoreLow.hintsRevealed).toBe(0);
      expect(scoreHigh.points).toBe(2);
      expect(scoreHigh.hintsRevealed).toBe(3);
    });

    it("defaults hintsRevealed to 0 when not provided", () => {
      const score = calculateThreadScore(1, true);

      expect(score.points).toBe(10);
      expect(score.hintsRevealed).toBe(0);
    });
  });

  describe("losing scenarios (give up)", () => {
    it("returns 0 points when not won (gave up with no guesses)", () => {
      const score = calculateThreadScore(0, false, 0);

      expect(score.points).toBe(0);
      expect(score.guessCount).toBe(0);
      expect(score.won).toBe(false);
    });

    it("returns 0 points when not won (gave up after guesses and hints)", () => {
      const score = calculateThreadScore(3, false, 2);

      expect(score.points).toBe(0);
      expect(score.guessCount).toBe(3);
      expect(score.won).toBe(false);
      expect(score.hintsRevealed).toBe(2);
    });

    it("returns 0 points regardless of hints revealed when not won", () => {
      expect(calculateThreadScore(1, false, 0).points).toBe(0);
      expect(calculateThreadScore(1, false, 1).points).toBe(0);
      expect(calculateThreadScore(1, false, 3).points).toBe(0);
    });
  });

  describe("maxPoints", () => {
    it("always returns 10 as maxPoints regardless of hints", () => {
      expect(calculateThreadScore(1, true, 0).maxPoints).toBe(10);
      expect(calculateThreadScore(3, true, 2).maxPoints).toBe(10);
      expect(calculateThreadScore(1, false, 0).maxPoints).toBe(10);
    });
  });
});

describe("formatThreadScore", () => {
  it('formats perfect score as "10/10"', () => {
    const score: ThreadScore = {
      points: 10,
      maxPoints: 10,
      guessCount: 1,
      won: true,
      hintsRevealed: 0,
    };

    expect(formatThreadScore(score)).toBe("10/10");
  });

  it('formats partial score as "6/10"', () => {
    const score: ThreadScore = {
      points: 6,
      maxPoints: 10,
      guessCount: 3,
      won: true,
      hintsRevealed: 1,
    };

    expect(formatThreadScore(score)).toBe("6/10");
  });

  it('formats give up score as "0/10"', () => {
    const score: ThreadScore = {
      points: 0,
      maxPoints: 10,
      guessCount: 2,
      won: false,
      hintsRevealed: 1,
    };

    expect(formatThreadScore(score)).toBe("0/10");
  });
});

describe("generateThreadEmojiGrid", () => {
  it("returns 3-slot locked grid with Perfect for 0 hints", () => {
    const score: ThreadScore = {
      points: 10,
      maxPoints: 10,
      guessCount: 1,
      won: true,
      hintsRevealed: 0,
    };

    const grid = generateThreadEmojiGrid(score);
    expect(grid).toBe("🧵 🔒🔒🔒 Perfect!");
  });

  it("returns 1 unlocked + 2 locked with Great for 1 hint", () => {
    const score: ThreadScore = {
      points: 6,
      maxPoints: 10,
      guessCount: 2,
      won: true,
      hintsRevealed: 1,
    };

    const grid = generateThreadEmojiGrid(score);
    expect(grid).toBe("🧵 🔓🔒🔒 Great!");
  });

  it("returns 2 unlocked + 1 locked with Good for 2 hints", () => {
    const score: ThreadScore = {
      points: 4,
      maxPoints: 10,
      guessCount: 3,
      won: true,
      hintsRevealed: 2,
    };

    const grid = generateThreadEmojiGrid(score);
    expect(grid).toBe("🧵 🔓🔓🔒 Good!");
  });

  it("returns 3 unlocked with Close for 3 hints", () => {
    const score: ThreadScore = {
      points: 2,
      maxPoints: 10,
      guessCount: 5,
      won: true,
      hintsRevealed: 3,
    };

    const grid = generateThreadEmojiGrid(score);
    expect(grid).toBe("🧵 🔓🔓🔓 Close!");
  });

  it("returns DNF message for give up", () => {
    const score: ThreadScore = {
      points: 0,
      maxPoints: 10,
      guessCount: 2,
      won: false,
      hintsRevealed: 1,
    };

    const grid = generateThreadEmojiGrid(score);
    expect(grid).toBe("🧵 💀 DNF");
  });
});
