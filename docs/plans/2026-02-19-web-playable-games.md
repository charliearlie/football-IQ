# Plan: Web Playable Games — Drive App Downloads

## Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Shared Infrastructure | **DONE** | All files created, tested, build passes |
| Career Path (`/play/career-path`) | **DONE** | Fully playable, OG image, share text |
| Transfer Guess (`/play/transfer-guess`) | **DONE** | Server page + game component + 23 tests |
| Connections (`/play/connections`) | **DONE** | Grid UI, group matching, Bebas Neue font, 21 tests |
| Topical Quiz (`/play/topical-quiz`) | **DONE** | 5 MCQ with auto-advance, 11 tests |
| OG Images | **DONE** | All 5 routes created (hub + 4 games) |
| Landing Page Updates | **DONE** | GameModeGrid links, nav link, demo link |
| Tests | **DONE** | 765 tests across 29 files (97 infra + 55 game component tests) |

### What Was Built (PR 1)

**Infrastructure files created:**
- `web/lib/fetchDailyPuzzle.ts` — Server-side puzzle fetcher (Supabase admin client)
- `web/lib/playSession.ts` — localStorage play session tracking
- `web/lib/shareText.ts` — Share text generators for all 4 game modes (already written for future games)
- `web/lib/constants.ts` — Added `WEB_PLAYABLE_GAMES` + `APP_ONLY_GAMES` arrays
- `web/components/play/GamePageShell.tsx` — Shell with React Context (`useGameComplete()` hook)
- `web/components/play/GameNav.tsx` — Sticky 56px nav bar
- `web/components/play/AdSlot.tsx` — Placeholder ad container
- `web/components/play/PostGameCTA.tsx` — Inline post-game CTA panel
- `web/components/play/PlayedTodayGate.tsx` — One-play-per-day localStorage gate
- `web/components/play/GameHubCard.tsx` — Hub card with live/completed/app-only states
- `web/app/play/layout.tsx` — Dark theme wrapper
- `web/app/play/page.tsx` — Game hub server component

**Career Path game:**
- `web/app/play/career-path/page.tsx` — Server page with puzzle fetching
- `web/components/play/CareerPathGame.tsx` — Client game with useReducer

**OG Images:**
- `web/components/og/GameOGCard.tsx` — Shared Satori-compatible card
- `web/app/api/og/play/route.tsx` — Hub OG
- `web/app/api/og/play/career-path/route.tsx`
- `web/app/api/og/play/transfer-guess/route.tsx`
- `web/app/api/og/play/connections/route.tsx`
- `web/app/api/og/play/topical-quiz/route.tsx`

**Landing page changes:**
- `web/components/landing/GameModeGrid.tsx` — Added slugs, FREE badges, Link wrapping
- `web/app/page.tsx` — Added "Play Free" nav link + "Play the full version" demo link

**Tests (97 total):**
- `web/lib/__tests__/playSession.test.ts` (29 tests)
- `web/lib/__tests__/shareText.test.ts` (53 tests)
- `web/lib/__tests__/fetchDailyPuzzle.test.ts` (15 tests)

### Critical Architecture Notes

1. **Server→Client boundary**: `GamePageShell` is a `"use client"` component. It provides `GameCompleteContext` via React Context. Game components call `useGameComplete()` to report results. **DO NOT use render-prop/function-as-children pattern** — Next.js 15 cannot serialize functions across the server→client boundary.

2. **Pattern for each new game page:**
   ```
   Server page (page.tsx):
     fetchDailyPuzzle(dbMode, date) → get content
     <GamePageShell title="..." gameSlug="...">
       <PlayedTodayGate gameSlug="...">
         <GameComponent content={...} puzzleDate={...} />
       </PlayedTodayGate>
     </GamePageShell>

   Client game component:
     const onGameComplete = useGameComplete();
     // ...game logic with useReducer...
     onGameComplete({ won, answer, shareText });
   ```

3. **Share text generators already exist** in `web/lib/shareText.ts` for all 4 games. The remaining game components just need to call them.

4. **Content types** live in `web/lib/schemas/puzzle-schemas.ts` — `TransferGuessContent`, `ConnectionsContent`, `TopicalQuizContent`.

