# Phase 1.3 — Top Tens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the "Top Tens" game mode (guess all 10 entries in a top-10 list, e.g. "Top 10 Premier League All-Time Goalscorers") from the mobile app to the web, plugged into the orchestrator built in Phase 1.0. Third daily-play game per the spec's priority order.

**Architecture:** Pure-logic utilities (scoring, validation/matcher, share) port from the mobile feature into `web/lib/top-tens/`. UI is rebuilt in React: a 10-slot `<RankGrid />` plus a fuzzy-match guess input. `<TopTensGame />` owns reducer state, accepts text guesses, runs them through a `StringMatcher` against the answer list (including rank-10 alternates), reveals matched slots, and reports completion via the `GameProps<TopTensContent>` contract. No API endpoints — puzzle content is self-contained.

**Tech Stack:** Next.js 15 (App Router, RSC), React 18, TypeScript, Tailwind, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-05-10-website-games-migration-design.md` (Phase 1.3 in the Phasing section).
**Dependencies:** Phase 1.0 (orchestrator + registry), 1.1 (per-game folder pattern), 1.2 (`fix-then-merge` from review). `TopTensContent` is already exported from `@/lib/schemas/puzzle-schemas` — no schema extraction step.

---

## File structure

**Create:**
- `web/lib/top-tens/types.ts` — re-exports `TopTensContent`, `TopTenAnswer` from `puzzle-schemas`; defines local `RankIndex`, `RankSlotState`, `TopTensScore`, `TopTensState`, `TopTensAction`, `createInitialState`
- `web/lib/top-tens/scoring.ts` — `MAX_POINTS`, `calculateTopTensScore`, `formatTopTensScore`, `getScoreProgression`
- `web/lib/top-tens/validation.ts` — `StringMatcher` class + `findMatchingAnswer` helper, both using `validateGuess` from `@/lib/validation`
- `web/lib/top-tens/share.ts` — `generateTopTensShareText` (web-only, no RN imports)
- `web/lib/top-tens/__tests__/scoring.test.ts`
- `web/lib/top-tens/__tests__/validation.test.ts`
- `web/lib/top-tens/__tests__/share.test.ts`
- `web/components/play/games/top-tens/RankCard.tsx` — single slot (rank #, name/?, optional info)
- `web/components/play/games/top-tens/RankGrid.tsx` — 10-slot grid
- `web/components/play/games/top-tens/TopTensGame.tsx` — main game implementing `GameProps<TopTensContent>`
- `web/components/play/__tests__/TopTensGame.test.tsx` — smoke test
- `web/app/play/top-tens/page.tsx` — SEO wrapper rendering `<DailyPuzzleGame mode="top-tens">`

**Modify:**
- `web/lib/constants.ts` — add `FALLBACK_TOP_TENS_PUZZLE`; move `top-tens` from `APP_ONLY_GAMES` to `WEB_PLAYABLE_GAMES`
- `web/lib/play/registry.ts` — add `top-tens` entry; extend `AnyGameRegistryEntry` union

**Out of scope (deferred):**
- Climb animation (mobile has a Tenable-style "climbing" reveal animation; v1 web uses an instant reveal)
- Premium gating (Phase 3.2). Top Tens is `is_premium=true` on mobile but for web step-1 SEO purposes every mode's daily puzzle is free with ads.
- Persistence of in-progress state across reloads (orchestrator's `playSession` handles "played today" detection only)
- Last 10 variant (separate `last_tens` mode)

---

## Task 1: Add fallback, types, WEB_PLAYABLE_GAMES entry

**Files:**
- Modify: `web/lib/constants.ts`
- Create: `web/lib/top-tens/types.ts`

- [ ] **Step 1: Add fallback to constants**

Open `web/lib/constants.ts`. Find `FALLBACK_HIGHER_LOWER_PUZZLE` and append after it:

```ts
export const FALLBACK_TOP_TENS_PUZZLE = {
  title: "Top 10 Premier League All-Time Goalscorers",
  category: "Premier League",
  answers: [
    { name: "Alan Shearer", aliases: ["Shearer"], info: "260 goals" },
    { name: "Harry Kane", aliases: ["Kane"], info: "213 goals" },
    { name: "Wayne Rooney", aliases: ["Rooney"], info: "208 goals" },
    { name: "Andy Cole", aliases: ["Andrew Cole", "Cole"], info: "187 goals" },
    { name: "Sergio Agüero", aliases: ["Aguero", "Sergio Aguero"], info: "184 goals" },
    { name: "Frank Lampard", aliases: ["Lampard"], info: "177 goals" },
    { name: "Thierry Henry", aliases: ["Henry"], info: "175 goals" },
    { name: "Mohamed Salah", aliases: ["Salah", "Mo Salah"], info: "169 goals" },
    { name: "Robbie Fowler", aliases: ["Fowler"], info: "163 goals" },
    { name: "Jermain Defoe", aliases: ["Defoe"], info: "162 goals" },
  ],
};
```

- [ ] **Step 2: Move top-tens to WEB_PLAYABLE_GAMES**

In the same file, append to `WEB_PLAYABLE_GAMES`:

```ts
  {
    dbMode: "top_tens",
    slug: "top-tens",
    title: "Top Tens",
    description: "Guess all 10 entries in a top-10 list — Tenable style",
    accentColor: "#FF6B6B",
  },
