# Phase 1.1 — Who's That? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the "Who's That?" game mode (Wordle-for-footballers — 6 guesses, attribute feedback) from the mobile app to the web, plugged into the Phase 1.0 orchestrator at `/play/whos-that`. Highest priority game per the spec because it's a daily-play game with strong SEO potential.

**Architecture:** Pure-logic utilities (feedback, nationalities, scoring, share) port verbatim from the mobile feature into `web/lib/whos-that/`. UI is rebuilt in React: an autocomplete-driven `<WhosThatGame />` component that owns reducer state, looks up player attributes via two new public API endpoints, generates feedback, and reports completion via the `GameProps<WhosThatContent>` contract. Wires into `GAME_REGISTRY` and ships at `/play/whos-that` as a thin SEO wrapper around `<DailyPuzzleGame mode="whos-that">`.

**Tech Stack:** Next.js 15 (App Router, RSC), React 18, TypeScript, Tailwind, Vitest + @testing-library/react, Supabase RPC (`search_players_oracle` + `get_balldle_attributes`).

**Spec:** `docs/superpowers/specs/2026-05-10-website-games-migration-design.md` (Phase 1.1 in the Phasing section).
**Dependencies:** Phase 1.0 (orchestrator + game registry + `GameProps<T>` contract) — complete on this branch.

---

## File structure

**Create:**
- `web/lib/whos-that/types.ts` — `WhosThatContent`, `FeedbackColor`, `AttributeFeedback`, `GuessFeedback`, `GuessInput`, `WhosThatState`, `WhosThatAction` (re-export `WhosThatContent` from `puzzle-schemas` + locally-defined feedback/state shapes)
- `web/lib/whos-that/nationalities.ts` — `NATIONALITY_MAP`, `nationalityCodeToName(code)`
- `web/lib/whos-that/feedback.ts` — `CONTINENT_MAP`, `POSITION_CATEGORY`, `generateFeedback(guess, answer)`
- `web/lib/whos-that/scoring.ts` — `WhosThatScore`, `calculateWhosThatScore`, `formatWhosThatScore`
- `web/lib/whos-that/share.ts` — `generateWhosThatEmojiGrid`, `generateWhosThatShareText` (web-only, no RN imports)
- `web/lib/whos-that/__tests__/feedback.test.ts` — feedback unit tests
- `web/lib/whos-that/__tests__/scoring.test.ts` — scoring unit tests
- `web/lib/whos-that/__tests__/share.test.ts` — share text unit tests
- `web/app/api/games/whos-that/search/route.ts` — public GET endpoint: search players by name (no auth, simple rate limit)
- `web/app/api/games/whos-that/player/[id]/route.ts` — public GET endpoint: return full attribute set for a player
- `web/components/play/games/whos-that/GuessRow.tsx` — one filled-guess row (5 attribute cells)
- `web/components/play/games/whos-that/Grid.tsx` — full 6-row grid (filled + empty placeholders, no animation v1)
- `web/components/play/games/whos-that/PlayerSearchInput.tsx` — autocomplete combobox
- `web/components/play/games/whos-that/WhosThatGame.tsx` — orchestrator-facing component, implements `GameProps<WhosThatContent>`
- `web/components/play/__tests__/WhosThatGame.test.tsx` — smoke test for the game component
- `web/app/play/whos-that/page.tsx` — SEO wrapper rendering `<DailyPuzzleGame mode="whos-that">`

**Modify:**
- `web/lib/constants.ts` — add `FALLBACK_WHOS_THAT_PUZZLE`; add `whos-that` entry to `WEB_PLAYABLE_GAMES`
- `web/lib/play/registry.ts` — add `whos-that` registry entry
- `web/lib/play/registry.ts` types union — extend `AnyGameRegistryEntry` to include `GameRegistryEntry<WhosThatContent>`

