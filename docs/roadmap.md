# Football IQ - Growth, Engagement & SEO Roadmap

> Last updated: February 2026

---

## Current State (Feb 2026)

The core product is working. The funnel is broken.

| Metric | Value | Signal |
|--------|-------|--------|
| Registered users | 262 | Acquisition is happening |
| Ever played | 31 (12%) | **Activation is the #1 problem** |
| Weekly active users | 8 | Retention is thin |
| Premium subscribers | 5 | Conversion is possible |
| Puzzle completion rate | 96% | The game itself is excellent |

The 96% completion rate proves that once users reach a puzzle, they finish it. The problem is that 88% of registered users never reach one. The growth priority order is therefore:

1. Fix activation (remove friction before first play)
2. Fix retention (give users reasons to return)
3. Fix discovery (SEO and ASO to grow the top of funnel)
4. Fix monetisation (only valuable once the above are working)

---

## Tier 1: This Week - Analytics & SEO Foundations

*Being implemented now. No user-facing changes, but unblocks every data-driven decision going forward.*

### 1. PostHog Web Analytics

Install `posthog-js` on the Next.js web app using the same API key and EU host as the mobile app. This gives a unified view of web game plays, page views, and conversion events across both surfaces.

- **Files:** `web/components/PostHogProvider.tsx`, `web/app/layout.tsx`
- **Why now:** Without web analytics, we cannot measure the impact of any SEO work or landing page changes.

### 2. Google Search Console

Verify ownership of the domain and submit the sitemap. This is the single most important non-code action for organic growth — without it, Google cannot communicate crawl errors or keyword rankings back to us.

- **Action:** Add HTML tag to `web/app/layout.tsx` metadata, submit `https://footballiq.app/sitemap.xml`

### 3. Sitemap Fixes

Two problems exist in the current sitemap:

1. The `/play` hub page is missing entirely, so Google has no crawl entry point to the game pages.
2. `lastModified: new Date()` on game pages tells Google the content changes every time the site rebuilds. This trains Google to ignore the freshness signal entirely.

Fix both: add `/play` to the sitemap with a real static date, and replace `new Date()` with hardcoded last-modified dates on all game pages that only update when the page content genuinely changes.

- **File:** `web/app/sitemap.ts`

### 4. Footer Internal Links

The footer currently contains no links to individual game pages. Internal links are the cheapest source of link equity — every page on the site should pass authority to the game pages that we want to rank.

Add a "Play Games" column to the footer with links to all five game pages.

- **File:** `web/components/landing/Footer.tsx`

### 5. FAQ Schema on Game Pages

FAQPage structured data targets the "People Also Ask" boxes in Google search results. These boxes appear for informational queries like "daily footballer guessing game" and "football connections puzzle" — precisely the mid-funnel queries where someone is deciding whether to try a game.

Add one FAQPage schema block per game page with 3-5 questions answering what the game is, how to play, and how it compares to similar games.

- **Files:** `web/app/play/career-path/page.tsx`, `web/app/play/transfer-guess/page.tsx`, `web/app/play/connections/page.tsx`, `web/app/play/timeline/page.tsx`, `web/app/play/topical-quiz/page.tsx`

### 6. Organisation Schema

An Organisation schema block in the root layout establishes Football IQ as a known entity in Google's knowledge graph. This supports brand queries and makes it more likely that rich results appear for branded searches over time.

- **File:** `web/app/layout.tsx`

### 7. Fix AdSense Rejection

Pre-game banner ads in `GamePageShell` are currently showing before any content loads. This violates AdSense policy. The fix is to remove pre-game banner placements entirely and keep only post-game rectangle ads (which appear after the user has consumed content).

- **File:** `web/components/play/GamePageShell.tsx`
- **Impact:** Unblocks ad revenue on the web platform.

---

## Tier 2: Next 2 Weeks - Activation & Session Depth

