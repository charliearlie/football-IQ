# Football IQ Growth Features — Test Plan

Last updated: 2026-04-03

## Automated Tests

### Mobile (Jest + jest-expo)
Run: `npx jest --no-coverage`

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| useAnalytics | `src/hooks/__tests__/useAnalytics.test.ts` | 38 | PASS |
| useStoreReview | `src/hooks/__tests__/useStoreReview.test.ts` | 21 | PASS |
| createChallenge | `src/features/challenges/__tests__/createChallenge.test.ts` | 13 | PASS |
| PremiumUpsellContent | `src/features/subscription/__tests__/PremiumUpsellContent.test.tsx` | 27 | PASS |
| SyncService (pre-existing) | `src/services/player/__tests__/SyncService.test.ts` | 7 | FAIL |

### Web (Vitest)
Run: `cd web && npx vitest run lib/__tests__/constants.test.ts lib/__tests__/push.test.ts`

| Suite | File | Tests | Status |
|-------|------|-------|--------|
| constants/appStoreUrl | `web/lib/__tests__/constants.test.ts` | 16 | PASS |
| push utilities | `web/lib/__tests__/push.test.ts` | 20 | PASS |

**Total: 142 new tests, 135 passing, 7 failing (pre-existing in SyncService)**

---

## Manual Test Plan

### Phase 1: Analytics & Conversion

| # | Feature | Steps | Expected Result | Status |
|---|---------|-------|-----------------|--------|
| 1.1a | paywall_dismissed event | Open premium modal > close it | PostHog shows `paywall_dismissed` with `trigger_source` | TODO |
| 1.1b | paywall_dismissed (archive) | Tap locked archive day > close modal | PostHog shows `paywall_dismissed` trigger_source=`archive` | TODO |
| 1.1c | paywall_dismissed (unlock choice) | See unlock choice modal > close it | PostHog shows `paywall_dismissed` trigger_source=`unlock_choice` | TODO |
| 1.1d | store_review_prompted | Complete 5+ games (win/complete) | PostHog shows `store_review_prompted` with trigger type | TODO |
| 1.2a | Contextual paywall - general | Navigate to `/premium-modal` | Subtitle: "Unlimited games. Zero ads. Full stats." | TODO |
| 1.2b | Contextual paywall - streak_save | Navigate to `/premium-modal?mode=streak_save` | Subtitle: "Protect your streak forever." | TODO |
| 1.2c | Contextual paywall - first_win | Navigate to `/premium-modal?mode=first_win` | Subtitle: "You're a natural. Keep the momentum." | TODO |
| 1.3 | Store review interval | Check MIN_INTERVAL_MS constant | Should be 90 days (7,776,000,000 ms) | TODO |
| 1.4a | UTM - homepage | Click App Store link on homepage | URL contains `?mt=8&ct=web_home` | TODO |
| 1.4b | UTM - play hub | Click App Store link on /play | URL contains `?mt=8&ct=web_play` | TODO |
| 1.4c | UTM - blog | Click App Store link on blog article | URL contains `?mt=8&ct=web_blog` | TODO |
| 1.5 | Post-game download CTA | Complete any web game | "Want more?" banner appears below result | TODO |
| 1.5b | Post-game CTA dismiss | Click X on the banner | Banner disappears, doesn't reappear until page reload | TODO |
| 1.6a | Social proof strip | Visit homepage | SocialProofStrip shows "X+ GAMES PLAYED" | TODO |
| 1.6b | Mode count | Visit homepage | Shows "13 MODES" (not 11) | TODO |

### Phase 2: Server-Side Push & Lifecycle