5. **Validation**: `web/lib/validation.ts` has `validateGuess()` for fuzzy player name matching (used by Career Path and Transfer Guess).

6. **Build command**: `source ~/.nvm/nvm.sh && nvm use 22 && cd web && npm run build`
7. **Test command**: `source ~/.nvm/nvm.sh && nvm use 22 && cd web && npm test`

---

## Context

The current landing page has a single inline Career Path demo. Landing pages don't convert — playable games do. The plan is to make 4 game modes fully playable on the web at `/play/[game-mode]`, with placeholder ad slots and strategic app-download CTAs. Each game gets its own shareable URL. The web experience is intentionally "incomplete" (no streaks, no IQ score, no tier progression, no archive) to make the app the natural next step. Premium modes (Timeline, Top Tens, Career Path Pro) stay app-only.

This document is the master plan. A dev team will implement it game-by-game using TDD.

---

## Route Structure

```
/play                    → Game hub (server component)
/play/career-path        → Refactored from existing landing embed
/play/transfer-guess     → New
/play/connections        → New
/play/topical-quiz       → New
```

All pages accept `?date=YYYY-MM-DD` for archive/yesterday access.

**Not on web**: Timeline, Top Tens, Career Path Pro — these are premium in the app. We can't offer them free on web and paid in the app. They appear in the hub as "APP ONLY" teasers to drive downloads.

---

## Priority Order

| # | Game | Complexity | Why This Order |
|---|------|-----------|----------------|
| 1 | Career Path | Low (80% built) | Extract from landing, prove the pattern |
| 2 | Transfer Guess | Low-Med | Same text-input pattern as Career Path |
| 3 | Connections | Medium | Highest social-share potential (emoji grid) |
| 4 | Topical Quiz | Low | 5 MCQ questions, simplest UI |

---

## Shared Infrastructure (Build First)

### Files to Create

```
web/app/play/layout.tsx              ← Shared nav + footer for all /play pages
web/app/play/page.tsx                ← Game hub: today's available games
web/components/play/GamePageShell.tsx ← Layout wrapper: GameNav + AdSlot + PostGameCTA
web/components/play/GameNav.tsx      ← Sticky bar: ← ALL GAMES · TITLE · GET APP
web/components/play/AdSlot.tsx       ← Placeholder ad container (fixed height, CLS-safe)
web/components/play/PostGameCTA.tsx  ← Inline app-download panel (NOT a modal)
web/components/play/PlayedTodayGate.tsx ← localStorage gate + "come back tomorrow" screen
web/components/play/GameHubCard.tsx  ← Card component for the /play hub page
web/lib/fetchDailyPuzzle.ts         ← Shared server-side puzzle fetcher
web/lib/playSession.ts              ← localStorage read/write for play state
```

> **Ad slots are placeholders only.** The `AdSlot` component renders a fixed-height container with subtle "Advertisement" text. No ad provider is wired up yet — this will be integrated later. The important thing is the layout reserves the correct space to prevent CLS when ads are eventually loaded.

### Existing Files to Reuse

| File | What to Reuse |
|------|--------------|
| `web/lib/validation.ts` | `validateGuess()` + `normalizeString()` — fuzzy matching for all text-input games |
| `web/lib/schemas/puzzle-schemas.ts` | All content type definitions + `validateContent()` |
| `web/lib/constants.ts` | `GAME_MODES`, `APP_STORE_URL`, `PLAY_STORE_URL`, `FALLBACK_CAREER_PUZZLE` |
| `web/components/landing/PlayableCareerPath.tsx` | Starting point for `/play/career-path` |
| `web/components/landing/SuccessModal.tsx` | Adapt into `PostGameCTA` pattern |
| `web/components/landing/CTAButton.tsx` | Reuse for guess submit buttons |
| `web/components/landing/CareerStepCard.tsx` | Reuse directly in career-path page |
| `web/components/landing/LockedStepCard.tsx` | Reuse directly in career-path page |
| `src/features/connections/utils/share.ts` | Port `generateConnectionsEmojiGrid()` to web |
| `src/features/career-path/utils/share.ts` | Port share text generation pattern to web |

