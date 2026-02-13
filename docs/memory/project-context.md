# Football IQ - Project Context

## Overview

Football IQ is a mobile trivia game featuring daily puzzles across 10 game modes:

1. **Career Path** - Guess player from sequential career clues
2. **Career Path Pro** (Premium) - Premium version of Career Path with harder players
3. **The Grid** - Fill 3x3 matrix with players matching criteria
4. **The Chain** - Connect two players through shared club history (Inverse Par scoring)
5. **The Thread** - Guess the club from a chronological list of kit sponsors/suppliers
6. **Transfer Guess** - Identify player from transfer info
7. **Goalscorer Recall** - Name scorers from historic match (timed)
8. **Topical Quiz** - 5 multiple-choice questions
9. **Top Tens** (Premium) - Name all 10 answers in a ranked list
10. **Starting XI** - Identify hidden players on a tactical pitch lineup

## Tech Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Mobile App    | React Native 0.76.5 + Expo SDK 52         |
| Routing       | Expo Router 4.x (file-based)              |
| Backend       | Supabase (PostgreSQL + Auth + Realtime)   |
| Local Storage | Expo SQLite (offline-first)               |
| Payments      | RevenueCat                                |
| Ads           | Google AdMob                              |
| CMS           | `tools/content-creator.html` (standalone) |

## Database Schema

### Supabase Tables

| Table                 | RLS          | Purpose                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------- |
| `daily_puzzles`       | Yes          | One puzzle per game mode per day (+ special event puzzles via `is_special` flag) |
| `profiles`            | Yes          | User profiles with `is_premium` flag                                             |
| `puzzle_attempts`     | Yes          | User puzzle attempts with scores                                                 |
| `user_streaks`        | Yes          | Streak tracking per game mode                                                    |
| `content_reports`     | Yes          | User error reports for puzzle content                                            |
| `game_submissions`    | Yes          | User-submitted game mode ideas                                                   |
| `players`             | Yes (SELECT) | Wikidata player graph (QID PK) + `api_football_id` external mapping              |
| `clubs`               | Yes (SELECT) | Club identity (QID PK)                                                           |
| `player_appearances`  | Yes (SELECT) | Player ↔ Club junction with years                                                |
| `achievements`        | Yes (SELECT) | Curated football achievements (Wikidata QID PK)                                  |
| `player_achievements` | Yes (SELECT) | Player ↔ Achievement junction with year/club                                     |
| `app_config`          | Yes (SELECT) | App versioning (Elite Index version)                                             |
| `agent_runs`          | Blocked      | AI agent logs (admin-only)                                                       |
| `match_data`          | Blocked      | Football match data (admin-only)                                                 |

### SQLite Tables (Local)

```sql
puzzles (id, game_mode, puzzle_date, content, difficulty, synced_at, updated_at, is_special, event_title, event_subtitle, event_tag, event_theme)
attempts (id, puzzle_id, completed, score, score_display, metadata, started_at, completed_at, synced)
sync_queue (id, table_name, record_id, action, payload, created_at)
unlocked_puzzles (puzzle_id, unlocked_at)  -- Ad unlocks (permanent)
puzzle_catalog (id, game_mode, puzzle_date, difficulty, is_special)  -- Archive metadata
player_database (id, external_id, name, search_name, clubs, nationalities, is_active)
player_search_cache (id, name, search_name, scout_rank, birth_year, position_category, nationality_code, stats_cache, synced_at)
_metadata (key, value, updated_at)  -- Version tracking (Elite Index version)
```

### Migrations

**Supabase:** 001-009 + 012 + 019-022 + 033 (base tables, RLS, triggers, catalog RPC, leaderboard RPCs, score distribution, safe upsert, player graph, player sync, achievements + stats_cache, special events)
**SQLite:** v1-v13 (base schema, catalog, unlocks, player database, puzzle updated_at, player_search_cache, elite index seeding, stats_cache column, special event columns)

## Authentication

### Flow