**Out of scope (deferred):**
- Premium gating (Phase 3.2)
- Archive picker (Phase 3.2)
- Animations on incorrect-guess shake / row reveal (v2 polish)
- Onboarding / GameIntroScreen equivalent (web users land directly on the game; the SEO copy handles introduction)
- Mobile-style attempt persistence across reloads (web uses the orchestrator's standard `playSession` for "played today" detection)
- Country flag rendering inside the autocomplete (v2 polish)

---

## Task 1: Add fallback puzzle + WEB_PLAYABLE_GAMES entry + WhosThatContent re-export

**Files:**
- Modify: `web/lib/constants.ts`
- Create: `web/lib/whos-that/types.ts`

- [ ] **Step 1: Add fallback puzzle to constants**

Open `web/lib/constants.ts`. Find the existing `FALLBACK_QUIZ_PUZZLE` declaration. Add this constant immediately after it (before any other code):

```ts
export const FALLBACK_WHOS_THAT_PUZZLE = {
  answer: {
    player_name: "Mohamed Salah",
    player_id: "Q346551",
    club: "Liverpool",
    league: "Premier League",
    nationality: "Egypt",
    position: "Right Winger",
    birth_year: 1992,
  },
};
```

- [ ] **Step 2: Add Who's That? to WEB_PLAYABLE_GAMES**

In the same file, find the `WEB_PLAYABLE_GAMES` array. Add a new entry at the end of the array (before the closing `];`):

```ts
  {
    dbMode: "whos-that",
    slug: "whos-that",
    title: "Who's That?",
    description: "Wordle for footballers — 6 guesses, attribute feedback",
    accentColor: "#A855F7",
  },
```

Also remove the matching `Who's That?` entry from the `APP_ONLY_GAMES` array (currently at the bottom — the line `{ title: "Who's That?", description: "Wordle for footballers — 6 guesses, attribute feedback" },`). It's no longer app-only.

- [ ] **Step 3: Create the types module**

```ts
// web/lib/whos-that/types.ts
export type { WhosThatContent } from "@/lib/schemas/puzzle-schemas";

/** Colour-coded feedback for a single attribute cell. */
export type FeedbackColor = "green" | "yellow" | "red";

export interface AttributeFeedback {
  /** Display value shown in the cell. */
  value: string;
  /** Colour indicating correctness. */
  color: FeedbackColor;
  /** Direction arrow for birth-year attribute. */
  direction?: "up" | "down";
}

/** Feedback for a single guess (one row in the grid). */
export interface GuessFeedback {
  playerName: string;
  club: AttributeFeedback;
  league: AttributeFeedback;
  nationality: AttributeFeedback;
  position: AttributeFeedback;
  birthYear: AttributeFeedback;
}

/** Attributes of a guessed player (input to feedback generation). */
export interface GuessInput {
  playerName: string;
  club: string;
  league: string;
  nationality: string;
  position: string;
  birthYear: number;
}

/** Game state. */
export interface WhosThatState {
  guesses: GuessFeedback[];
  maxGuesses: number;
  gameStatus: "playing" | "won" | "lost";
  lastGuessIncorrect: boolean;
}

export type WhosThatAction =
  | { type: "SUBMIT_GUESS"; payload: GuessFeedback & { isCorrect: boolean } }
  | { type: "CLEAR_SHAKE" }
  | { type: "RESET" };

export function createInitialState(): WhosThatState {
  return {
    guesses: [],
    maxGuesses: 6,
    gameStatus: "playing",
    lastGuessIncorrect: false,
  };
}
```

- [ ] **Step 4: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -E "constants.ts|whos-that/types.ts"`
Expected: no output (zero errors in these files).

- [ ] **Step 5: Commit**

```bash
git add web/lib/constants.ts web/lib/whos-that/types.ts
git commit -m "feat(whos-that): add fallback puzzle, types module, WEB_PLAYABLE_GAMES entry"
```

---

## Task 2: Port the nationalities map

**Files:**
- Create: `web/lib/whos-that/nationalities.ts`

- [ ] **Step 1: Write the nationalities module**

Copy the full ISO-code mapping from the mobile feature verbatim. Long but flat data:

```ts
// web/lib/whos-that/nationalities.ts

/**
 * ISO country code → display name mapping for Who's That?.
 * Covers all nationality_code values in the players table.
 */
export const NATIONALITY_MAP: Record<string, string> = {
  // British home nations (GB subdivisions)
  "GB-ENG": "England",
  "GB-SCT": "Scotland",
  "GB-WLS": "Wales",
  "GB-NIR": "Northern Ireland",

  // Europe
  AD: "Andorra", AL: "Albania", AM: "Armenia", AT: "Austria", AZ: "Azerbaijan",
  BA: "Bosnia", BE: "Belgium", BG: "Bulgaria", BY: "Belarus", CH: "Switzerland",
  CY: "Cyprus", CZ: "Czech Republic", DE: "Germany", DK: "Denmark", EE: "Estonia",
  ES: "Spain", FI: "Finland", FO: "Faroe Islands", FR: "France", GE: "Georgia",
  GI: "Gibraltar", GR: "Greece", HR: "Croatia", HU: "Hungary", IE: "Republic of Ireland",
  IS: "Iceland", IT: "Italy", LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg",
  LV: "Latvia", ME: "Montenegro", MK: "North Macedonia", NL: "Netherlands", NO: "Norway",
  PL: "Poland", PT: "Portugal", RO: "Romania", RS: "Serbia", RU: "Russia",
  SE: "Sweden", SI: "Slovenia", SK: "Slovakia", SM: "San Marino", TR: "Turkey",
  UA: "Ukraine", XK: "Kosovo",

  // South America
  AR: "Argentina", BO: "Bolivia", BR: "Brazil", CL: "Chile", CO: "Colombia",
  EC: "Ecuador", GF: "French Guiana", GY: "Guyana", PE: "Peru", PY: "Paraguay",
  SR: "Suriname", UY: "Uruguay", VE: "Venezuela",

  // Africa
  AO: "Angola", BF: "Burkina Faso", BH: "Bahrain", BI: "Burundi", BJ: "Benin",
  CD: "DR Congo", CF: "Central African Republic", CG: "Congo", CI: "Ivory Coast",
  CM: "Cameroon", CV: "Cape Verde", DZ: "Algeria", EG: "Egypt", GA: "Gabon",
  GH: "Ghana", GM: "Gambia", GN: "Guinea", GQ: "Equatorial Guinea", GW: "Guinea-Bissau",
  KE: "Kenya", LR: "Liberia", LY: "Libya", MA: "Morocco", MG: "Madagascar",
  ML: "Mali", MR: "Mauritania", MZ: "Mozambique", NG: "Nigeria", SC: "Seychelles",
  SL: "Sierra Leone", SN: "Senegal", TG: "Togo", TN: "Tunisia", TZ: "Tanzania",
  ZA: "South Africa", ZM: "Zambia", ZW: "Zimbabwe",

  // North/Central America & Caribbean
  AG: "Antigua and Barbuda", BB: "Barbados", BM: "Bermuda", CA: "Canada",
  CR: "Costa Rica", CW: "Curacao", DO: "Dominican Republic", GD: "Grenada",
  GP: "Guadeloupe", GT: "Guatemala", HN: "Honduras", HT: "Haiti", JM: "Jamaica",
  KN: "Saint Kitts and Nevis", MQ: "Martinique", MS: "Montserrat", MX: "Mexico",
  PA: "Panama", SV: "El Salvador", TT: "Trinidad", US: "United States",

  // Asia
  AE: "UAE", BD: "Bangladesh", CN: "China", ID: "Indonesia", IL: "Israel",
  IN: "India", IQ: "Iraq", IR: "Iran", JO: "Jordan", JP: "Japan",
  KH: "Cambodia", KP: "North Korea", KR: "South Korea", LB: "Lebanon", MY: "Malaysia",
  OM: "Oman", PH: "Philippines", PK: "Pakistan", QA: "Qatar", SA: "Saudi Arabia",
  SG: "Singapore", TH: "Thailand", UZ: "Uzbekistan", VN: "Vietnam",

  // Oceania
  AU: "Australia", FJ: "Fiji", NZ: "New Zealand", PF: "French Polynesia", BT: "Bhutan",
};

/**
 * Convert an ISO nationality code to a display name.
 * Returns the code itself if no mapping exists.
 */
export function nationalityCodeToName(code: string): string {
  return NATIONALITY_MAP[code] ?? code;
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -F "nationalities.ts"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/lib/whos-that/nationalities.ts
git commit -m "feat(whos-that): port nationalities map from mobile"
```

---

## Task 3: Port the feedback generator with tests

**Files:**
- Create: `web/lib/whos-that/feedback.ts`
- Create: `web/lib/whos-that/__tests__/feedback.test.ts`

- [ ] **Step 1: Write the failing test first**

Create `web/lib/whos-that/__tests__/feedback.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateFeedback } from "../feedback";

const ANSWER = {
  player_name: "Mohamed Salah",
  player_id: "Q346551",
  club: "Liverpool",
  league: "Premier League",
  nationality: "Egypt",
  position: "Right Winger",
  birth_year: 1992,
};

describe("generateFeedback", () => {
  it("returns all-green for the exact correct player", () => {
    const fb = generateFeedback(
      {
        playerName: "Mohamed Salah",
        club: "Liverpool",
        league: "Premier League",
        nationality: "Egypt",
        position: "Right Winger",
        birthYear: 1992,
      },
      ANSWER
    );
    expect(fb.club.color).toBe("green");
    expect(fb.league.color).toBe("green");
    expect(fb.nationality.color).toBe("green");
    expect(fb.position.color).toBe("green");
    expect(fb.birthYear.color).toBe("green");
  });

  it("returns red on wrong club and wrong league", () => {
    const fb = generateFeedback(
      {
        playerName: "Lionel Messi",
        club: "Inter Miami",
        league: "Major League Soccer",
        nationality: "Argentina",
        position: "Right Winger",
        birthYear: 1987,
      },
      ANSWER
    );
    expect(fb.club.color).toBe("red");
    expect(fb.league.color).toBe("red");
  });

  it("returns yellow on same continent nationality, red otherwise", () => {
    // Same continent (Africa): Senegal vs Egypt = yellow
    const sameContinent = generateFeedback(
      { playerName: "Sadio Mane", club: "Al-Nassr", league: "Saudi Pro League",
        nationality: "Senegal", position: "Left Winger", birthYear: 1992 },
      ANSWER
    );
    expect(sameContinent.nationality.color).toBe("yellow");

    // Different continent (Europe vs Africa): Spain vs Egypt = red
    const diff = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Spain", position: "Right Winger", birthYear: 1992 },
      ANSWER
    );
    expect(diff.nationality.color).toBe("red");
  });

  it("returns yellow on same position category, red otherwise", () => {
    // Same category (Forward): Striker vs Right Winger = yellow
    const sameCategory = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Striker", birthYear: 1992 },
      ANSWER
    );
    expect(sameCategory.position.color).toBe("yellow");

    // Different category (Defender vs Forward) = red
    const diff = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Centre-Back", birthYear: 1992 },
      ANSWER
    );
    expect(diff.position.color).toBe("red");
  });

  it("returns yellow on birthYear within ±2 with direction arrow, red otherwise", () => {
    const close = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Right Winger", birthYear: 1990 },
      ANSWER
    );
    expect(close.birthYear.color).toBe("yellow");
    expect(close.birthYear.direction).toBe("up"); // 1990 < 1992 → arrow points up (older guess, need younger)

    const far = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Right Winger", birthYear: 1980 },
      ANSWER
    );
    expect(far.birthYear.color).toBe("red");
    expect(far.birthYear.direction).toBe("up");
  });

  it("strips F.C. / A.F.C. suffix from club display value", () => {
    const fb = generateFeedback(
      {
        playerName: "X",
        club: "Arsenal F.C.",
        league: "Premier League",
        nationality: "Egypt",
        position: "Right Winger",
        birthYear: 1992,
      },
      { ...ANSWER, club: "Arsenal" }
    );
    expect(fb.club.value).toBe("Arsenal");
    expect(fb.club.color).toBe("green");
  });

  it("maps ISO nationality codes via nationalityCodeToName", () => {
    const fb = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "EG", position: "Right Winger", birthYear: 1992 },
      ANSWER
    );
    expect(fb.nationality.value).toBe("Egypt");
    expect(fb.nationality.color).toBe("green");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run lib/whos-that/__tests__/feedback.test.ts`
Expected: FAIL — `generateFeedback` does not exist yet.

- [ ] **Step 3: Write the feedback module**

```ts
// web/lib/whos-that/feedback.ts
import type {
  AttributeFeedback,
  FeedbackColor,
  GuessFeedback,
  GuessInput,
  WhosThatContent,
} from "./types";
import { nationalityCodeToName } from "./nationalities";

