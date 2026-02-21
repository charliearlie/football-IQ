# Football IQ: Growth, Retention & Monetization Plan

## Prompt for Implementation

Use the following prompt to kick off implementation of any phase in this document:

```
Read @docs/plans/2026-02-21-growth-retention-monetization.md and implement Phase [N].

Dispatch a research and development team to execute this:
- Use an Explore agent to understand the current implementation of relevant files before making changes
- Use specialist subagents (trivia-engagement-expert, rn-developer, migration-writer, test-writer, ui-designer) as appropriate for the phase
- Use TDD — write tests first, then implement
- Run the web build and/or mobile tests after completion to verify nothing is broken
- Commit the changes when done

Key context:
- React Native (Expo) mobile app in src/ and app/
- Next.js 15 web app in web/
- Supabase backend
- RevenueCat for subscriptions
- AdMob for ads (react-native-google-mobile-ads)
- PostHog for analytics
- Node 22 required for web builds: source ~/.nvm/nvm.sh && nvm use 22
```

---

## Situation Analysis (Feb 2026)

### The Numbers
| Metric | Value | Implication |
|--------|-------|-------------|
| Registered users | 262 | Growing (195 in last 30 days) |
| Ever played a puzzle | 31 (12%) | **88% activation failure — top priority** |
| Active last 7 days | 8 (3% WAU) | Tiny but engaged core |
| Premium subscribers | 5 (1.9% of all, 16% of players) | Conversion rate is actually good among players |
| Puzzle completion rate | 96% | The game itself is excellent |
| Game modes | 11 | Enough — no more needed |
| Content: The Grid/Chain/Thread | 1 puzzle each | **Critical gap — breaks retention** |

### Root Cause Diagnosis
1. **Activation failure** (88% never play): No onboarding, 11 game cards shown cold, no guided first experience
2. **No conversion pressure**: Everything is free forever, no daily game limit, no structural reason to upgrade
3. **Invisible upsell**: Post-game premium prompt only fires for top 25% scorers (75% never see it)
4. **Share links broken**: Missing `https://` protocol means links don't auto-hyperlink on most platforms
5. **Content gaps**: 3 game modes have only 1 puzzle — anyone who explores beyond Career Path hits a dead end

### What's Already Strong
- Streak system with freeze mechanics (earned + premium unlimited)
- Share cards with emoji grids (Wordle-style viral format)
- Tier progression (10 tiers from Intern to The Gaffer)
- AdMob integration (banner + rewarded, production ad units configured)
- Push notification infrastructure (local scheduling, morning + evening)
- RevenueCat integration with full entitlement sync
- Web-playable games driving app downloads
- PostHog analytics tracking all key events

---

## Completed Work

### Phase 1: Quick SEO & Share Fixes (DONE)
- All 10 share text generators (5 web, 5 mobile) now use `https://football-iq.app/...`
- Apple Smart Banner added to `web/app/layout.tsx`
- Timeline added to `web/app/sitemap.ts`
- Scout pages noindexed in `web/app/scout/[userId]/page.tsx`
- Domain standardized to `football-iq.app` across all files

### Phase 3: Post-Game Upsell Fix (DONE)
- Removed `percentile >= 75` gate in `BaseResultModal.tsx`
- Upsell now shows to ALL free users after every completed game
- Contextual copy: high scorers see percentile, others see "Track your accuracy"

---

## Phase 2: Admin Analytics Dashboard

**Effort**: 3-4 hours | **Impact**: Critical (enables all future decisions)

Every other decision depends on understanding why 88% of registered users never play. We're currently flying blind.

### 2a. Users admin page (`/admin/users`)

**New file**: `web/app/(dashboard)/admin/users/page.tsx`
**Pattern**: Follow existing admin pages (e.g., `/admin/connections/`)

**Cohort funnel header cards:**
```
Registered: 262 | Ever Played: 31 (12%) | Active 7d: 8 (3%) | Premium: 5 (1.9%)
```

**SQL for funnel cards:**
```sql
-- Registered
SELECT COUNT(*) FROM profiles;

-- Ever played
SELECT COUNT(DISTINCT user_id) FROM puzzle_attempts;

-- Active 7d
SELECT COUNT(DISTINCT user_id) FROM puzzle_attempts
WHERE created_at > NOW() - INTERVAL '7 days';

-- Premium
SELECT COUNT(*) FROM profiles WHERE is_premium = true;
```

