# Phase 1.0 — Orchestrator Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `<DailyPuzzleGame>` orchestrator + game registry, and migrate the 5 existing playable web games (Career Path, Transfer Guess, Connections, Topical Quiz, Timeline) onto it. This is the foundation phase — every subsequent game port (Phase 1.1+) and the paywall enforcement work (Phase 3.2) plug into the orchestrator built here.

**Architecture:** A single typed `GAME_REGISTRY` maps each game slug to its component, fallback content, page title, and metadata. A new server component `<DailyPuzzleGame mode="<slug>" />` does the puzzle fetch and dispatches to a client orchestrator `<DailyPuzzleClient>`, which wraps in the existing layout shell + played-today gate and renders the registered game component via the new `GameProps<T>` contract. The 5 existing per-game pages collapse into thin SEO wrappers around `<DailyPuzzleGame>`.

**Tech Stack:** Next.js 15 (App Router, RSC), React 18, TypeScript, Vitest, Tailwind, Supabase (puzzle data).

**Spec:** `docs/superpowers/specs/2026-05-10-website-games-migration-design.md`

---

## File structure

**Create:**
- `web/lib/play/types.ts` — `GameProps<T>`, `GameResult`, `GameRegistryEntry<T>`, `OnGameComplete` types
- `web/lib/play/registry.ts` — `GAME_REGISTRY` mapping all 5 games (and ready to extend)
- `web/components/play/DailyPuzzleGame.tsx` — server component (puzzle fetch + dispatch)
- `web/components/play/DailyPuzzleClient.tsx` — client orchestrator (shell + gate + game render)
- `web/components/play/__tests__/DailyPuzzleClient.test.tsx` — orchestrator tests

**Modify:**
- `web/components/play/CareerPathGame.tsx` — convert to `GameProps<CareerPathContent>` contract
- `web/components/play/TransferGuessGame.tsx` — convert to `GameProps<TransferGuessContent>` contract
- `web/components/play/ConnectionsGame.tsx` — convert to `GameProps<ConnectionsContent>` contract
- `web/components/play/TopicalQuizGame.tsx` — convert to `GameProps<QuizContent>` contract
- `web/components/play/TimelineGame.tsx` — convert to `GameProps<TimelineContent>` contract
- `web/components/play/GamePageShell.tsx` — drop the `useGameComplete` context, accept `result` as a prop instead (layout-only)
- `web/components/play/__tests__/{Connections,Timeline,TopicalQuiz,TransferGuess}Game.test.tsx` — update any tests that touched the old prop shape
- `web/app/play/career-path/page.tsx` — replace hand-wired shell with `<DailyPuzzleGame mode="career-path" />`
- `web/app/play/transfer-guess/page.tsx` — same migration
- `web/app/play/connections/page.tsx` — same migration
- `web/app/play/topical-quiz/page.tsx` — same migration
- `web/app/play/timeline/page.tsx` — same migration

**Out of scope (future phases):**
- Paywall checks (Phase 3.2)
- Premium-mode lockouts (Phase 3.3)
- New game ports — Who's That?, Higher/Lower, Top Tens etc. (Phases 1.1+)

---

## Task 1: Create the play types module

**Files:**
- Create: `web/lib/play/types.ts`

- [ ] **Step 1: Write the types file**

```ts
// web/lib/play/types.ts
import type { ComponentType, ReactNode } from "react";

/**
 * Result a game reports when it ends. Drives post-game CTA rendering.
 */
export interface GameResult {
  won: boolean;
  answer: string;
  shareText: string;
}

export type OnGameComplete = (result: GameResult) => void;

/**
 * Contract every game UI implements. The orchestrator passes today's puzzle
 * content + the date, and listens for completion via onComplete.
 */
export interface GameProps<TContent> {
  content: TContent;
  puzzleDate: string;
  onComplete: OnGameComplete;
}

/**
 * Registry entry per playable game mode. Lives client-side because it carries
 * a React component reference. The server-side <DailyPuzzleGame> only reads
 * `dbMode`, `title`, and `fallbackContent` (all serializable).
 */
export interface GameRegistryEntry<TContent> {
  /** URL slug, e.g. "career-path". */
  slug: string;
  /** Database game_mode value, e.g. "career_path". */
  dbMode: string;
  /** Display title, used by GamePageShell. */
  title: string;
  /** Fallback content rendered when no live puzzle exists for the date. */
  fallbackContent: TContent;
  /** The game UI component conforming to GameProps<TContent>. */
  component: ComponentType<GameProps<TContent>>;
  /** Optional how-to-play / SEO node rendered below the game. */
  howToPlay?: ReactNode;
}
```