const CONTINENT_MAP: Record<string, string> = {
  // Europe
  England: "Europe", France: "Europe", Germany: "Europe", Spain: "Europe", Italy: "Europe",
  Portugal: "Europe", Netherlands: "Europe", Belgium: "Europe", Croatia: "Europe",
  Serbia: "Europe", Scotland: "Europe", Wales: "Europe", Poland: "Europe", Denmark: "Europe",
  Sweden: "Europe", Norway: "Europe", Switzerland: "Europe", Austria: "Europe",
  "Czech Republic": "Europe", Turkey: "Europe", Ukraine: "Europe",
  "Republic of Ireland": "Europe", Greece: "Europe", Hungary: "Europe", Slovakia: "Europe",
  Slovenia: "Europe", Finland: "Europe", Romania: "Europe", Bulgaria: "Europe",
  Albania: "Europe", "North Macedonia": "Europe", Bosnia: "Europe", Montenegro: "Europe",
  Kosovo: "Europe", Iceland: "Europe", "Northern Ireland": "Europe", Luxembourg: "Europe",

  // South America
  Brazil: "South America", Argentina: "South America", Colombia: "South America",
  Uruguay: "South America", Chile: "South America", Ecuador: "South America",
  Paraguay: "South America", Peru: "South America", Venezuela: "South America",
  Bolivia: "South America",

  // Africa
  Nigeria: "Africa", Senegal: "Africa", Ghana: "Africa", Cameroon: "Africa", Egypt: "Africa",
  Morocco: "Africa", Algeria: "Africa", "Ivory Coast": "Africa", Tunisia: "Africa",
  Mali: "Africa", "DR Congo": "Africa", "South Africa": "Africa", Guinea: "Africa",
  Gabon: "Africa", Benin: "Africa", "Burkina Faso": "Africa", Mozambique: "Africa",

  // North/Central America & Caribbean
  "United States": "North America", Mexico: "North America", Canada: "North America",
  Jamaica: "North America", "Costa Rica": "North America", Honduras: "North America",
  Panama: "North America", Trinidad: "North America", Cuba: "North America",
  Haiti: "North America", Guatemala: "North America", "El Salvador": "North America",
  Nicaragua: "North America",

  // Asia
  Japan: "Asia", "South Korea": "Asia", Iran: "Asia", "Saudi Arabia": "Asia",
  China: "Asia", Qatar: "Asia", UAE: "Asia", Iraq: "Asia", Uzbekistan: "Asia",

  // Oceania
  Australia: "Oceania", "New Zealand": "Oceania",
};

const POSITION_CATEGORY: Record<string, string> = {
  Goalkeeper: "Goalkeeper",
  "Centre-Back": "Defender", "Left-Back": "Defender", "Right-Back": "Defender",
  "Wing-Back": "Defender", Defender: "Defender",
  "Defensive Midfielder": "Midfielder", "Central Midfielder": "Midfielder",
  "Attacking Midfielder": "Midfielder", "Left Midfielder": "Midfielder",
  "Right Midfielder": "Midfielder", Midfielder: "Midfielder",
  "Left Winger": "Forward", "Right Winger": "Forward", "Centre-Forward": "Forward",
  Striker: "Forward", Forward: "Forward", Winger: "Forward",
};

function getContinent(nationality: string): string {
  return CONTINENT_MAP[nationality] ?? "Unknown";
}

function getPositionCategory(position: string): string {
  return POSITION_CATEGORY[position] ?? position;
}

function clubsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const normalize = (s: string) =>
    s
      .replace(/ F\.?C\.?$/i, "")
      .replace(/^AFC /i, "")
      .replace(/ A\.?F\.?C\.?$/i, "")
      .replace(/ & .*$/i, "")
      .trim()
      .toLowerCase();
  return normalize(a) === normalize(b);
}

function nationalityFeedback(
  guessNationality: string,
  answerNationality: string
): AttributeFeedback {
  const guessName = nationalityCodeToName(guessNationality);
  const answerName = nationalityCodeToName(answerNationality);

  if (guessName === answerName) {
    return { value: guessName, color: "green" };
  }
  const guessContinent = getContinent(guessName);
  const answerContinent = getContinent(answerName);
  if (guessContinent !== "Unknown" && guessContinent === answerContinent) {
    return { value: guessName, color: "yellow" };
  }
  return { value: guessName, color: "red" };
}