```

Find and remove the matching entry from `APP_ONLY_GAMES`:

```ts
  { title: "Top Tens", description: "Guess the top 10 in each category" },
```

- [ ] **Step 3: Create the types module**

```ts
// web/lib/top-tens/types.ts
export type { TopTensContent, TopTenAnswer } from "@/lib/schemas/puzzle-schemas";

import type { TopTenAnswer } from "@/lib/schemas/puzzle-schemas";

/** Rank indices 0-9 (representing display ranks 1-10). */
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** State for a single rank slot in the grid. */
export interface RankSlotState {
  /** Display rank (1-10). */
  rank: number;
  /** Whether this slot has been found. */
  found: boolean;
  /** Whether this slot was auto-revealed on give-up. */
  autoRevealed: boolean;
  /** The answer (revealed when found). */
  answer: TopTenAnswer | null;
}

/** Score structure. */
export interface TopTensScore {
  /** Points earned (0-8, flat tier scoring). */
  points: number;
  /** Maximum possible points (always 8). */
  maxPoints: 8;
  /** Number of answers found (0-10). */
  foundCount: number;
  /** Number of incorrect guesses made. */
  wrongGuessCount: number;
  /** Whether player found all answers (won). */
  won: boolean;
}

export type TopTensGameStatus = "playing" | "won" | "lost";

/** Game state. */
export interface TopTensState {
  gameStatus: TopTensGameStatus;
  rankSlots: RankSlotState[];
  foundCount: number;
  wrongGuessCount: number;
  /** Triggers shake animation on incorrect guess. */
  lastGuessIncorrect: boolean;
  /** Triggers duplicate feedback (already found). */
  lastGuessDuplicate: boolean;
}

export type TopTensAction =
  | { type: "CORRECT_GUESS"; payload: { rankIndex: RankIndex; answer: TopTenAnswer } }
  | { type: "INCORRECT_GUESS" }
  | { type: "DUPLICATE_GUESS" }
  | { type: "CLEAR_FEEDBACK" }
  | { type: "GIVE_UP"; payload: { answers: TopTenAnswer[] } }
  | { type: "RESET" };

export function createInitialState(): TopTensState {
  return {
    gameStatus: "playing",
    rankSlots: Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      found: false,
      autoRevealed: false,
      answer: null,
    })),
    foundCount: 0,
    wrongGuessCount: 0,
    lastGuessIncorrect: false,
    lastGuessDuplicate: false,
  };
}
```

- [ ] **Step 4: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -E "constants.ts|top-tens/types.ts"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add web/lib/constants.ts web/lib/top-tens/types.ts
git commit -m "feat(top-tens): add fallback puzzle, types module, WEB_PLAYABLE_GAMES entry"
```

---

## Task 2: Port scoring with tests

