# Football IQ - Project Context

## Overview
Football IQ is a mobile trivia game featuring daily puzzles across 6 game modes:
1. **Career Path** - Guess player from sequential career clues
2. **The Grid** - Fill 3x3 matrix with players matching criteria
3. **Transfer Guess** - Identify player from transfer info
4. **Goalscorer Recall** - Name scorers from historic match (timed)
5. **Topical Quiz** - 5 multiple-choice questions
6. **Top Tens** (Premium) - Name all 10 answers in a ranked list

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
| `agent_runs` | Blocked | AI agent logs (admin-only) |
| `match_data` | Blocked | Football match data (admin-only) |

### SQLite Tables (Local)
```sql
puzzles (id, game_mode, puzzle_date, content, difficulty, synced_at)
attempts (id, puzzle_id, completed, score, score_display, metadata, started_at, completed_at, synced)
sync_queue (id, table_name, record_id, action, payload, created_at)
unlocked_puzzles (puzzle_id, unlocked_at)  -- Ad unlocks (permanent)
puzzle_catalog (id, game_mode, puzzle_date, difficulty)  -- Archive metadata
player_database (id, external_id, name, search_name, clubs, nationalities, is_active)
```

### Migrations
**Supabase:** 001-009 + 012 (base tables, RLS, triggers, catalog RPC, leaderboard RPCs, score distribution, safe upsert)
**SQLite:** v1-v4 (base schema, catalog, unlocks, player database)

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
- **Attempt sync**: SQLite → Supabase via `safe_upsert_attempt()` RPC
- **Completion protection**: Once `completed=true`, stale syncs cannot overwrite
- **Key files**: `src/features/puzzles/context/PuzzleContext.tsx`, `services/attemptSyncService.ts`

### Progressive Save
All game modes save progress to SQLite on app background, restore on return. Uses `AppState` listener + `RESTORE_PROGRESS` action in game hooks.

## Game Modes

### Career Path
Guess player from sequential career steps. Each wrong guess reveals next step as penalty.

**Content**: `{ answer, career_steps: [{ type, text, year, apps?, goals? }] }`
**Scoring**: `totalSteps - (revealedSteps - 1)` points (0 if lost)
**Display**: `⬛` hidden, `⬜` revealed, `🟩` winning step, `🟥` lost
**Files**: `src/features/career-path/`

### Transfer Guess
Identify player from transfer details. Hints revealed voluntarily (not on wrong guess).

**Content**: `{ answer, from_club, to_club, year, fee, hints: [nation, position, achievement] }`
**Scoring**: `10 - (hints×2) - (wrongGuesses×1)`, min 1 if correct, 0 if lost
**Display**: `⚫` hint hidden, `🟡` revealed; `❌` wrong, `✅` correct, `💀` gave up
**Files**: `src/features/transfer-guess/`

### Goalscorer Recall
Name all goalscorers from a match within 60 seconds. Own goals auto-revealed.

**Content**: `{ home_team, away_team, scores, competition, match_date, goals: [{ scorer, minute, team, isOwnGoal? }] }`
**Scoring**: `(foundScorers / totalScorers) × 100` + time bonus if all found
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
**Scoring**: 1 point per answer found (0-10)
**Display**: `✅✅✅❌❌❌❌❌❌❌` (one per rank)
**Access**: `PremiumOnlyGate` component wraps screens
**Files**: `src/features/top-tens/`

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

### Score Distribution Graph
Wordle-style "How You Compare" bar chart in result modals.
- Per-puzzle distribution via `get_puzzle_score_distribution()` RPC
- Scores bucketed 0-100 in 10s, user's bucket highlighted
- **Files**: `src/features/stats/components/ScoreDistribution*.tsx`

### Settings
Fourth tab with Privacy Policy, Terms, Rate App, and secret dev menu (7 taps on version).
- **Files**: `src/features/settings/`, `app/(tabs)/settings.tsx`

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

## Key Files Reference

```
app/
  (tabs)/              # Bottom tabs: Home, Archive, My IQ, Settings
  career-path/         # Career Path routes
  transfer-guess/      # Transfer Guess routes
  goalscorer-recall/   # Goalscorer Recall routes
  the-grid/            # The Grid routes
  topical-quiz/        # Topical Quiz routes
  top-tens/            # Top Tens routes (premium)
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
```

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