function positionFeedback(
  guessPosition: string,
  answerPosition: string
): AttributeFeedback {
  if (guessPosition === answerPosition) {
    return { value: guessPosition, color: "green" };
  }
  const guessCategory = getPositionCategory(guessPosition);
  const answerCategory = getPositionCategory(answerPosition);
  if (guessCategory === answerCategory) {
    return { value: guessPosition, color: "yellow" };
  }
  return { value: guessPosition, color: "red" };
}

function birthYearFeedback(
  guessBirthYear: number,
  answerBirthYear: number
): AttributeFeedback {
  if (guessBirthYear === answerBirthYear) {
    return { value: String(guessBirthYear), color: "green" };
  }
  const diff = Math.abs(guessBirthYear - answerBirthYear);
  const color: FeedbackColor = diff <= 2 ? "yellow" : "red";
  // Born earlier = older player, arrow points up (need younger); born later = arrow down
  const direction = guessBirthYear < answerBirthYear ? "up" : "down";
  return { value: String(guessBirthYear), color, direction };
}

/**
 * Generate feedback for a single guess against the puzzle answer.
 */
export function generateFeedback(
  guess: GuessInput,
  answer: WhosThatContent["answer"]
): GuessFeedback {
  const displayClub = guess.club
    .replace(/ F\.?C\.?$/i, "")
    .replace(/ A\.?F\.?C\.?$/i, "")
    .trim();

  return {
    playerName: guess.playerName,
    club: {
      value: displayClub || guess.club,
      color: clubsMatch(guess.club, answer.club) ? "green" : "red",
    },
    league: {
      value: guess.league,
      color: guess.league.toLowerCase() === answer.league.toLowerCase() ? "green" : "red",
    },
    nationality: nationalityFeedback(guess.nationality, answer.nationality),
    position: positionFeedback(guess.position, answer.position),
    birthYear: birthYearFeedback(guess.birthYear, answer.birth_year),
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd web && npx vitest run lib/whos-that/__tests__/feedback.test.ts`
Expected: 7/7 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/whos-that/feedback.ts web/lib/whos-that/__tests__/feedback.test.ts
git commit -m "feat(whos-that): port feedback generator with tests"
```

---

## Task 4: Port the scoring module with tests

**Files:**
- Create: `web/lib/whos-that/scoring.ts`
- Create: `web/lib/whos-that/__tests__/scoring.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/whos-that/__tests__/scoring.test.ts
import { describe, it, expect } from "vitest";
import { calculateWhosThatScore, formatWhosThatScore } from "../scoring";

describe("calculateWhosThatScore", () => {
  it("awards 6 points for getting it on attempt 1", () => {
    expect(calculateWhosThatScore(1, true)).toEqual({
      points: 6, maxPoints: 6, guessCount: 1, won: true,
    });
  });
  it("awards 1 point for getting it on the last (6th) attempt", () => {
    expect(calculateWhosThatScore(6, true).points).toBe(1);
  });
  it("awards 0 points when the player loses", () => {
    expect(calculateWhosThatScore(6, false).points).toBe(0);
  });
});

describe("formatWhosThatScore", () => {
  it("formats as X/Y", () => {
    expect(formatWhosThatScore({ points: 4, maxPoints: 6, guessCount: 3, won: true })).toBe("4/6");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd web && npx vitest run lib/whos-that/__tests__/scoring.test.ts`
Expected: FAIL — `calculateWhosThatScore` not defined.

- [ ] **Step 3: Write the scoring module**

```ts
// web/lib/whos-that/scoring.ts

/** Score data for a completed Who's That? game. */
export interface WhosThatScore {
  /** Points earned (0-6). */
  points: number;
  /** Maximum possible points (6). */
  maxPoints: number;
  /** Number of guesses used. */
  guessCount: number;
  /** Whether the player guessed correctly. */
  won: boolean;
}

/**
 * Calculate the final score for a Who's That? game.
 * Attempt 1 = 6 points; attempt 6 = 1 point; loss = 0 points.
 */
export function calculateWhosThatScore(guessCount: number, won: boolean): WhosThatScore {
  const maxPoints = 6;
  const points = won ? maxPoints - (guessCount - 1) : 0;
  return { points, maxPoints, guessCount, won };
}

/** Format score for display as "X/Y" string. */
export function formatWhosThatScore(score: WhosThatScore): string {
  return `${score.points}/${score.maxPoints}`;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd web && npx vitest run lib/whos-that/__tests__/scoring.test.ts`
Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/whos-that/scoring.ts web/lib/whos-that/__tests__/scoring.test.ts
git commit -m "feat(whos-that): port scoring with tests"
```

---

## Task 5: Port the share-text generator with tests

**Files:**
- Create: `web/lib/whos-that/share.ts`
- Create: `web/lib/whos-that/__tests__/share.test.ts`

- [ ] **Step 1: Write the failing test first**

```ts
// web/lib/whos-that/__tests__/share.test.ts
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
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd web && npx vitest run lib/whos-that/__tests__/share.test.ts`
Expected: FAIL — `generateWhosThatEmojiGrid` / `generateWhosThatShareText` not defined.

- [ ] **Step 3: Write the share module**

```ts
// web/lib/whos-that/share.ts
import type { WhosThatScore } from "./scoring";
import type { GuessFeedback } from "./types";

/**
 * Generate emoji grid summary for a Who's That? result.
 * Each row: club + league + nationality + position + birth-year squares.
 */
export function generateWhosThatEmojiGrid(guesses: GuessFeedback[]): string {
  const colorToEmoji: Record<string, string> = {
    green: "🟩",
    yellow: "🟨",
    red: "🟥",
  };

  return guesses
    .map((g) =>
      [g.club, g.league, g.nationality, g.position, g.birthYear]
        .map((attr) => colorToEmoji[attr.color] ?? "⬜")
        .join("")
    )
    .join("\n");
}

/**
 * Generate share text for a Who's That? result.
 */
export function generateWhosThatShareText(
  score: WhosThatScore,
  guesses: GuessFeedback[],
  puzzleDate?: string
): string {
  const dateStr = puzzleDate
    ? new Date(puzzleDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  const emojiGrid = generateWhosThatEmojiGrid(guesses);

  const firstLine = score.won
    ? score.guessCount === 1
      ? "Got it in one!"
      : `Got it in ${score.guessCount}/${score.maxPoints} guesses`
    : `Couldn't crack it in ${score.maxPoints} tries`;

  const playUrl = puzzleDate
    ? `https://football-iq.app/play/whos-that?ref=share&mode=whos-that&date=${puzzleDate}`
    : "https://football-iq.app/play/whos-that?ref=share&mode=whos-that";

  return [
    "Football IQ — Who's That?",
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

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd web && npx vitest run lib/whos-that/__tests__/share.test.ts`
Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/whos-that/share.ts web/lib/whos-that/__tests__/share.test.ts
git commit -m "feat(whos-that): port share-text generator with tests"
```

---

## Task 6: Build the public player-search API endpoint

**Files:**
- Create: `web/app/api/games/whos-that/search/route.ts`

- [ ] **Step 1: Write the endpoint**

```ts
// web/app/api/games/whos-that/search/route.ts
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PlayerSearchResult {
  id: string;
  name: string;
  birth_year: number | null;
  position_category: string | null;
  nationality_code: string | null;
}

/**
 * Public player-name autocomplete endpoint for the Who's That? game.
 * No auth required (the data exposed here is name + birth year + nationality code +
 * broad position — none of which are sensitive). Limited to top 10 results.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return Response.json({ players: [] satisfies PlayerSearchResult[] });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("search_players_oracle", {
    query_text: q,
    match_limit: 10,
    active_only: true,
  });

  if (error || !data) {
    return Response.json(
      { players: [] satisfies PlayerSearchResult[], error: "search_failed" },
      { status: 500 }
    );
  }

  const players: PlayerSearchResult[] = data.map((row: {
    id: string;
    name: string;
    birth_year: number | null;
    position_category: string | null;
    nationality_code: string | null;
  }) => ({
    id: row.id,
    name: row.name,
    birth_year: row.birth_year,
    position_category: row.position_category,
    nationality_code: row.nationality_code,
  }));

  return Response.json({ players });
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -F "whos-that/search/route.ts"`
Expected: no output.

- [ ] **Step 3: Smoke-test the endpoint**

Start dev server in a separate shell: `cd web && PORT=3457 npm run dev` (or use existing background process).

Run: `curl -s "http://localhost:3457/api/games/whos-that/search?q=salah" | head -c 200`
Expected: a JSON response like `{"players":[{"id":"Q346551","name":"Mohamed Salah","birth_year":1992,"position_category":"Forward","nationality_code":"EG"}, ...]}`. At minimum, the request returns valid JSON with a `players` array (may be empty if the local DB doesn't have player data — that's fine).

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add web/app/api/games/whos-that/search/route.ts
git commit -m "feat(whos-that): add public player-search API endpoint"
```

---

## Task 7: Build the public player-attributes API endpoint

**Files:**
- Create: `web/app/api/games/whos-that/player/[id]/route.ts`

- [ ] **Step 1: Write the endpoint**

```ts
// web/app/api/games/whos-that/player/[id]/route.ts
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PlayerAttributes {
  club: string;
  league: string;
  birth_year: number | null;
}

/**
 * Public player-attributes lookup for the Who's That? game.
 * Returns the player's current club + league via the `get_balldle_attributes` RPC.
 * Used to enrich an autocomplete-selected player with the data needed to generate
 * feedback. Retired players (no current club) return `club: ""` — the client
 * rejects those before submitting a guess.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 2) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("get_balldle_attributes", {
    p_player_id: id,
  });

  if (error || data == null) {
    return Response.json({ error: "lookup_failed" }, { status: 500 });
  }

  const attrs = typeof data === "string" ? JSON.parse(data) : data;
  const club: string = (attrs?.club ?? "")
    .replace(/ F\.?C\.?$/i, "")
    .replace(/ A\.?F\.?C\.?$/i, "")
    .trim();

  const result: PlayerAttributes = {
    club,
    league: typeof attrs?.league === "string" ? attrs.league : "",
    birth_year: typeof attrs?.birth_year === "number" ? attrs.birth_year : null,
  };

  return Response.json(result);
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "whos-that/player"`
Expected: no output.

- [ ] **Step 3: Smoke-test the endpoint**

Start dev server. Run: `curl -s "http://localhost:3457/api/games/whos-that/player/Q346551" | head -c 200`
Expected: JSON like `{"club":"Liverpool","league":"Premier League","birth_year":1992}`, OR `{"club":"","league":"","birth_year":null}` if the player isn't in your local DB. Either is acceptable — what matters is the request returns valid JSON of the right shape, not 500.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add web/app/api/games/whos-that/player/[id]/route.ts
git commit -m "feat(whos-that): add public player-attributes API endpoint"
```

---

## Task 8: Build the guess-row visual component

**Files:**
- Create: `web/components/play/games/whos-that/GuessRow.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/whos-that/GuessRow.tsx
"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import type { GuessFeedback, FeedbackColor } from "@/lib/whos-that/types";
import { cn } from "@/lib/utils";

const CELL_BG: Record<FeedbackColor, string> = {
  green: "bg-pitch-green",
  yellow: "bg-card-yellow",
  red: "bg-red-card",
};

const CELL_TEXT: Record<FeedbackColor, string> = {
  green: "text-stadium-navy",
  yellow: "text-stadium-navy",
  red: "text-floodlight",
};

const ATTRIBUTE_LABELS = ["Club", "League", "Nat.", "Pos.", "Born"] as const;

interface GuessRowProps {
  guess: GuessFeedback;
}

export function GuessRow({ guess }: GuessRowProps) {
  const attributes = [
    guess.club,
    guess.league,
    guess.nationality,
    guess.position,
    guess.birthYear,
  ];

  return (
    <div className="mb-1.5">
      <p className="text-floodlight text-[13px] font-medium mb-1 px-0.5 truncate">
        {guess.playerName}
      </p>
      <div className="flex gap-1">
        {attributes.map((attr, index) => (
          <div
            key={ATTRIBUTE_LABELS[index]}
            className={cn(
              "flex-1 rounded-md py-1.5 px-1 flex flex-col items-center justify-center min-h-[44px]",
              CELL_BG[attr.color]
            )}
          >
            <span
              className={cn(
                "text-[9px] uppercase tracking-wider opacity-70 leading-none",
                CELL_TEXT[attr.color]
              )}
            >
              {ATTRIBUTE_LABELS[index]}
            </span>
            <div className="flex items-center gap-0.5 mt-1">
              <span
                className={cn(
                  "text-[11px] font-medium text-center leading-tight",
                  CELL_TEXT[attr.color]
                )}
              >
                {attr.value}
              </span>
              {attr.direction === "up" && (
                <ArrowUp size={10} strokeWidth={2.5} className={CELL_TEXT[attr.color]} />
              )}
              {attr.direction === "down" && (
                <ArrowDown size={10} strokeWidth={2.5} className={CELL_TEXT[attr.color]} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

The Tailwind colour names `bg-pitch-green`, `bg-card-yellow`, `bg-red-card`, `text-stadium-navy`, `text-floodlight` are the brand colour utilities used elsewhere in the codebase (e.g. by `GamePageShell`). Confirm they resolve by inspecting `web/tailwind.config.ts` or by searching: `grep -n "pitch-green\|card-yellow\|red-card\|stadium-navy\|floodlight" web/tailwind.config.*`. If any of these don't exist as Tailwind utilities, fall back to arbitrary value form using the hex codes from `web/lib/constants.ts` (`#2EFC5D` pitchGreen, `#FACC15` cardYellow, `#EF4444` redCard, `#05050A` stadiumNavy, `#FFFFFF` floodlight) — e.g. `bg-[#2EFC5D]`.

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "GuessRow.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/whos-that/GuessRow.tsx
git commit -m "feat(whos-that): add GuessRow component (5 colour-coded attribute cells)"
```

---

## Task 9: Build the grid component

**Files:**
- Create: `web/components/play/games/whos-that/Grid.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/whos-that/Grid.tsx
"use client";

import type { GuessFeedback } from "@/lib/whos-that/types";
import { GuessRow } from "./GuessRow";
import { cn } from "@/lib/utils";

const MAX_GUESSES = 6;
const EMPTY_CELL_LABELS = ["Club", "League", "Nat.", "Pos.", "Born"] as const;

interface GridProps {
  guesses: GuessFeedback[];
}

export function Grid({ guesses }: GridProps) {
  const filledCount = guesses.length;
  const emptyCount = MAX_GUESSES - filledCount;

  return (
    <div className="space-y-1.5">
      {guesses.map((guess, index) => (
        <GuessRow key={`guess-${index}`} guess={guess} />
      ))}
      {Array.from({ length: emptyCount }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="flex gap-1 mb-1.5"
          aria-hidden="true"
        >
          {EMPTY_CELL_LABELS.map((label) => (
            <div
              key={label}
              className={cn(
                "flex-1 h-[44px] rounded-md border",
                index === 0
                  ? "bg-pitch-green/[0.08] border-pitch-green/25 animate-pulse"
                  : "bg-white/[0.03] border-white/[0.06]"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "Grid.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/whos-that/Grid.tsx
git commit -m "feat(whos-that): add Grid component (6-row guess grid with empty placeholders)"
```

---

## Task 10: Build the player search input (autocomplete)

**Files:**
- Create: `web/components/play/games/whos-that/PlayerSearchInput.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/whos-that/PlayerSearchInput.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchedPlayer {
  id: string;
  name: string;
  birth_year: number | null;
  position_category: string | null;
  nationality_code: string | null;
}

interface PlayerSearchInputProps {
  onSelect: (player: SearchedPlayer) => void;
  /** Disables the input — e.g. when the game is over. */
  disabled?: boolean;
  /** Placeholder text in the input. */
  placeholder?: string;
}

export function PlayerSearchInput({
  onSelect,
  disabled,
  placeholder = "Search players (3+ letters)...",
}: PlayerSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when user clicks outside.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/games/whos-that/search?q=${encodeURIComponent(value.trim())}`
        );
        const json = (await res.json()) as { players?: SearchedPlayer[] };
        const players = json.players ?? [];
        setResults(players);
        setShowDropdown(players.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, []);

  const handleSelect = useCallback(
    (player: SearchedPlayer) => {
      setQuery("");
      setResults([]);
      setShowDropdown(false);
      onSelect(player);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9 bg-white/5 border-white/10 text-floodlight placeholder:text-slate-500"
          aria-label="Player name"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            …
          </span>
        )}
      </div>
      {showDropdown && (
        <ul
          className={cn(
            "absolute z-50 w-full mt-1 bg-stadium-navy border border-white/10 rounded-md shadow-xl",
            "max-h-60 overflow-y-auto"
          )}
          role="listbox"
        >
          {results.map((player) => (
            <li key={player.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelect(player)}
                className="w-full px-3 py-2 text-left text-sm text-floodlight hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center justify-between"
              >
                <span className="truncate">{player.name}</span>
                {player.birth_year && (
                  <span className="text-xs text-slate-400 ml-2">
                    b. {player.birth_year}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "PlayerSearchInput.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/whos-that/PlayerSearchInput.tsx
git commit -m "feat(whos-that): add PlayerSearchInput autocomplete component"
```

---

## Task 11: Build the WhosThatGame orchestrator-facing component

**Files:**
- Create: `web/components/play/games/whos-that/WhosThatGame.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/games/whos-that/WhosThatGame.tsx
"use client";

import { useReducer, useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { GameProps } from "@/lib/play/types";
import type {
  WhosThatContent,
  WhosThatState,
  WhosThatAction,
} from "@/lib/whos-that/types";
import { createInitialState } from "@/lib/whos-that/types";
import { generateFeedback } from "@/lib/whos-that/feedback";
import { nationalityCodeToName } from "@/lib/whos-that/nationalities";
import { calculateWhosThatScore } from "@/lib/whos-that/scoring";
import { generateWhosThatShareText } from "@/lib/whos-that/share";
import { useGameTracking } from "@/hooks/use-game-tracking";
import { Grid } from "./Grid";
import { PlayerSearchInput, type SearchedPlayer } from "./PlayerSearchInput";

function whosThatReducer(state: WhosThatState, action: WhosThatAction): WhosThatState {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { isCorrect, ...feedback } = action.payload;
      const newGuesses = [...state.guesses, feedback];
      const guessCount = newGuesses.length;
      if (isCorrect) {
        return { ...state, guesses: newGuesses, gameStatus: "won", lastGuessIncorrect: false };
      }
      if (guessCount >= state.maxGuesses) {
        return { ...state, guesses: newGuesses, gameStatus: "lost", lastGuessIncorrect: true };
      }
      return { ...state, guesses: newGuesses, lastGuessIncorrect: true };
    }
    case "CLEAR_SHAKE":
      return { ...state, lastGuessIncorrect: false };
    case "RESET":
      return createInitialState();
  }
}

export function WhosThatGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<WhosThatContent>) {
  const [state, dispatch] = useReducer(whosThatReducer, undefined, createInitialState);
  const [fetchingAttrs, setFetchingAttrs] = useState(false);
  const [retiredPlayerName, setRetiredPlayerName] = useState<string | null>(null);
  const { trackGameCompleted } = useGameTracking();

  const isGameOver = state.gameStatus !== "playing";

  const handlePlayerSelect = useCallback(
    async (player: SearchedPlayer) => {
      if (isGameOver || fetchingAttrs) return;
      setRetiredPlayerName(null);
      setFetchingAttrs(true);
      try {
        const res = await fetch(
          `/api/games/whos-that/player/${encodeURIComponent(player.id)}`
        );
        const attrs = (await res.json()) as {
          club: string;
          league: string;
          birth_year: number | null;
        };

        // Retired players (no current club) are rejected — mirrors mobile behavior.
        if (!attrs.club) {
          setRetiredPlayerName(player.name);
          return;
        }

        const nationalityName = nationalityCodeToName(player.nationality_code ?? "");
        const birthYear = attrs.birth_year ?? player.birth_year ?? 0;
        const position = player.position_category ?? "";

        const feedback = generateFeedback(
          {
            playerName: player.name,
            club: attrs.club,
            league: attrs.league,
            nationality: nationalityName,
            position,
            birthYear,
          },
          content.answer
        );

        const isCorrect = player.id === content.answer.player_id;

        dispatch({ type: "SUBMIT_GUESS", payload: { ...feedback, isCorrect } });
      } finally {
        setFetchingAttrs(false);
      }
    },
    [content.answer, isGameOver, fetchingAttrs]
  );

  // Clear shake after a short timeout so the user can guess again.
  useEffect(() => {
    if (!state.lastGuessIncorrect) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_SHAKE" }), 600);
    return () => clearTimeout(t);
  }, [state.lastGuessIncorrect]);

  // Report completion to the orchestrator.
  useEffect(() => {
    if (state.gameStatus === "playing") return;
    const won = state.gameStatus === "won";
    const score = calculateWhosThatScore(state.guesses.length, won);
    const shareText = generateWhosThatShareText(score, state.guesses, puzzleDate);

    if (won) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    trackGameCompleted("whos-that", { won, guessCount: state.guesses.length });

    onComplete({
      won,
      answer: content.answer.player_name,
      shareText,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameStatus]);

  return (
    <div className="space-y-4">
      <Grid guesses={state.guesses} />

      {!isGameOver && (
        <div className="space-y-2">
          <PlayerSearchInput
            onSelect={handlePlayerSelect}
            disabled={fetchingAttrs}
          />
          {fetchingAttrs && (
            <p className="text-xs text-slate-400">Looking up player...</p>
          )}
          {retiredPlayerName && (
            <p className="text-xs text-card-yellow">
              {retiredPlayerName} has no current club — pick an active player.
            </p>
          )}
          <p className="text-xs text-slate-500 text-center">
            Guess {state.guesses.length + 1} of {state.maxGuesses}
          </p>
        </div>
      )}

      {state.gameStatus === "lost" && (
        <p className="text-center text-floodlight">
          Out of guesses. The answer was <strong>{content.answer.player_name}</strong>.
        </p>
      )}
    </div>
  );
}
```

The component:
- Owns reducer state for the in-progress game
- Calls `/api/games/whos-that/player/[id]` to fetch attributes when the user selects a player from the autocomplete
- Rejects retired players (no current club) before submitting
- Generates feedback via the pure `generateFeedback` util
- Compares `player.id` to `content.answer.player_id` for the correctness check
- Reports completion to the orchestrator via `onComplete` once gameStatus transitions to won/lost

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "WhosThatGame.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/games/whos-that/WhosThatGame.tsx
git commit -m "feat(whos-that): add WhosThatGame component conforming to GameProps"
```

---

## Task 12: Add the smoke test for WhosThatGame

**Files:**
- Create: `web/components/play/__tests__/WhosThatGame.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhosThatGame } from "@/components/play/games/whos-that/WhosThatGame";
import type { WhosThatContent } from "@/lib/whos-that/types";

vi.mock("@/hooks/use-game-tracking", () => ({
  useGameTracking: () => ({
    trackGameCompleted: vi.fn(),
    trackGameStarted: vi.fn(),
  }),
}));

const fakeContent: WhosThatContent = {
  answer: {
    player_name: "Mohamed Salah",
    player_id: "Q346551",
    club: "Liverpool",
    league: "Premier League",
    nationality: "Egypt",
    position: "Right Winger",
    birth_year: 1992,
  },
};

describe("WhosThatGame", () => {
  it("renders the player-search input while game is in progress", () => {
    render(
      <WhosThatGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(
      screen.getByPlaceholderText(/Search players/i)
    ).toBeInTheDocument();
  });

  it("shows the guess counter for the first guess", () => {
    render(
      <WhosThatGame
        content={fakeContent}
        puzzleDate="2026-05-11"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Guess 1 of 6/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run components/play/__tests__/WhosThatGame.test.tsx`
Expected: 2/2 PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/__tests__/WhosThatGame.test.tsx
git commit -m "test(whos-that): add smoke tests for WhosThatGame"
```

---

## Task 13: Add Who's That? to the game registry

**Files:**
- Modify: `web/lib/play/registry.ts`

- [ ] **Step 1: Update the registry**

Replace the imports block and `AnyGameRegistryEntry` union and the `GAME_REGISTRY` object so the file becomes:

```ts
// web/lib/play/registry.ts
"use client";

import { CareerPathGame } from "@/components/play/CareerPathGame";
import { TransferGuessGame } from "@/components/play/TransferGuessGame";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";
import { TimelineGame } from "@/components/play/TimelineGame";
import { WhosThatGame } from "@/components/play/games/whos-that/WhosThatGame";

import {
  FALLBACK_CAREER_PUZZLE,
  FALLBACK_TRANSFER_PUZZLE,
  FALLBACK_CONNECTIONS_PUZZLE,
  FALLBACK_QUIZ_PUZZLE,
  FALLBACK_TIMELINE_PUZZLE,
  FALLBACK_WHOS_THAT_PUZZLE,
} from "@/lib/constants";

import type { GameRegistryEntry } from "./types";
import type {
  CareerPathContent,
  TransferGuessContent,
  ConnectionsContent,
  TopicalQuizContent,
  TimelineContent,
} from "@/lib/schemas/puzzle-schemas";
import type { WhosThatContent } from "@/lib/whos-that/types";

// Use a discriminated entry type so the registry remains typed end-to-end.
export type AnyGameRegistryEntry =
  | GameRegistryEntry<CareerPathContent>
  | GameRegistryEntry<TransferGuessContent>
  | GameRegistryEntry<ConnectionsContent>
  | GameRegistryEntry<TopicalQuizContent>
  | GameRegistryEntry<TimelineContent>
  | GameRegistryEntry<WhosThatContent>;

export const GAME_REGISTRY: Record<string, AnyGameRegistryEntry> = {
  "career-path": {
    dbMode: "career_path",
    title: "Career Path",
    component: CareerPathGame,
    fallbackContent: FALLBACK_CAREER_PUZZLE as CareerPathContent,
  },
  "transfer-guess": {
    dbMode: "guess_the_transfer",
    title: "Transfer Guess",
    component: TransferGuessGame,
    fallbackContent: FALLBACK_TRANSFER_PUZZLE as TransferGuessContent,
  },
  "connections": {
    dbMode: "connections",
    title: "Connections",
    component: ConnectionsGame,
    fallbackContent: FALLBACK_CONNECTIONS_PUZZLE as ConnectionsContent,
  },
  "topical-quiz": {
    dbMode: "topical_quiz",
    title: "Topical Quiz",
    component: TopicalQuizGame,
    fallbackContent: FALLBACK_QUIZ_PUZZLE as TopicalQuizContent,
  },
  "timeline": {
    dbMode: "timeline",
    title: "Timeline",
    component: TimelineGame,
    fallbackContent: FALLBACK_TIMELINE_PUZZLE as TimelineContent,
  },
  "whos-that": {
    dbMode: "whos-that",
    title: "Who's That?",
    component: WhosThatGame,
    fallbackContent: FALLBACK_WHOS_THAT_PUZZLE as WhosThatContent,
  },
};

export function getGameEntry(slug: string): AnyGameRegistryEntry | null {
  return GAME_REGISTRY[slug] ?? null;
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "play/registry.ts"`
Expected: no output.

- [ ] **Step 3: Run the existing DailyPuzzleClient tests to confirm no regressions**

Run: `cd web && npx vitest run components/play/__tests__/DailyPuzzleClient.test.tsx`
Expected: 3/3 PASS.

- [ ] **Step 4: Commit**

```bash
git add web/lib/play/registry.ts
git commit -m "feat(whos-that): register whos-that in GAME_REGISTRY"
```

---

## Task 14: Create the SEO page

**Files:**
- Create: `web/app/play/whos-that/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// web/app/play/whos-that/page.tsx
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

const BASE_URL = "https://www.football-iq.app";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Who's That? — Daily Football Wordle | Football IQ",
    description:
      "Guess the mystery footballer in 6 tries. Each guess reveals colour-coded clues on club, league, nationality, position, and age. New player every day. Free to play in your browser.",
    alternates: {
      canonical: `${BASE_URL}/play/whos-that`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: "Who's That? — Daily Football Wordle | Football IQ",
      description:
        "Wordle for footballers. 6 guesses, colour-coded clues. A new player every day, free to play in your browser.",
      url: `${BASE_URL}/play/whos-that`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/whos-that`,
          width: 1200,
          height: 630,
          alt: "Who's That? - Daily football Wordle",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Who's That? — Daily Football Wordle | Football IQ",
      description:
        "6 guesses to identify the mystery footballer. Free to play, new puzzle every day.",
      images: [`${BASE_URL}/api/og/play/whos-that`],
    },
  };
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WhosThatPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Quiz",
              name: "Who's That? — Daily Football Wordle",
              description:
                "Guess the mystery footballer in 6 tries. Colour-coded feedback on club, league, nationality, position, and age.",
              url: `${BASE_URL}/play/whos-that`,
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
                  name: "Who's That?",
                  item: `${BASE_URL}/play/whos-that`,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How does Who's That? work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "You have 6 guesses to identify a mystery footballer. Each guess reveals colour-coded feedback on the player's club, league, nationality, position, and birth year. Green means exact match; yellow means close (same continent, same position category, or birth year within 2 years); red means wrong.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Who's That? free to play?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Football IQ publishes a new Who's That? puzzle every day and today's puzzle is always free in your browser at football-iq.app — no signup or download required.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Who's That? like Wordle?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Yes. Who's That? uses the same green/yellow/red feedback pattern as Wordle, but instead of letters you're guessing a footballer's attributes — club, league, nationality, position, and age. Fewer guesses = higher score.",
                  },
                },
              ],
            },
          ],
        }}
      />
      <DailyPuzzleGame mode="whos-that" date={params.date} />
      <HowToPlay
        title="Who's That?"
        rules={[
          "Type any active footballer's name into the search bar.",
          "After each guess, five cells reveal colour-coded clues: green = exact match, yellow = close, red = wrong.",
          "An arrow on the birth-year cell shows whether the answer is older (↑) or younger (↓) than your guess.",
          "You have 6 guesses. Get it right in as few attempts as possible.",
          "Retired players can't be guessed — pick someone with a current club.",
        ]}
        tips={[
          "Start with a player from the league you suspect — locking the league early narrows the field fast.",
          "A yellow nationality cell means same continent; a yellow position cell means same broad role (Defender / Midfielder / Forward).",
          "Birth-year arrows compound: two ↑ arrows in a row mean the answer is older than both your guesses.",
        ]}
        keywords="Who's That? is a daily football Wordle clone. Guess the mystery footballer in 6 tries with colour-coded clues on club, league, nationality, position, and age. A new player every day, free to play in your browser."
      />
    </>
  );
}
```

- [ ] **Step 2: Verify the page builds**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx tsc --noEmit 2>&1 | grep -F "whos-that/page.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/app/play/whos-that/page.tsx
git commit -m "feat(whos-that): add SEO page at /play/whos-that"
```

