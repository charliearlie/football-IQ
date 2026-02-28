# Football IQ - Growth, Engagement & SEO Roadmap

> Last updated: February 2026

---

## Current State (Feb 2026)

The core product is working. The funnel is broken.

| Metric                 | Value    | Signal                           |
| ---------------------- | -------- | -------------------------------- |
| Registered users       | 262      | Acquisition is happening         |
| Ever played            | 31 (12%) | **Activation is the #1 problem** |
| Weekly active users    | 8        | Retention is thin                |
| Premium subscribers    | 5        | Conversion is possible           |
| Puzzle completion rate | 96%      | The game itself is excellent     |

The 96% completion rate proves that once users reach a puzzle, they finish it. The problem is that 88% of registered users never reach one. The growth priority order is therefore:

1. Fix activation (remove friction before first play)
2. Fix retention (give users reasons to return)
3. Fix discovery (SEO and ASO to grow the top of funnel)
4. Fix monetisation (only valuable once the above are working)

---

## Tier 1: This Week - Analytics & SEO Foundations ✅

_Completed Feb 2026. All code changes deployed._

### 1. ~~PostHog Web Analytics~~ ✅

Installed `posthog-js` on the Next.js web app using the same API key and EU host as the mobile app. Unified view of web game plays, page views, and conversion events across both surfaces.