### Data Fetching Pattern

Every game page is a **server component** that fetches the puzzle, passing content as props to the client game component:

```typescript
// web/lib/fetchDailyPuzzle.ts
export async function fetchDailyPuzzle(gameMode: string, date?: string) {
  const supabase = await createAdminClient();
  const puzzleDate = date ?? new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('daily_puzzles')
    .select('content, puzzle_date')
    .eq('game_mode', gameMode)
    .eq('puzzle_date', puzzleDate)
    .eq('status', 'live')
    .single();
  return data;
}
```

`export const revalidate = 3600;` on every page (matches existing landing page pattern).

### localStorage Play Session

```typescript
// web/lib/playSession.ts
// Key format: footballiq_played_{gameSlug}_{YYYY-MM-DD}
// Value: JSON with { won: boolean, shareText: string, timestamp: number }
//
// Functions: markPlayed(), hasPlayedToday(), getPlayResult(), getDaysPlayed()
```

`getDaysPlayed()` enables personalised CTA copy: day 7 → "You've played 7 days in a row on the web — imagine what your streak looks like in the app."

---

## Game Page Layout (All Games Share This)

```
┌────────────────────────────────────────────┐
│  GAME NAV (sticky, 56px)                   │
│  ← ALL GAMES    GAME TITLE      [GET APP]  │
├────────────────────────────────────────────┤
│  TOP AD SLOT (320x50 mobile, 728x90 desk) │
├────────────────────────────────────────────┤
│                                            │
│  GAME CONTENT AREA (max-w-md mx-auto)      │
│  (client component with game logic)        │
│                                            │
├────────────────────────────────────────────┤
│  POST-GAME CTA (slides in on game end)     │
│  Result → Share → App Download → Next Game │
├────────────────────────────────────────────┤
│  BOTTOM AD SLOT (300x250, after game ends) │
├────────────────────────────────────────────┤
│  MINI FOOTER (links to /play, store)       │
└────────────────────────────────────────────┘
```

The game component calls `onGameComplete({ won, shareText })` to trigger the post-game zone.

---

## Ad Strategy (Placeholder Slots)

Ad provider integration comes later. For now, build the layout with placeholder slots:

- **Top banner** (320x50 mobile / 728x90 desktop): Visible before game starts. Collapses once user begins playing.
- **Bottom rectangle** (300x250): Hidden during play (`opacity-0 h-0 overflow-hidden`). Reveals with `PostGameCTA` after game ends.
- **No interstitials during gameplay.** Ever. The answer-reveal moment is sacred.
- **Second-visit interstitial**: On return visits (detected via localStorage), show a full-screen "You're back — play in the app" prompt before the game loads. First visit = no interruption.
- `AdSlot` renders a `div` with exact dimensions, `bg-white/[0.02]` background, and `text-[10px] text-slate-600 uppercase` "Advertisement" label. Fixed height prevents layout shift when real ads load later.

---

## Conversion Strategy

### Post-Game CTA (Inline Panel, NOT a Modal)

The existing `SuccessModal` blocks the result view. Replace with an inline panel that slides in below the game:

1. **Result** — "Well played!" (won) or "The answer was [NAME]" (lost)
2. **Share button** — Copy emoji result to clipboard (the distribution engine)
3. **App download pitch** — "Your score doesn't count without an account. In the app, earn IQ points, build a streak, climb from Intern to The Gaffer."
4. **Other games** — "Also try Transfer Guess and Connections" with links to `/play/[game]`
5. **Store badges** — App Store + Google Play (Coming Soon)

### What's Web-Only vs App-Only

| Web (the hook) | App (the reward) |
|----------------|-----------------|
| 4 daily games, fully playable | All 11 game modes |
| Shareable emoji result card | Score distribution (how you compare) |
| "You played today" localStorage record | Streak counter + streak freeze |
| | IQ points + tier progression |
| | 7-day archive access |
| | Premium modes (Timeline, Top Tens, Career Path Pro) |

### Repeat Visitor Escalation