---

## Task 15: Full verification + dev-server smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run the full vitest suite for `components/play/` and `lib/whos-that/`**

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 >/dev/null && npx vitest run components/play/__tests__/ lib/whos-that/__tests__/`
Expected: all tests pass. Specifically: the 5 existing play-component test files (~104 tests) plus the 3 new whos-that unit-test files (~16 tests) plus the WhosThatGame smoke test (2 tests) = ~122 tests passing.

- [ ] **Step 2: Run the full TypeScript check**

Run: `cd web && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Verify `/play/whos-that` is no longer served by the dynamic SEO landing route**

Run: `cat web/app/play/[gameMode]/page.tsx | grep -A 3 "generateStaticParams"`
Expected: `generateStaticParams` filters out slugs that have a static page. With the new static `web/app/play/whos-that/page.tsx`, Next.js static routes take priority over dynamic — the dynamic landing should no longer fire for `whos-that`. No code change needed; Next.js routing handles this automatically.

- [ ] **Step 4: Run production build**

Run: `cd web && npm run build 2>&1 | grep -E "/play/whos-that|Compiled successfully|Build error"`
Expected: build succeeds. `/play/whos-that` appears in the output as a dynamic (server-rendered) route, listed alongside the other 5 play routes.

- [ ] **Step 5: Dev-server smoke test**

