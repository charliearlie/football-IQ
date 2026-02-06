import { describe, it, expect } from "vitest";
import {
  calculateChainScore,
  formatChainScore,
  getChainScoreEmoji,
  type ChainScore,
} from "../the-chain/scoring";

describe("calculateChainScore", () => {
  describe("winning scenarios", () => {
    it("calculates Eagle score (2 under par)", () => {
      const score = calculateChainScore(3, 5, true);
      expect(score.points).toBe(7);
      expect(score.maxPoints).toBe(7);
      expect(score.stepsTaken).toBe(3);
      expect(score.par).toBe(5);
      expect(score.parDifference).toBe(-2);
      expect(score.completed).toBe(true);
      expect(score.label).toBe("Eagle");
    });

    it("calculates Birdie score (1 under par)", () => {
      const score = calculateChainScore(4, 5, true);
      expect(score.points).toBe(6);
      expect(score.parDifference).toBe(-1);
      expect(score.label).toBe("Birdie");
    });

    it("calculates Par score (exactly at par)", () => {
      const score = calculateChainScore(5, 5, true);
      expect(score.points).toBe(5);
      expect(score.parDifference).toBe(0);
      expect(score.label).toBe("Par");
    });

    it("calculates Bogey score (1 over par)", () => {
      const score = calculateChainScore(6, 5, true);
      expect(score.points).toBe(4);
      expect(score.parDifference).toBe(1);
      expect(score.label).toBe("Bogey");
    });

    it("calculates Double Bogey score (2 over par)", () => {
      const score = calculateChainScore(7, 5, true);
      expect(score.points).toBe(3);
      expect(score.parDifference).toBe(2);
      expect(score.label).toBe("Double Bogey");
    });

    it("calculates Triple Bogey+ for 3+ over par", () => {
      const score = calculateChainScore(8, 5, true);
      expect(score.points).toBe(2);
      expect(score.parDifference).toBe(3);
      expect(score.label).toBe("Triple Bogey+");
    });

    it("calculates Triple Bogey+ for 4 over par", () => {
      const score = calculateChainScore(9, 5, true);
      expect(score.points).toBe(1);
      expect(score.parDifference).toBe(4);
      expect(score.label).toBe("Triple Bogey+");
    });
  });

  describe("floor at zero", () => {
    it("returns 0 points when far over par (5 over)", () => {
      const score = calculateChainScore(10, 5, true);
      expect(score.points).toBe(0);
      expect(score.parDifference).toBe(5);
      expect(score.completed).toBe(true);
    });

    it("returns 0 points when extremely over par", () => {
      const score = calculateChainScore(15, 5, true);
      expect(score.points).toBe(0);
      expect(score.parDifference).toBe(10);
    });

    it("returns 0 points for DNF (Did Not Finish)", () => {
      const score = calculateChainScore(0, 5, false);
      expect(score.points).toBe(0);
      expect(score.completed).toBe(false);
      expect(score.label).toBe("Did Not Finish");
    });

    it("returns 0 points for DNF regardless of steps taken", () => {
      const score = calculateChainScore(3, 5, false);
      expect(score.points).toBe(0);
      expect(score.completed).toBe(false);
      expect(score.label).toBe("Did Not Finish");
    });
  });

  describe("maxPoints calculation", () => {
    it("maxPoints is par + 2 (Eagle maximum) for par 5", () => {
      const score = calculateChainScore(3, 5, true);
      expect(score.maxPoints).toBe(7);
    });

    it("maxPoints is par + 2 for par 3", () => {
      const score = calculateChainScore(1, 3, true);
      expect(score.maxPoints).toBe(5);
    });

    it("maxPoints is par + 2 for par 8", () => {
      const score = calculateChainScore(6, 8, true);
      expect(score.maxPoints).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("handles minimum par (2)", () => {
      const score = calculateChainScore(2, 2, true);
      expect(score.points).toBe(2);
      expect(score.label).toBe("Par");
      expect(score.maxPoints).toBe(4);
    });

    it("handles Eagle on minimum par (2)", () => {
      // Note: 0 steps would be impossible in real game, but testing the math
      const score = calculateChainScore(0, 2, true);
      expect(score.points).toBe(4);
      expect(score.parDifference).toBe(-2);
      expect(score.label).toBe("Eagle");
    });

    it("handles maximum par (10)", () => {
      const score = calculateChainScore(10, 10, true);
      expect(score.points).toBe(10);
      expect(score.label).toBe("Par");
      expect(score.maxPoints).toBe(12);
    });

    it("handles Eagle on maximum par (10)", () => {
      const score = calculateChainScore(8, 10, true);
      expect(score.points).toBe(12);
      expect(score.parDifference).toBe(-2);
      expect(score.label).toBe("Eagle");
    });

    it("handles 1 step on par 3 (Birdie)", () => {
      const score = calculateChainScore(2, 3, true);
      expect(score.points).toBe(4);
      expect(score.parDifference).toBe(-1);
      expect(score.label).toBe("Birdie");
    });

    it("handles exactly 3 under par as Eagle (not better)", () => {
      // Even if 3+ under, label stays Eagle (best possible)
      const score = calculateChainScore(2, 5, true);
      expect(score.points).toBe(8);
      expect(score.parDifference).toBe(-3);
      expect(score.label).toBe("Eagle");
    });
  });

  describe("different par values", () => {
    it("Par 3: Eagle (1 step) = 5 points", () => {
      const score = calculateChainScore(1, 3, true);
      expect(score.points).toBe(5);
      expect(score.label).toBe("Eagle");
    });

    it("Par 4: Par (4 steps) = 4 points", () => {
      const score = calculateChainScore(4, 4, true);
      expect(score.points).toBe(4);
      expect(score.label).toBe("Par");
    });

    it("Par 6: Birdie (5 steps) = 7 points", () => {
      const score = calculateChainScore(5, 6, true);
      expect(score.points).toBe(7);
      expect(score.label).toBe("Birdie");
    });

    it("Par 8: Double Bogey (10 steps) = 6 points", () => {
      const score = calculateChainScore(10, 8, true);
      expect(score.points).toBe(6);
      expect(score.label).toBe("Double Bogey");
    });
  });
});

describe("formatChainScore", () => {
  it("formats Eagle score with negative difference", () => {
    const score: ChainScore = {
      points: 7,
      maxPoints: 7,
      stepsTaken: 3,
      par: 5,
      parDifference: -2,
      completed: true,
      label: "Eagle",
    };
    expect(formatChainScore(score)).toBe("7pts (-2)");
  });

  it("formats Birdie score with negative difference", () => {
    const score: ChainScore = {
      points: 6,
      maxPoints: 7,
      stepsTaken: 4,
      par: 5,
      parDifference: -1,
      completed: true,
      label: "Birdie",
    };
    expect(formatChainScore(score)).toBe("6pts (-1)");
  });

  it("formats Par score with zero difference", () => {
    const score: ChainScore = {
      points: 5,
      maxPoints: 7,
      stepsTaken: 5,
      par: 5,
      parDifference: 0,
      completed: true,
      label: "Par",
    };
    expect(formatChainScore(score)).toBe("5pts (E)");
  });

  it("formats Bogey score with positive difference", () => {
    const score: ChainScore = {
      points: 4,
      maxPoints: 7,
      stepsTaken: 6,
      par: 5,
      parDifference: 1,
      completed: true,
      label: "Bogey",
    };
    expect(formatChainScore(score)).toBe("4pts (+1)");
  });

  it("formats DNF", () => {
    const score: ChainScore = {
      points: 0,
      maxPoints: 7,
      stepsTaken: 0,
      par: 5,
      parDifference: -5,
      completed: false,
      label: "Did Not Finish",
    };
    expect(formatChainScore(score)).toBe("DNF");
  });

  it("formats zero points when completed but far over par", () => {
    const score: ChainScore = {
      points: 0,
      maxPoints: 7,
      stepsTaken: 12,
      par: 5,
      parDifference: 7,
      completed: true,
      label: "Triple Bogey+",
    };
    expect(formatChainScore(score)).toBe("0pts (+7)");
  });
});

describe("getChainScoreEmoji", () => {
  it("returns eagle emoji for Eagle", () => {
    const score: ChainScore = {
      points: 7,
      maxPoints: 7,
      stepsTaken: 3,
      par: 5,
      parDifference: -2,
      completed: true,
      label: "Eagle",
    };
    expect(getChainScoreEmoji(score)).toBe("🦅");
  });

  it("returns bird emoji for Birdie", () => {
    const score: ChainScore = {
      points: 6,
      maxPoints: 7,
      stepsTaken: 4,
      par: 5,
      parDifference: -1,
      completed: true,
      label: "Birdie",
    };
    expect(getChainScoreEmoji(score)).toBe("🐦");
  });

  it("returns flag emoji for Par", () => {
    const score: ChainScore = {
      points: 5,
      maxPoints: 7,
      stepsTaken: 5,
      par: 5,
      parDifference: 0,
      completed: true,
      label: "Par",
    };
    expect(getChainScoreEmoji(score)).toBe("⛳");
  });

  it("returns neutral emoji for Bogey", () => {
    const score: ChainScore = {
      points: 4,
      maxPoints: 7,
      stepsTaken: 6,
      par: 5,
      parDifference: 1,
      completed: true,
      label: "Bogey",
    };
    expect(getChainScoreEmoji(score)).toBe("😐");
  });

  it("returns worried emoji for Double Bogey", () => {
    const score: ChainScore = {
      points: 3,
      maxPoints: 7,
      stepsTaken: 7,
      par: 5,
      parDifference: 2,
      completed: true,
      label: "Double Bogey",
    };
    expect(getChainScoreEmoji(score)).toBe("😟");
  });

  it("returns anxious emoji for Triple Bogey+", () => {
    const score: ChainScore = {
      points: 2,
      maxPoints: 7,
      stepsTaken: 8,
      par: 5,
      parDifference: 3,
      completed: true,
      label: "Triple Bogey+",
    };
    expect(getChainScoreEmoji(score)).toBe("😰");
  });

  it("returns skull for DNF", () => {
    const score: ChainScore = {
      points: 0,
      maxPoints: 7,
      stepsTaken: 0,
      par: 5,
      parDifference: -5,
      completed: false,
      label: "Did Not Finish",
    };
    expect(getChainScoreEmoji(score)).toBe("💀");
  });
});