- **Files:** `web/components/PostHogProvider.tsx`, `web/app/layout.tsx`
- **Note:** Vercel environment variables (`NEXT_PUBLIC_POSTHOG_API_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) must be added manually in the Vercel dashboard.

### 2. Google Search Console ⏳

Verify ownership of the domain and submit the sitemap. This is the single most important non-code action for organic growth — without it, Google cannot communicate crawl errors or keyword rankings back to us.

- **Action:** Add HTML tag to `web/app/layout.tsx` metadata, submit `https://football-iq.app/sitemap.xml`
- **Status:** Manual action required — not a code change.

### 3. ~~Sitemap Fixes~~ ✅

Added `/play` hub page to the sitemap. Removed misleading `lastModified: new Date()` from game pages so Google no longer treats every rebuild as a content change.

- **File:** `web/app/sitemap.ts`

### 4. ~~Footer Internal Links~~ ✅

Added a two-column footer with a "Play" column linking to all five web game pages, passing link equity from every page on the site.

- **File:** `web/components/landing/Footer.tsx`

### 5. ~~FAQ Schema on Game Pages~~ ✅

Added FAQPage structured data to the JSON-LD `@graph` on all five game pages with 3 questions each, targeting "People Also Ask" boxes for mid-funnel queries.

- **Files:** `web/app/play/career-path/page.tsx`, `web/app/play/transfer-guess/page.tsx`, `web/app/play/connections/page.tsx`, `web/app/play/timeline/page.tsx`, `web/app/play/topical-quiz/page.tsx`

### 6. ~~Organisation Schema~~ ✅

Added Organisation JSON-LD to the root layout for knowledge graph presence and branded search rich results.

- **File:** `web/app/layout.tsx`

### 7. ~~Fix AdSense Rejection~~ ✅

Banner ads in `GamePageShell` now only render once game content has mounted (via `contentRef` callback), preventing ads on empty loading states. Post-game rectangle ads appear after game completion. This should resolve the "ads on screens without publisher content" rejection.

- **File:** `web/components/play/GamePageShell.tsx`
- **Impact:** Unblocks ad revenue on the web platform.

---

## Tier 2: Activation & Session Depth ✅

_Completed Feb 2026. All code changes deployed._

### 8. ~~Remove Onboarding Name Requirement~~ ✅

Onboarding modal no longer shows. Users go straight to the home screen and can play immediately as anonymous guests. Display name defaults to "Football Fan" on leaderboards and "Guest Manager" in settings. `updateDisplayName()` is available for future optional name prompt.

- **File:** `src/features/auth/context/OnboardingContext.tsx`
- **Expected impact:** Activation rate from 12% to 30%+

<!-- ### 9. "Next Puzzle" Button on Result Modal

After completing a game, show a prominent button to jump to the next unplayed daily puzzle. Chains sessions together.

- **Expected impact:** Average session length increases from ~1 game to 2-3 games.

### 10. Percentile Display for All Users

Show percentile ranking on the result modal for all users (not just premium). Needs careful approach — avoid showing raw player counts or "Top 0%" when data is sparse.

### 11. "Last Time vs This Time" Comparison

Compare the user's score against their most recent previous attempt on the same game mode (not yesterday — since only Career Path and Transfer Guess are daily). Show improvement/regression indicator. -->

### 12. ~~Web PostHog Event Tracking~~ ✅

Added `game_started`, `game_completed`, and `share_completed` events to all 5 web game components + PostGameCTA. Events include `platform: "web"` property and match the mobile schema. Time tracking via start ref.

- **Files:** New `web/hooks/use-game-tracking.ts`, 5 web game components, `web/components/play/PostGameCTA.tsx`

---

## Tier 3: Month 1 - Leaderboards & Retention ✅

_Completed Feb 2026. All code changes on branch `feature/tier3-leaderboards-retention`._

### 13. ~~Yearly Leaderboard~~ ✅

Added "Today | This Year | All Time" toggle to `LeaderboardToggle`. Yearly leaderboard resets on January 1st via `get_yearly_leaderboard(year, limit)` RPC that aggregates `puzzle_attempts` within the calendar year.

- **Files:** `src/features/leaderboard/components/LeaderboardToggle.tsx`, `supabase/migrations/041_leaderboard_yearly_alltime.sql`

### 14. ~~All-Time Leaderboard Rework~~ ✅

Replaced opaque weighted Global IQ score with raw `total_iq` from profiles. Directly maps to the tier system (Intern through The Gaffer). Tier name and color shown on each row in the all-time view.

- **Files:** `src/features/leaderboard/services/leaderboardService.ts`, `supabase/migrations/041_leaderboard_yearly_alltime.sql`

### 15. ~~Per-Mode Stats on Profile~~ ✅

Added per-mode breakdown to Scout Report via `get_user_mode_stats` RPC. Shows games played, average score, and best score per game mode. Free users see their own stats.

- **Files:** `src/features/stats/`, `supabase/migrations/041_leaderboard_yearly_alltime.sql`

### 16. ~~Archive Completion Percentage~~ ✅

Added archive completion display showing "You've played N of M archived puzzles" on the archive header and home screen.

- **Files:** `src/features/archive/components/ArchiveHeader.tsx`, `src/features/home/`

### Additional: Leaderboard UI Redesign ✅

Complete visual overhaul of leaderboard rows. Top 3 get gold/silver/bronze disc badges, tinted backgrounds, and medal-colored accent bars. "STANDINGS" divider separates podium from field. StickyMeBar redesigned as a pinned navy row with "YOU" badge and "N pts behind #M" gap text.

- **Files:** `src/features/leaderboard/components/LeaderboardEntry.tsx`, `LeaderboardList.tsx`, `StickyMeBar.tsx`

### Additional: Daily Leaderboard Scoring Fix + Dummy Padding ✅

Rewrote `get_daily_leaderboard` RPC to use `SUM(score)` instead of percentage-based metadata scoring (consistent with yearly/all-time). Added runtime dummy entry injection — 30-45 dummy users with deterministic random scores appear automatically on every day's daily board without any database seeding or cron jobs.

### Additional: Leaderboard Data Cleanup ✅

Reconciled all `profiles.total_iq` values with actual `puzzle_attempts` scores. Seeded 75 dummy users with football-themed names and realistic puzzle attempt history for populated yearly/all-time boards.

---

## Tier 4: Month 1-2 - Archive Redesign & Content Packs

_The archive is currently a flat list sorted by date. This makes it useful only for users who know what they're looking for. Redesigning it around game modes and introducing purchasable packs creates a genuine content catalogue._

### 17. Mode-First Archive Browsing

Add a "Browse by Game" tab alongside "Browse by Date" in the archive. The tab shows a card grid of all 11 game modes. Tapping a mode reveals all puzzles for that mode, paginated newest-first.

This reuses the `AdvancedFilterBar` filtering logic with a new entry point and solves the discovery problem for users who love Career Path but don't want to scroll through Topical Quiz entries to find more of it.

- **Files:** `src/features/archive/`

### 18. Content Pack MVP

Test the content pack model with a single non-consumable IAP: "30 Classic Career Paths" at 99p. This is the lowest-risk way to validate purchase intent before building a full catalogue.

Schema additions:

- `packs` table: `id, name, description, price, puzzle_ids[]`
- `user_pack_purchases` table: `user_id, pack_id, purchased_at`

Modify `isPuzzleLocked()` in `dateGrouping.ts` to treat pack ownership as an unlock path alongside Premium subscription.

RevenueCat configuration required in App Store Connect and Google Play Console.

- **Files:** `dateGrouping.ts`, new Supabase tables, RevenueCat configuration

### 19. Pack UI in Archive

A horizontal scroll strip above the archive filter bar. Each pack card shows: icon, name, puzzle count, price (or "Purchased" state with a checkmark). Tapping opens a preview of 3 sample puzzles and a purchase button.

- **Files:** `src/features/archive/`

### 20. Contextual Pack Upsells

After a user completes their third Career Path puzzle in a day, show a contextual prompt: "Want to keep going? The Premier League Icons pack has 100 more Career Path puzzles." Surface this in both the result modal (when daily games run out) and in archive filter results (when a mode filter shows locked content).

---

## Tier 5: Month 2 - SEO Content & Conversion

_By month 2, Search Console should be showing which queries are getting impressions but low clicks. These tasks are planned now but should be validated against that data before execution._

### 21. Flagship Trivia Questions Page

Create `/football-trivia-questions` with 50+ questions organised by category: Premier League, World Cup, Transfers, History, Records. Answers sit behind `<details>` toggles (so the page ranks for questions, not just answers). Add FAQPage schema and inline CTAs to relevant game pages throughout the content.

Target keyword: "football trivia questions and answers" — high volume, relatively low competition, strong intent signal.

- **New file:** `web/app/football-trivia-questions/page.tsx`
- **Update:** `web/app/sitemap.ts`

### 22. Fix SoftwareApplication Schema

The current schema is missing `operatingSystem: "iOS, Android"` and `aggregateRating`. Add real App Store and Google Play ratings once sufficient review volume exists. An aggregate rating in the schema can unlock star rating display in search results.

- **File:** `web/app/page.tsx`

### 23. ASO Optimisation

App Store title: "Football IQ - Daily Football Quiz" (27 characters, includes primary keyword).
Subtitle: "Guess Players & Transfer Quiz".
Keywords field: `career,path,footballer,guess,transfer,connections,timeline,daily,sports,knowledge,test,challenge,premier,league,puzzle`

These changes require an App Store submission but no code changes.

---

## Tier 6: Month 2-3 - Engagement Loops

_Retention mechanics that create habitual daily behaviour. These are only worth building once activation is fixed — a leaky bucket doesn't benefit from a better retention pump._

### 24. Deep-Link Notifications to First Unplayed Game

Push notifications currently deep-link to `/(tabs)` (the home tab). Change the deep link to include the puzzle ID of the first unplayed game for that day. On launch from a notification, auto-navigate directly to the puzzle rather than requiring the user to find it on the home screen.

- **Files:** `src/features/notifications/`

### 25. Animated At-Risk Streak Indicator

After 6pm local time, if the user hasn't played today, the flame streak icon in `HomeHeader` pulses using Reanimated `withRepeat`. This creates urgency without being as intrusive as a notification. The animation stops once any puzzle is completed.

- **File:** `src/features/home/components/new/HomeHeader.tsx`

### 26. Progressive Mode Revelation

Showing all 11 game modes on day 1 is overwhelming for new users and reduces the perceived novelty of each mode. Reveal modes progressively:

- Day 1: Career Path + Topical Quiz
- Day 2: + Transfer Guess
- Day 3: + Connections
- Day 5: + The Grid, The Chain
- Day 7+: All modes

This creates daily novelty and a sense of the app "opening up" over the first week.

- **File:** `src/features/home/hooks/useDailyPuzzles.ts`

### 27. Welcome-Back Banners

Dismissible banners at streak milestones reinforce the habit loop with social recognition:

- Day 2: "Welcome back! Day 2 streak."
- Day 5: "5 days in a row. You're in the top 15%."
- Day 7: "One week streak. That's commitment."

These appear at the top of the home screen and auto-dismiss after the first game play.

- **New file:** `src/features/home/components/WelcomeBackBanner.tsx`

### 28. Rate App Prompt

Trigger `expo-store-review` when all four conditions are met: 10+ puzzles completed, 3+ day streak, not prompted in the last 30 days, user just won a game. This is the optimal moment — the user is feeling positive about the product and has demonstrated meaningful engagement.

- **Files:** `src/features/settings/`, new review service

---

## Tier 7: Month 3+ - Scale-Dependent Features

_These features are only valuable at scale, or require scale to build responsibly. Do not pull forward._

### 29. Content Packs Expansion

Once the MVP pack (item 18) has validated purchase intent, expand to themed multi-mode packs: "The 2004/05 Season Pack" contains Career Path, Transfer Guess, and Goalscorer Recall puzzles all themed around a single season. Narrative coherence increases perceived value. Price point: £2.99.

### 30. Daily Game Cap

3 games/day for free users. "Watch Ad for 1 more game" + "Go Pro for unlimited." This only makes sense once there is enough content variety that the cap feels fair rather than punishing. Prerequisite: content packs live and archive has 500+ puzzles per mode.

- **Files:** `src/features/home/`, new `dailyLimitService.ts`

### 31. Rewarded Ad Expansion

Beyond the daily cap, rewarded ads can unlock: streak freeze protection ("Watch an ad to protect your 12-day streak"), and interstitial ads between sessions (every 3rd game, maximum 1 per session, never shown in the first session). Never show ads to Pro users.

### 32. Friends System and Challenges

Head-to-head on the same puzzle via deep link. Requires simultaneous users — meaningful only when WAU exceeds ~500. Deferred until then.

### 33. World Cup 2026 Content Hub

A dedicated `/world-cup-2026` page with quiz content, trivia questions, and game mode integrations themed around the tournament. Must publish by April 2026 at the latest to capture pre-tournament search volume accumulation. Add to the April sprint planning.

### 34. Flagship SEO Player Pages

Individual pages per footballer can capture "X player career" and "X footballer clubs" queries. However, thin pages at scale trigger Google's helpful content system penalty. Only build these once the player database is rich enough (club history, transfer fees, international caps, notable achievements) to provide genuine value per page. Current ~10k player database is not sufficient.

---

## Keyword Strategy

| Page                         | Target Keywords                                                          |
| ---------------------------- | ------------------------------------------------------------------------ |
| Homepage (`/`)               | "daily football quiz", "free football games online"                      |
| `/play/career-path`          | "guess the footballer career", "footballer guessing game"                |
| `/play/transfer-guess`       | "football transfer quiz", "guess the transfer"                           |
| `/play/connections`          | "football connections game", "NYT connections football"                  |
| `/play/timeline`             | "football timeline quiz", "sort footballers in order"                    |
| `/play/topical-quiz`         | "weekly football quiz", "football news quiz"                             |
| `/football-trivia-questions` | "football trivia questions and answers", "premier league quiz questions" |

---

## What NOT to Build (Yet)

| Feature                    | Why Deferred                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| Player pages (SEO)         | Thin pages at scale trigger Google helpful content penalty; database not rich enough              |
| Blog                       | Single evergreen trivia questions page achieves the same traffic without ongoing maintenance cost |
| A/B testing infrastructure | Need 1,000+ active users for statistical significance; results would be noise                     |
| Live multiplayer           | XL engineering effort, only creates value at scale                                                |
| Localisation               | Need English-market traction first before splitting focus                                         |
| Email marketing            | No email collection at registration; requires architecture change first                           |
| New game modes             | 11 modes is sufficient; fix activation before adding more content                                 |
| Daily game cap             | Cannot enforce limits fairly until content catalogue is large enough                              |

---

## Design System Notes

The visual language is strong: stadium navy, pitch green, Bebas Neue. The changes needed are behavioural, not aesthetic.

**Result modal:** Celebrate first (large score animation, confetti), information second (stats, percentile, comparison). Currently the order is reversed.

**Streak indicator:** The flame needs to feel alive. A static icon communicates nothing urgently. Pulsing after 6pm when the streak is at risk creates appropriate tension without being intrusive.

**Archive cards:** Completion state should be immediately visually obvious. Completed puzzles: green tint. Missed puzzles (within free window, not played): grey tint. Locked puzzles: lock overlay.

**Home screen:** Should show session progress ("3 of 5 games today"), not just individual game states. Progress toward completing the daily set is a more powerful motivational frame than a list of available games.

---

## Success Metrics by Tier

| Tier                  | Primary Metric                               | Target                    |
| --------------------- | -------------------------------------------- | ------------------------- |
| Tier 1 (Analytics)    | Search Console set up, web analytics live    | Done by end of week       |
| Tier 2 (Activation)   | % of registered users who play at least once | 12% → 35%                 |
| Tier 3 (Retention)    | Weekly active users                          | 8 → 30                    |
| Tier 4 (Monetisation) | Monthly revenue                              | Track first pack purchase |
| Tier 5 (SEO)          | Organic search impressions                   | 0 → 5,000/month           |
| Tier 6 (Loops)        | D7 retention                                 | Establish baseline        |
| Tier 7 (Scale)        | Monthly active users                         | 500+ before building      |