| # | Feature | Steps | Expected Result | Status |
|---|---------|-------|-----------------|--------|
| 2.1 | Streak saver cron | `curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/streak-saver` | JSON response with sent/failed/eligibleUsers counts | TODO |
| 2.1b | Streak saver - no auth | `curl https://.../api/cron/streak-saver` | 401 Unauthorized | TODO |
| 2.2 | DB tables | Check Supabase | `scheduled_notifications` and `notification_opens` tables exist | DONE |
| 2.3 | Notification opens | Tap a server-side push notification | Row appears in `notification_opens` table | TODO |
| 2.4a | Lifecycle - at risk | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/lifecycle-nudge` | JSON with at_risk/lapsed_7d/never_played campaign results | TODO |
| 2.4b | Weekly recap | `curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/weekly-recap` | JSON with personalised message counts | TODO |
| 2.5a | Admin segments | Dashboard > Notifications > Select "Free users only" | Estimated audience count updates | TODO |
| 2.5b | Admin send to segment | Select segment > compose > send | Only segment users receive notification | TODO |
| 2.6 | Vercel crons | Deploy > check Vercel dashboard | 3 new crons: streak-saver, lifecycle-nudge, weekly-recap | TODO |

### Phase 3: Viral Growth Features

| # | Feature | Steps | Expected Result | Status |
|---|---------|-------|-----------------|--------|
| 3.1a | Challenge create | Win a game > tap "Challenge a Friend" | Share sheet opens with challenge URL | TODO |
| 3.1b | Challenge button hidden on loss | Lose a game | "Challenge a Friend" button not shown | TODO |
| 3.1c | Challenge web page | Visit `/challenge/[valid-uuid]` | Shows challenger name, score, game mode, download CTA | TODO |
| 3.1d | Challenge 404 | Visit `/challenge/invalid-id` | Shows "Challenge Not Found" page | TODO |
| 3.1e | Challenge OG tags | Share challenge URL on social media | Preview shows "X challenged you to Career Path!" | TODO |
| 3.1f | Challenge API - create | POST to `/api/challenges` with valid body | Returns `{ id, url }` | TODO |
| 3.1g | Challenge API - respond | POST to `/api/challenges/[id]` with score | Returns `{ result: won/lost/tied, scores }` | TODO |
| 3.1h | Challenge API - duplicate | POST same user response twice | 409 Conflict | TODO |
| 3.5 | Referral CTA post-purchase | Subscribe to premium | Success screen shows "Share Football IQ and give your friends 7 free days" | TODO |

### Phase 4: A/B Testing & Growth Dashboard

| # | Feature | Steps | Expected Result | Status |
|---|---------|-------|-----------------|--------|
| 4.1a | Experiment hook | Enable `paywall_timing_v1` flag in PostHog (test variant) | After first win, paywall shows with "first_win" context | TODO |
| 4.1b | Experiment - control | Set flag to control variant | No paywall after win (normal behaviour) | TODO |
| 4.1c | Experiment - once per session | Win multiple games in test variant | Paywall only triggers on first win, not subsequent | TODO |
| 4.2a | Growth dashboard | Navigate to /growth | Page loads with all 4 metric sections | TODO |
| 4.2b | Growth - headline metrics | Check overview section | Total Users, Premium, Games Played, Avg IQ shown | TODO |
| 4.2c | Growth - retention | Check retention section | D1/D7/D30 percentages with colour coding | TODO |
| 4.2d | Growth - virality | Check virality section | Referral codes, challenges, response rate | TODO |
| 4.2e | Growth - push | Check push section | Notification history with open rates | TODO |
| 4.2f | Growth nav | Check sidebar | "Growth" item with TrendingUp icon between Notifications and Player Scout | TODO |

---

## Phase 5: Email Capture (TODO)
_Tests to be added when implemented_

## Phase 6: SEO Content Expansion (TODO)
_Tests to be added when implemented_

## Phase 9: New Game Modes (TODO)
_Tests to be added when implemented_

---

## Pre-existing Issues

| Issue | File | Notes |
|-------|------|-------|
| 7 failing tests | `src/services/player/__tests__/SyncService.test.ts` | mockRpc not wiring correctly — needs fix |
| TS error | `src/features/auth/services/SubscriptionSync.ts:71` | `upgrade_to_premium` not in typed RPC list |
| Lint warning | `web/app/(dashboard)/calendar/actions.ts` | no-explicit-any (pre-existing) |
| Missing dep | `country-flag-icons/string/3x2` | Import warning (pre-existing) |
