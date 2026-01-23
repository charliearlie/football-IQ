# Football IQ - Project Context

## Overview
Football IQ is a mobile trivia game featuring daily puzzles across 8 game modes:
1. **Career Path** - Guess player from sequential career clues
2. **Career Path Pro** (Premium) - Premium version of Career Path with harder players
3. **The Grid** - Fill 3x3 matrix with players matching criteria
4. **Transfer Guess** - Identify player from transfer info
5. **Goalscorer Recall** - Name scorers from historic match (timed)
6. **Topical Quiz** - 5 multiple-choice questions
7. **Top Tens** (Premium) - Name all 10 answers in a ranked list
8. **Starting XI** - Identify hidden players on a tactical pitch lineup

## Tech Stack
| Layer | Technology |
|-------|------------|
| Mobile App | React Native 0.76.5 + Expo SDK 52 |
| Routing | Expo Router 4.x (file-based) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Local Storage | Expo SQLite (offline-first) |
| Payments | RevenueCat |
| Ads | Google AdMob |
| CMS | `tools/content-creator.html` (standalone) |

## Database Schema

### Supabase Tables
| Table | RLS | Purpose |
|-------|-----|---------|
| `daily_puzzles` | Yes | One puzzle per game mode per day |
| `profiles` | Yes | User profiles with `is_premium` flag |
| `puzzle_attempts` | Yes | User puzzle attempts with scores |
| `user_streaks` | Yes | Streak tracking per game mode |
| `content_reports` | Yes | User error reports for puzzle content |
| `agent_runs` | Blocked | AI agent logs (admin-only) |
| `match_data` | Blocked | Football match data (admin-only) |

### SQLite Tables (Local)
```sql
puzzles (id, game_mode, puzzle_date, content, difficulty, synced_at, updated_at)
attempts (id, puzzle_id, completed, score, score_display, metadata, started_at, completed_at, synced)
sync_queue (id, table_name, record_id, action, payload, created_at)
unlocked_puzzles (puzzle_id, unlocked_at)  -- Ad unlocks (permanent)
puzzle_catalog (id, game_mode, puzzle_date, difficulty)  -- Archive metadata
player_database (id, external_id, name, search_name, clubs, nationalities, is_active)
```

### Migrations
**Supabase:** 001-009 + 012 (base tables, RLS, triggers, catalog RPC, leaderboard RPCs, score distribution, safe upsert)
**SQLite:** v1-v5 (base schema, catalog, unlocks, player database, puzzle updated_at)

## Authentication

### Flow
1. App mount → Check existing session
2. No session → Auto `signInAnonymously()`
3. First run → Prompt for display_name (FirstRunModal)
4. Optional → Email OTP to link account and preserve data

### Key Files
- `src/features/auth/context/AuthContext.tsx` - AuthProvider + useAuth hook
- `src/features/auth/components/AuthGate.tsx` - Blocks until authenticated
- `src/features/auth/context/SubscriptionSyncContext.tsx` - RevenueCat ↔ Supabase sync

## Shared Systems

### Fuzzy Name Validation
All game modes use `src/lib/validation.ts` for player name matching:
- Case insensitive, accent normalization (Özil = Ozil)
- Partial name matching (surname only: "Messi" = "Lionel Messi")
- Typo tolerance via Dice coefficient (threshold: 0.85)

### Access Control (3-Tier)
| Tier | User Type | Puzzle Access |
|------|-----------|---------------|
| 1 | Anonymous | Today only |
| 2 | Free (authenticated) | Last 7 days |
| 3 | Premium | Full archive |

```typescript
// src/features/archive/utils/dateGrouping.ts
function isPuzzleLocked(puzzleDate, isPremium, puzzleId?, adUnlocks?, hasCompletedAttempt?): boolean {
  if (hasCompletedAttempt) return false;  // Completed = permanent unlock
  if (isPremium) return false;
  if (isWithinFreeWindow(puzzleDate)) return false;  // 7-day window
  if (hasValidAdUnlock(puzzleId, adUnlocks)) return false;  // Ad unlock
  return true;
}
```

### Sync Engine
- **Puzzle sync**: Supabase → SQLite on app launch (RLS filters by tier)
- **Light sync**: On app foreground, compares `updated_at` timestamps to detect CMS edits
- **Attempt sync**: SQLite → Supabase via `safe_upsert_attempt()` RPC
- **Completion protection**: Once `completed=true`, stale syncs cannot overwrite
- **Staleness detection**: Per-puzzle `updated_at` comparison (30s cooldown)
- **Key files**: `src/features/puzzles/context/PuzzleContext.tsx`, `services/puzzleLightSyncService.ts`