1. App mount → Check existing session
2. No session → Auto `signInAnonymously()`
3. First run → Full-screen Briefing (BriefingScreen) with weekly schedule + display name
4. Optional → Email OTP to link account and preserve data

### Onboarding Briefing

Full-screen experience shown on first launch to introduce the app and collect display name.

**Components:**

- `BriefingScreen` - Main full-screen composition with header, schedule grid, and name input
- `BriefingBackground` - SVG tactical formation pattern (4-3-3 shape)
- `WeeklyFixturesGrid` - Two-column grid showing all 7 game modes with schedule
- `FixtureCard` - MiniCard-style game mode display with premium badges

**Trigger Logic:**

- Shown when `needsDisplayName` (no profile.display_name) OR `!hasCompletedOnboarding` (AsyncStorage)
- AsyncStorage key: `@app_onboarding_completed`
- Persists immediately on "START YOUR CAREER" press

**Validation:**

- Display name: 3-30 characters (minimum increased from 2)
- Success haptic on submit
- Sentry event: `User Onboarded` with `display_name_length` tag

### Key Files

- `src/features/auth/context/AuthContext.tsx` - AuthProvider + useAuth hook
- `src/features/auth/components/BriefingScreen.tsx` - Full-screen onboarding experience
- `src/features/auth/components/FirstRunModal.tsx` - Modal wrapper for BriefingScreen
- `src/features/auth/constants/briefingSchedule.ts` - Weekly schedule data
- `src/features/auth/context/SubscriptionSyncContext.tsx` - RevenueCat ↔ Supabase sync

## Shared Systems

### IQ Progression System

Cumulative points system with 10 football-themed tiers from Trialist (0) to GOAT (20,000).

**Tier Thresholds:**
| Tier | Name | Min Points |
|------|------|------------|
| 1 | Trialist | 0 |
| 2 | Youth Squad | 25 |
| 3 | Reserve Team | 100 |
| 4 | Impact Sub | 250 |
| 5 | Rotation Player | 500 |
| 6 | First Team Regular | 1,000 |
| 7 | Key Player | 2,000 |
| 8 | Club Legend | 4,000 |
| 9 | National Treasure | 8,000 |
| 10 | GOAT | 20,000 |

**Server-Side Increment:** PostgreSQL trigger automatically adds puzzle score to `profiles.total_iq` on completed attempt INSERT.

**Files:** `src/features/stats/utils/tierProgression.ts`, `supabase/migrations/018_total_iq_progression.sql`

### Fuzzy Name Validation

All game modes use `src/lib/validation.ts` for player name matching:

- Case insensitive, accent normalization (Özil = Ozil)
- Partial name matching (surname only: "Messi" = "Lionel Messi")
- Typo tolerance via Dice coefficient (threshold: 0.85)

### Elite Index (Player Search)

Pre-bundled database of ~4,900 elite players for instant autocomplete across all game modes.

**Architecture:**

1. **Bundled Asset**: `assets/data/elite-index.json` (~783 KB) exported from Supabase `players` table
2. **Seeding**: SQLite migration v8 loads JSON into `player_search_cache` on first launch
3. **Local Search**: `searchPlayerCache()` — LIKE on search_name, ORDER BY scout_rank DESC
4. **Oracle Fallback**: If < 3 local results, debounced (300ms) Supabase RPC for niche players
5. **Auto-Cache**: Oracle results upserted into `player_search_cache` for future searches
6. **Delta Sync**: Calendar-aware background check via `SyncService` + `SyncScheduler` — weekly during transfer windows/awards season (Jan, May-Jun, Aug), monthly otherwise — downloads deltas including `stats_cache` when server version bumps

**Search Flow:**

```
User types 3+ chars → searchPlayerCache() (instant, ~4,900 players)
  ↓ (if < 3 results)
300ms debounce → searchPlayersOracle() via Supabase RPC
  ↓
Merge + dedupe → sort by relevance + scout_rank
  ↓
Cache Oracle results to player_search_cache
```

**Zero-Spoiler**: Only flag, birth year, position shown. No club history in autocomplete.