**Files:**
- Create: `web/lib/top-tens/scoring.ts`
- Create: `web/lib/top-tens/__tests__/scoring.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/top-tens/__tests__/scoring.test.ts
import { describe, it, expect } from "vitest";
import {
  calculateTopTensScore,
  formatTopTensScore,
  getScoreProgression,
  MAX_POINTS,
} from "../scoring";

describe("calculateTopTensScore", () => {
  it("returns 0 points for 0 found", () => {
    expect(calculateTopTensScore(0, 0, false).points).toBe(0);
  });
  it("returns 1 point for 1-2 found", () => {
    expect(calculateTopTensScore(1, 0, false).points).toBe(1);
    expect(calculateTopTensScore(2, 0, false).points).toBe(1);
  });
  it("returns 2 points for 3-4 found", () => {
    expect(calculateTopTensScore(3, 0, false).points).toBe(2);
    expect(calculateTopTensScore(4, 0, false).points).toBe(2);
  });
  it("returns 3 points for 5-6 found", () => {
    expect(calculateTopTensScore(5, 0, false).points).toBe(3);
    expect(calculateTopTensScore(6, 0, false).points).toBe(3);
  });
  it("returns 4 points for 7-8 found", () => {
    expect(calculateTopTensScore(7, 0, false).points).toBe(4);
    expect(calculateTopTensScore(8, 0, false).points).toBe(4);
  });
  it("returns 5 points for 9 found", () => {
    expect(calculateTopTensScore(9, 0, false).points).toBe(5);
  });
  it("returns the jackpot 8 points for all 10 found", () => {
    expect(calculateTopTensScore(10, 0, true).points).toBe(8);
  });
  it("preserves foundCount, wrongGuessCount, and won in the result", () => {
    expect(calculateTopTensScore(7, 3, false)).toEqual({
      points: 4,
      maxPoints: 8,
      foundCount: 7,
      wrongGuessCount: 3,
      won: false,
    });
  });
  it("exports MAX_POINTS = 8", () => {
    expect(MAX_POINTS).toBe(8);
  });
});

describe("formatTopTensScore", () => {
  it("formats as X/Y", () => {
    expect(
      formatTopTensScore({
        points: 4,
        maxPoints: 8,
        foundCount: 7,
        wrongGuessCount: 0,
        won: false,
      })
    ).toBe("4/8");
  });
});

describe("getScoreProgression", () => {
  it("returns the flat tier ladder", () => {
    expect(getScoreProgression()).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 8]);
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run lib/top-tens/__tests__/scoring.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/top-tens/scoring.ts
import type { TopTensScore } from "./types";

/** Maximum possible points (Jackpot). */
export const MAX_POINTS = 8;

function getScoreForFoundCount(foundCount: number): number {
  if (foundCount <= 0) return 0;
  if (foundCount <= 2) return 1;
  if (foundCount <= 4) return 2;
  if (foundCount <= 6) return 3;
  if (foundCount <= 8) return 4;
  if (foundCount === 9) return 5;
  return 8; // 10 found = Jackpot
}

/**
 * Calculate the final score. Flat tier scoring; finding all 10 earns the
 * maximum 8 points (Jackpot).
 */
export function calculateTopTensScore(
  foundCount: number,
  wrongGuessCount: number,
  won: boolean
): TopTensScore {
  return {
    points: getScoreForFoundCount(foundCount),
    maxPoints: MAX_POINTS,
    foundCount,
    wrongGuessCount,
    won,
  };
}

/** Format score as "X/Y" for display. */
export function formatTopTensScore(score: TopTensScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/** Score progression for ranks 1-10 (for UI display). */
export function getScoreProgression(): number[] {
  return [1, 1, 2, 2, 3, 3, 4, 4, 5, 8];
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/top-tens/__tests__/scoring.test.ts`
Expected: all tests pass (10–11 test cases).

- [ ] **Step 5: Commit**

```bash
git add web/lib/top-tens/scoring.ts web/lib/top-tens/__tests__/scoring.test.ts
git commit -m "feat(top-tens): port scoring (flat tier) with tests"
```

---

## Task 3: Port validation/matcher with tests

