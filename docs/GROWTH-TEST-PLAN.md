# Football IQ Growth Features — Test Plan

Last updated: 2026-04-04

## Automated Tests

### Mobile (Jest + jest-expo)
Run: `npx jest --no-coverage`

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| useAnalytics | `src/hooks/__tests__/useAnalytics.test.ts` | 38 | PASS |
| useStoreReview | `src/hooks/__tests__/useStoreReview.test.ts` | 21 | PASS |
| createChallenge | `src/features/challenges/__tests__/createChallenge.test.ts` | 13 | PASS |
| PremiumUpsellContent | `src/features/subscription/__tests__/PremiumUpsellContent.test.tsx` | 27 | PASS |
| SyncService | `src/services/player/__tests__/SyncService.test.ts` | 7 | PASS |

### Web (Vitest)
Run: `cd web && npx vitest run lib/__tests__/constants.test.ts lib/__tests__/push.test.ts`

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| constants/appStoreUrl | `web/lib/__tests__/constants.test.ts` | 16 | PASS |
| push utilities | `web/lib/__tests__/push.test.ts` | 20 | PASS |

**Total: 142 new tests, 142 passing, 0 failing**

---

## How to Test in Simulator

1. Start Metro with cache clear: `npx expo start --clear`
2. New game modes (Balldle, Higher/Lower) only appear on home screen if puzzles exist for today — create them via the API first (see Phase 9 section)
3. For web features, run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 && npm run dev`

---

## Manual Test Plan — Mobile App (Simulator)

### Phase 1: Analytics & Conversion

**What you'll see:** Contextual paywall copy changes, post-game download banner on web, social proof on homepage.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 1.2a | Contextual paywall copy — general | Open premium modal from settings or home | Subtitle: **"Unlimited games. Zero ads. Full stats."** | TODO |
| 1.2b | Contextual paywall copy — streak_save | Trigger paywall from streak loss (or deep link `/premium-modal?mode=streak_save`) | Subtitle: **"Protect your streak forever."** | TODO |
| 1.2c | Contextual paywall copy — first_win | Win first game with A/B test enabled in PostHog | Subtitle: **"You're a natural. Keep the momentum."** | TODO |
| 1.1a | paywall_dismissed tracking | Open premium modal > dismiss it | Check PostHog for `paywall_dismissed` event with `trigger_source` property | TODO |
| 1.1d | Store review prompt | Complete 5+ games across sessions (90-day interval) | System review dialog appears; PostHog shows `store_review_prompted` | TODO |

**Web-only (test in browser at localhost:3000):**

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 1.4a | UTM tracking on App Store links | Click any App Store button on homepage | URL contains `?mt=8&ct=web_home` | TODO |
| 1.5 | Post-game download banner | Complete any web game (e.g. `/play/career-path`) | Green **"Want more?"** banner below result with App Store link | TODO |
| 1.6a | Social proof strip | Visit homepage | Strip below hero showing **"X+ GAMES PLAYED"** and **"15 MODES"** | TODO |

### Phase 2: Server-Side Push & Lifecycle

**What you'll see:** No visual changes in app — these are server-side crons + admin dashboard features.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 2.1 | Streak saver cron | `curl -H "Authorization: Bearer $CRON_SECRET" https://www.football-iq.app/api/cron/streak-saver` | JSON with sent/failed/eligibleUsers counts | TODO |
| 2.2 | DB tables exist | Check Supabase dashboard | `scheduled_notifications` and `notification_opens` tables present | DONE |
| 2.4a | Lifecycle nudge cron | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/lifecycle-nudge` | JSON with at_risk/lapsed_7d/never_played results | TODO |
| 2.4b | Weekly recap cron | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/weekly-recap` | JSON with personalised message counts | TODO |
| 2.5a | Admin notification segments | Admin dashboard > Notifications > Select "Free users only" | Estimated audience count updates dynamically | TODO |
| 2.6 | Vercel crons registered | Deploy > Vercel dashboard > Crons tab | 3 crons: streak-saver, lifecycle-nudge, weekly-recap | TODO |

### Phase 3: Viral Growth Features

**What you'll see:** "Challenge a Friend" button on result modals after winning, referral CTA after purchase.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 3.1a | **Challenge a Friend button** | Win any game mode > see result modal | **"Challenge a Friend"** button visible below Share/Done buttons | TODO |
| 3.1b | Challenge hidden on loss | Lose a game > see result modal | Challenge button is NOT shown (only Share + Done) | TODO |
| 3.1c | Challenge share flow | Win a game > tap "Challenge a Friend" | Button shows "Creating..." then opens native share sheet with challenge URL | TODO |
| 3.5 | Referral CTA post-purchase | Subscribe to premium (sandbox) | Success screen shows **"Share Football IQ and give your friends 7 free days"** with share button | TODO |

**Web-only:**

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 3.1c | Challenge web page | Visit `/challenge/[valid-uuid]` in browser | Shows challenger name, score, game mode, and **download CTA** | TODO |
| 3.1d | Challenge 404 | Visit `/challenge/invalid-id` | Shows "Challenge Not Found" page | TODO |