**Files:**

- `assets/data/elite-index.json` — Bundled player data
- `src/lib/database.ts` — Migration v8, `searchPlayerCache()`, `getEliteIndexVersion()`
- `src/services/player/HybridSearchEngine.ts` — Local + Oracle waterfall
- `src/services/player/SyncService.ts` — Calendar-aware delta sync (delegates to SyncScheduler)
- `src/services/sync/SyncScheduler.ts` — Seasonal sync frequency (weekly in Jan/May-Jun/Aug, monthly otherwise)
- `supabase/migrations/020_player_sync.sql` — `app_config` table + `get_elite_index_delta` RPC
- `supabase/migrations/022_achievements.sql` — Achievements schema, stats_cache, calculate_player_stats RPC

### Club Search (for The Thread game mode)

Hybrid search for clubs with nickname support and fuzzy matching.

**Architecture:**

1. **Local Cache**: ~200 elite clubs pre-seeded in `club_colors` table from `elite-index.json`
2. **Nickname Map**: Hardcoded `CLUB_NICKNAME_MAP` for common aliases (e.g., "Spurs" → Tottenham)
3. **Local Search**: `searchClubColors()` — LIKE on name with diacritic normalization
4. **Remote Fallback**: If < 3 local results, debounced (300ms) Supabase `clubs` table query
5. **Deduplication**: Results merged by club ID, sorted by relevance score

**Search Flow:**

```
User types 2+ chars → searchClubColors() (instant, ~200 clubs)
  ↓
Check CLUB_NICKNAME_MAP for alias matches
  ↓ (if < 3 results)
300ms debounce → Supabase clubs table query
  ↓
Merge + dedupe by ID → sort by relevance
```

**Nickname Examples:**

- "Spurs" → Tottenham Hotspur F.C.
- "Gunners" → Arsenal F.C.
- "Barca" → FC Barcelona
- "Bayern" / "FCB" → FC Bayern Munich

**Files:**

- `src/services/club/ClubSearchEngine.ts` — Hybrid search with callback pattern
- `src/services/club/clubNicknames.ts` — `CLUB_NICKNAME_MAP` + `NICKNAME_TO_CLUB_ID` reverse lookup
- `src/services/club/types.ts` — `UnifiedClub`, `CachedClub` interfaces
- `src/lib/database.ts` — `searchClubColors()`, `getClubColorById()`
- `src/components/ClubAutocomplete.tsx` — Neubrutalist autocomplete UI

### API-Football ID Mapping