*The highest-leverage work in this entire roadmap. Fixing activation from 12% to even 30% would nearly triple the active user base with zero new acquisition spend.*

### 8. Remove Onboarding Name Requirement

This is the single biggest activation blocker identified. `BriefingScreen` currently requires a user to enter their name before they can play their first game. This is a friction wall placed at the worst possible moment — between a new user and the experience they came to try.

The fix: let users play immediately as anonymous guests. Ask for a name (or offer to skip) only after the first game completes, when the user has experienced value and has a reason to care about their identity.

- **Files:** `src/features/auth/context/OnboardingContext.tsx`, `src/features/auth/components/FirstRunModal.tsx`, `src/features/auth/components/BriefingScreen.tsx`
- **Expected impact:** Activation rate from 12% to 30%+

### 9. "Next Puzzle" Button on Result Modal

After completing a game, users currently have to navigate back to the home screen to start the next one. This is an unnecessary interruption that kills session depth.

Add a primary green "Next Puzzle" button above the Share and Done buttons on all result modals. The button resolves the next unplayed game from `useDailyPuzzles`. When all daily games are complete, it transitions to "Play from Archive" using the existing `useRandomPlay` hook.

- **Files:** `src/components/GameResultModal/BaseResultModal.tsx`, all game screen files
- **Expected impact:** Average session length increases from ~1 game to 2-3 games.

### 10. Percentile Display for All Users

The current implementation only shows percentile ranking to users in the top 25%. This is backwards — the users who most need motivation to return are those in the bottom 75%, and showing them "342 people played today. You scored better than 67%." gives them a concrete social comparison and a reason to improve.

Show the full percentile to everyone. No gate.

- **File:** `src/components/GameResultModal/BaseResultModal.tsx`

### 11. "You vs Yesterday" Comparison

Self-comparison is one of the most reliable drivers of competence motivation. Showing a user their score today versus their score on the same game yesterday gives them a concrete improvement target that has nothing to do with other players.

Display a simple "Yesterday: 4 clues / Today: 2 clues" comparison on the result modal for repeat players.

- **File:** `src/components/GameResultModal/BaseResultModal.tsx`

### 12. Web PostHog Event Tracking

The Tier 1 PostHog installation captures page views but not game events. Add explicit tracking for `game_started`, `game_completed`, and `share_completed` on web game components, matching the event schema already in use on mobile.

- **Files:** `web/components/play/*.tsx`

---

## Tier 3: Month 1 - Leaderboards & Retention

*These features give returning users a persistent reason to keep coming back. The current leaderboard is an all-time table that new users can never compete on — this discourages engagement rather than encouraging it.*

### 13. Yearly Leaderboard

Add a third tab to `LeaderboardToggle`: "Today | This Year | All Time". A yearly leaderboard resets on January 1st, giving every user a fair competitive starting point at the beginning of the year. Users who joined in 2025 can actually compete on the 2026 table.

Implement via a new Supabase RPC `get_yearly_leaderboard(year, limit)` that aggregates `puzzle_attempts` within the calendar year.

- **Files:** `src/features/leaderboard/components/LeaderboardToggle.tsx`, new Supabase migration

### 14. All-Time Leaderboard Rework

The current Global IQ score (a weighted 0-100 figure) is opaque. Users don't understand how it's calculated, so they don't know what actions to take to improve it.

Replace it with raw `total_iq` from the profiles table. This directly maps to the tier system users already understand and have emotional investment in (Intern through The Gaffer).

- **Files:** `src/features/leaderboard/`

### 15. Per-Mode Stats on Profile

Users currently see aggregate stats but not a breakdown by game mode. Showing "Career Path: 47 games, 84% accuracy, best score: 2 clues" per mode creates mode-specific improvement goals and reveals which games each user is strongest at.

Query `puzzle_attempts` grouped by `game_mode`. Free users see their own stats; a detailed comparative analytics view sits behind a Pro overlay.