| Visit # | CTA Variant |
|---------|-------------|
| 1 | Standard: "Track your scores in the app" |
| 7 | "You've played 7 days in a row — imagine your streak in the app" |
| 30 | "30 puzzles without a home for your score" |

---

## Social Sharing (Per Game)

Shared links always go to `/play/[game-mode]` (NOT the App Store). The person receiving the share needs to play first, then convert.

| Game | Share Format |
|------|-------------|
| Career Path | `Football IQ - Career Path\n19 Feb\nSolved in 3/6 clues\n🔓🔓🔓🔒🔒🔒\nfootballiq.app/play/career-path` |
| Transfer Guess | `Football IQ - Transfer Guess\n19 Feb\nGuessed with 1 hint\n💰🔍⬜\nfootballiq.app/play/transfer-guess` |
| Connections | `Football IQ - Connections\n19 Feb\n🟨🟨🟨🟨\n🟩🟦🟩🟩\n...\n1 mistake\nfootballiq.app/play/connections` |
| Topical Quiz | `Football IQ - Quiz\n19 Feb\n4/5 correct\n✅✅❌✅✅\nfootballiq.app/play/topical-quiz` |

Each page needs custom Open Graph meta tags so shared links preview attractively on social platforms.

---

## Game Hub (/play) Design

```
┌─────────────────────────────────────────────┐
│  NAV: FOOTBALL IQ                [GET APP]  │
├─────────────────────────────────────────────┤
│  TODAY'S GAMES                              │
│  WEDNESDAY · 19 FEB                         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  CAREER PATH              [LIVE]    │   │  ← Featured card, full-width
│  │  Guess the player from their career │   │
│  │  [  PLAY TODAY'S GAME  →  ]         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌────────────────┐  ┌────────────────┐    │
│  │ TRANSFER GUESS │  │ CONNECTIONS    │    │  ← 2-col grid
│  │ [LIVE]         │  │ [LIVE]         │    │
│  │ [PLAY →]       │  │ [PLAY →]       │    │
│  └────────────────┘  └────────────────┘    │
│                                             │
│  ┌────────────────┐                        │
│  │ TOPICAL QUIZ   │                        │
│  │ [LIVE]         │                        │
│  │ [PLAY →]       │                        │
│  └────────────────┘                        │
│                                             │
│  ─────── MORE IN THE APP ────────────────  │
│  [Timeline] [Top Tens] [The Grid] ...       │  ← Greyed, "APP ONLY"
│  [  DOWNLOAD FOOTBALL IQ — FREE  ]         │
└─────────────────────────────────────────────┘
```

**Card states**: `available` (LIVE badge, play button) → `completed` (PLAYED TODAY checkmark, still clickable) → `no_puzzle` (NEXT PUZZLE SOON, disabled).

Hub server component fetches puzzle existence only:
```sql
SELECT game_mode FROM daily_puzzles
WHERE puzzle_date = today AND status = 'live'
AND game_mode IN ('career_path', 'guess_the_transfer', 'connections', 'topical_quiz')
```

The remaining 7 game modes (Timeline, Top Tens, Career Path Pro, The Grid, The Chain, Threads, Goalscorer Recall, Starting XI) appear in a "MORE IN THE APP" section as greyed-out cards with an "APP ONLY" badge — driving downloads through FOMO.

---

## Game-by-Game Implementation Notes

### 1. Career Path (`/play/career-path`)

**Effort**: Low — extract + wrap existing components.

- Move `PlayableCareerPath` logic into `web/components/play/PlayableCareerPath.tsx`
- Reuse `CareerStepCard`, `LockedStepCard`, `CTAButton` from `web/components/landing/`
- Replace `SuccessModal` with inline `PostGameCTA`
- Add share text generation (port pattern from `src/features/career-path/utils/share.ts`)
- Server page fetches puzzle via `fetchDailyPuzzle('career_path', date)`
- Update landing page: keep inline demo, add "Play the full version →" link below it
- **TDD**: Test game state reducer, guess validation, share text generation, localStorage gating

### 2. Transfer Guess (`/play/transfer-guess`)

**Effort**: Medium — new component, same text-input pattern.