### Progressive Save
All game modes save progress to SQLite on app background, restore on return. Uses `AppState` listener + `RESTORE_PROGRESS` action in game hooks.

### Time Integrity System
Prevents clock manipulation to access future/past puzzles:
- **Server time sources**: worldtimeapi.org (primary), Supabase RPC (fallback)
- **Drift detection**: Compares Unix timestamps (timezone-agnostic), threshold ±5 minutes
- **Local dates**: Puzzles use user's local timezone (Wordle-style midnight rollover)
- **Blocking overlay**: Non-dismissible "Time Out of Sync" screen when tampered
- **Midnight refresh**: Auto-syncs puzzles at user's local midnight
- **Offline fallback**: Uses cached time; detects backward clock manipulation
- **Files**: `src/lib/time.ts`, `src/features/integrity/`

## Game Modes

### Career Path
Guess player from sequential career steps. Each wrong guess reveals next step as penalty.

**Content**: `{ answer, career_steps: [{ type, text, year, apps?, goals? }] }`
**Scoring**: `totalSteps - (revealedSteps - 1)` points (0 if lost)
**Display**: `⬛` hidden, `⬜` revealed, `🟩` winning step, `🟥` lost
**Victory Reveal**: On correct guess, all hidden steps reveal with staggered animation (200ms each), followed by haptic celebration and 1.5s delay before result modal. "View Full Path" button lets user toggle between modal and full career view.
**Files**: `src/features/career-path/`

### Career Path Pro (Premium Only)
Premium version of Career Path using the same unified engine. Features harder/more obscure players.
Uses `PremiumOnlyGate` wrapper - non-premium users cannot access regardless of puzzle date.

**Content**: Same structure as Career Path
**Scoring**: Same scoring formula as Career Path
**Display**: Same emoji grid with "Career Path Pro" title
**Access**: `PremiumOnlyGate` component wraps screens
**Files**: `app/career-path-pro/`, `src/features/career-path/` (shared engine)

### Transfer Guess
Identify player from transfer details. Hints revealed voluntarily (not on wrong guess).

**Content**: `{ answer, from_club, to_club, year, fee, hints: [nation, position, achievement] }`
**Scoring**: `10 - (hints×2) - (wrongGuesses×1)`, min 1 if correct, 0 if lost
**Display**: `⚫` hint hidden, `🟡` revealed; `❌` wrong, `✅` correct, `💀` gave up
**Files**: `src/features/transfer-guess/`

### Goalscorer Recall
Name all goalscorers from a match within 60 seconds. Own goals auto-revealed.

**Content**: `{ home_team, away_team, scores, competition, match_date, goals: [{ scorer, minute, team, isOwnGoal? }] }`
**Scoring**: 1pt per scorer + 3pt bonus for finding all (e.g., 6/6 = 9pts)
**Display**: `⏱️Xs | ✅✅❌❌` (time + goals)
**Files**: `src/features/goalscorer-recall/`

### The Grid
Fill 3x3 matrix with players matching row (Y-axis) and column (X-axis) criteria.

**Content**: `{ xAxis: [cat, cat, cat], yAxis: [cat, cat, cat], valid_answers: { "0": [...], ... } }`
**Categories**: `club`, `nation`, `stat`, `trophy`
**Scoring**: `cellsFilled === 9 ? 100 : Math.round((cellsFilled / 9) × 100)`
**Display**: 3x3 grid of `✅` filled / `❌` empty
**Validation**: Uses `player_database` SQLite table for club/nation checks
**Files**: `src/features/the-grid/`

*Note: Legacy Tic Tac Toe (`tic_tac_toe`) still exists for archive review but replaced by The Grid for daily play.*

### Topical Quiz
5 multiple-choice questions on current events. Auto-advances after answer.

**Content**: `{ questions: [{ id, question, imageUrl?, options: [4], correctIndex }] }`
**Scoring**: 2 points per correct answer (0-10 total)
**Display**: `✅❌✅✅❌` (one per question)
**Files**: `src/features/topical-quiz/`

### Top Tens (Premium Only)
Guess all 10 items in a ranked list. Correct guesses reveal at rank position.

**Content**: `{ title, category?, answers: [{ name, aliases?, info? }] }`
**Scoring**: Progressive tiers (1,1,2,2,3,3,4,4,5,8) max 30pts, 10th = Jackpot!
**Display**: `✅✅✅❌❌❌❌❌❌❌` (one per rank)
**Access**: `PremiumOnlyGate` component wraps screens
**Files**: `src/features/top-tens/`

### Starting XI
Identify hidden players in a historic match lineup displayed on a tactical pitch.