In a separate shell: `cd web && PORT=3457 npm run dev`. Wait for "Ready in ..."s.

Run: `curl -sf -o /tmp/whos-that.html -w "%{http_code}\n" "http://localhost:3457/play/whos-that"`
Expected: `200` and `/tmp/whos-that.html` populated.

Run: `grep -c -i "Who's That\|whos-that\|Search players\|Guess 1 of 6" /tmp/whos-that.html`
Expected: > 0 (page rendered with game UI).

Stop dev server.

- [ ] **Step 6: Manual browser verification (in the open dev server, before stopping it)**

Visit `http://localhost:3457/play/whos-that` in a browser:
- Nav title shows "WHO'S THAT?" (uppercased by `GameNav`)
- Banner ad slot appears under the nav once content loads
- 6 empty rows are visible, top one pulsing
- Type a player name (3+ chars) → autocomplete dropdown appears
- Select a player → a guess row populates with colour-coded cells
- After 6 guesses or correct guess, post-game CTA shows with share text
- Open the share text by copying — confirm it follows the format: brand header, score line, date, emoji grid, IQ score, and play URL

This step requires a populated local Supabase or production env vars in `.env.local`. If neither is available, document which steps could not be verified (the autocomplete will return empty results but the page should still render the empty grid + search input).

- [ ] **Step 7: Final cleanup commit (if any)**

If smoke tests surfaced minor issues, commit fixes:

```bash
git add <changed files>
git commit -m "fix(whos-that): post-smoke-test cleanup"
```

Otherwise nothing to commit. Tag the milestone:

```bash
git tag -a phase-1.1-whos-that -m "Phase 1.1 complete: Who's That? playable on /play/whos-that"
```

---

## Verification summary

After all tasks complete:
- `/play/whos-that` renders the playable Wordle-for-footballers game using the Phase 1.0 orchestrator
- Autocomplete fetches from a public API; player attributes from a separate public API
- Pure logic (feedback, scoring, share, nationalities) is testable in isolation
- 16+ new unit tests cover the pure logic
- Zero regressions in the 5 existing games
- Mobile parity in mechanics; visual parity not required
- `/play/whos-that` is now the playable page; old dynamic SEO landing is bypassed automatically for that slug
- `Who's That?` is moved from `APP_ONLY_GAMES` to `WEB_PLAYABLE_GAMES` so the `/play` hub links to the playable version

Next up after this lands: Phase 1.2 (Higher/Lower) — same pattern, simpler game (no autocomplete, just two-player stat comparison).