- [ ] **Step 2: Verify the types compile**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (no new errors)

- [ ] **Step 3: Commit**

```bash
git add web/lib/play/types.ts
git commit -m "feat(play): add GameProps + registry types for orchestrator"
```

---

## Task 2: Convert CareerPathGame to the GameProps contract

**Files:**
- Modify: `web/components/play/CareerPathGame.tsx` (props interface + function signature + onComplete call site)

- [ ] **Step 1: Read the current props interface and onComplete call site**

Run: `grep -n "interface CareerPathGameProps\|useGameComplete\|onGameComplete" web/components/play/CareerPathGame.tsx`
Expected: shows `interface CareerPathGameProps { ... }`, the `useGameComplete()` import + call, and the place where `onGameComplete(...)` is invoked on win/loss.

- [ ] **Step 2: Replace the props interface and function signature**

Replace the existing `interface CareerPathGameProps { ... }` and `export function CareerPathGame({ careerSteps, answer, puzzleDate }: CareerPathGameProps) {` with:

```ts
import type { GameProps } from "@/lib/play/types";
import type { CareerPathContent } from "@/lib/schemas/puzzle-schemas";

export function CareerPathGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<CareerPathContent>) {
  const { career_steps: careerSteps, answer } = content;
  // ...rest of body unchanged
```

- [ ] **Step 3: Remove the `useGameComplete` import and replace the call**

Find:
```ts
import { useGameComplete } from "./GamePageShell";
```
Delete that import.

Find the line `const onGameComplete = useGameComplete();` (or equivalent inside the component body) and delete it.

Replace every call to `onGameComplete(result)` with `onComplete(result)`.

- [ ] **Step 4: Verify the file compiles**

Run: `cd web && npx tsc --noEmit`
Expected: errors only in pages that still pass the old props (`careerSteps`, `answer`) — those pages are migrated in a later task. No errors inside `CareerPathGame.tsx` itself.

- [ ] **Step 5: Commit**

```bash
git add web/components/play/CareerPathGame.tsx
git commit -m "refactor(play): convert CareerPathGame to GameProps contract"
```

---

## Task 3: Convert TransferGuessGame to the GameProps contract

**Files:**
- Modify: `web/components/play/TransferGuessGame.tsx`

- [ ] **Step 1: Read the current shape**

Run: `grep -n "interface TransferGuessGameProps\|useGameComplete\|onGameComplete\|export function TransferGuessGame" web/components/play/TransferGuessGame.tsx`
Expected: existing `{ content, puzzleDate }` signature; `useGameComplete()` import + call.

- [ ] **Step 2: Replace the function signature**

`TransferGuessContent` already exists at `@/lib/schemas/puzzle-schemas` — the file currently imports it.

Replace the existing `interface TransferGuessGameProps { content: TransferGuessContent; puzzleDate: string }` and `export function TransferGuessGame({ content, puzzleDate }: TransferGuessGameProps) {` with:

```ts
import type { GameProps } from "@/lib/play/types";
// keep the existing: import type { TransferGuessContent } from "@/lib/schemas/puzzle-schemas";

export function TransferGuessGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<TransferGuessContent>) {
```

Delete the now-unused `TransferGuessGameProps` interface declaration.

- [ ] **Step 3: Replace the `useGameComplete` call**

Delete the import:
```ts
import { useGameComplete } from "./GamePageShell";
```
Delete the `const onGameComplete = useGameComplete();` line.

Replace `onGameComplete(...)` calls with `onComplete(...)`.