**Files:**
- Create: `web/lib/top-tens/validation.ts`
- Create: `web/lib/top-tens/__tests__/validation.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/top-tens/__tests__/validation.test.ts
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
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && npx vitest run lib/top-tens/__tests__/validation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/top-tens/validation.ts
import { validateGuess } from "@/lib/validation";
import type { TopTenAnswer } from "@/lib/schemas/puzzle-schemas";
import type { RankIndex } from "./types";

/** Result of validating a guess against the answer list. */
export interface TopTensValidationResult {
  /** Whether a match was found. */
  isMatch: boolean;
  /** Index of matched answer (0-9), or null if no match. */
  matchedIndex: RankIndex | null;
  /** Display name of matched answer, or null if no match. */
  displayName: string | null;
  /** Similarity score (0-1). */
  score: number;
}

/**
 * Matching strategy interface. v1: string-based fuzzy matching. Future v2 could
 * use database player IDs for exact matches.
 */
export interface AnswerMatcher {
  findMatch(
    guess: string,
    answers: TopTenAnswer[],
    alreadyFound: Set<RankIndex>
  ): TopTensValidationResult;
}

/**
 * v1: string-based fuzzy matching. Uses shared `validateGuess` from
 * `@/lib/validation` and also tries each answer's aliases. For rank 10
 * (index 9), each `alternates` entry's name + aliases are matched as well.
 */
export class StringMatcher implements AnswerMatcher {
  findMatch(
    guess: string,
    answers: TopTenAnswer[],
    alreadyFound: Set<RankIndex>
  ): TopTensValidationResult {
    const trimmedGuess = guess.trim();
    if (!trimmedGuess) {
      return { isMatch: false, matchedIndex: null, displayName: null, score: 0 };
    }

    for (let i = 0; i < answers.length; i++) {
      if (alreadyFound.has(i as RankIndex)) continue;

      const answer = answers[i];
      const candidates: { displayName: string; names: string[] }[] = [
        { displayName: answer.name, names: [answer.name, ...(answer.aliases ?? [])] },
      ];
      // Only rank 10 (index 9) supports alternates
      if (i === 9 && answer.alternates) {
        for (const alt of answer.alternates) {
          candidates.push({
            displayName: alt.name,
            names: [alt.name, ...(alt.aliases ?? [])],
          });
        }
      }

      for (const candidate of candidates) {
        for (const name of candidate.names) {
          const result = validateGuess(trimmedGuess, name);
          if (result.isMatch) {
            return {
              isMatch: true,
              matchedIndex: i as RankIndex,
              displayName: candidate.displayName,
              score: result.score,
            };
          }
        }
      }
    }

    return { isMatch: false, matchedIndex: null, displayName: null, score: 0 };
  }
}

const defaultMatcher = new StringMatcher();

/**
 * Find a matching answer from the list. Skips already-found indices.
 * Optional `matcher` parameter is for testing / future v2 strategies.
 */
export function findMatchingAnswer(
  guess: string,
  answers: TopTenAnswer[],
  alreadyFound: Set<RankIndex>,
  matcher: AnswerMatcher = defaultMatcher
): TopTensValidationResult {
  return matcher.findMatch(guess, answers, alreadyFound);
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/top-tens/__tests__/validation.test.ts`
Expected: all tests pass (~10 test cases).

- [ ] **Step 5: Commit**

```bash
git add web/lib/top-tens/validation.ts web/lib/top-tens/__tests__/validation.test.ts
git commit -m "feat(top-tens): port StringMatcher + findMatchingAnswer with tests"
```

---

## Task 4: Port share-text with tests

**Files:**
- Create: `web/lib/top-tens/share.ts`
- Create: `web/lib/top-tens/__tests__/share.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/top-tens/__tests__/share.test.ts
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
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && npx vitest run lib/top-tens/__tests__/share.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/top-tens/share.ts
import type { RankSlotState, TopTensScore } from "./types";

/**
 * Generate share text for a Top Tens game result.
 *
 * @param title - The puzzle title (e.g. "Top 10 Premier League Goalscorers")
 * @param rankSlots - The 10 rank slot states (found = ✅, autoRevealed = ⬜)
 * @param score - The final score
 * @param puzzleDate - Optional ISO date (YYYY-MM-DD); used in the play URL
 */
export function generateTopTensShareText(
  title: string,
  rankSlots: RankSlotState[],
  score: TopTensScore,
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const grid = rankSlots
    .map((slot) => (slot.found ? "✅" : "⬜"))
    .join("");

  const firstLine = score.won
    ? `Jackpot! I got all 10 on ${title}`
    : `${title} — ${score.foundCount}/10 found`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/top-tens?ref=share&date=${puzzleDate}`
    : "https://football-iq.app/play/top-tens?ref=share";

  return [
    firstLine,
    dateStr,
    "",
    grid,
    "",
    `${score.points}/${score.maxPoints} IQ`,
    playUrl,
  ].join("\n");
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/top-tens/__tests__/share.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/lib/top-tens/share.ts web/lib/top-tens/__tests__/share.test.ts
git commit -m "feat(top-tens): port share-text generator with tests"
```

---

## Task 5: Build the RankCard component

**Files:**
- Create: `web/components/play/games/top-tens/RankCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/top-tens/RankCard.tsx
"use client";

import { CheckCircle2 } from "lucide-react";
import type { RankSlotState } from "@/lib/top-tens/types";
import { cn } from "@/lib/utils";

interface RankCardProps {
  slot: RankSlotState;
}