**Content**: `{ match_name, competition, match_date, formation, team, players: [{ position_key, player_name, is_hidden, override_x?, override_y? }] }`
**Formations**: `4-3-3`, `4-2-3-1`, `4-4-2`, `3-5-2`, `3-4-3`, `5-3-2`
**Position coords**: y=90 (defensive), y=10 (attacking), x=0-100 (left-right)
**Scoring**: 1pt per hidden player + 3pt Perfect XI bonus (max 5 hidden, max 8pts)
**Display**: Formation-based emoji grid (⬜ hidden, 🟩 found)
**Files**: `src/features/starting-xi/`

## Features

### Daily Loop
Home screen dashboard showing today's 6 puzzles with Play/Resume/Done states.
- **StreakHeader**: Fire icon + count, daily progress (X/6)
- **Card states**: Play (green), Resume (yellow), Done (emoji grid + Result button)
- **Midnight refresh**: AppState listener triggers refresh on date change
- **Files**: `src/features/home/`, `app/(tabs)/index.tsx`

### Archive Screen
Historical puzzle browser with premium gating and "Velvet Rope" locked card design.
- **Filters**: All, Incomplete, or by game mode
- **Catalog sync**: `get_puzzle_catalog()` RPC bypasses RLS to show locked puzzle metadata
- **Completed puzzles**: Always unlocked for viewing results
- **Files**: `src/features/archive/`, `app/(tabs)/archive.tsx`

### Premium Gating
Two-layer defense: UI hook (`useGatedNavigation`) + route HOC (`PremiumGate`).
- Locked cards show gold border + Crown unlock button
- Tapping locked → `UnlockChoiceModal` (Go Premium or Watch Ad)
- Deep-link bypass blocked by `PremiumGate` on `[puzzleId].tsx` routes
- **Files**: `src/features/archive/hooks/useGatedNavigation.ts`, `src/features/auth/components/PremiumGate.tsx`

### Leaderboard
Daily (0-500 cumulative) and Global IQ (0-100 weighted) rankings.
- DENSE_RANK with earliest completion as tiebreaker
- Polling every 30s, sticky "Me" bar when scrolled
- **Files**: `src/features/leaderboard/`, `app/leaderboard/index.tsx`

### My IQ Profile
Aggregates all attempts to calculate Global IQ (weighted average across modes).
- **Tiers**: Rookie (0-29), Apprentice (30-49), Intermediate (50-69), Expert (70-89), Elite (90+)
- **Badges**: Streak milestones, perfect scores, games played
- **Files**: `src/features/stats/`, `app/(tabs)/stats.tsx`

### Streak Calendar
Mobile-optimized calendar showing daily completion history on My IQ tab.
- **Cell intensity**: 0 games (navy), 1-3 (green 50%), 4+ (green 100%)
- **3D depth**: Uses Solid Layer architecture (1px sunk, 3px filled)
- **Tooltips**: Tap cell to see date, IQ earned, game mode completion icons
- **Perfect Week**: Gold left border on weeks with Mon-Sun completions
- **Flame Icon**: Shows longest streak within each month
- **Premium Gating**: Free users see 60 days, older months blurred with upsell
- **Files**: `src/features/stats/components/StreakCalendar/`

### Score Distribution Graph
Wordle-style "How You Compare" bar chart in result modals.
- Per-puzzle distribution via `get_puzzle_score_distribution()` RPC
- Scores bucketed 0-100 in 10s, user's bucket highlighted
- **Files**: `src/features/stats/components/ScoreDistribution*.tsx`

### Settings
Fourth tab with Privacy Policy, Terms, Rate App, and secret dev menu (7 taps on version).
- **Files**: `src/features/settings/`, `app/(tabs)/settings.tsx`

### Local Notifications
Push-style local notifications to maximize DAU and protect streaks.
- **Daily Kick-off** (08:30): Morning reminder if user hasn't played, rotating messages
- **Streak Saver** (20:00): Evening alert if `streak > 0 AND gamesPlayedToday === 0`
- **Perfect Day**: Full-screen confetti celebration when all daily puzzles completed
- **Scheduling**: Uses True-Time system (`getTimeDriftMs()`) for accurate timing
- **Permission Flow**: Custom modal shown after first puzzle completion
- **Files**: `src/features/notifications/`

### Review Mode
Visual replay of completed games showing user choices, hints used, and outcomes.
- Career Path: Green winning step / red missed step
- Transfer Guess: Shows only actually revealed hints
- Goalscorer Recall: Found vs Missed comparison view
- All screens show "REVIEWING COMPLETED GAME" banner

## Monetization