### Phase 4: A/B Testing & Growth Dashboard

**What you'll see:** Growth dashboard in admin, paywall experiment behaviour.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 4.1a | Paywall after first win | Enable `paywall_timing_v1` flag in PostHog (test variant) > win a game | Premium modal appears with "first_win" context copy | TODO |
| 4.1b | Control variant | Set flag to control > win a game | No paywall after win (normal behaviour) | TODO |
| 4.1c | Once per session only | Win multiple games (test variant) | Paywall triggers on **first win only**, not subsequent | TODO |
| 4.2a | **Growth dashboard** | Visit admin dashboard > Growth tab | Page loads with 4 sections: overview, retention, virality, push | TODO |
| 4.2f | Growth nav item | Check admin sidebar | **"Growth"** item with TrendingUp icon, between Notifications and Player Scout | TODO |

---

## Manual Test Plan — Result Modal Bug Fixes

**What you'll see:** Fixed button layout, correct archive behavior, challenge button appearing.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| BF-1 | **No empty button gap** | Win first daily game > result modal | "NEXT PUZZLE (2 OF 3)" takes **full width** (no invisible gap on the right) | TODO |
| BF-2a | **Archive doesn't show daily chain** | Play an archive puzzle (past date) | Result modal shows **Share + Done** only, NOT "NEXT PUZZLE (X OF 3)" | TODO |
| BF-2b | Daily still chains correctly | Play today's first daily puzzle | Result modal shows **"NEXT PUZZLE (2 OF 3)"** correctly | TODO |
| BF-3 | **Challenge button on all modes** | Win Career Path / Connections / any mode | **"Challenge a Friend"** button visible below share/close buttons | TODO |

---

## Manual Test Plan — Web Features

### Phase 5: Email Capture

**What you'll see:** Email signup forms on multiple pages, subscribe API.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 5.1 | DB table exists | Check Supabase | `email_subscribers` table with email, source, welcome_sequence_step | DONE |
| 5.2a | Subscribe API | `curl -X POST .../api/email/subscribe -d '{"email":"test@test.com","source":"landing"}'` | `{ success: true }` | TODO |
| 5.2b | Invalid email rejected | POST with `{"email":"notanemail"}` | 400: `{ error: "Invalid email" }` | TODO |
| 5.3a | **Email form on landing** | Visit homepage, scroll below game grid | Email input + "Subscribe" button with **"Get weekly football trivia"** heading | TODO |
| 5.3b | **Email form on blog** | Visit any `/blog/[slug]` article | Email capture form at bottom of article | TODO |
| 5.3c | **Email form on scout** | Visit `/scout/[userId]` | Email capture form after scout report | TODO |
| 5.3d | **Email form on download** | Visit `/download` | Email form with **Android waitlist** messaging | TODO |
| 5.4 | Welcome sequence cron | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/welcome-sequence` | JSON with emails_sent count | TODO |

### Phase 6: SEO Content Expansion

**What you'll see:** New quiz pages with trivia questions and game CTAs.

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 6.1a | **Quiz — Premier League** | Visit `/quiz/premier-league` | H1 with "Premier League", 4 sections of questions, CTAs to play modes, FAQ accordion | TODO |
| 6.1b | **Quiz — Champions League** | Visit `/quiz/champions-league` | Similar layout with Champions League questions | TODO |
| 6.1c | **Quiz — World Cup** | Visit `/quiz/world-cup` | World Cup questions across 4 sections | TODO |
| 6.1d | **Quiz — Guess the Footballer** | Visit `/quiz/guess-the-footballer` | Clue-based questions (nationality, position, achievements) | TODO |
| 6.2 | JSON-LD schema | View page source on any quiz page | `<script type="application/ld+json">` with FAQPage schema | TODO |
| 6.3 | Blog index | Visit `/blog` | Page loads (may show "No articles yet" if empty) | TODO |
| 6.4 | Data journalism template | Visit `/blog/data/test` (will 404 but template exists) | Template file at `web/app/blog/data/[slug]/page.tsx` | DONE |
| 6.5 | Sitemap includes quizzes | Visit `/sitemap.xml` | Contains `/quiz/premier-league`, etc. | TODO |

---

## Phase 9: New Game Modes

**Note:** Balldle and Higher/Lower only appear on the home screen when puzzles exist for today's date. Create test puzzles first:

```bash
# Create a Balldle puzzle for today
curl -X PUT https://www.football-iq.app/api/puzzles \
  -H "Authorization: Bearer $FOOTBALL_IQ_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"puzzle_date":"2026-04-04","game_mode":"balldle","status":"live","source":"manual","content":{"answer":{"player_name":"Bukayo Saka","player_id":"Q54307379","club":"Arsenal","league":"Premier League","nationality":"England","position":"Forward","age":24}}}'