- Create `web/components/play/PlayableTransferGuess.tsx`
- Core UI: Transfer card (two coloured club circles + fee + arrow), 3 hint slots, text input
- `useReducer` for game state: guesses remaining (5), hints revealed (0-3), game status
- Reuse `validateGuess()` from `web/lib/validation.ts` for fuzzy player name matching
- Content type: `TransferGuessContent` from `web/lib/schemas/puzzle-schemas.ts`
- Hints array: `[year, position, nationality_code]` — reveal progressively on wrong guess or button tap
- Port share format from `src/features/transfer-guess/` (hints used, guess count)
- **TDD**: Test reducer transitions, hint reveal logic, guess validation, share text

### 3. Connections (`/play/connections`)

**Effort**: Medium — grid UI with tap-to-select.

- Create `web/components/play/PlayableConnections.tsx`
- 4x4 CSS grid (`grid-template-columns: repeat(4, 1fr)`, min 44px touch targets)
- Cell states: default → selected (pitch-green border) → solved (coloured group banner)
- Solved groups slide to top of grid as coloured banners
- 4 mistakes allowed, visual indicator (dots)
- "One away" feedback toast when 3/4 correct
- Port `generateConnectionsEmojiGrid()` from `src/features/connections/utils/share.ts` (replace React Native imports with web clipboard API)
- Content type: `ConnectionsContent` from `web/lib/schemas/puzzle-schemas.ts`
- **TDD**: Test group matching, mistake counting, "one away" detection, shuffle, share grid generation

### 4. Topical Quiz (`/play/topical-quiz`)

**Effort**: Low — 5 MCQ questions, static layout.

- Create `web/components/play/PlayableTopicalQuiz.tsx`
- Question card with 4 option buttons
- On select: 800ms reveal (green/red), then auto-advance to next question
- Progress bar inside card (thin pitch-green strip, fills over 5 questions)
- Content type: `TopicalQuizContent` from `web/lib/schemas/puzzle-schemas.ts`
- **TDD**: Test answer checking, score tally, auto-advance timing, share text

---

## Landing Page Changes

1. `GameModeGrid` (`web/components/landing/GameModeGrid.tsx`) — cards for the 4 web-playable games (Career Path, Transfer Guess, Connections, Topical Quiz) get `<Link href="/play/{slug}">` wrapping with a "PLAY FREE" badge. All other games keep their current display + get an "APP ONLY" badge.
2. Nav in `web/app/page.tsx` gets a "PLAY FREE" link pointing to `/play`.
3. Existing inline `PlayableCareerPath` stays. Add subtle "Play the full version →" link beneath it pointing to `/play/career-path`.

---

## TDD Approach (Per Game)

Each game implementation follows this test-first pattern:

1. **Game state reducer tests** — Write tests for every state transition (guess, reveal hint, game over, etc.) before implementing the reducer
2. **Validation/matching tests** — Test fuzzy matching, group detection, order checking etc.
3. **Share text generation tests** — Test emoji grid/row generation for each game
4. **localStorage utility tests** — Test `markPlayed()`, `hasPlayedToday()`, `getPlayResult()`
5. **Component integration tests** — Test the full game flow: initial render → user interaction → game end → CTA display

Test files go in `web/components/play/__tests__/` and `web/lib/__tests__/`.

---

## Verification

1. **Per game**: Run `source ~/.nvm/nvm.sh && nvm use 22 && cd web && npm run dev`, navigate to `/play/[game]`, play through a full game, verify post-game CTA and share work
2. **Hub**: Visit `/play`, verify all game cards show correct status (LIVE/NO PUZZLE)
3. **Already-played gate**: Play a game, refresh page, verify "already played today" screen appears
4. **Ad slots**: Verify top ad visible before play, bottom ad + CTA appear after game ends, no CLS
5. **Mobile**: Test on Chrome DevTools mobile viewport — verify touch targets, ad sizing, sticky nav
6. **Share**: Copy share text, verify it includes correct emoji format and `/play/[game]` URL
7. **Landing page**: Verify GameModeGrid cards link to `/play/[game]` for web-playable modes
8. **Tests**: `npm test` passes for all new test files
9. **Build**: `npm run build` succeeds with no new errors