### RevenueCat (Subscriptions)
- **Entitlement**: `premium_access`
- **Offering**: `default_offering`
- **Sync**: `SubscriptionSyncProvider` syncs entitlement → `profiles.is_premium` in Supabase
- **Offer detection**: Auto-detects free trials and intro pricing
- **Files**: `src/config/revenueCat.ts`, `src/features/subscription/`

### Google AdMob
- **Banner**: Global in tab layout, auto-hides for premium
- **Rewarded**: Watch-to-unlock for permanent archive puzzle access
- **Files**: `src/features/ads/`

| Type | iOS | Android |
|------|-----|---------|
| Banner | `ca-app-pub-9426782115883407/8614691809` | `ca-app-pub-9426782115883407/4156572045` |
| Rewarded | `ca-app-pub-9426782115883407/6782735388` | `ca-app-pub-9426782115883407/1028873493` |

### Sentry Error Monitoring
- **Organization**: `football-iq`
- **Project**: `football-iq-mobile`
- **Region**: `de.sentry.io`
- **DSN**: Environment variable `EXPO_PUBLIC_SENTRY_DSN`
- **Initialization**: `app/_layout.tsx` (disabled in `__DEV__`)
- **Error Boundary**: `Sentry.ErrorBoundary` wraps root navigation with `SentryErrorFallback` component
- **Source Maps**: Not yet configured (future: Xcode Build Phase with `sentry-cli`)
- **Files**: `src/components/SentryErrorFallback.tsx`

## App Configuration

```json
{
  "name": "Football IQ",
  "slug": "football-iq",
  "version": "1.0.0",
  "ios.bundleIdentifier": "com.charliearlie.footballiq.app",
  "ios.buildNumber": "17"  // INCREMENT BEFORE EACH SUBMISSION
}
```

**RevenueCat Keys:**
- Production: `appl_QWyaHOEVWcyFzTWkykxesWlqhDo`
- Sandbox: `test_otNRIIDWLJwJlzISdCbUzGtwwlD`

**AdMob App IDs:**
- iOS: `ca-app-pub-9426782115883407~8797195643`
- Android: `ca-app-pub-9426782115883407~1712062487`

**OpenAI (CMS AI Scout):**
- Model: `gpt-4o`
- Temperature: `0.2` (factual accuracy)
- Env var: `OPENAI_API_KEY` (server-side only in `web/.env.local`)

## Key Files Reference

```
app/
  (tabs)/              # Bottom tabs: Home, Archive, My IQ, Settings
  career-path/         # Career Path routes
  career-path-pro/     # Career Path Pro routes (premium, shared engine)
  transfer-guess/      # Transfer Guess routes
  goalscorer-recall/   # Goalscorer Recall routes
  the-grid/            # The Grid routes
  topical-quiz/        # Topical Quiz routes
  top-tens/            # Top Tens routes (premium)
  starting-xi/         # Starting XI routes
  premium-modal.tsx    # Native subscription sheet
  leaderboard/         # Leaderboard screen

src/
  features/            # Feature modules (auth, puzzles, ads, stats, etc.)
  components/          # Shared UI (GlassCard, ElevatedButton, Skeletons)
  lib/                 # Utilities (supabase.ts, database.ts, validation.ts, haptics.ts)
  theme/               # Design tokens (colors, fonts, spacing)
  hooks/               # Shared hooks (useHaptics, useFeedback)
  services/player/     # Player database search service

tools/
  content-creator.html # Admin puzzle creation tool

web/                   # CMS (Command Centre)
  app/                 # Next.js 15 App Router
  components/          # shadcn/ui components
  hooks/               # Data fetching hooks
  lib/                 # Supabase clients
```

## Command Centre (CMS)

A Next.js 15 web application for managing puzzle content.

**Location**: `/web` directory (excluded from mobile build)

**Features**:
- Master Calendar view showing 8 game modes per day
- Green/Red dot indicators for puzzle status
- Quick View sidebar for puzzle details
- Supabase Auth with protected routes
- **AI Scout**: Auto-populate Career Path timelines from Wikipedia URLs
- **Intelligent Scheduler**: Schedule-aware puzzle management (see below)

### AI Scout Feature
Extracts career data from Wikipedia using MediaWiki API + OpenAI gpt-4o.
- **Input**: Wikipedia player URL (e.g., `https://en.wikipedia.org/wiki/Andrea_Pirlo`)
- **Output**: Populated career timeline with clubs, years, apps, goals, and trivia
- **Confidence scoring**: High/Medium/Low indicators per step
- **Anti-hallucination**: Validates extracted clubs against source wikitext
- **Provenance Metadata**: Extracts Wikipedia revision ID and timestamp for audit trail
- **Files**: `web/lib/ai/career-scout.ts`, `web/types/ai.ts`
- **See**: `docs/memory/decisions/ai-scout.md` for full documentation