# Create a Higher/Lower puzzle for today
curl -X PUT https://www.football-iq.app/api/puzzles \
  -H "Authorization: Bearer $FOOTBALL_IQ_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"puzzle_date":"2026-04-04","game_mode":"higher_lower","status":"live","source":"manual","content":{"pairs":[{"player1":{"name":"Neymar","club":"PSG","fee":222},"player2":{"name":"Mbappe","club":"Real Madrid","fee":180}},{"player1":{"name":"Coutinho","club":"Barcelona","fee":135},"player2":{"name":"Lukaku","club":"Chelsea","fee":97.5}},{"player1":{"name":"Bale","club":"Real Madrid","fee":101},"player2":{"name":"Ronaldo","club":"Real Madrid","fee":94}},{"player1":{"name":"Pogba","club":"Man United","fee":105},"player2":{"name":"Hazard","club":"Real Madrid","fee":115}},{"player1":{"name":"Zidane","club":"Real Madrid","fee":77.5},"player2":{"name":"Ferdinand","club":"Man United","fee":46.6}},{"player1":{"name":"Van Dijk","club":"Liverpool","fee":75},"player2":{"name":"Kepa","club":"Chelsea","fee":80}},{"player1":{"name":"Griezmann","club":"Barcelona","fee":120},"player2":{"name":"Joao Felix","club":"Atletico","fee":127}},{"player1":{"name":"Sancho","club":"Man United","fee":85},"player2":{"name":"Havertz","club":"Chelsea","fee":80}},{"player1":{"name":"Cucurella","club":"Chelsea","fee":65},"player2":{"name":"Grealish","club":"Man City","fee":100}},{"player1":{"name":"Haaland","club":"Man City","fee":60},"player2":{"name":"Nunez","club":"Liverpool","fee":85}}]}}'
```

### Code verification (DONE)

| # | Check | Status |
|---|-------|--------|
| 9.1a-f | Balldle registered in GameMode, route map, rules, home list, icon, web constants | DONE |
| 9.1g-h | Balldle feature module + app routes exist | DONE |
| 9.2a-f | Higher/Lower registered in same 6 locations | DONE |
| 9.2g-h | Higher/Lower feature module + app routes exist | DONE |
| 9.3 | Web TypeScript clean (`npx tsc --noEmit`) | DONE |
| 9.4 | Mobile tests pass (2300+) | DONE |

### Gameplay testing (after creating puzzles above)

| # | What to look for | Steps | Expected | Status |
|---|-----------------|-------|----------|--------|
| 9.1i | **Balldle on home screen** | Open app (after creating puzzle) | **"BALLDLE"** card visible in daily game list | TODO |
| 9.1j | **Balldle intro screen** | Tap Balldle card (first time) | Onboarding screen with rules: "6 attempts", attribute feedback explanation | TODO |
| 9.1k | **Balldle gameplay** | Start playing > type a player name | Autocomplete dropdown, select player, see **5 coloured attribute cells** (green/yellow/red) per guess | TODO |
| 9.1l | **Balldle result** | Win or use all 6 guesses | Result modal with score, emoji grid, Share + Challenge buttons | TODO |
| 9.2i | **Higher/Lower on home screen** | Open app (after creating puzzle) | **"HIGHER/LOWER"** card visible in daily game list | TODO |
| 9.2j | **Higher/Lower intro screen** | Tap Higher/Lower card (first time) | Onboarding with rules: "10 rounds", "one wrong = game over" | TODO |
| 9.2k | **Higher/Lower gameplay** | Start playing | Two player cards stacked with **"VS"** divider, top fee visible, bottom hidden as **"?"**, **HIGHER/LOWER** buttons at bottom | TODO |
| 9.2l | **Higher/Lower reveal** | Tap Higher or Lower | Bottom card fee reveals with **green** (correct) or **red** (wrong) highlight, auto-advances after ~1.5s | TODO |
| 9.2m | **Higher/Lower result** | Complete 10 rounds or get one wrong | Result modal with rounds completed, streak score out of 55, emoji grid (checkmarks/crosses) | TODO |

---

## Pre-existing Issues

| Issue | File | Notes |
|-------|------|-------|
| ~~7 failing tests~~ | `src/services/player/__tests__/SyncService.test.ts` | **FIXED** — was using local mockRpc overwritten by jest-setup.ts global mock |
| TS error | `src/features/auth/services/SubscriptionSync.ts:71` | `upgrade_to_premium` not in typed RPC list |
| Lint warning | `web/app/(dashboard)/calendar/actions.ts` | no-explicit-any (pre-existing) |
| Missing dep | `country-flag-icons/string/3x2` | Import warning (pre-existing) |
| Date-sensitive tests | `archive/LockHierarchy`, `auth/PremiumGating`, `archive/Gating` | 3 suites with hardcoded dates fail on date rollover — not related to growth work |
| Reanimated mock | `settings/RateAppModal`, `settings/LegalModal`, etc. | `.mass()` not mocked in Reanimated — pre-existing |
