import { describe, it, expect } from "vitest";
import { findMatchingAnswer, StringMatcher } from "../validation";
import type { RankIndex } from "../types";
import type { TopTenAnswer } from "@/lib/schemas/puzzle-schemas";

const answers: TopTenAnswer[] = [
  { name: "Alan Shearer", aliases: ["Shearer"], info: "260 goals" },
  { name: "Harry Kane", aliases: ["Kane"], info: "213 goals" },
  { name: "Wayne Rooney", aliases: ["Rooney"], info: "208 goals" },
  { name: "Andy Cole", aliases: ["Andrew Cole", "Cole"], info: "187 goals" },
  { name: "Sergio Agüero", aliases: ["Aguero", "Sergio Aguero"], info: "184 goals" },
  { name: "Frank Lampard", aliases: ["Lampard"], info: "177 goals" },
  { name: "Thierry Henry", aliases: ["Henry"], info: "175 goals" },
  { name: "Mohamed Salah", aliases: ["Salah"], info: "169 goals" },
  { name: "Robbie Fowler", aliases: ["Fowler"], info: "163 goals" },
  {
    name: "Jermain Defoe",
    aliases: ["Defoe"],
    info: "162 goals",
    alternates: [
      { name: "Michael Owen", aliases: ["Owen"], info: "150 goals" },
    ],
  },
];

describe("findMatchingAnswer", () => {
  it("matches by primary name (case-insensitive, trimmed)", () => {
    const res = findMatchingAnswer("alan shearer", answers, new Set());
    expect(res.isMatch).toBe(true);
    expect(res.matchedIndex).toBe(0);
    expect(res.displayName).toBe("Alan Shearer");
  });

  it("matches by alias", () => {
    const res = findMatchingAnswer("Kane", answers, new Set());
    expect(res.isMatch).toBe(true);
    expect(res.matchedIndex).toBe(1);
  });

  it("tolerates accent differences (Aguero matches Agüero)", () => {
    const res = findMatchingAnswer("Aguero", answers, new Set());
    expect(res.isMatch).toBe(true);
    expect(res.matchedIndex).toBe(4);
  });

  it("returns no match for empty / whitespace", () => {
    expect(findMatchingAnswer("", answers, new Set()).isMatch).toBe(false);
    expect(findMatchingAnswer("   ", answers, new Set()).isMatch).toBe(false);
  });

  it("returns no match for an unknown player", () => {
    expect(findMatchingAnswer("Cristiano Ronaldo", answers, new Set()).isMatch).toBe(false);
  });

  it("skips indices already found", () => {
    const alreadyFound = new Set<RankIndex>([0 as RankIndex]);
    const res = findMatchingAnswer("Shearer", answers, alreadyFound);
    expect(res.isMatch).toBe(false);
  });

  it("matches a rank-10 alternate (joint 10th)", () => {
    const res = findMatchingAnswer("Michael Owen", answers, new Set());
    expect(res.isMatch).toBe(true);
    expect(res.matchedIndex).toBe(9);
    expect(res.displayName).toBe("Michael Owen");
  });

  it("matches a rank-10 alternate via its alias", () => {
    const res = findMatchingAnswer("Owen", answers, new Set());
    expect(res.isMatch).toBe(true);
    expect(res.matchedIndex).toBe(9);
  });

  it("does NOT match alternates on non-rank-10 entries", () => {
    // Constructing a deliberately misplaced alternates on rank 1 (the schema would
    // reject this at puzzle-create time, but the matcher should still ignore it).
    const misplaced: TopTenAnswer[] = [
      {
        name: "X",
        aliases: [],
        alternates: [{ name: "Y", aliases: [] }],
      },
      ...answers.slice(1),
    ];
    const res = findMatchingAnswer("Y", misplaced, new Set());
    expect(res.isMatch).toBe(false);
  });
});

describe("StringMatcher", () => {
  it("is a class that implements findMatch with the same behavior", () => {
    const matcher = new StringMatcher();
    expect(matcher.findMatch("Shearer", answers, new Set()).matchedIndex).toBe(0);
  });
});