### Content Oracle
AI-powered bulk puzzle generation and user error reporting system.
- **Oracle Engine**: Suggests players for Career Path/Pro based on game mode difficulty
  - `career_path`: High-profile players (Ballon d'Or nominees, league legends)
  - `career_path_pro`: Cult heroes, journeymen, obscure legends
  - 30-day deduplication against existing puzzles
- **Metadata Enrichment**: `_metadata` object in puzzle content tracks provenance:
  - `scouted_at`: ISO timestamp when AI Scout extracted data
  - `wikipedia_revision_id`: MediaWiki revision ID for audit trail
  - `generated_by`: `"manual"` | `"ai_oracle"` | `"ai_scout"`
- **CMS Features**:
  - "Oracle" dropdown in Calendar header to bulk-fill schedule gaps
  - Report badges (red indicator) on GameModeDot for puzzles with pending reports
  - Report triage section in PuzzleEditorModal with Resolve/Dismiss actions
- **Mobile Features**:
  - ScoutingDisclaimer footer showing data provenance date
  - ReportErrorSheet for submitting error reports (5 quick-select types)
- **Database**: `content_reports` table with RLS (users can insert, admins can read/update)
- **Files**: `web/lib/ai/oracle.ts`, `web/hooks/use-reports.ts`, `src/features/career-path/components/ScoutingDisclaimer.tsx`, `src/features/career-path/components/ReportErrorSheet.tsx`
- **See**: `docs/memory/decisions/content-oracle.md` for full documentation

### Intelligent Scheduler
Schedule-aware puzzle management system for efficient content creation.
- **Weekly Schedule**: Defines which game modes run on which days (see `web/lib/scheduler.ts`)
- **Backlog Puzzles**: Create puzzles without dates, assign later from the Backlog panel
- **Progress Indicators**: Each day shows `populatedRequired/requiredCount` (e.g., "5/6")
- **Gap Warnings**: Yellow border on days in next 14 days with missing required puzzles
- **Initialize Week**: Creates draft placeholders for all missing required slots in a week
- **Save & Next Gap**: Editor button that saves and opens the next chronological gap
- **Bonus Puzzles**: Mark puzzles as bonus content (gold ring indicator) - excluded from schedule requirements
- **Smart Displacement**: When assigning a puzzle to an occupied slot, offers conflict resolution:
  - **Add as Bonus**: Keep both, mark incoming puzzle as bonus content
  - **Displace Existing**: Move current puzzle forward to next available slot (supports ripple effect up to 5 levels)
  - **Swap**: Exchange dates between two puzzles of the same game mode
- **Files**: `web/lib/scheduler.ts`, `web/lib/displacement.ts`, `web/hooks/use-backlog-puzzles.ts`, `web/components/puzzle/backlog-sheet.tsx`, `web/components/puzzle/conflict-resolution-modal.tsx`
- **See**: `docs/memory/decisions/intelligent-scheduler.md` for full documentation

**Tech Stack**: Next.js 15, Tailwind CSS, shadcn/ui, Supabase SSR

**Running the CMS**:
```bash
cd web
npm install
cp .env.local.example .env.local  # Fill in Supabase keys
npm run dev
```

**Key Files**:
- `web/app/(dashboard)/calendar/page.tsx` - Master Calendar
- `web/hooks/use-puzzles.ts` - Data fetching
- `web/components/calendar/` - Calendar components
- `web/lib/supabase/server.ts` - Admin client (bypasses RLS)

## Design System ("Digital Pitch")

| Token | Value | Usage |
|-------|-------|-------|
| Pitch Green | #58CC02 | Primary actions |
| Stadium Navy | #0F172A | Background |
| Floodlight White | #F8FAFC | Text |
| Card Yellow | #FACC15 | Highlights, warnings |
| Red Card | #EF4444 | Errors, destructive |

**Typography**: Bebas Neue (headlines), Inter (body)
**Core Components**: `ElevatedButton` (3D neubrutalist), `GlassCard` (frosted blur)

### Solid Layer 3D Architecture
All interactive elements use a two-layer View structure for cross-platform 3D depth:
- **Shadow layer**: Fixed at bottom, solid darker color
- **Top layer**: Animates `translateY` on press (squash effect)

See `docs/memory/decisions/solid-layer-3d.md` for implementation details.

**Depth values** (`depthOffset`): button=8px, card=2px, gridCell=3px, sunk=1px