- **Files:** `src/features/stats/`, new Supabase RPC

### 16. Archive Completion Percentage

Show "You've played 234 of 847 archived puzzles" on the archive header and home screen. This is a completionist hook — it gives users a sense of meaningful progress through a finite collection, which is a fundamentally different motivation than daily streaks.

The data already exists via `completedCount` and `totalCount` from `useArchivePuzzles`. This is purely a display change.

- **Files:** `src/features/archive/components/ArchiveHeader.tsx`, `src/features/home/`

---

## Tier 4: Month 1-2 - Archive Redesign & Content Packs

*The archive is currently a flat list sorted by date. This makes it useful only for users who know what they're looking for. Redesigning it around game modes and introducing purchasable packs creates a genuine content catalogue.*

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

*By month 2, Search Console should be showing which queries are getting impressions but low clicks. These tasks are planned now but should be validated against that data before execution.*

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

*Retention mechanics that create habitual daily behaviour. These are only worth building once activation is fixed — a leaky bucket doesn't benefit from a better retention pump.*

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

*These features are only valuable at scale, or require scale to build responsibly. Do not pull forward.*

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

| Page | Target Keywords |
|------|----------------|
| Homepage (`/`) | "daily football quiz", "free football games online" |
| `/play/career-path` | "guess the footballer career", "footballer guessing game" |
| `/play/transfer-guess` | "football transfer quiz", "guess the transfer" |
| `/play/connections` | "football connections game", "NYT connections football" |
| `/play/timeline` | "football timeline quiz", "sort footballers in order" |
| `/play/topical-quiz` | "weekly football quiz", "football news quiz" |
| `/football-trivia-questions` | "football trivia questions and answers", "premier league quiz questions" |

---

## What NOT to Build (Yet)

| Feature | Why Deferred |
|---------|-------------|
| Player pages (SEO) | Thin pages at scale trigger Google helpful content penalty; database not rich enough |
| Blog | Single evergreen trivia questions page achieves the same traffic without ongoing maintenance cost |
| A/B testing infrastructure | Need 1,000+ active users for statistical significance; results would be noise |
| Live multiplayer | XL engineering effort, only creates value at scale |
| Localisation | Need English-market traction first before splitting focus |
| Email marketing | No email collection at registration; requires architecture change first |
| New game modes | 11 modes is sufficient; fix activation before adding more content |
| Daily game cap | Cannot enforce limits fairly until content catalogue is large enough |

---

## Design System Notes

The visual language is strong: stadium navy, pitch green, Bebas Neue. The changes needed are behavioural, not aesthetic.

**Result modal:** Celebrate first (large score animation, confetti), information second (stats, percentile, comparison). Currently the order is reversed.

**Streak indicator:** The flame needs to feel alive. A static icon communicates nothing urgently. Pulsing after 6pm when the streak is at risk creates appropriate tension without being intrusive.

**Archive cards:** Completion state should be immediately visually obvious. Completed puzzles: green tint. Missed puzzles (within free window, not played): grey tint. Locked puzzles: lock overlay.

**Home screen:** Should show session progress ("3 of 5 games today"), not just individual game states. Progress toward completing the daily set is a more powerful motivational frame than a list of available games.

---

## Success Metrics by Tier

| Tier | Primary Metric | Target |
|------|---------------|--------|
| Tier 1 (Analytics) | Search Console set up, web analytics live | Done by end of week |
| Tier 2 (Activation) | % of registered users who play at least once | 12% → 35% |
| Tier 3 (Retention) | Weekly active users | 8 → 30 |
| Tier 4 (Monetisation) | Monthly revenue | Track first pack purchase |
| Tier 5 (SEO) | Organic search impressions | 0 → 5,000/month |
| Tier 6 (Loops) | D7 retention | Establish baseline |
| Tier 7 (Scale) | Monthly active users | 500+ before building |