export function RankCard({ slot }: RankCardProps) {
  const isFound = slot.found;
  const isRevealed = slot.found || slot.autoRevealed;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors",
        isFound
          ? "bg-pitch-green/10 border-pitch-green/40"
          : slot.autoRevealed
          ? "bg-white/[0.03] border-white/10 opacity-70"
          : "bg-white/[0.04] border-white/10"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-bold text-sm",
          isFound
            ? "bg-pitch-green text-stadium-navy"
            : "bg-white/10 text-floodlight/60"
        )}
      >
        {slot.rank}
      </div>
      <div className="min-w-0 flex-1">
        {isRevealed && slot.answer ? (
          <>
            <p className="text-floodlight font-medium text-sm truncate">
              {slot.answer.name}
              {slot.answer.alternates && slot.answer.alternates.length > 0 && (
                <span className="text-slate-400 text-xs ml-1">
                  + {slot.answer.alternates.length} more
                </span>
              )}
            </p>
            {slot.answer.info && (
              <p className="text-slate-400 text-xs truncate">{slot.answer.info}</p>
            )}
          </>
        ) : (
          <p className="text-slate-500 text-sm">?</p>
        )}
      </div>
      {isFound && (
        <CheckCircle2 className="size-4 shrink-0 text-pitch-green" aria-hidden="true" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -F "RankCard.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/top-tens/RankCard.tsx
git commit -m "feat(top-tens): add RankCard component"
```

---

## Task 6: Build the RankGrid component

**Files:**
- Create: `web/components/play/games/top-tens/RankGrid.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/top-tens/RankGrid.tsx
"use client";

import type { RankSlotState } from "@/lib/top-tens/types";
import { RankCard } from "./RankCard";

interface RankGridProps {
  slots: RankSlotState[];
}

export function RankGrid({ slots }: RankGridProps) {
  return (
    <ol className="space-y-1.5 list-none m-0 p-0">
      {slots.map((slot) => (
        <li key={slot.rank}>
          <RankCard slot={slot} />
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "RankGrid.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/top-tens/RankGrid.tsx
git commit -m "feat(top-tens): add RankGrid component (10-slot list)"
```

---

## Task 7: Build the TopTensGame component

**Files:**
- Create: `web/components/play/games/top-tens/TopTensGame.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/top-tens/TopTensGame.tsx
"use client";

import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { GameProps } from "@/lib/play/types";
import type {
  TopTensContent,
  TopTensState,
  TopTensAction,
  RankIndex,
} from "@/lib/top-tens/types";
import { createInitialState } from "@/lib/top-tens/types";
import { findMatchingAnswer } from "@/lib/top-tens/validation";
import { calculateTopTensScore } from "@/lib/top-tens/scoring";
import { generateTopTensShareText } from "@/lib/top-tens/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RankGrid } from "./RankGrid";

function reducer(state: TopTensState, action: TopTensAction): TopTensState {
  switch (action.type) {
    case "CORRECT_GUESS": {
      const { rankIndex, answer } = action.payload;
      const newSlots = state.rankSlots.map((slot, i) =>
        i === rankIndex ? { ...slot, found: true, answer } : slot
      );
      const newFoundCount = state.foundCount + 1;
      const won = newFoundCount === 10;
      return {
        ...state,
        rankSlots: newSlots,
        foundCount: newFoundCount,
        lastGuessIncorrect: false,
        lastGuessDuplicate: false,
        gameStatus: won ? "won" : "playing",
      };
    }
    case "INCORRECT_GUESS":
      return {
        ...state,
        wrongGuessCount: state.wrongGuessCount + 1,
        lastGuessIncorrect: true,
        lastGuessDuplicate: false,
      };
    case "DUPLICATE_GUESS":
      return { ...state, lastGuessDuplicate: true, lastGuessIncorrect: false };
    case "CLEAR_FEEDBACK":
      return { ...state, lastGuessIncorrect: false, lastGuessDuplicate: false };
    case "GIVE_UP": {
      const { answers } = action.payload;
      const newSlots = state.rankSlots.map((slot, i) =>
        slot.found ? slot : { ...slot, autoRevealed: true, answer: answers[i] }
      );
      return { ...state, rankSlots: newSlots, gameStatus: "lost" };
    }
    case "RESET":
      return createInitialState();
  }
}

export function TopTensGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<TopTensContent>) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [currentGuess, setCurrentGuess] = useState("");
  const { trackGameCompleted } = useGameTracking("top-tens", puzzleDate);

  const foundIndices = useMemo(() => {
    const set = new Set<RankIndex>();
    state.rankSlots.forEach((slot, i) => {
      if (slot.found) set.add(i as RankIndex);
    });
    return set;
  }, [state.rankSlots]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (state.gameStatus !== "playing") return;
      const guess = currentGuess.trim();
      if (!guess) return;

      const result = findMatchingAnswer(guess, content.answers, foundIndices);

      if (result.isMatch && result.matchedIndex !== null) {
        const answer = content.answers[result.matchedIndex];
        dispatch({
          type: "CORRECT_GUESS",
          payload: { rankIndex: result.matchedIndex, answer },
        });
        setCurrentGuess("");
      } else {
        // Check if it would have been a duplicate (matches an already-found entry).
        const dupResult = findMatchingAnswer(guess, content.answers, new Set());
        if (dupResult.isMatch && dupResult.matchedIndex !== null && foundIndices.has(dupResult.matchedIndex)) {
          dispatch({ type: "DUPLICATE_GUESS" });
        } else {
          dispatch({ type: "INCORRECT_GUESS" });
        }
      }
    },
    [state.gameStatus, currentGuess, content.answers, foundIndices]
  );

  const handleGiveUp = useCallback(() => {
    if (state.gameStatus !== "playing") return;
    dispatch({ type: "GIVE_UP", payload: { answers: content.answers } });
  }, [state.gameStatus, content.answers]);

  // Clear shake/duplicate feedback after a short timeout.
  useEffect(() => {
    if (!state.lastGuessIncorrect && !state.lastGuessDuplicate) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_FEEDBACK" }), 700);
    return () => clearTimeout(t);
  }, [state.lastGuessIncorrect, state.lastGuessDuplicate]);

  // Fire completion once when game ends.
  useEffect(() => {
    if (state.gameStatus === "playing") return;
    const won = state.gameStatus === "won";
    const score = calculateTopTensScore(state.foundCount, state.wrongGuessCount, won);
    const shareText = generateTopTensShareText(content.title, state.rankSlots, score, puzzleDate);

    if (won) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    trackGameCompleted(
      won ? "won" : "lost",
      `${score.foundCount}/10`
    );

    onComplete({
      won,
      answer: content.title,
      shareText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  const isPlaying = state.gameStatus === "playing";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-floodlight font-semibold text-base text-center mb-0.5">
          {content.title}
        </p>
        {content.category && (
          <p className="text-slate-400 text-xs text-center">{content.category}</p>
        )}
      </div>

      <RankGrid slots={state.rankSlots} />

      {isPlaying && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value)}
            placeholder="Type a name..."
            className={cn(
              "bg-white/5 border-white/10 text-floodlight placeholder:text-slate-500",
              state.lastGuessIncorrect && "border-red-card animate-pulse",
              state.lastGuessDuplicate && "border-card-yellow"
            )}
            aria-label="Guess input"
            autoComplete="off"
          />
          {state.lastGuessDuplicate && (
            <p className="text-xs text-card-yellow">Already found — try a different player.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="submit"
              disabled={!currentGuess.trim()}
              className="h-11 bg-pitch-green text-stadium-navy hover:bg-pitch-green/90 disabled:opacity-50"
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGiveUp}
              className="h-11 border-white/10 text-slate-400 hover:bg-white/5"
            >
              Give up
            </Button>
          </div>
          <p className="text-slate-500 text-xs text-center">
            Found {state.foundCount}/10 · Wrong guesses: {state.wrongGuessCount}
          </p>
        </form>
      )}
    </div>
  );
}
```

The component:
- Reducer handles CORRECT/INCORRECT/DUPLICATE/CLEAR_FEEDBACK/GIVE_UP/RESET
- Submit form runs the guess through `findMatchingAnswer`
- On match: dispatch CORRECT_GUESS (which transitions to "won" if foundCount hits 10)
- On no match: re-check WITHOUT the `alreadyFound` skip to detect duplicates → dispatch DUPLICATE or INCORRECT
- Give Up button auto-reveals all unfound slots and ends game as "lost"
- Reports completion to orchestrator via `onComplete` on gameStatus transition; confetti on Jackpot

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "TopTensGame.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/top-tens/TopTensGame.tsx
git commit -m "feat(top-tens): add TopTensGame component conforming to GameProps"
```

---

## Task 8: TopTensGame smoke test

**Files:**
- Create: `web/components/play/__tests__/TopTensGame.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// web/components/play/__tests__/TopTensGame.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopTensGame } from "@/components/play/games/top-tens/TopTensGame";
import type { TopTensContent } from "@/lib/top-tens/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: TopTensContent = {
  title: "Top 10 Premier League All-Time Goalscorers",
  category: "Premier League",
  answers: [
    { name: "Alan Shearer", aliases: ["Shearer"], info: "260 goals" },
    { name: "Harry Kane", aliases: ["Kane"], info: "213 goals" },
    { name: "Wayne Rooney", aliases: ["Rooney"], info: "208 goals" },
    { name: "Andy Cole", aliases: [], info: "187 goals" },
    { name: "Sergio Agüero", aliases: ["Aguero"], info: "184 goals" },
    { name: "Frank Lampard", aliases: [], info: "177 goals" },
    { name: "Thierry Henry", aliases: ["Henry"], info: "175 goals" },
    { name: "Mohamed Salah", aliases: ["Salah"], info: "169 goals" },
    { name: "Robbie Fowler", aliases: [], info: "163 goals" },
    { name: "Jermain Defoe", aliases: ["Defoe"], info: "162 goals" },
  ],
};

describe("TopTensGame", () => {
  it("renders the title, 10 ranked slots, and the guess input", () => {
    render(
      <TopTensGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Top 10 Premier League/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a name/i)).toBeInTheDocument();
    // Each rank number 1-10 should be visible
    for (let n = 1; n <= 10; n++) {
      expect(screen.getByText(String(n))).toBeInTheDocument();
    }
  });

  it("reveals a slot on a correct guess and disables Submit when input is empty", () => {
    render(
      <TopTensGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    const submit = screen.getByRole("button", { name: /^Submit$/i });
    expect(submit).toBeDisabled();

    const input = screen.getByPlaceholderText(/Type a name/i);
    fireEvent.change(input, { target: { value: "Shearer" } });
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);
    expect(screen.getByText("Alan Shearer")).toBeInTheDocument();
  });

  it("shows the found/wrong counter", () => {
    render(
      <TopTensGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Found 0\/10/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect PASS**

Run: `cd web && npx vitest run components/play/__tests__/TopTensGame.test.tsx`
Expected: 3/3 PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/__tests__/TopTensGame.test.tsx
git commit -m "test(top-tens): add smoke tests for TopTensGame"
```

---

## Task 9: Register in GAME_REGISTRY

**Files:**
- Modify: `web/lib/play/registry.ts`

- [ ] **Step 1: Update the registry**

Edit `web/lib/play/registry.ts`:

1. Add import after the `HigherLowerGame` import:
   ```ts
   import { TopTensGame } from "@/components/play/games/top-tens/TopTensGame";
   ```

2. Extend the constants import with `FALLBACK_TOP_TENS_PUZZLE`:
   ```ts
   FALLBACK_TOP_TENS_PUZZLE,
   ```

3. The type imports already include `TopTensContent` from `@/lib/schemas/puzzle-schemas` — keep it.

4. Extend the `AnyGameRegistryEntry` union (no new entry needed because `TopTensContent` is already typed in the union; verify it is — Phase 1.0 may not have included it, in which case append `| GameRegistryEntry<TopTensContent>`).

5. Add the new entry inside `GAME_REGISTRY`:
   ```ts
     "top-tens": {
       dbMode: "top_tens",
       title: "Top Tens",
       component: TopTensGame,
       fallbackContent: FALLBACK_TOP_TENS_PUZZLE as TopTensContent,
     },
   ```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "play/registry.ts"`
Expected: no output.

- [ ] **Step 3: Run DailyPuzzleClient tests**

Run: `cd web && npx vitest run components/play/__tests__/DailyPuzzleClient.test.tsx`
Expected: 3/3 PASS.

- [ ] **Step 4: Commit**

```bash
git add web/lib/play/registry.ts
git commit -m "feat(top-tens): register top-tens in GAME_REGISTRY"
```

---

## Task 10: Create the SEO page

**Files:**
- Create: `web/app/play/top-tens/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// web/app/play/top-tens/page.tsx
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Top Tens — Daily Football List Game | Football IQ",
    description:
      "Can you name all 10? Guess every entry in today's top-10 football list. Goalscorers, transfer fees, World Cup records — a new list every day. Free to play.",
    alternates: {
      canonical: `${BASE_URL}/play/top-tens`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Top Tens — Daily Football List Game | Football IQ",
      description:
        "Name all 10. A daily football top-10 list challenge. Free to play in your browser.",
      url: `${BASE_URL}/play/top-tens`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/top-tens`,
          width: 1200,
          height: 630,
          alt: "Top Tens - Daily football list challenge",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Top Tens — Daily Football List Game | Football IQ",
      description:
        "Can you name all 10? Daily football top-10 list. Free to play, no download.",
      images: [`${BASE_URL}/api/og/play/top-tens`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TopTensPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Top Tens — Daily Football List Game",
              description:
                "Guess every entry in today's football top-10 list. Goalscorers, transfer fees, World Cup records, and more.",
              url: `${BASE_URL}/play/top-tens`,
              isAccessibleForFree: true,
              provider: {
                "@type": "Organization",
                name: "Football IQ",
                url: BASE_URL,
              },
              typicalAgeRange: "13-",
              inLanguage: "en",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Football IQ", item: BASE_URL },
                { "@type": "ListItem", position: 2, name: "Play", item: `${BASE_URL}/play` },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Top Tens",
                  item: `${BASE_URL}/play/top-tens`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Top Tens work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Each day you get a football top-10 list — for example 'Top 10 Premier League All-Time Goalscorers'. Type names to guess the entries; correct guesses reveal at their rank position. Find as many as you can.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Top Tens free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Today's Top Tens puzzle is always free to play in your browser at football-iq.app — no signup or download required. A new list publishes every day.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Top Tens scored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Flat-tier scoring rewards quantity: 1-2 found = 1 point, 3-4 = 2, 5-6 = 3, 7-8 = 4, 9 = 5, and the Jackpot (all 10) is worth 8 points. Aim for the Jackpot.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="top-tens" date={params.date} />
      <HowToPlay
        title="Top Tens"
        rules={[
          "Each puzzle is a football top-10 list (e.g. 'Top 10 Premier League All-Time Goalscorers').",
          "Type a name into the input. Correct guesses reveal the entry at its rank position.",
          "Fuzzy matching: 'Shearer' matches 'Alan Shearer'; 'Aguero' matches 'Sergio Agüero'.",
          "Find as many as you can. Hit 'Give Up' to reveal the remaining answers.",
          "Score: 1-2 found = 1pt, 3-4 = 2, 5-6 = 3, 7-8 = 4, 9 = 5, all 10 = Jackpot (8pts).",
        ]}
        tips={[
          "Start with the obvious top-of-list names — they're often the easiest free hits.",
          "Try last names first; the fuzzy matcher will resolve them to the full name.",
          "Joint 10th-place entries are accepted — if today's list has ties, any tied name works.",
        ]}
        keywords="Top Tens is a daily football top-10 list game. Guess every entry — goalscorers, transfer fees, World Cup records — with fuzzy matching. Free to play, new list every day, no download required."
      />
    </>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "top-tens/page.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/app/play/top-tens/page.tsx
git commit -m "feat(top-tens): add SEO page at /play/top-tens"
```

---

## Task 11: Full verification + dev-server smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run all play + lib unit tests**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run components/play/__tests__/ lib/whos-that/__tests__/ lib/higher-lower/__tests__/ lib/top-tens/__tests__/`
Expected: all tests pass.

- [ ] **Step 2: Full TS check**

Run: `cd web && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Production build**

Run: `cd web && npm run build 2>&1 | grep -E "Compiled successfully|/play/top-tens|Build error"`
Expected: build succeeds; `/play/top-tens` appears in route output.

- [ ] **Step 4: Dev-server smoke**

Start: `cd web && PORT=3461 npm run dev` (background or separate shell).

Run:
```
curl -sf -o /tmp/tt.html -w "%{http_code}\n" "http://localhost:3461/play/top-tens"
grep -c -i "Top Tens\|schema.org\|How does Top Tens\|Type a name" /tmp/tt.html
```
Expected: 200 + multiple matches.

Stop dev server.

- [ ] **Step 5: Final commit (if any cleanup) + tag**

```bash
git tag -a phase-1.3-top-tens -m "Phase 1.3 complete: Top Tens playable on /play/top-tens"
```

---

## Verification summary

- `/play/top-tens` renders the playable list-guessing game with fuzzy matching
- 8 games now web-playable (the 5 existing + Who's That? + Higher/Lower + Top Tens)
- Pure logic isolated and tested: scoring (10 cases), validation/matcher (9 cases), share text (2 cases)
- Pattern locked: adding a new game = ~10 focused tasks
- Remaining mobile-only games: Starting XI, The Grid, Who Am I?, Career Path Pro, The Chain, Threads, Goalscorer Recall

Next: Phase 1.4 (Starting XI / The Grid / Who Am I?) — each follows the same pattern.