- [ ] **Step 4: Verify TS compiles inside the file**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "TransferGuessGame.tsx"`
Expected: no output (zero errors inside this file)

- [ ] **Step 5: Commit**

```bash
git add web/components/play/TransferGuessGame.tsx
git commit -m "refactor(play): convert TransferGuessGame to GameProps contract"
```

---

## Task 4: Convert ConnectionsGame to the GameProps contract

**Files:**
- Modify: `web/components/play/ConnectionsGame.tsx`

- [ ] **Step 1: Read the current shape**

Run: `grep -n "interface ConnectionsGameProps\|useGameComplete\|onGameComplete" web/components/play/ConnectionsGame.tsx`

- [ ] **Step 2: Replace the function signature**

`ConnectionsContent` already exists at `@/lib/schemas/puzzle-schemas` — the file currently imports it.

Replace `interface ConnectionsGameProps { ... }` and `export function ConnectionsGame({ content, puzzleDate }: ConnectionsGameProps) {` with:

```ts
import type { GameProps } from "@/lib/play/types";
// keep the existing: import type { ConnectionsContent } from "@/lib/schemas/puzzle-schemas";

export function ConnectionsGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<ConnectionsContent>) {
```

Delete the now-unused `ConnectionsGameProps` interface declaration.

- [ ] **Step 3: Replace `useGameComplete` calls**

Delete `import { useGameComplete } from "./GamePageShell";`. Delete `const onGameComplete = useGameComplete();`. Replace `onGameComplete(...)` with `onComplete(...)`.

- [ ] **Step 4: Run the existing ConnectionsGame tests**

Run: `cd web && npx vitest run components/play/__tests__/ConnectionsGame.test.tsx`
Expected: PASS (test file imports pure logic, not the React shape, so unaffected by the prop refactor)

- [ ] **Step 5: Commit**

```bash
git add web/components/play/ConnectionsGame.tsx
git commit -m "refactor(play): convert ConnectionsGame to GameProps contract"
```

---

## Task 5: Convert TopicalQuizGame to the GameProps contract

**Files:**
- Modify: `web/components/play/TopicalQuizGame.tsx`

- [ ] **Step 1: Replace the function signature**

`TopicalQuizContent` already exists at `@/lib/schemas/puzzle-schemas` — the file currently imports it. (Note: the type is `TopicalQuizContent`, not `QuizContent`.)

Replace `interface TopicalQuizGameProps` and `export function TopicalQuizGame({ content, puzzleDate }: TopicalQuizGameProps) {` with:

```ts
import type { GameProps } from "@/lib/play/types";
// keep the existing: import type { TopicalQuizContent } from "@/lib/schemas/puzzle-schemas";

export function TopicalQuizGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<TopicalQuizContent>) {
```

Delete the now-unused `TopicalQuizGameProps` interface declaration.

- [ ] **Step 2: Replace `useGameComplete` calls**

Delete the import + call; replace `onGameComplete(...)` with `onComplete(...)`.

- [ ] **Step 3: Run the existing test**

Run: `cd web && npx vitest run components/play/__tests__/TopicalQuizGame.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/components/play/TopicalQuizGame.tsx
git commit -m "refactor(play): convert TopicalQuizGame to GameProps contract"
```

---

## Task 6: Convert TimelineGame to the GameProps contract

**Files:**
- Modify: `web/components/play/TimelineGame.tsx`

- [ ] **Step 1: Replace the function signature**

`TimelineContent` already exists at `@/lib/schemas/puzzle-schemas` — the file currently imports it.

Replace `interface TimelineGameProps` and `export function TimelineGame({ content, puzzleDate }: TimelineGameProps) {` with:

```ts
import type { GameProps } from "@/lib/play/types";
// keep the existing: import type { TimelineContent } from "@/lib/schemas/puzzle-schemas";

export function TimelineGame({
  content,
  puzzleDate,
  onComplete,
}: GameProps<TimelineContent>) {
```

Delete the now-unused `TimelineGameProps` interface declaration.

- [ ] **Step 2: Replace `useGameComplete` calls**

Delete the import + call; replace `onGameComplete(...)` with `onComplete(...)`.

- [ ] **Step 3: Run the TimelineGame tests**

Run: `cd web && npx vitest run components/play/__tests__/TimelineGame.test.tsx`
Expected: PASS (existing tests cover pure reducer/util logic, not React props)

- [ ] **Step 4: Commit**

```bash
git add web/components/play/TimelineGame.tsx
git commit -m "refactor(play): convert TimelineGame to GameProps contract"
```

---

## Task 7: Convert GamePageShell from context-based to prop-based result

**Files:**
- Modify: `web/components/play/GamePageShell.tsx`

The current shell exposes `useGameComplete` via React context. After Tasks 2–6 nothing reads it, but the shell still owns the result state. We flip ownership of the result up to the orchestrator and make the shell layout-only.

- [ ] **Step 1: Read the current file**

Run: `cat web/components/play/GamePageShell.tsx`
Expected: shows the context provider + `useGameComplete` export.

- [ ] **Step 2: Rewrite GamePageShell**

Replace the entire file contents with:

```tsx
"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { GameNav } from "./GameNav";
import { AdSlot } from "./AdSlot";
import { PostGameCTA } from "./PostGameCTA";
import type { GameResult } from "@/lib/play/types";

interface GamePageShellProps {
  title: string;
  gameSlug: string;
  /** Result reported by the embedded game; null while game is in progress. */
  result: GameResult | null;
  children: ReactNode;
}

/**
 * Pure layout shell: nav + ad slots + post-game CTA. Result state lives in the
 * caller (DailyPuzzleClient); the shell just renders against it.
 */
export function GamePageShell({
  title,
  gameSlug,
  result,
  children,
}: GamePageShellProps) {
  const [contentReady, setContentReady] = useState(false);

  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (node && node.childElementCount > 0) {
      setContentReady(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <GameNav title={title} />

      {contentReady && !result && (
        <div className="py-3">
          <AdSlot variant="banner" />
        </div>
      )}

      <div ref={contentRef} className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {children}

        {result && (
          <>
            <PostGameCTA
              won={result.won}
              answer={result.answer}
              shareText={result.shareText}
              gameSlug={gameSlug}
            />
            <div className="py-6">
              <AdSlot variant="rectangle" />
            </div>
          </>
        )}
      </div>

      <footer className="py-4 text-center border-t border-white/5">
        <p className="text-slate-600 text-xs">football-iq.app</p>
      </footer>
    </div>
  );
}
```

This deletes the `GameCompleteContext`, the `useGameComplete` export, and the internal `gameResult` state — all moved up to the orchestrator (Task 9).

- [ ] **Step 3: Verify no residual `useGameComplete` imports anywhere**

Run: `grep -rn "useGameComplete" web/`
Expected: no matches.

- [ ] **Step 4: Verify TS compiles inside the shell**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "GamePageShell.tsx"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add web/components/play/GamePageShell.tsx
git commit -m "refactor(play): make GamePageShell layout-only, lift result state up"
```

---

## Task 8: Build the game registry

**Files:**
- Create: `web/lib/play/registry.ts`

- [ ] **Step 1: Write the registry**

```ts
// web/lib/play/registry.ts
import { CareerPathGame } from "@/components/play/CareerPathGame";
import { TransferGuessGame } from "@/components/play/TransferGuessGame";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";
import { TimelineGame } from "@/components/play/TimelineGame";

import {
  FALLBACK_CAREER_PUZZLE,
  FALLBACK_TRANSFER_PUZZLE,
  FALLBACK_CONNECTIONS_PUZZLE,
  FALLBACK_QUIZ_PUZZLE,
  FALLBACK_TIMELINE_PUZZLE,
} from "@/lib/constants";

import type { GameRegistryEntry } from "./types";
import type {
  CareerPathContent,
  TransferGuessContent,
  ConnectionsContent,
  TopicalQuizContent,
  TimelineContent,
} from "@/lib/schemas/puzzle-schemas";

// Use a discriminated entry type so the registry remains typed end-to-end.
export type AnyGameRegistryEntry =
  | GameRegistryEntry<CareerPathContent>
  | GameRegistryEntry<TransferGuessContent>
  | GameRegistryEntry<ConnectionsContent>
  | GameRegistryEntry<TopicalQuizContent>
  | GameRegistryEntry<TimelineContent>;

export const GAME_REGISTRY: Record<string, AnyGameRegistryEntry> = {
  "career-path": {
    slug: "career-path",
    dbMode: "career_path",
    title: "Career Path",
    component: CareerPathGame,
    fallbackContent: FALLBACK_CAREER_PUZZLE as CareerPathContent,
  },
  "transfer-guess": {
    slug: "transfer-guess",
    dbMode: "guess_the_transfer",
    title: "Transfer Guess",
    component: TransferGuessGame,
    fallbackContent: FALLBACK_TRANSFER_PUZZLE as TransferGuessContent,
  },
  "connections": {
    slug: "connections",
    dbMode: "connections",
    title: "Connections",
    component: ConnectionsGame,
    fallbackContent: FALLBACK_CONNECTIONS_PUZZLE as ConnectionsContent,
  },
  "topical-quiz": {
    slug: "topical-quiz",
    dbMode: "topical_quiz",
    title: "Topical Quiz",
    component: TopicalQuizGame,
    fallbackContent: FALLBACK_QUIZ_PUZZLE as TopicalQuizContent,
  },
  "timeline": {
    slug: "timeline",
    dbMode: "timeline",
    title: "Timeline",
    component: TimelineGame,
    fallbackContent: FALLBACK_TIMELINE_PUZZLE as TimelineContent,
  },
};

export function getGameEntry(slug: string): AnyGameRegistryEntry | null {
  return GAME_REGISTRY[slug] ?? null;
}
```

The casts on `fallbackContent` reflect that `web/lib/constants.ts` types fallbacks as inline literals; once those literals are typed against the same `*Content` interfaces (a small refinement we can do later), the casts go away.

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "registry.ts"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/lib/play/registry.ts
git commit -m "feat(play): add typed GAME_REGISTRY for the 5 web games"
```

---

## Task 9: Build the client orchestrator

**Files:**
- Create: `web/components/play/DailyPuzzleClient.tsx`

- [ ] **Step 1: Write the failing test first**

Create `web/components/play/__tests__/DailyPuzzleClient.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyPuzzleClient } from "../DailyPuzzleClient";

vi.mock("@/lib/playSession", () => ({
  hasPlayedToday: () => false,
  getPlayResult: () => null,
  copyToClipboard: vi.fn(),
  getConsecutiveStreak: () => 0,
}));

describe("DailyPuzzleClient", () => {
  it("renders the registered game's title in the shell", () => {
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    expect(screen.getByText("Career Path")).toBeInTheDocument();
  });

  it("falls back to the registry's fallbackContent when content is null", () => {
    render(
      <DailyPuzzleClient
        mode="career-path"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    // Fallback puzzle answer is "Bukayo Saka" — Arsenal step is in fallback.
    expect(screen.getByText(/Arsenal/i)).toBeInTheDocument();
  });

  it("returns null for an unregistered mode", () => {
    const { container } = render(
      <DailyPuzzleClient
        mode="not-a-real-mode"
        content={null}
        puzzleDate="2026-05-10"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd web && npx vitest run components/play/__tests__/DailyPuzzleClient.test.tsx`
Expected: FAIL — `DailyPuzzleClient` does not exist yet.

- [ ] **Step 3: Write the orchestrator**

Create `web/components/play/DailyPuzzleClient.tsx`:

```tsx
"use client";

import { useState, type ComponentType } from "react";
import { GamePageShell } from "./GamePageShell";
import { PlayedTodayGate } from "./PlayedTodayGate";
import { getGameEntry } from "@/lib/play/registry";
import type { GameProps, GameResult } from "@/lib/play/types";

interface DailyPuzzleClientProps {
  /** URL slug, e.g. "career-path". Must match a key in GAME_REGISTRY. */
  mode: string;
  /** Today's puzzle content from Supabase, or null if no live puzzle exists. */
  content: unknown;
  /** ISO date string (YYYY-MM-DD) for the puzzle being played. */
  puzzleDate: string;
}

export function DailyPuzzleClient({
  mode,
  content,
  puzzleDate,
}: DailyPuzzleClientProps) {
  const [result, setResult] = useState<GameResult | null>(null);
  const entry = getGameEntry(mode);

  if (!entry) {
    return null;
  }

  // The registry is a discriminated union; once we have a slug match we know
  // the component matches the fallback's content type. The cast reflects this.
  const Game = entry.component as ComponentType<GameProps<unknown>>;
  const puzzleContent = content ?? entry.fallbackContent;

  return (
    <GamePageShell title={entry.title} gameSlug={mode} result={result}>
      <PlayedTodayGate gameSlug={mode}>
        <Game
          content={puzzleContent}
          puzzleDate={puzzleDate}
          onComplete={setResult}
        />
      </PlayedTodayGate>
    </GamePageShell>
  );
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd web && npx vitest run components/play/__tests__/DailyPuzzleClient.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/play/DailyPuzzleClient.tsx web/components/play/__tests__/DailyPuzzleClient.test.tsx
git commit -m "feat(play): add DailyPuzzleClient orchestrator"
```

---

## Task 10: Build the server-side DailyPuzzleGame component

**Files:**
- Create: `web/components/play/DailyPuzzleGame.tsx`

- [ ] **Step 1: Write the component**

```tsx
// web/components/play/DailyPuzzleGame.tsx
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { GAME_REGISTRY } from "@/lib/play/registry";
import { DailyPuzzleClient } from "./DailyPuzzleClient";

interface DailyPuzzleGameProps {
  /** URL slug, e.g. "career-path". */
  mode: string;
  /** Optional override date (YYYY-MM-DD); defaults to today. */
  date?: string;
}

/**
 * Server component that fetches today's puzzle for the given mode and hands it
 * to the client orchestrator. Per-page SEO wrappers render this; the rest of
 * the page (Metadata, JsonLd, HowToPlay) stays in the page file.
 */
export async function DailyPuzzleGame({ mode, date }: DailyPuzzleGameProps) {
  const entry = GAME_REGISTRY[mode];
  if (!entry) {
    return null;
  }

  const puzzle = await fetchDailyPuzzle(entry.dbMode, date);
  const puzzleDate =
    puzzle?.puzzle_date ?? new Date().toISOString().split("T")[0];

  return (
    <DailyPuzzleClient
      mode={mode}
      content={puzzle?.content ?? null}
      puzzleDate={puzzleDate}
    />
  );
}
```

- [ ] **Step 2: Verify TS compiles**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "DailyPuzzleGame.tsx"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add web/components/play/DailyPuzzleGame.tsx
git commit -m "feat(play): add server-side DailyPuzzleGame puzzle fetcher"
```

---

## Task 11: Migrate the Career Path page to use the orchestrator

**Files:**
- Modify: `web/app/play/career-path/page.tsx`

- [ ] **Step 1: Read the current page to capture the SEO + JSON-LD blocks (kept verbatim)**

Run: `cat web/app/play/career-path/page.tsx`
Expected: shows `generateMetadata`, the `JsonLd` block, the existing `<GamePageShell>` + `<PlayedTodayGate>` + `<CareerPathGame>` wiring, and `<HowToPlay>` at the bottom.

- [ ] **Step 2: Rewrite the page**

Replace the page body (the `export default async function CareerPathPage(...)` block) so that the `<GamePageShell>` + `<PlayedTodayGate>` + `<CareerPathGame>` block becomes a single `<DailyPuzzleGame mode="career-path" date={params.date} />`. Keep the `JsonLd` block and the `<HowToPlay>` block exactly as they are.

After the change, the page looks like:

```tsx
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  // ...keep this function exactly as it was — unchanged
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function CareerPathPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <>
      <JsonLd
        data={{
          // ...keep the existing @graph object exactly as it was
        }}
      />
      <DailyPuzzleGame mode="career-path" date={params.date} />
      <HowToPlay
        title="Career Path"
        rules={[
          // ...keep the existing rules array exactly as it was
        ]}
        tips={[
          // ...keep the existing tips array exactly as it was
        ]}
        keywords="Career Path is a daily footballer guessing game. Guess the player from their career moves and transfer history. A new career path puzzle every day, free to play in your browser."
      />
    </>
  );
}
```

(Preserve all `JsonLd` content, all rules, tips, and keywords text. Do not regenerate them — re-paste what was already in the file.)

- [ ] **Step 3: Verify the page builds**

Run: `cd web && npx next build 2>&1 | tail -30`
Expected: build succeeds; no type errors on this page.

- [ ] **Step 4: Manually smoke-test the page**

Start dev server: `cd web && npm run dev`
Visit: `http://localhost:3000/play/career-path`
Expected:
- Game loads with today's puzzle (or fallback if no live puzzle exists)
- "Career Path" title in the nav
- Banner ad slot under the nav once content mounts
- Submitting the correct answer triggers post-game CTA + share text + rectangle ad
- Submitting wrong answer reveals next career step

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add web/app/play/career-path/page.tsx
git commit -m "refactor(play): migrate /play/career-path to DailyPuzzleGame"
```

---

## Task 12: Migrate the Transfer Guess page to use the orchestrator

**Files:**
- Modify: `web/app/play/transfer-guess/page.tsx`

- [ ] **Step 1: Read the current page**

Run: `cat web/app/play/transfer-guess/page.tsx`
Expected: shows `generateMetadata`, `JsonLd` block, the existing `<GamePageShell>` + `<PlayedTodayGate>` + `<TransferGuessGame>` wiring, and `<HowToPlay>`.

- [ ] **Step 2: Update imports**

Remove these imports from the top of the page (no longer used):

```ts
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_TRANSFER_PUZZLE } from "@/lib/constants";
import type { TransferGuessContent } from "@/types/transferGuess";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TransferGuessGame } from "@/components/play/TransferGuessGame";
```

Add this import:

```ts
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";
```

Keep these imports:

```ts
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { HowToPlay } from "@/components/play/HowToPlay";
```

- [ ] **Step 3: Replace the page body**

In the `export default async function` body, delete the puzzle-fetch lines (`const puzzle = await fetchDailyPuzzle(...)`, `const content = ...`, `const puzzleDate = ...`) and replace the entire `<GamePageShell>` JSX block (the one wrapping `<PlayedTodayGate>` + `<TransferGuessGame>`) with:

```tsx
<DailyPuzzleGame mode="transfer-guess" date={params.date} />
```

Keep the `<JsonLd>` block above it and the `<HowToPlay>` block below it exactly as they were.

- [ ] **Step 4: Verify the page builds**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "transfer-guess/page.tsx"`
Expected: no output.

- [ ] **Step 5: Smoke-test**

Start: `cd web && npm run dev`
Visit: `http://localhost:3000/play/transfer-guess`
Confirm: page loads, transfer card renders, hints reveal on wrong guesses, post-game CTA appears on correct guess, banner + rectangle ads visible.
Stop server.

- [ ] **Step 6: Commit**

```bash
git add web/app/play/transfer-guess/page.tsx
git commit -m "refactor(play): migrate /play/transfer-guess to DailyPuzzleGame"
```

---

## Task 13: Migrate the Connections page

**Files:**
- Modify: `web/app/play/connections/page.tsx`

- [ ] **Step 1: Read the current page**

Run: `cat web/app/play/connections/page.tsx`
Expected: similar pattern to Career Path/Transfer Guess — `generateMetadata`, `JsonLd`, hand-wired shell + `<ConnectionsGame>`, `HowToPlay`.

- [ ] **Step 2: Update imports**

Remove these imports:

```ts
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_CONNECTIONS_PUZZLE } from "@/lib/constants";
import type { ConnectionsContent } from "@/types/connections";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
```

Add:

```ts
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";
```

Keep `Metadata`, `JsonLd`, `HowToPlay` imports.

- [ ] **Step 3: Replace the page body**

Delete puzzle-fetch lines in the page body. Replace the `<GamePageShell>` block with:

```tsx
<DailyPuzzleGame mode="connections" date={params.date} />
```

Keep the `<JsonLd>` block and `<HowToPlay>` block exactly as they were.

- [ ] **Step 4: Verify the page builds**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "connections/page.tsx"`
Expected: no output.

- [ ] **Step 5: Smoke-test**

Start: `cd web && npm run dev`
Visit: `http://localhost:3000/play/connections`
Confirm: 4×4 grid of 16 players renders, selecting 4 evaluates as a group, mistakes counter decrements, post-game CTA on win/loss, banner + rectangle ads visible.
Stop server.

- [ ] **Step 6: Commit**

```bash
git add web/app/play/connections/page.tsx
git commit -m "refactor(play): migrate /play/connections to DailyPuzzleGame"
```

---

## Task 14: Migrate the Topical Quiz page

**Files:**
- Modify: `web/app/play/topical-quiz/page.tsx`

- [ ] **Step 1: Read the current page**

Run: `cat web/app/play/topical-quiz/page.tsx`
Expected: similar pattern — `generateMetadata`, `JsonLd`, hand-wired shell + `<TopicalQuizGame>`, `HowToPlay`.

- [ ] **Step 2: Update imports**

Remove:

```ts
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_QUIZ_PUZZLE } from "@/lib/constants";
import type { QuizContent } from "@/types/quiz";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";
```

Add:

```ts
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";
```

- [ ] **Step 3: Replace the page body**

Delete puzzle-fetch lines. Replace the `<GamePageShell>` block with:

```tsx
<DailyPuzzleGame mode="topical-quiz" date={params.date} />
```

Keep `<JsonLd>` and `<HowToPlay>` exactly as they were.

- [ ] **Step 4: Verify the page builds**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "topical-quiz/page.tsx"`
Expected: no output.

- [ ] **Step 5: Smoke-test**

Start: `cd web && npm run dev`
Visit: `http://localhost:3000/play/topical-quiz`
Confirm: 5 multiple-choice questions render in sequence, selecting an answer locks it and advances, score appears at the end, post-game CTA + share text + ads.
Stop server.

- [ ] **Step 6: Commit**

```bash
git add web/app/play/topical-quiz/page.tsx
git commit -m "refactor(play): migrate /play/topical-quiz to DailyPuzzleGame"
```

---

## Task 15: Migrate the Timeline page

**Files:**
- Modify: `web/app/play/timeline/page.tsx`

- [ ] **Step 1: Read the current page**

Run: `cat web/app/play/timeline/page.tsx`
Expected: similar pattern — `generateMetadata`, `JsonLd`, hand-wired shell + `<TimelineGame>`, `HowToPlay`.

- [ ] **Step 2: Update imports**

Remove:

```ts
import { fetchDailyPuzzle } from "@/lib/fetchDailyPuzzle";
import { FALLBACK_TIMELINE_PUZZLE } from "@/lib/constants";
import type { TimelineContent } from "@/types/timeline";
import { GamePageShell } from "@/components/play/GamePageShell";
import { PlayedTodayGate } from "@/components/play/PlayedTodayGate";
import { TimelineGame } from "@/components/play/TimelineGame";
```

Add:

```ts
import { DailyPuzzleGame } from "@/components/play/DailyPuzzleGame";
```

- [ ] **Step 3: Replace the page body**

Delete puzzle-fetch lines. Replace the `<GamePageShell>` block with:

```tsx
<DailyPuzzleGame mode="timeline" date={params.date} />
```

Keep `<JsonLd>` and `<HowToPlay>` exactly as they were.

- [ ] **Step 4: Verify the page builds**

Run: `cd web && npx tsc --noEmit 2>&1 | grep -F "timeline/page.tsx"`
Expected: no output.

- [ ] **Step 5: Smoke-test**

Start: `cd web && npm run dev`
Visit: `http://localhost:3000/play/timeline`
Confirm: 6 events render as draggable cards, dragging reorders them, "check order" reveals correct/incorrect per slot, locked correct slots stay fixed across attempts, post-game CTA + ads.
Stop server.

- [ ] **Step 6: Commit**

```bash
git add web/app/play/timeline/page.tsx
git commit -m "refactor(play): migrate /play/timeline to DailyPuzzleGame"
```

---

## Task 16: Run the full test + build suite + final smoke

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `cd web && npx vitest run`
Expected: all tests pass; no regressions in any of the 4 existing game test files (Connections, Timeline, TopicalQuiz, TransferGuess) or the new `DailyPuzzleClient` test.

- [ ] **Step 2: Run the type check**

Run: `cd web && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Run the production build**

Run: `cd web && npm run build`
Expected: build succeeds. All 5 game routes appear in the static-route output.

- [ ] **Step 4: Final manual smoke test on all 5 games**

Start dev server: `cd web && npm run dev`

For each of `career-path`, `transfer-guess`, `connections`, `topical-quiz`, `timeline`:
- Visit `http://localhost:3000/play/<slug>`
- Confirm: page loads, game renders, banner ad slot appears under nav, finishing the game shows post-game CTA, share text copies, rectangle ad appears.
- Visit again from the same browser (without clearing localStorage) — confirm the `<PlayedTodayGate>` shows the "you've played today" view.

Stop server.

- [ ] **Step 5: Verify no orphan code**

Run: `grep -rn "useGameComplete\|GameCompleteContext" web/`
Expected: no matches. The old context-based API is fully removed.

- [ ] **Step 6: Commit any cleanup that surfaced + tag the milestone**

If any cleanup was needed during the smoke tests:

```bash
git add <changed files>
git commit -m "fix(play): post-orchestrator-refactor cleanup"
```

Optionally tag the milestone:

```bash
git tag -a phase-1.0-orchestrator-refactor -m "Phase 1.0 complete: orchestrator + 5-game migration"
```

---

## Verification summary

After all tasks complete:
- 5 game pages collapse from ~150-line files into ~80-line SEO-focused wrappers
- Adding the next game (Phase 1.1, Who's That?) is: 1 component file + 1 registry entry + 1 page file (mostly SEO copy)
- The paywall path in Phase 3.2 only needs to touch `<DailyPuzzleClient>` — not 11+ pages
- Zero behaviour change for users; identical UX, identical SEO
