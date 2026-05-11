# Phase 1.2 — Higher/Lower Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the "Higher/Lower" game mode (10 rounds, compare two players' stats) from the mobile app to the web, plugged into the orchestrator built in Phase 1.0. Daily-play game per the spec's priority order.

**Architecture:** Pure-logic utilities (scoring, formatStatValue, share, content parsing) port verbatim from the mobile feature into `web/lib/higher-lower/`. UI is rebuilt in React: a `<HigherLowerGame />` component that owns reducer state, displays two PlayerCards per round, accepts higher/lower input, and reports completion via the `GameProps<HigherLowerContent>` contract. The game data is self-contained in the puzzle content — no API endpoints needed (unlike Phase 1.1 which required autocomplete + attribute lookup). Wires into `GAME_REGISTRY` and ships at `/play/higher-lower` as a thin SEO wrapper around `<DailyPuzzleGame mode="higher-lower">`.

**Tech Stack:** Next.js 15 (App Router, RSC), React 18, TypeScript, Tailwind, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-05-10-website-games-migration-design.md` (Phase 1.2 in the Phasing section).
**Dependencies:** Phase 1.0 (orchestrator + game registry + `GameProps<T>` contract) and Phase 1.1 (Who's That? port, established the per-game folder pattern at `web/components/play/games/<slug>/`) — both already merged to main.

---

## File structure

**Create:**
- `web/lib/higher-lower/types.ts` — re-exports `HigherLowerContent` from `puzzle-schemas`; defines local `StatType`, `HigherLowerEntry`, `TransferPair`, `HigherLowerState`, `HigherLowerAction`, `createInitialState`
- `web/lib/higher-lower/formatStatValue.ts` — `formatStatValue(value, statType)`
- `web/lib/higher-lower/scoring.ts` — `HigherLowerScore`, `calculateHigherLowerScore`, `formatHigherLowerScore`
- `web/lib/higher-lower/share.ts` — `generateHigherLowerEmojiGrid`, `generateHigherLowerShareText`
- `web/lib/higher-lower/content.ts` — `parseHigherLowerContent(content)` returning normalised `{ pairs: TransferPair[] }` (handles both chain + pairs formats, both new + legacy entry shapes)
- `web/lib/higher-lower/__tests__/formatStatValue.test.ts`
- `web/lib/higher-lower/__tests__/scoring.test.ts`
- `web/lib/higher-lower/__tests__/share.test.ts`
- `web/lib/higher-lower/__tests__/content.test.ts`
- `web/components/play/games/higher-lower/PlayerCard.tsx` — visual card showing player name, context, stat value (or hidden "?")
- `web/components/play/games/higher-lower/HigherLowerGame.tsx` — main game implementing `GameProps<HigherLowerContent>`
- `web/components/play/__tests__/HigherLowerGame.test.tsx` — smoke test
- `web/app/play/higher-lower/page.tsx` — SEO wrapper rendering `<DailyPuzzleGame mode="higher-lower">`

**Modify:**
- `web/lib/constants.ts` — add `FALLBACK_HIGHER_LOWER_PUZZLE`; move `higher-lower` from `APP_ONLY_GAMES` to `WEB_PLAYABLE_GAMES`
- `web/lib/schemas/puzzle-schemas.ts` — extract previously-inline `higher_lower` schema into a named `higherLowerContentSchema`, export `HigherLowerContent` type
- `web/lib/play/registry.ts` — add `higher-lower` entry; extend `AnyGameRegistryEntry` union

**Out of scope (deferred):**
- Premium gating (Phase 3.2)
- Animations on the result-reveal (the mobile app uses `Animated` API for the stat-reveal flip; v1 web uses a plain "Reveal" → instant show)
- Review-list post-game UI (mobile has `HigherLowerReviewList` showing all 10 rounds with correct/incorrect markers; v1 web relies on the orchestrator's `PostGameCTA` for results display)
- Onboarding intro screen

---

## Task 1: Add fallback puzzle, types module, extract HigherLowerContent schema

**Files:**
- Modify: `web/lib/constants.ts`
- Modify: `web/lib/schemas/puzzle-schemas.ts`
- Create: `web/lib/higher-lower/types.ts`

- [ ] **Step 1: Add fallback puzzle to constants**

Open `web/lib/constants.ts`. Find `FALLBACK_WHOS_THAT_PUZZLE` and append this constant after it:

```ts
export const FALLBACK_HIGHER_LOWER_PUZZLE = {
  players: [
    { name: "Neymar Jr.", context: "Barcelona → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 222 },
    { name: "Kylian Mbappé", context: "Monaco → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 180 },
    { name: "Philippe Coutinho", context: "Liverpool → Barcelona", statLabel: "Transfer Fee", statType: "transfer_fee", value: 145 },
    { name: "João Félix", context: "Benfica → Atlético", statLabel: "Transfer Fee", statType: "transfer_fee", value: 126 },
    { name: "Antoine Griezmann", context: "Atlético → Barcelona", statLabel: "Transfer Fee", statType: "transfer_fee", value: 120 },
    { name: "Paul Pogba", context: "Juventus → Man United", statLabel: "Transfer Fee", statType: "transfer_fee", value: 105 },
    { name: "Gareth Bale", context: "Tottenham → Real Madrid", statLabel: "Transfer Fee", statType: "transfer_fee", value: 100 },
    { name: "Cristiano Ronaldo", context: "Man United → Real Madrid", statLabel: "Transfer Fee", statType: "transfer_fee", value: 94 },
    { name: "Eden Hazard", context: "Chelsea → Real Madrid", statLabel: "Transfer Fee", statType: "transfer_fee", value: 89 },
    { name: "Romelu Lukaku", context: "Everton → Man United", statLabel: "Transfer Fee", statType: "transfer_fee", value: 85 },
    { name: "Virgil van Dijk", context: "Southampton → Liverpool", statLabel: "Transfer Fee", statType: "transfer_fee", value: 84 },
  ],
};
```

- [ ] **Step 2: Move higher-lower from APP_ONLY_GAMES to WEB_PLAYABLE_GAMES**

In the same file, find `WEB_PLAYABLE_GAMES` and append:

```ts
  {
    dbMode: "higher_lower",
    slug: "higher-lower",
    title: "Higher/Lower",
    description: "Higher or lower? Compare real player stats over 10 rounds",
    accentColor: "#F59E0B",
  },
```

Find `APP_ONLY_GAMES` and remove the entry:

```ts
  { title: "Higher/Lower", description: "Higher or lower? Compare real player stats" },
```

- [ ] **Step 3: Extract HigherLowerContent schema in puzzle-schemas.ts**

Open `web/lib/schemas/puzzle-schemas.ts`. Find the inline `higher_lower: z.object({...})` entry inside the `puzzleContentSchemas` map (it's currently a complex object with `players` and `pairs` union refinement).

First, find the location of the `whosThatContentSchema` export (added in Phase 1.1, right after `whoAmIContentSchema` exports). Add the new schema and type below it:

```ts
const higherLowerEntrySchema = z.union([
  // New format: generic stat entry
  z.object({
    name: z.string(),
    context: z.string(),
    statLabel: z.string(),
    statType: z.string(),
    value: z.number(),
  }),
  // Legacy format: transfer fee only
  z.object({
    name: z.string(),
    club: z.string(),
    fee: z.number(),
  }),
]);

export const higherLowerContentSchema = z
  .object({
    // Chain format: 11+ entries, round N compares players[N] vs players[N+1]
    players: z.array(higherLowerEntrySchema).optional(),
    // Legacy format: independent pairs
    pairs: z
      .array(
        z.object({
          player1: higherLowerEntrySchema,
          player2: higherLowerEntrySchema,
        })
      )
      .optional(),
  })
  .refine((data) => data.players || data.pairs, {
    message: "Either 'players' (chain) or 'pairs' (legacy) must be provided",
  });

export type HigherLowerContent = z.infer<typeof higherLowerContentSchema>;
```

Then replace the inline `higher_lower: z.object({...}).refine(...)` entry in `puzzleContentSchemas` with:

```ts
  higher_lower: higherLowerContentSchema,
```

The full block of code being replaced (currently inline in the map) starts with `higher_lower: z.object({` and ends with `}),` after the `.refine(...)` call. Replace that entire block with the one-line reference shown above.

- [ ] **Step 4: Create the types module**

Create `web/lib/higher-lower/types.ts`:

```ts
// web/lib/higher-lower/types.ts
export type { HigherLowerContent } from "@/lib/schemas/puzzle-schemas";

/** Known stat categories — drives value formatting. */
export type StatType =
  | "transfer_fee"
  | "league_appearances"
  | "international_caps"
  | "goals"
  | "assists"
  | "clean_sheets";

/** A single normalised entry — what the parser returns and what the UI consumes. */
export interface HigherLowerEntry {
  /** Player name. */
  name: string;
  /** Club or national team / transfer route. */
  context: string;
  /** Human-readable stat label, e.g. "League Appearances". */
  statLabel: string;
  /** Machine-readable stat category. */
  statType: StatType;
  /** Numeric stat value. */
  value: number;
}

/** One comparison pair (round N). */
export interface TransferPair {
  player1: HigherLowerEntry;
  player2: HigherLowerEntry;
}

/** Game state. */
export interface HigherLowerState {
  /** Current round index (0-based). */
  currentRound: number;
  /** Total rounds in the game. */
  totalRounds: number;
  /** User's answers per completed round. */
  answers: ("higher" | "lower")[];
  /** Whether each answer was correct. */
  results: boolean[];
  /** Current game status. */
  gameStatus: "playing" | "won" | "lost";
  /** True while showing the round's result before advancing. */
  showingResult: boolean;
}

export type HigherLowerAction =
  | { type: "SUBMIT_ANSWER"; payload: { answer: "higher" | "lower"; isCorrect: boolean } }
  | { type: "ADVANCE_ROUND" }
  | { type: "RESET" };

export function createInitialState(totalRounds: number): HigherLowerState {
  return {
    currentRound: 0,
    totalRounds,
    answers: [],
    results: [],
    gameStatus: "playing",
    showingResult: false,
  };
}
```

- [ ] **Step 5: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -E "constants.ts|puzzle-schemas.ts|higher-lower/types.ts"`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add web/lib/constants.ts web/lib/schemas/puzzle-schemas.ts web/lib/higher-lower/types.ts
git commit -m "feat(higher-lower): add fallback puzzle, types module, extract HigherLowerContent schema"
```

---

## Task 2: Port formatStatValue with tests

**Files:**
- Create: `web/lib/higher-lower/formatStatValue.ts`
- Create: `web/lib/higher-lower/__tests__/formatStatValue.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/higher-lower/__tests__/formatStatValue.test.ts
import { describe, it, expect } from "vitest";
import { formatStatValue } from "../formatStatValue";

describe("formatStatValue", () => {
  it("formats transfer fees with euro and millions suffix", () => {
    expect(formatStatValue(105, "transfer_fee")).toBe("€105m");
    expect(formatStatValue(222, "transfer_fee")).toBe("€222m");
  });

  it("formats integers with locale separators for non-transfer stats", () => {
    expect(formatStatValue(1234, "goals")).toBe("1,234");
    expect(formatStatValue(500, "league_appearances")).toBe("500");
    expect(formatStatValue(1234567, "league_appearances")).toBe("1,234,567");
  });

  it("handles zero", () => {
    expect(formatStatValue(0, "transfer_fee")).toBe("€0m");
    expect(formatStatValue(0, "goals")).toBe("0");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run lib/higher-lower/__tests__/formatStatValue.test.ts`
Expected: FAIL (function not defined).

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/higher-lower/formatStatValue.ts
import type { StatType } from "./types";

/**
 * Format a stat value for display based on its type.
 * Transfer fees get currency formatting (€Xm); all others are locale integers.
 */
export function formatStatValue(value: number, statType: StatType): string {
  if (statType === "transfer_fee") {
    return `€${value}m`;
  }
  return value.toLocaleString("en-GB");
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/formatStatValue.test.ts`
Expected: 3/3 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/higher-lower/formatStatValue.ts web/lib/higher-lower/__tests__/formatStatValue.test.ts
git commit -m "feat(higher-lower): port formatStatValue with tests"
```

---

## Task 3: Port scoring with tests

**Files:**
- Create: `web/lib/higher-lower/scoring.ts`
- Create: `web/lib/higher-lower/__tests__/scoring.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/higher-lower/__tests__/scoring.test.ts
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
});

describe("formatHigherLowerScore", () => {
  it("formats as X/Y", () => {
    expect(
      formatHigherLowerScore({ points: 7, maxPoints: 10, won: false })
    ).toBe("7/10");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/scoring.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/higher-lower/scoring.ts

/** Score data for a completed Higher/Lower game. */
export interface HigherLowerScore {
  /** Correct answers (0–10). */
  points: number;
  /** Maximum possible (10). */
  maxPoints: number;
  /** Whether the player got all 10 correct. */
  won: boolean;
}

/**
 * Calculate the final score for a Higher/Lower game.
 * @param results - Array of booleans (true = correct, false = wrong)
 */
export function calculateHigherLowerScore(results: boolean[]): HigherLowerScore {
  const points = results.filter(Boolean).length;
  return {
    points,
    maxPoints: 10,
    won: points === 10,
  };
}

/** Format score for display as "X/Y" string. */
export function formatHigherLowerScore(score: HigherLowerScore): string {
  return `${score.points}/${score.maxPoints}`;
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/scoring.test.ts`
Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/higher-lower/scoring.ts web/lib/higher-lower/__tests__/scoring.test.ts
git commit -m "feat(higher-lower): port scoring with tests"
```

---

## Task 4: Port share-text generator with tests

**Files:**
- Create: `web/lib/higher-lower/share.ts`
- Create: `web/lib/higher-lower/__tests__/share.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/higher-lower/__tests__/share.test.ts
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
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/share.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/higher-lower/share.ts
import type { HigherLowerScore } from "./scoring";

/** Generate emoji string. ✅ = correct, ❌ = wrong. */
export function generateHigherLowerEmojiGrid(results: boolean[]): string {
  return results.map((r) => (r ? "✅" : "❌")).join("");
}

/** Generate share text for a Higher/Lower result. */
export function generateHigherLowerShareText(
  score: HigherLowerScore,
  results: boolean[],
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const emojiGrid = generateHigherLowerEmojiGrid(results);

  const firstLine = score.won
    ? "I got a perfect 10 in Higher/Lower!"
    : `I scored ${score.points}/10 in Higher/Lower!`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/higher-lower?ref=share&date=${puzzleDate}`
    : "https://football-iq.app?ref=share";

  return [
    firstLine,
    dateStr,
    "",
    emojiGrid,
    "",
    `${score.points}/${score.maxPoints} IQ`,
    playUrl,
  ].join("\n");
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/share.test.ts`
Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/higher-lower/share.ts web/lib/higher-lower/__tests__/share.test.ts
git commit -m "feat(higher-lower): port share-text generator with tests"
```

---

## Task 5: Port the content parser (chain + pairs, new + legacy entry shapes) with tests

**Files:**
- Create: `web/lib/higher-lower/content.ts`
- Create: `web/lib/higher-lower/__tests__/content.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/higher-lower/__tests__/content.test.ts
import { describe, it, expect } from "vitest";
import { parseHigherLowerContent } from "../content";

describe("parseHigherLowerContent", () => {
  it("normalises a chain of new-format entries into pairs", () => {
    const content = {
      players: [
        { name: "A", context: "X", statLabel: "Goals", statType: "goals", value: 30 },
        { name: "B", context: "Y", statLabel: "Goals", statType: "goals", value: 25 },
        { name: "C", context: "Z", statLabel: "Goals", statType: "goals", value: 22 },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs).toHaveLength(2);
    expect(parsed!.pairs[0].player1.name).toBe("A");
    expect(parsed!.pairs[0].player2.name).toBe("B");
    expect(parsed!.pairs[1].player1.name).toBe("B");
    expect(parsed!.pairs[1].player2.name).toBe("C");
  });

  it("accepts legacy entries (club/fee) and normalises to new shape with transfer_fee statType", () => {
    const content = {
      players: [
        { name: "A", club: "Barcelona", fee: 222 },
        { name: "B", club: "PSG", fee: 180 },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs[0].player1).toEqual({
      name: "A",
      context: "Barcelona",
      statLabel: "Transfer Fee",
      statType: "transfer_fee",
      value: 222,
    });
    expect(parsed!.pairs[0].player2.value).toBe(180);
  });

  it("accepts explicit pairs format and preserves order", () => {
    const content = {
      pairs: [
        {
          player1: { name: "A", context: "X", statLabel: "Caps", statType: "international_caps", value: 100 },
          player2: { name: "B", context: "Y", statLabel: "Caps", statType: "international_caps", value: 80 },
        },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs).toHaveLength(1);
    expect(parsed!.pairs[0].player1.name).toBe("A");
  });

  it("falls back to 'transfer_fee' for unknown statType strings", () => {
    const content = {
      players: [
        { name: "A", context: "X", statLabel: "Mystery", statType: "not_a_real_stat", value: 10 },
        { name: "B", context: "Y", statLabel: "Mystery", statType: "not_a_real_stat", value: 20 },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs[0].player1.statType).toBe("transfer_fee");
  });

  it("returns null for malformed input", () => {
    expect(parseHigherLowerContent(null)).toBeNull();
    expect(parseHigherLowerContent({})).toBeNull();
    expect(parseHigherLowerContent({ players: [] })).toBeNull();
    expect(parseHigherLowerContent({ players: [{ name: "A" }] })).toBeNull();
    expect(parseHigherLowerContent({ pairs: [] })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/content.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/higher-lower/content.ts
import type { HigherLowerEntry, StatType, TransferPair } from "./types";

const VALID_STAT_TYPES: Set<string> = new Set([
  "transfer_fee",
  "league_appearances",
  "international_caps",
  "goals",
  "assists",
  "clean_sheets",
]);

function isValidStatType(value: unknown): value is StatType {
  return typeof value === "string" && VALID_STAT_TYPES.has(value);
}

/**
 * Normalise a raw entry to HigherLowerEntry.
 * Accepts the new shape (context/statLabel/statType/value) or legacy shape (club/fee).
 * Unknown statType values are coerced to "transfer_fee".
 */
function normalizeEntry(value: unknown): HigherLowerEntry | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.length === 0) return null;

  // New format: has context + value
  if (typeof obj.context === "string" && typeof obj.value === "number") {
    return {
      name: obj.name,
      context: obj.context,
      statLabel: typeof obj.statLabel === "string" ? obj.statLabel : "Transfer Fee",
      statType: isValidStatType(obj.statType) ? obj.statType : "transfer_fee",
      value: obj.value,
    };
  }

  // Legacy format: has club + fee → normalise
  if (
    typeof obj.club === "string" &&
    obj.club.length > 0 &&
    typeof obj.fee === "number" &&
    obj.fee >= 0
  ) {
    return {
      name: obj.name,
      context: obj.club,
      statLabel: "Transfer Fee",
      statType: "transfer_fee",
      value: obj.fee,
    };
  }

  return null;
}

function normalizePair(value: unknown): TransferPair | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const player1 = normalizeEntry(obj.player1);
  const player2 = normalizeEntry(obj.player2);
  if (!player1 || !player2) return null;
  return { player1, player2 };
}

export interface ParsedHigherLowerContent {
  pairs: TransferPair[];
}

/**
 * Parse and normalise Higher/Lower puzzle content into a uniform pairs array.
 *
 * Supports:
 * - Chain format (`players: HigherLowerEntry[]`) — round N compares players[N] vs players[N+1]
 * - Pairs format (`pairs: TransferPair[]`) — explicit independent pairs
 * - Both new (context/statLabel/statType/value) and legacy (club/fee) entry shapes
 *
 * Returns null if input is malformed.
 */
export function parseHigherLowerContent(content: unknown): ParsedHigherLowerContent | null {
  if (!content || typeof content !== "object") return null;
  const obj = content as Record<string, unknown>;

  // Chain format
  if (Array.isArray(obj.players) && obj.players.length >= 2) {
    const players: HigherLowerEntry[] = [];
    for (const raw of obj.players) {
      const entry = normalizeEntry(raw);
      if (!entry) return null;
      players.push(entry);
    }
    const pairs: TransferPair[] = [];
    for (let i = 0; i < players.length - 1; i++) {
      pairs.push({ player1: players[i], player2: players[i + 1] });
    }
    return { pairs };
  }

  // Pairs format
  if (!Array.isArray(obj.pairs) || obj.pairs.length < 1) {
    return null;
  }
  const pairs: TransferPair[] = [];
  for (const raw of obj.pairs) {
    const pair = normalizePair(raw);
    if (!pair) return null;
    pairs.push(pair);
  }
  return { pairs };
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd web && npx vitest run lib/higher-lower/__tests__/content.test.ts`
Expected: 9/9 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/higher-lower/content.ts web/lib/higher-lower/__tests__/content.test.ts
git commit -m "feat(higher-lower): port content parser with chain/pairs + legacy/new entry support"
```

---

## Task 6: Build the PlayerCard component

**Files:**
- Create: `web/components/play/games/higher-lower/PlayerCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/higher-lower/PlayerCard.tsx
"use client";

import type { HigherLowerEntry } from "@/lib/higher-lower/types";
import { formatStatValue } from "@/lib/higher-lower/formatStatValue";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  entry: HigherLowerEntry;
  /** When false, the stat value is hidden behind a "?" placeholder. */
  revealed: boolean;
  /** Visual highlight after the user has answered: "correct" (green) | "wrong" (red) | undefined (neutral). */
  resultHighlight?: "correct" | "wrong";
}

export function PlayerCard({ entry, revealed, resultHighlight }: PlayerCardProps) {
  const ringClass =
    resultHighlight === "correct"
      ? "ring-2 ring-pitch-green"
      : resultHighlight === "wrong"
      ? "ring-2 ring-red-card"
      : "ring-1 ring-white/10";

  return (
    <div
      className={cn(
        "rounded-lg bg-white/[0.04] px-4 py-5 text-center",
        ringClass
      )}
    >
      <p className="text-floodlight font-semibold text-base mb-1 line-clamp-2">
        {entry.name}
      </p>
      <p className="text-slate-400 text-xs mb-3 line-clamp-1">{entry.context}</p>
      <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
        {entry.statLabel}
      </p>
      <p
        className={cn(
          "font-bold text-2xl",
          revealed ? "text-pitch-green" : "text-slate-600"
        )}
      >
        {revealed ? formatStatValue(entry.value, entry.statType) : "?"}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -F "PlayerCard.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/higher-lower/PlayerCard.tsx
git commit -m "feat(higher-lower): add PlayerCard component (player name, context, stat or hidden)"
```

---

## Task 7: Build the HigherLowerGame component

**Files:**
- Create: `web/components/play/games/higher-lower/HigherLowerGame.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/higher-lower/HigherLowerGame.tsx
"use client";

import { useReducer, useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { GameProps } from "@/lib/play/types";
import type {
  HigherLowerContent,
  HigherLowerState,
  HigherLowerAction,
} from "@/lib/higher-lower/types";
import { createInitialState } from "@/lib/higher-lower/types";
import { parseHigherLowerContent } from "@/lib/higher-lower/content";
import { calculateHigherLowerScore } from "@/lib/higher-lower/scoring";
import { generateHigherLowerShareText } from "@/lib/higher-lower/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "./PlayerCard";

const ROUNDS_PER_GAME = 10;

function reducer(state: HigherLowerState, action: HigherLowerAction): HigherLowerState {
  switch (action.type) {
    case "SUBMIT_ANSWER": {
      const { answer, isCorrect } = action.payload;
      return {
        ...state,
        answers: [...state.answers, answer],
        results: [...state.results, isCorrect],
        showingResult: true,
      };
    }
    case "ADVANCE_ROUND": {
      const nextRound = state.currentRound + 1;
      if (nextRound >= state.totalRounds) {
        const won = state.results.every(Boolean);
        return { ...state, currentRound: nextRound, showingResult: false, gameStatus: won ? "won" : "lost" };
      }
      return { ...state, currentRound: nextRound, showingResult: false };
    }
    case "RESET":
      return createInitialState(state.totalRounds);
  }
}

export function HigherLowerGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<HigherLowerContent>) {
  const parsed = useMemo(() => parseHigherLowerContent(content), [content]);
  // Cap to ROUNDS_PER_GAME to respect the "always 10 rounds" rule. If the puzzle
  // has fewer pairs, play all of them.
  const pairs = useMemo(() => (parsed?.pairs ?? []).slice(0, ROUNDS_PER_GAME), [parsed]);
  const totalRounds = pairs.length;

  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => createInitialState(totalRounds)
  );
  const { trackGameCompleted } = useGameTracking("higher-lower", puzzleDate);
  const [transitioning, setTransitioning] = useState(false);

  const currentPair = pairs[state.currentRound];

  const handleAnswer = useCallback(
    (answer: "higher" | "lower") => {
      if (!currentPair || state.showingResult || transitioning) return;
      const { value: v1 } = currentPair.player1;
      const { value: v2 } = currentPair.player2;
      // Ties resolve as "higher" (matches mobile behaviour: equal values are not
      // a valid puzzle state, but if they appear we treat the answer "higher" as correct).
      const isCorrect = answer === "higher" ? v2 >= v1 : v2 < v1;
      dispatch({ type: "SUBMIT_ANSWER", payload: { answer, isCorrect } });
    },
    [currentPair, state.showingResult, transitioning]
  );

  const handleNext = useCallback(() => {
    if (!state.showingResult || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      dispatch({ type: "ADVANCE_ROUND" });
      setTransitioning(false);
    }, 100);
  }, [state.showingResult, transitioning]);

  // Fire completion once when game ends.
  useEffect(() => {
    if (state.gameStatus === "playing") return;
    const won = state.gameStatus === "won";
    const score = calculateHigherLowerScore(state.results);
    const shareText = generateHigherLowerShareText(score, state.results, puzzleDate);

    if (won) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    trackGameCompleted(
      won ? "won" : "lost",
      `${score.points}/${score.maxPoints}`
    );

    onComplete({
      won,
      answer: `${score.points}/${score.maxPoints}`,
      shareText,
    });
    // Intentionally only watch gameStatus — results and other deps are
    // captured at the moment of game-end transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  if (!parsed || pairs.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        Could not load today&apos;s puzzle. Please try again later.
      </div>
    );
  }

  // After all rounds played, render a brief "loading results..." placeholder
  // until the orchestrator's PostGameCTA renders via onComplete.
  if (state.gameStatus !== "playing") {
    return null;
  }

  // currentPair is guaranteed to exist while gameStatus === "playing"
  if (!currentPair) return null;

  const lastResult = state.showingResult ? state.results[state.results.length - 1] : undefined;
  const highlight: "correct" | "wrong" | undefined = state.showingResult
    ? lastResult
      ? "correct"
      : "wrong"
    : undefined;

  return (
    <div className="space-y-4">
      <p className="text-center text-slate-400 text-sm">
        Round {state.currentRound + 1} of {totalRounds}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <PlayerCard entry={currentPair.player1} revealed={true} />
        <PlayerCard
          entry={currentPair.player2}
          revealed={state.showingResult}
          resultHighlight={highlight}
        />
      </div>

      {!state.showingResult ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => handleAnswer("higher")}
            variant="outline"
            className="border-pitch-green/50 text-pitch-green hover:bg-pitch-green/10 h-14"
            aria-label="Higher"
          >
            <ChevronUp className="size-5 mr-2" />
            Higher
          </Button>
          <Button
            type="button"
            onClick={() => handleAnswer("lower")}
            variant="outline"
            className="border-red-card/50 text-red-card hover:bg-red-card/10 h-14"
            aria-label="Lower"
          >
            <ChevronDown className="size-5 mr-2" />
            Lower
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleNext}
          className="w-full h-12 bg-pitch-green text-stadium-navy hover:bg-pitch-green/90"
          aria-label="Next round"
        >
          {state.currentRound + 1 < totalRounds ? "Next round" : "See your score"}
        </Button>
      )}

      <p className="text-center text-slate-500 text-xs">
        Correct so far: {state.results.filter(Boolean).length} / {state.results.length}
      </p>
    </div>
  );
}
```

The component:
- Parses content via `parseHigherLowerContent` (memoised)
- Caps to 10 rounds
- Reducer handles SUBMIT_ANSWER (records answer + shows result), ADVANCE_ROUND (steps to next round or ends the game), RESET
- Shows two PlayerCards per round; player2's stat hidden until the user answers
- "Higher" button = bet player2 ≥ player1; "Lower" = bet player2 < player1
- Reports completion via `onComplete` once gameStatus transitions away from "playing"
- Confetti only on perfect 10

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "HigherLowerGame.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/higher-lower/HigherLowerGame.tsx
git commit -m "feat(higher-lower): add HigherLowerGame component conforming to GameProps"
```

---

## Task 8: Add a smoke test for HigherLowerGame

**Files:**
- Create: `web/components/play/__tests__/HigherLowerGame.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// web/components/play/__tests__/HigherLowerGame.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HigherLowerGame } from "@/components/play/games/higher-lower/HigherLowerGame";
import type { HigherLowerContent } from "@/lib/higher-lower/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: HigherLowerContent = {
  players: [
    { name: "Neymar", context: "Barcelona → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 222 },
    { name: "Mbappé", context: "Monaco → PSG", statLabel: "Transfer Fee", statType: "transfer_fee", value: 180 },
    { name: "Coutinho", context: "Liverpool → Barcelona", statLabel: "Transfer Fee", statType: "transfer_fee", value: 145 },
  ],
};

describe("HigherLowerGame", () => {
  it("renders the round counter and first round's player cards", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Round 1 of/i)).toBeInTheDocument();
    expect(screen.getByText("Neymar")).toBeInTheDocument();
    expect(screen.getByText("Mbappé")).toBeInTheDocument();
  });

  it("shows higher/lower buttons before an answer is submitted", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /^Higher$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Lower$/i })).toBeInTheDocument();
  });

  it("hides the second player's stat value until an answer is submitted", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    // Neymar's value is shown
    expect(screen.getByText("€222m")).toBeInTheDocument();
    // Mbappé's value is hidden behind "?"
    expect(screen.queryByText("€180m")).not.toBeInTheDocument();
    expect(screen.getAllByText("?").length).toBeGreaterThan(0);
  });

  it("reveals the second player's stat and shows a next-round button after an answer", () => {
    render(
      <HigherLowerGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^Lower$/i }));
    expect(screen.getByText("€180m")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next round/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, expect PASS**

Run: `cd web && npx vitest run components/play/__tests__/HigherLowerGame.test.tsx`
Expected: 4/4 PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/__tests__/HigherLowerGame.test.tsx
git commit -m "test(higher-lower): add smoke tests for HigherLowerGame"
```

---

## Task 9: Register higher-lower in GAME_REGISTRY

**Files:**
- Modify: `web/lib/play/registry.ts`

- [ ] **Step 1: Update the registry**

Edit `web/lib/play/registry.ts`:

1. Add the import after the `WhosThatGame` import:
   ```ts
   import { HigherLowerGame } from "@/components/play/games/higher-lower/HigherLowerGame";
   ```

2. Extend the constants import with `FALLBACK_HIGHER_LOWER_PUZZLE`:
   ```ts
   import {
     FALLBACK_CAREER_PUZZLE,
     FALLBACK_TRANSFER_PUZZLE,
     FALLBACK_CONNECTIONS_PUZZLE,
     FALLBACK_QUIZ_PUZZLE,
     FALLBACK_TIMELINE_PUZZLE,
     FALLBACK_WHOS_THAT_PUZZLE,
     FALLBACK_HIGHER_LOWER_PUZZLE,
   } from "@/lib/constants";
   ```

3. Add the `HigherLowerContent` type import below the existing `WhosThatContent` type import:
   ```ts
   import type { HigherLowerContent } from "@/lib/higher-lower/types";
   ```

4. Extend the `AnyGameRegistryEntry` union — append `| GameRegistryEntry<HigherLowerContent>`:
   ```ts
   export type AnyGameRegistryEntry =
     | GameRegistryEntry<CareerPathContent>
     | GameRegistryEntry<TransferGuessContent>
     | GameRegistryEntry<ConnectionsContent>
     | GameRegistryEntry<TopicalQuizContent>
     | GameRegistryEntry<TimelineContent>
     | GameRegistryEntry<WhosThatContent>
     | GameRegistryEntry<HigherLowerContent>;
   ```

5. Add the new registry entry after the `"whos-that"` entry inside `GAME_REGISTRY`:
   ```ts
     "higher-lower": {
       dbMode: "higher_lower",
       title: "Higher/Lower",
       component: HigherLowerGame,
       fallbackContent: FALLBACK_HIGHER_LOWER_PUZZLE as HigherLowerContent,
     },
   ```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "play/registry.ts"`
Expected: no output.

- [ ] **Step 3: Run existing DailyPuzzleClient tests to confirm no regressions**

Run: `cd web && npx vitest run components/play/__tests__/DailyPuzzleClient.test.tsx`
Expected: 3/3 PASS.

- [ ] **Step 4: Commit**

```bash
git add web/lib/play/registry.ts
git commit -m "feat(higher-lower): register higher-lower in GAME_REGISTRY"
```

---

## Task 10: Create the SEO page

**Files:**
- Create: `web/app/play/higher-lower/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// web/app/play/higher-lower/page.tsx
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Higher/Lower — Daily Football Stats Game | Football IQ",
    description:
      "Higher or lower? Compare real footballer stats over 10 rounds. Transfer fees, goals, caps, appearances. A new puzzle every day. Free to play in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/higher-lower`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Higher/Lower — Daily Football Stats Game | Football IQ",
      description:
        "Higher or lower? Compare real footballer stats. 10 rounds, free to play, new puzzle every day.",
      url: `${BASE_URL}/play/higher-lower`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/higher-lower`,
          width: 1200,
          height: 630,
          alt: "Higher/Lower - Daily football stats comparison game",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Higher/Lower — Daily Football Stats Game | Football IQ",
      description:
        "10 rounds. Compare real player stats. Free daily puzzle, no download needed.",
      images: [`${BASE_URL}/api/og/play/higher-lower`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function HigherLowerPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Higher/Lower — Daily Football Stats Game",
              description:
                "Compare two footballers' stats over 10 rounds. Higher or lower? Transfer fees, goals, caps, appearances. New puzzle every day.",
              url: `${BASE_URL}/play/higher-lower`,
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
                  name: "Higher/Lower",
                  item: `${BASE_URL}/play/higher-lower`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Higher/Lower work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "You see two real footballers and a stat (transfer fee, goals, caps, etc.). For each round you pick whether the second player's value is higher or lower than the first. Get as many right as you can across 10 rounds.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Higher/Lower free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Football IQ publishes a new Higher/Lower puzzle every day and today's puzzle is always free in your browser at football-iq.app — no signup or download required.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What stats are compared?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Transfer fees, league appearances, international caps, goals, assists, and clean sheets. The stat being compared is shown on the card, so you always know what you're betting on.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="higher-lower" date={params.date} />
      <HowToPlay
        title="Higher/Lower"
        rules={[
          "Two footballers are shown per round. Player 1's stat is revealed; Player 2's stat is hidden.",
          "Tap 'Higher' if you think Player 2's stat is higher than (or equal to) Player 1's. Tap 'Lower' if you think it's lower.",
          "After each answer the stat is revealed and you see whether you were right.",
          "Play all 10 rounds. Score = number correct out of 10. A perfect 10 is a clean sweep.",
        ]}
        tips={[
          "Pay attention to the stat label — transfer fees and appearances live on very different scales.",
          "Use eras as anchors: pre-2000 transfers were smaller; modern Premier League fees are inflated.",
          "Career length matters for appearances and caps — long-serving veterans outpace shorter careers by a lot.",
        ]}
        keywords="Higher/Lower is a daily football stats comparison game. Pick whether each next player has a higher or lower stat than the previous one. 10 rounds, free to play in your browser, new puzzle every day."
      />
    </>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "higher-lower/page.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/app/play/higher-lower/page.tsx
git commit -m "feat(higher-lower): add SEO page at /play/higher-lower"
```

---

## Task 11: Full verification + dev-server smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run all play + higher-lower tests**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run components/play/__tests__/ lib/whos-that/__tests__/ lib/higher-lower/__tests__/`
Expected: all tests pass. ~122 from prior phases + 4 (formatStatValue) + 4 (scoring) + 4 (share) + 9 (content) + 4 (HigherLowerGame smoke) = ~147 tests.

- [ ] **Step 2: Run full TS check**

Run: `cd web && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Run production build**

Run: `cd web && npm run build 2>&1 | grep -E "Compiled successfully|/play/higher-lower|Build error"`
Expected: build succeeds; `/play/higher-lower` appears in the routes output.

- [ ] **Step 4: Dev-server smoke test**

Start dev server in a separate shell: `cd web && PORT=3459 npm run dev`. Wait for "Ready".

Run: `curl -sf -o /tmp/hl.html -w "%{http_code}\n" "http://localhost:3459/play/higher-lower"`
Expected: `200`.

Run: `grep -c -i "Higher/Lower\|schema.org\|How does Higher/Lower\|10 rounds" /tmp/hl.html`
Expected: > 0.

Stop dev server.

- [ ] **Step 5: Manual browser verification**

Restart dev server and visit `http://localhost:3459/play/higher-lower`:
- Nav title shows "HIGHER/LOWER" (uppercased by `GameNav`)
- Two player cards visible — first shows stat value, second shows "?"
- Round counter shows "Round 1 of 10"
- Click "Higher" or "Lower" → second card reveals stat with green/red ring, "Next round" button appears
- Play through all 10 rounds → orchestrator's post-game CTA shows with share text
- Confetti fires only on perfect 10
- Refresh the page after completing → `PlayedTodayGate` shows the "you've played today" view

Stop dev server.

- [ ] **Step 6: Final commit (if any cleanup) + tag**

If smoke surfaced cleanup, commit it:

```bash
git add <files>
git commit -m "fix(higher-lower): post-smoke cleanup"
```

Tag:

```bash
git tag -a phase-1.2-higher-lower -m "Phase 1.2 complete: Higher/Lower playable on /play/higher-lower"
```

---

## Verification summary

After all tasks complete:
- `/play/higher-lower` renders the playable 10-round stats-comparison game using the orchestrator
- Pure logic (parsing, scoring, share, formatting) is testable in isolation; ~21 new unit tests cover it
- 7 games are now web-playable (Career Path, Transfer Guess, Connections, Topical Quiz, Timeline, Who's That?, Higher/Lower)
- 3 games remain mobile-only on this branch's track (Top Tens, Starting XI, The Grid, Who Am I? — Phases 1.3 + 1.4)
- Pattern is locked: adding a new game = ~10 focused tasks (pure logic + UI + registry + SEO page)

Next: Phase 1.3 (Top Tens) — same pattern, no autocomplete, simple list-guessing UI.