**User list table** with columns:
- display_name, created_at, last_active (from puzzle_attempts), total_attempts, is_premium
- Filterable by: never_played, active (7d), lapsed (7-30d), churned (30d+)

**SQL for user list:**
```sql
SELECT
  p.id,
  p.display_name,
  p.created_at,
  p.is_premium,
  p.total_iq,
  COUNT(pa.id) as total_attempts,
  MAX(pa.created_at) as last_active
FROM profiles p
LEFT JOIN puzzle_attempts pa ON pa.user_id = p.id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

**Individual user detail** (click a row to expand or navigate):
- Registration date, every puzzle attempt with game_mode/score, IQ progression, push token status

### 2b. Content health dashboard

Add to admin home or new `/admin/content` page.

**Days-of-coverage per game mode:**
```sql
SELECT
  game_mode,
  COUNT(*) as live_puzzles,
  COUNT(*) as days_coverage
FROM daily_puzzles
WHERE status = 'live' AND puzzle_date >= CURRENT_DATE
GROUP BY game_mode
ORDER BY live_puzzles ASC;
```

Flag critical gaps:
- The Grid (1 puzzle), The Chain (1), The Thread (1) — **CRITICAL**
- Timeline (2), Connections (5), Starting XI (5) — **WARNING**
- Career Path (39), Transfer Guess (39) — OK

### Key files to reference
- Existing admin pages: `web/app/(dashboard)/admin/connections/`
- Admin layout: `web/app/(dashboard)/layout.tsx`
- Supabase admin client: `web/lib/supabase/server.ts`

---

## Phase 4: Daily Free Game Cap

**Effort**: 1-2 days | **Impact**: Highest monetization lever

The single highest-leverage change. Currently there is zero structural reason to pay because everything is free forever.

### Design

- Free users get **3 games per day** (configurable constant `FREE_DAILY_LIMIT = 3`)
- When 4th game tapped → show paywall: "You've played your 3 free games today. Come back tomorrow, or go Pro for unlimited play."
- Track `completedTodayCount` against `FREE_DAILY_LIMIT`
- Premium users: unlimited, no cap

### Soft-lock UX

When limit reached, remaining game cards show a new state (distinct from premium-only lock):
- Greyed card with lock icon
- Label: "Daily limit reached"
- Two paths on tap:
  1. "Watch Ad for 1 more game" → rewarded ad → increment `freeGamesAdBonus` (AsyncStorage, resets daily)
  2. "Go Pro for unlimited" → navigate to `/premium-modal`

### What stays free always
- Today's daily puzzles (up to cap)
- Streaks and streak display
- IQ points and tier progression
- Share cards
- Leaderboard viewing

### Key files to modify
- `src/features/home/hooks/useDailyPuzzles.ts` — add `completedTodayCount` tracking and `FREE_DAILY_LIMIT`
- `src/features/home/components/new/HomeGameList.tsx` — render soft-lock state after limit
- `src/features/home/components/new/GlassGameCard.tsx` — new "limit reached" visual state
- `src/features/ads/context/AdContext.tsx` — add rewarded ad for daily bonus game
- New: `src/features/home/services/dailyLimitService.ts` — AsyncStorage tracking for daily count + ad bonus

### Analytics events to add
```typescript
DAILY_LIMIT_REACHED: { games_played: number }
DAILY_LIMIT_AD_WATCHED: { games_played: number }
DAILY_LIMIT_UPGRADE_TAPPED: { games_played: number }
```

---

## Phase 5: Onboarding Flow

**Effort**: 3-4 days | **Impact**: Fixes 88% activation drop

### Why 88% never play
Users arrive cold, see 11 game cards, don't know where to start, leave. There is no guided first experience.

### First-session experience

Gate with `isFirstSession` flag in AsyncStorage. Scaffolding exists in `AuthOnboardingProvider` (`app/_layout.tsx`).

**Step 1 — Auto-launch one game**: Pre-select a Career Path puzzle (medium difficulty, famous player like Messi/Ronaldo). No choice paralysis. User taps one button to start.

**Step 2 — Show the reward**: After game completes → show result + IQ points earned. "You're a Match Analyst. Play more to level up." Animate tier badge appearing. This is the first dopamine hit.

**Step 3 — Hook the streak**: "New puzzles every day. Build your streak." Show streak counter at 1. **Request notification permission HERE** — the user just won, they want to protect this. Conversion rate for notification permission is highest right after a positive experience.

**Step 4 — Reveal the menu**: Show today's remaining games. Frame as "Today's Challenges" not "Game Modes". The language matters — challenges imply a goal, modes imply a menu.

### Progressive mode revelation (days 1-7)

Don't show all 11 modes on day 1. Reveal progressively to create novelty:

| Day | Modes visible |
|-----|---------------|
| 1 | Career Path, Topical Quiz |
| 2 | + Transfer Guess |
| 3 | + Connections |
| 5 | + The Grid, The Chain |
| 7+ | All modes |

Implement via `installDayCount` filter on game mode order in `useDailyPuzzles.ts`. Store install date in AsyncStorage.

### Key files
- `app/_layout.tsx` — `AuthOnboardingProvider` already wraps the app
- `src/features/puzzles/types/onboarding.types.ts` — existing onboarding type definitions
- New: `src/features/onboarding/` — first-session flow components
- `src/features/home/hooks/useDailyPuzzles.ts` — mode filtering by install day

---

## Phase 6: 7-Day Free Trial

**Effort**: 1 day | **Impact**: High conversion lift (typically 2-3x trial starts)

RevenueCat supports intro pricing natively. The code in `PremiumUpsellContent.tsx` already reads `introPrice` and has `isOfferActive` logic — this is mostly store configuration, not code.

### Actions
1. Configure 7-day free trial in App Store Connect
2. Configure 7-day free trial in Google Play Console
3. Update paywall CTA to "Try Pro free for 7 days"
4. Rewrite benefit list from features → outcomes:
   - "Play every puzzle ever made, not just today's"
   - "Zero ads, ever. Pure football knowledge."
   - "See exactly which modes you dominate"
   - "Never lose your streak again"

### Key files
- `src/features/subscription/components/PremiumUpsellContent.tsx` — CTA copy + benefit rows
- App Store Connect / Google Play Console — trial configuration
- `src/config/revenueCat.ts` — verify offering ID matches

---

## Phase 7: Rewarded Ad Expansion

**Effort**: 2-3 days | **Impact**: Revenue + engagement

Current ads: banner (bottom of screen for free users) + rewarded (archive unlock via `UnlockChoiceModal` only). Most users never visit archive, so most never see a rewarded ad.

### 7a. Rewarded ad for extra daily game (at the cap)
- When free user hits 3-game limit → "Watch an ad to unlock 1 more game today"
- Shown alongside the premium CTA in the soft-lock state
- Reward: increment `freeGamesAdBonus` for the day (AsyncStorage, resets daily)
- **Depends on Phase 4 (daily cap)**

### 7b. Rewarded ad for streak freeze
- When user hasn't played and it's after 20:00 → "Watch ad to protect your streak"
- Most emotionally compelling ad placement — streak is something user invested in
- Hook into existing `awardFreeze` in `streakFreezeService.ts`
- Can show in the streak-at-risk notification response or on home screen after 20:00

### 7c. Interstitial between sessions
- After every 3rd completed game, show interstitial before returning to home
- Add `loadInterstitialAd` / `showInterstitialAd` to `AdContext.tsx`
- Use existing ad unit IDs from `src/features/ads/config/adUnits.ts`
- Frequency cap: max 1 interstitial per session
- **Never during gameplay, never in first session**

### UX rules
- No ads in the first session ever (pristine new user experience)
- Rewarded ads only when user explicitly taps "Watch Ad" (never auto-trigger)
- No banner ads during active gameplay
- Interstitials only between games, never mid-game
- Premium removes all ads

### Key files
- `src/features/ads/context/AdContext.tsx` — add interstitial ad management
- `src/features/ads/config/adUnits.ts` — interstitial ad unit IDs needed (or use rewarded units)
- `src/features/streaks/services/streakFreezeService.ts` — hook for ad-earned freeze
- `src/features/home/components/new/HomeGameList.tsx` — soft-lock ad button

---

## Phase 8: Push Notification Improvements

**Effort**: 1-2 days | **Impact**: Retention

Infrastructure exists (`NotificationContext`, `messageRotation.ts`, local scheduling for 08:30 daily + 20:30 streak saver). What's missing: server-side targeting and content quality.

### 8a. Segment targeting for admin notifications

**File**: `web/app/(dashboard)/admin/notifications/`

Add `last_active_at` tracking (join push_tokens to puzzle_attempts). Replace "Send to All Devices" with a segment selector:

| Segment | Query Logic |
|---------|------------|
| Never played | `user_id NOT IN (SELECT DISTINCT user_id FROM puzzle_attempts)` |
| At risk | Played before, no activity 3-7 days |
| Lapsed | No activity 7-30 days |
| Churned | No activity 30+ days |
| Non-premium only | `is_premium = false` |

Add `last_notified_at` column to `push_tokens`, enforce max 1 notification per user per 24 hours.

### 8b. Better notification copy

**Contextual daily notifications:**
- Include a teaser: "Ballon d'Or winner, 4 clubs — guess the career?"
- Reference the streak: "Your 12-day streak is at risk!"
- Personalize: "You're 200 IQ from Chief Scout — one more game today?"

**Ensure `messageRotation.ts` is firing correctly:**
- Verify it receives streak count
- Add 5-7 more message variants
- Test that morning + evening notifications schedule correctly on both iOS and Android

### Key files
- `web/app/(dashboard)/admin/notifications/` — admin UI
- `src/features/notifications/utils/messageRotation.ts` — copy variants
- `src/features/notifications/context/NotificationContext.tsx` — scheduling
- Migration needed: add `last_notified_at` to `push_tokens` table

---

## Phase 9: Evergreen SEO Content Page

**Effort**: 3-4 hours | **Impact**: Organic traffic (6-12 week payoff)

One high-value page, not a blog. Do not start a blog as a solo dev — a single evergreen page achieves the same traffic goal.

### `/quiz/football-trivia-questions/` page

**Title**: "Football Trivia Questions and Answers: 50 Questions to Test Your Knowledge"

**Structure**:
- 5 categories x 10 questions:
  1. Premier League (10 questions)
  2. World Cup & International (10 questions)
  3. Player Careers (10 questions)
  4. Transfers & Fees (10 questions)
  5. Football History (10 questions)
- Source questions from existing Topical Quiz puzzle history
- Answers behind collapsible `<details>` toggles
- `FAQPage` JSON-LD schema on bottom 10 questions (targets People Also Ask boxes)
- Inline CTA after every 10 questions: "Think you know football? Test yourself live — today's Career Path puzzle is waiting."
- Add to sitemap

**Target keywords**: "football trivia questions", "football quiz questions and answers" — high volume, low difficulty queries that game pages don't rank for.

### Key files
- New: `web/app/quiz/football-trivia-questions/page.tsx`
- `web/app/sitemap.ts` — add `/quiz/football-trivia-questions`

---

## Phase 10: Content Pipeline

**Effort**: Ongoing | **Impact**: Retention (critical modes are empty)

### Current content coverage

| Game Mode | Live Puzzles | Status |
|-----------|-------------|--------|
| career_path | 39 | OK |
| career_path_pro | 39 | OK |
| guess_the_transfer | 39 | OK |
| guess_the_goalscorers | 11 | Low |
| topical_quiz | 11 | Low |
| top_tens | 9 | Low |
| connections | 5 | WARNING |
| starting_xi | 5 | WARNING |
| timeline | 2 | WARNING |
| the_grid | 1 | **CRITICAL** |
| the_chain | 1 | **CRITICAL** |
| the_thread | 1 | **CRITICAL** |

### Priority order for puzzle creation
1. **The Grid, The Chain, The Thread** — 1 puzzle each, need 14+ immediately
2. **Timeline, Connections, Starting XI** — need 14+ each
3. **Top Tens, Topical Quiz, Goalscorer Recall** — need 14+ each
4. Career Path already has 39 — sufficient

### Content health monitoring
- Admin widget (Phase 2b) showing days-of-coverage per mode
- Alert when any mode drops below 7 days of content
- Automated content integrity checks before puzzles go live

---

## Phase 11: Paywall Copy Rewrite (NEW)

**Effort**: 2 hours | **Impact**: Medium (15-30% conversion lift from copy alone)

The current premium benefit list describes features, not desires. Rewrite to focus on outcomes.

### Current → New

| Current | New |
|---------|-----|
| "Unlimited archive access" | "Play every puzzle ever made, not just today's" |
| "Ad-free experience" | "Zero ads, ever. Pure football knowledge." |
| "Per-mode accuracy" | "See exactly which leagues and eras you dominate" |
| "Unlimited streak protection" | "Never lose your streak again, no matter what" |

### Key file
- `src/features/subscription/components/PremiumUpsellContent.tsx` — benefit rows

---

## Phase 12: Home Screen UX Polish (NEW)

**Effort**: 1-2 days | **Impact**: Engagement

### 12a. Daily completion celebration
When user finishes all available daily games (or hits the free cap), show a "Daily Complete" card with:
- Current streak number (prominent)
- "Your streak resets in Xh Ym" countdown (already have `getTimeToMidnight()` in `HomeGameList.tsx`)
- Share button: "Challenge your mates"
- Next puzzle countdown

### 12b. Welcome-back moments
- Day 2: "Welcome back! Day 2 streak. You're building momentum."
- Day 5: "5 days in a row. You're in the top 15% of players for consistency."
- Day 7: "One week streak! You've played more than most."

Implement as a dismissible banner on home screen load, gated by streak count milestones.

### 12c. Archive discovery prompt
After day 3-4 of playing, surface the archive: "Yesterday's puzzles are still available. How would you have done?" — this is also the first organic premium prompt because archive requires Pro.

### Key files
- `src/features/home/components/new/HomeGameList.tsx`
- `src/features/home/components/new/DailyCompleteCard.tsx` (may already exist)
- New: `src/features/home/components/WelcomeBackBanner.tsx`

---

## Phase 13: Social Sharing Improvements (NEW)

**Effort**: 1-2 days | **Impact**: Viral growth

### 13a. Share text first-line hook
The first line of share text is what appears in iMessage/WhatsApp/Twitter previews. Currently it's brand copy ("Football IQ - Career Path"). Change to a curiosity hook:

| Game | Current | Better |
|------|---------|--------|
| Career Path | "Football IQ - Career Path" | "Guess this career? I got it in 3 clues" |
| Connections | "Football IQ - Connections" | "Can you find all 4 groups? I had 1 mistake" |
| Transfer Guess | "Football IQ - Transfer Guess" | "I named this transfer with just 1 hint" |
| Topical Quiz | "Football IQ - Quiz" | "4/5 on today's football quiz. Beat that." |
| Timeline | "Football IQ - Timeline" | "Put this career in order? I got 5/6" |

The key change: personalized + competitive + curiosity-inducing vs generic brand label.

### 13b. Percentile in share text
When percentile data is available, add to share text:
"Top 8% of players today" — social proof that drives competitive sharing.

### Key files
- `web/lib/shareText.ts` — all 5 web generators
- `src/features/*/utils/share.ts` — all mobile generators
- `src/components/GameResultModal/useResultShare.ts` — general share utility

---

## Phase 14: Rate App Prompt (NEW)

**Effort**: 2 hours | **Impact**: ASO (App Store ratings drive organic downloads)

### Trigger conditions
Show the native `expo-store-review` prompt when ALL of these are true:
- User has completed 10+ puzzles total
- User has a streak of 3+ days
- User has NOT been prompted in the last 30 days
- User just achieved a win (positive emotional state)

### Implementation
- Track `lastRatePromptDate` in AsyncStorage
- Check conditions in game result handler
- Use `StoreReview.requestReview()` — already imported in settings

### Key files
- `src/features/settings/components/RateAppModal.tsx` (exists, adapt logic)
- New: `src/features/engagement/services/rateAppService.ts`

---

## Phase 15: PostHog Dashboards (NEW, No Code)

**Effort**: 1 hour (PostHog UI only) | **Impact**: Decision-making

Create these dashboards in PostHog (no code changes needed, just PostHog configuration):

### Dashboard 1: Activation Funnel
```
Step 1: account_created (or first app open)
Step 2: game_started (first time)
Step 3: game_completed (first time)
Step 4: game_started (second session, different day)
```

### Dashboard 2: Game Mode Popularity
Bar chart of `game_started` events grouped by `game_mode` property.

### Dashboard 3: Session Depth
`game_completed` events per user per day. What % play 1 vs 2+ puzzles?

### Dashboard 4: Premium Conversion Journey
Person profiles of the 5 premium users. What did they all do before converting?

---

## Phase 16: ASO — App Store Optimization (NEW, No Code)

**Effort**: 1 hour (store configuration) | **Impact**: Organic downloads

### App Store Connect

**Title** (30 chars max):
- US: "Football IQ - Soccer Trivia" (27 chars — use "Soccer" for US ranking)
- UK: "Football IQ - Football Quiz" (27 chars)

**Subtitle** (30 chars max):
- "Daily Quiz & Player Guessing" (28 chars)

**Keyword field** (100 chars, no spaces after commas):
```
quiz,game,career,transfer,connections,premier,league,trivia,sports,daily,club,guess,knowledge,test
```
Do NOT include words already in title/subtitle (Apple won't double-index).

### Screenshot strategy
- Show share cards with emoji grids (Wordle recognition)
- Show tier progression (aspiration)
- Show streak counter (commitment device)
- A/B test: gameplay screenshot vs share card screenshot

### Seasonal keyword opportunities
- "champions league quiz 2026" — before UCL QF (March/April)
- "world cup quiz 2026" — FIFA World Cup is June 2026, start April

---

## Phases NOT in Scope (Revisit at 1000+ WAU)

| Feature | Why Deferred |
|---------|-------------|
| A/B testing infrastructure | Need 1000+ active users for statistical significance |
| Email marketing | No email collection at registration |
| Churn prediction models | Need hundreds of data points per user |
| Friends system + challenges | Important but secondary to activation fix |
| Blog | Single evergreen page achieves same goal |
| Player pages (SEO) | Right 12-month strategy, wrong now |
| New game modes | 11 is enough — need better activation and content |
| Localization | Need English-market traction first |
| Live multiplayer | XL effort, needs scale to justify |
| User-generated content | Need community first |

---

## Execution Order Summary

| # | Phase | Impact | Effort | Status |
|---|-------|--------|--------|--------|
| 1 | Phase 1: SEO & share fixes | Fixes broken shares | 1-2h | **DONE** |
| 2 | Phase 3: Post-game upsell | Unlocks 75% of users | 2h | **DONE** |
| 3 | Phase 2: Admin analytics | Enables all decisions | 3-4h | TODO |
| 4 | Phase 4: Daily game cap | #1 monetization lever | 1-2d | TODO |
| 5 | Phase 6: Free trial | 2-3x trial starts | 1d | TODO |
| 6 | Phase 11: Paywall copy | 15-30% conversion lift | 2h | TODO |
| 7 | Phase 5: Onboarding | Fixes 88% activation drop | 3-4d | TODO |
| 8 | Phase 7: Rewarded ads | Ad revenue + engagement | 2-3d | TODO |
| 9 | Phase 8: Push notifications | Retention | 1-2d | TODO |
| 10 | Phase 12: Home screen UX | Engagement polish | 1-2d | TODO |
| 11 | Phase 14: Rate app prompt | ASO ratings | 2h | TODO |
| 12 | Phase 13: Share text hooks | Viral growth | 1-2d | TODO |
| 13 | Phase 15: PostHog dashboards | Decision-making | 1h | TODO |
| 14 | Phase 16: ASO | Organic downloads | 1h | TODO |
| 15 | Phase 10: Content gaps | Retention | Ongoing | TODO |
| 16 | Phase 9: SEO content page | Organic traffic | 3-4h | TODO |

---

## Verification Checklist

After each phase:
1. **Web changes**: `source ~/.nvm/nvm.sh && nvm use 22 && cd web && npm run build`
2. **Web tests**: `source ~/.nvm/nvm.sh && nvm use 22 && cd web && npm test -- --run`
3. **Mobile tests**: `cd /Users/charlie/workspace/football-trivia && npx jest --passWithNoTests`
4. **Manual test**: Verify on device/simulator
5. **Analytics**: Check PostHog for new event firing
6. **No regressions**: Existing flows still work