External ID linkage between Wikidata QIDs and [API-Football v3](https://v3.football.api-sports.io) player IDs for data integrity verification.

**Architecture:**
1. **Column**: `players.api_football_id` (nullable integer, unique partial index) — migration 037
2. **Pipeline**: `web/lib/data-pipeline/map-external-ids.ts` — batch search + birth year/nationality disambiguation
3. **Safety**: 90-request budget per run (trial tier = 100/day), 1.2s delay between requests
4. **Confidence Levels**: `high` (birth year + nationality match) auto-saved; `medium` flagged for admin review in `agent_runs` logs
5. **Priority**: Players processed by `scout_rank DESC` (most notable first)
6. **Source of Truth**: Wikidata QID remains the primary key; `api_football_id` is a join key for cross-referencing

**Name Collision Prevention**: Searching by name alone fails for common names (e.g., "Ronaldo", "Gabriel"). The pipeline requires both `birth_year` and `nationality_code` to be present for disambiguation. Players missing either are skipped.

**Files:**
- `web/lib/data-pipeline/map-external-ids.ts` — Core mapping pipeline (types, scoring, batch runner)
- `web/lib/data-pipeline/__tests__/map-external-ids.test.ts` — TDD tests (36 tests)
- `web/app/(dashboard)/admin/actions.ts` — `runApiFootballMapping()` server action wrapper
- `supabase/migrations/037_api_football_id.sql` — Column + unique partial index

### Access Control (3-Tier)

| Tier | User Type            | Puzzle Access |
| ---- | -------------------- | ------------- |
| 1    | Anonymous            | Today only    |
| 2    | Free (authenticated) | Last 7 days   |
| 3    | Premium              | Full archive  |

```typescript
// src/features/archive/utils/dateGrouping.ts
function isPuzzleLocked(
  puzzleDate,
  isPremium,
  puzzleId?,
  adUnlocks?,
  hasCompletedAttempt?,
): boolean {
  if (hasCompletedAttempt) return false; // Completed = permanent unlock
  if (isPremium) return false;
  if (isWithinFreeWindow(puzzleDate)) return false; // 7-day window
  if (hasValidAdUnlock(puzzleId, adUnlocks)) return false; // Ad unlock
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

**Content**: `{ answer, from_club, to_club, fee, hints: [year, position, nationality_iso_code] }`
**Visible**: Clubs and fee shown in header. Year is Hint 1 (revealed on request).
**Nationality**: Stored as ISO 3166-1 alpha-2 code (e.g. "BR", "GB-ENG"). Rendered as SVG flag via `country-flag-icons` + custom home nation SVGs. Mobile `DossierSlot` has backwards compat (ISO → FlagIcon, emoji → text fallback for older app versions).
**Scoring**: 5/3/2/1 points based on hints revealed (0=5pts, 1=3pts, 2=2pts, 3=1pt)
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
**Validation**: Uses `player_database` SQLite table for club/nation checks; `stats_cache` for trophy/stat checks
**Files**: `src/features/the-grid/`, `src/features/the-grid/utils/achievementMapping.ts`

_Note: Legacy Tic Tac Toe (`tic_tac_toe`) still exists for archive review but replaced by The Grid for daily play._

### The Chain

Connect two players through shared club history using Inverse Par scoring.

**Content**: `{ start_player: { qid, name, nationality_code? }, end_player: { qid, name, nationality_code? }, par: number, solution_path?: [...], hint_player?: { qid, name, nationality_code? } }`
**Validation**: Uses `check_players_linked()` RPC to verify overlapping years at shared clubs
**PAR Calculation**: Uses `find_shortest_player_path()` RPC (BFS, max_depth=8) to determine optimal solution
**Scoring**: Inverse Par - `max(0, 2*par - steps)`, max points = par + 2 (Eagle)
**Labels**: Eagle (-2), Birdie (-1), Par (0), Bogey (+1), Double Bogey (+2), Triple Bogey+ (+3+), DNF
**Display**: Chain of player cards with connecting clubs
**Files**: `src/features/the-chain/`, `app/the-chain/`, `web/lib/the-chain/scoring.ts`, `web/components/puzzle/forms/the-chain-form.tsx`, `supabase/migrations/028_the_chain.sql`

### The Thread

Guess the football club from a chronological list of kit sponsors or suppliers.

**Content**: `{ thread_type: 'sponsor' | 'supplier', path: [{ brand_name, years }], correct_club_id, correct_club_name, kit_lore: { fun_fact } }`
**Validation**: Path must have at least 3 entries, years must follow YYYY-YYYY or YYYY- format. Club guesses validated by Wikidata QID (primary) with fuzzy name matching fallback.
**Scoring**: 100 points for 1st guess, -20 per subsequent guess (100 → 80 → 60 → 40 → 20 → 0). Formula: `max(0, 100 - ((guessCount - 1) * 20))`
**Display**: All brands shown upfront. Stars emoji grid on share (⭐⭐⭐⭐⭐ Perfect! down to ✓ Completed)
**Kit Lore**: Fun fact revealed only after game ends (won or gave up)
**CMS Form**: Timeline-styled brand array with numbered nodes, club selector with debounced search, thread type toggle (Sponsor/Supplier)
**Files**: `src/features/the-thread/`, `web/lib/schemas/puzzle-schemas.ts`, `web/components/puzzle/forms/the-thread-form.tsx`, `web/components/puzzle/previews/the-thread-preview.tsx`, `web/app/(dashboard)/admin/the-thread/page.tsx`

### Topical Quiz

5 multiple-choice questions on current events. Auto-advances after answer.

**Content**: `{ questions: [{ id, question, imageUrl?, options: [4], correctIndex }] }`
**Scoring**: 2 points per correct answer (0-10 total)
**Display**: `✅❌✅✅❌` (one per question)
**Files**: `src/features/topical-quiz/`

### Top Tens (Premium Only)

Guess all 10 items in a ranked list. Correct guesses reveal at rank position.

**Content**: `{ title, category?, answers: [{ name, aliases?, info? }] }`
**Scoring**: Flat tier system, max 8pts (1-2→1, 3-4→2, 5-6→3, 7-8→4, 9→5, 10→8 Jackpot!)
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

- **StreakHeader**: Fire icon + count + shield icon (when streak freezes available), daily progress (X/6)
- **Card states**: Play (green), Resume (yellow), Done (emoji grid + Result button)
- **Special Event Banner**: DB-driven EventBanner for `is_special` puzzles (hidden from daily feed)
- **Midnight refresh**: AppState listener triggers refresh on date change
- **Files**: `src/features/home/`, `app/(tabs)/index.tsx`

### Special Events

Database-driven system for time-limited event puzzles shown via a premium banner instead of the daily feed.

- **Database**: `is_special` boolean on `daily_puzzles` + CMS-configurable banner fields (`event_title`, `event_subtitle`, `event_tag`, `event_theme`)
- **Unique constraint**: `(puzzle_date, game_mode, is_special)` allows 1 regular + 1 special of same mode per day
- **CMS**: "Special Event?" toggle in puzzle editor modal with conditional banner fields
- **Mobile filtering**: `useDailyPuzzles` excludes `is_special=true` puzzles from "Today's Challenges"
- **EventBanner**: `useSpecialEvent` hook finds today's special puzzle, `EventBanner` renders with theme-based colors (gold/red/blue)
- **Themes**: `gold` (amber gradient), `red` (crimson gradient), `blue` (navy gradient) — each with matching accent, glow, border, and button colors
- **Default tag**: "LIMITED TIME"
- **Files**: `src/features/home/hooks/useSpecialEvent.ts`, `src/features/home/config/events.ts`, `src/features/home/components/new/EventBanner.tsx`, `supabase/migrations/033_special_events.sql`

### Archive Screen

Historical puzzle browser with premium gating and "Velvet Rope" locked card design.

- **Filters**: All, Incomplete, or by game mode
- **Catalog sync**: `get_puzzle_catalog()` RPC bypasses RLS to show locked puzzle metadata
- **Completed puzzles**: Always unlocked for viewing results
- **Random Play**: "Random Unplayed Game" button in filter bar selects random incomplete puzzle
  - Non-premium: 7-day window + ad-unlocked puzzles, excludes `career_path_pro`/`top_tens`
  - Premium: full backlog, all game modes
  - Shows "All Caught Up!" alert when no unplayed puzzles remain
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

### Scout Report (My IQ Profile)

Third tab displaying user's football identity with tier progression.

- **Components**: ElitePlayerCard (FUT-style header) + StreakCalendar
- **Tiers**: 10 football-themed tiers from Trialist (0) to GOAT (20,000)
- **Files**: `src/features/stats/`, `app/(tabs)/stats.tsx`

### Streak Calendar

Mobile-optimized calendar showing daily completion history on Scout Report tab.

- **Cell intensity**: 0 games (navy), 1-3 (green 50%), 4+ (green 100%)
- **3D depth**: Uses Solid Layer architecture (1px sunk, 3px filled)
- **Tooltips**: Tap cell to see date, IQ earned, game mode completion icons
- **Perfect Week**: Gold left border on weeks with Mon-Sun completions
- **Flame Icon**: Shows longest streak within each month
- **Premium Gating**: Free users see 60 days, older months blurred with upsell
- **Launch Date Floor**: January 20, 2026 - days before are dimmed and non-pressable
- **Files**: `src/features/stats/components/StreakCalendar/`

### Score Distribution Graph

Wordle-style "How You Compare" bar chart in result modals.

- Per-puzzle distribution via `get_puzzle_score_distribution()` RPC
- Scores bucketed 0-100 in 10s, user's bucket highlighted
- **Files**: `src/features/stats/components/ScoreDistribution*.tsx`

### Settings

Fourth tab with Privacy Policy, Terms, Rate App, and secret dev menu (7 taps on version).

- **Haptic Feedback toggle**: AsyncStorage `@haptics_enabled` (default: ON). Gates all haptic calls via `useFeedback` hook.
- **Dev menu**: Test Daily Reminder, Test Streak Saver, Reset Game Intros, Clear Data buttons
- **Files**: `src/features/settings/`, `app/(tabs)/settings.tsx`

### Submit Game Ideas

User-submitted game mode ideas with Pro subscription reward incentive.

- **Entry Points**: Lightbulb icon in Home header, "Submit Game Idea" row in Settings > Community
- **Reward**: 1 year of Pro if idea is used
- **Form Fields**: Title (required), Description (required), Email (optional)
- **Database**: `game_submissions` table with RLS (users insert, service role reads)
- **Files**: `src/features/ideas/`, `app/submit-idea.tsx`

### Local Notifications

Push-style local notifications to maximize DAU and protect streaks.

- **Notification IDs**: Stable numeric strings (`101`=Daily, `102`=Streak, `103`=Ad-hoc CMS reserved)
- **Daily Kick-off** (08:30): Morning reminder if user hasn't played, rotating messages
- **Streak Saver** (20:30): Evening alert 12h after Daily (configurable offset), if `streak > 0 AND gamesPlayedToday === 0`
- **Perfect Day**: Full-screen confetti celebration when all daily puzzles completed
- **Scheduling**: Uses True-Time system (`getTimeDriftMs()`) for accurate timing
- **Permission Flow**: Custom modal after first puzzle completion with 3 benefits (daily reminders, streak alerts, live challenges)
- **Test Notifications**: Available in Settings dev menu (7-tap version) for verifying Daily/Streak triggers
- **Cancellation**: Both reminders cancelled immediately when user completes any puzzle
- **Files**: `src/features/notifications/`

### Celebration Modals

Full-screen celebration modals triggered at key engagement moments. All follow the same pattern: Modal + dark overlay + Confetti + ViewShot share card + haptic pattern + ElevatedButton CTA.

- **Perfect Day**: All daily puzzles completed → confetti + share card with puzzle count + streak
- **Tier Level-Up**: IQ crosses tier threshold (e.g., 250 → Impact Sub) → tier badge animation + tier-coloured card + share CTA
- **First Win**: User's very first completed puzzle → "You're a natural!" + confetti + share CTA
- **Priority order**: PerfectDay > TierUp > FirstWin (only one shows at a time)
- **Duplicate prevention**: AsyncStorage keys per celebration type
- **Detection hub**: All detection logic in `NotificationContext.tsx` using `prevRef` pattern
- **Files**: `src/features/notifications/components/PerfectDayCelebration.tsx`, `src/features/stats/components/TierLevelUpCelebration.tsx`, `src/features/notifications/components/FirstWinCelebration.tsx`

### Streak Freeze System

AsyncStorage-backed streak protection mechanism (Duolingo-style).

- **Starting inventory**: 1 free freeze granted on first app launch
- **Earning**: +1 freeze per 7-day streak milestone (7, 14, 21...), cap at 3 for free users
- **Premium**: Unlimited auto-freeze (never consumes inventory)
- **Auto-apply**: When `calculateStreak()` detects a 1-day gap and freeze is available, it consumes it and maintains streak continuity
- **UI indicators**: Shield icon in StreakHeader when freezes available; red "at risk" warning in HomeHeader after 20:00 with 0 plays
- **AsyncStorage keys**: `@streak_freeze_count`, `@streak_freeze_used_dates`, `@streak_freeze_last_milestone`, `@streak_freeze_initial_granted`
- **Files**: `src/features/streaks/services/streakFreezeService.ts`, `src/features/home/hooks/useUserStats.ts`

### Dynamic Streak Warning

In-app urgency indicator when a streak is at risk.

- **Trigger**: After 20:00 local time, active streak > 0, 0 games played today
- **Display**: HomeHeader streak pill turns red/amber with "X day streak at risk! Nh left" text
- **Animation**: Pulsing opacity (Reanimated withRepeat) on at-risk pill
- **Re-checks**: 60-second interval + on app foregrounding
- **Files**: `src/features/home/hooks/useStreakAtRisk.ts`, `src/features/home/components/new/HomeHeader.tsx`

### Guided First Game Tutorial

Post-onboarding tutorial that auto-navigates to Career Path with overlay tooltips.

- **Flow**: BriefingScreen submit → auto-navigate to today's Career Path → 3-step tooltip overlay → normal gameplay
- **Steps**: (1) Clue area, (2) Search input, (3) Submit button
- **Tracking**: AsyncStorage `@tutorial_completed`, OnboardingContext `isTutorialComplete`
- **GameIntroScreen**: Skipped during tutorial flow
- **Fallback**: If no Career Path puzzle exists, falls back to home screen
- **Files**: `src/features/auth/components/TutorialOverlay.tsx`, `src/features/auth/context/OnboardingContext.tsx`, `src/features/auth/components/BriefingScreen.tsx`

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

| Type     | iOS                                      | Android                                  |
| -------- | ---------------------------------------- | ---------------------------------------- |
| Banner   | `ca-app-pub-9426782115883407/8614691809` | `ca-app-pub-9426782115883407/4156572045` |
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
  "ios.buildNumber": "7" // INCREMENT BEFORE EACH SUBMISSION
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
  submit-idea.tsx      # Game idea submission screen
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

### Admin Command Center

Player lookup and management tool for CMS administrators.

**Features**:

- **Universal Player Search**: Search across all ~4,900 elite players in the Supabase `players` table
- **Pro Badge**: Gold badge (#FFBF00) indicates elite players (top ~5,000 by `scout_rank`)
- **Player Detail Sheet**: Side drawer showing:
  - Club History (from `player_appearances` table with clubs)
  - Trophy Cabinet (from `player_achievements` grouped by Individual/Club/International)
  - Puzzle Appearances (game mode breakdown with dates)
- **Quick-Fix Actions**: Force re-sync from Wikidata (career + achievements)

**Elite Threshold**: Players with `scout_rank >= 50` are considered elite and display the Pro Badge.

**Files**:

- `web/components/admin/universal-answer-search.tsx` - Main search component with dropdown
- `web/components/admin/player-detail-sheet.tsx` - Detail drawer with club history, trophies, appearances
- `web/components/admin/pro-badge.tsx` - Reusable Pro Badge component
- `web/hooks/use-player-command-center.ts` - Data fetching hook combining command center + rap sheet
- `web/app/(dashboard)/admin/actions.ts` - Server actions (`fetchPlayerCommandCenterData`, `resyncPlayerFromWikidata`)

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

| Token            | Value   | Usage                |
| ---------------- | ------- | -------------------- |
| Pitch Green      | #58CC02 | Primary actions      |
| Stadium Navy     | #0F172A | Background           |
| Floodlight White | #F8FAFC | Text                 |
| Card Yellow      | #FACC15 | Highlights, warnings |
| Red Card         | #EF4444 | Errors, destructive  |

**Typography**: Bebas Neue (headlines), Inter (body)
**Core Components**: `ElevatedButton` (3D neubrutalist), `GlassCard` (frosted blur)

### Solid Layer 3D Architecture

All interactive elements use a two-layer View structure for cross-platform 3D depth:

- **Shadow layer**: Fixed at bottom, solid darker color
- **Top layer**: Animates `translateY` on press (squash effect)

See `docs/memory/decisions/solid-layer-3d.md` for implementation details.

**Depth values** (`depthOffset`): button=8px, card=2px, gridCell=3px, sunk=1px
