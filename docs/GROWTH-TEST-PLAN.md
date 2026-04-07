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
2. New game modes (Who's That?, Higher/Lower) only appear on home screen if puzzles exist for today — create them via the API first (see Phase 9 section)
3. For web features, run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 && npm run dev`

---

## What Visual Changes Were Made to the App

### Result Modal (every game mode)

These changes appear on the result modal after completing any game:

| What | Where | Details |
|------|-------|---------|
| **Challenge a Friend** | Below Share/Next Puzzle buttons | Yellow-bordered button. Only shows on wins. Tapping creates a challenge via API and opens the native share sheet. |
| **Tier progress bar** | Above buttons | Shows current tier name + IQ gained, animated fill bar toward next tier. "TIER UP!" text on tier change. |
| **Streak badge** | Above tier bar | Flame icon + "X day streak" label. Only when streak is active. |
| **Upsell banner** | Between streak/tier and buttons | Non-premium users with 15+ IQ see one of: tier-up copy, streak milestone copy, or default stats upsell. |
| **Store review prompt** | Native OS dialog | Appears ~1.5s after win if: 3+ day streak, tier promotion, or 5+ completed games. Rate-limited to once per 90 days. |
| **Button layout fix** | Button row | Next Puzzle + Share now side by side (was: full-width Share above, Next+Done below). |

### Paywall / Premium Modal

| What | Where | Details |
|------|-------|---------|
| **Contextual subtitle** | Below "Football IQ Pro" title | Changes based on trigger: "Unlimited games. Zero ads. Full stats." (general), "Protect your streak forever." (streak save), "You're a natural. Keep the momentum." (first win), "Unlock every game in the archive." (archive) |
| **Referral CTA** | Post-purchase success screen | Yellow-bordered box: "Share Football IQ and give your friends 7 free days" with share button |
| **A/B test trigger** | After first win | If PostHog `paywall_timing_v1` flag is `test`, paywall appears after first win of the session |

### Home Screen

| What | Where | Details |
|------|-------|---------|
| **Who's That? card** | Daily game list | New game card: "WHO'S THAT? — Guess the player". Only shows if a whos-that puzzle exists for today. |
| **Higher/Lower card** | Daily game list | New game card: "HIGHER/LOWER — Compare the fees". Only shows if a higher_lower puzzle exists for today. |

### Give Up Confirmation Modal

| What | Details |
|------|---------|
| **Darker background** | Changed from slate blue to near-black (`rgba(10, 10, 18, 0.97)`) |
| **No bounce** | Smooth 250ms slide-up instead of spring bounce |

### New Game Modes

**Who's That?** (Wordle for footballers):
- Intro/onboarding screen on first play (6 attempts, attribute feedback rules)
- Player search autocomplete (type name, select from dropdown)
- 6-row guess grid with 5 colour-coded attribute columns: Club, League, Nationality, Position, Age
  - Green = exact match, Yellow = close, Red/Gray = wrong
- Result modal with score and emoji grid

**Higher/Lower** (transfer fee comparison):
- Intro/onboarding screen on first play (10 rounds, one wrong = game over)
- Two stacked player cards with "VS" divider
  - Top card: name, club, fee visible
  - Bottom card: name, club, fee hidden as "?"
- HIGHER / LOWER buttons at bottom
- Fee reveal animation: green (correct) or red (wrong), auto-advance after ~1.5s
- Result modal with rounds completed, score out of 55

### Invisible Changes (no visual impact)

These are server-side or analytics-only — nothing to visually test in the simulator:
- PostHog analytics events (`game_started`, `game_completed`, `paywall_dismissed`, etc.)
- Push notification crons (streak saver, lifecycle nudge, weekly recap)
- Growth dashboard (web admin only)
- Email capture forms (web only)
- SEO quiz pages (web only)
- Post-game download banner (web only)
- UTM tracking on App Store links (web only)
- Social proof strip on homepage (web only)

---

## Manual Test Checklist — Mobile

### Result Modal

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| R-1 | Challenge button visible on win | Win any game mode | "Challenge a Friend" button below Share | TODO |
| R-2 | Challenge hidden on loss | Lose a game | No challenge button | TODO |
| R-3 | Challenge share works | Win > tap Challenge a Friend | Shows "Creating..." then native share sheet opens with URL (no emoji grid in message) | TODO |
| R-4 | Tier progress bar | Win a game (earn IQ) | Progress bar with tier name, fill animation, "+X IQ" | TODO |
| R-5 | Tier up celebration | Earn enough IQ to tier up | "TIER UP!" text, bar fills completely | TODO |
| R-6 | Streak badge | Win with active streak | Flame icon + "X day streak" | TODO |
| R-7 | Button layout | Win daily game with next puzzle available | NEXT PUZZLE + SHARE side by side, no green bar above | TODO |
| R-8 | Archive no chain | Play archive puzzle (past date) | Share + Done only, NOT "NEXT PUZZLE (X OF 3)" | TODO |
| R-9 | Store review prompt | Win with 5+ completed games (clear AsyncStorage `@football_iq_last_review_prompt` first) | Native review dialog after ~1.5s | TODO |
| R-10 | Upsell banner (non-premium) | Win with 15+ IQ, not premium | Upsell text appears above buttons | TODO |

### Paywall

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| P-1 | General copy | Open premium modal from settings | Subtitle: "Unlimited games. Zero ads. Full stats." | TODO |
| P-2 | Streak save copy | Trigger paywall from streak context | Subtitle: "Protect your streak forever." | TODO |
| P-3 | Referral CTA | Complete purchase (sandbox) | Yellow box: "Share Football IQ and give your friends 7 free days" | TODO |

### Home Screen

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| H-1 | Who's That? card | Create whos-that puzzle for today (see below), open app | "WHO'S THAT?" card in daily list | TODO |
| H-2 | Higher/Lower card | Create higher_lower puzzle for today (see below), open app | "HIGHER/LOWER" card in daily list | TODO |

### Give Up Modal

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| G-1 | Dark background, no bounce | Start any game > tap Give Up | Dark overlay, smooth slide (no spring bounce) | TODO |

### New Game Modes

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| B-1 | Who's That? intro | Tap Who's That? card (first time) | Onboarding: "6 attempts", attribute feedback rules | TODO |
| B-2 | Who's That? gameplay | Type player name | Autocomplete dropdown, select player, 5 colour-coded cells per guess | TODO |
| B-3 | Who's That? result | Win or exhaust 6 guesses | Result modal with score, Share + Challenge buttons | TODO |
| HL-1 | Higher/Lower intro | Tap Higher/Lower card (first time) | Onboarding: "10 rounds", "one wrong = game over" | TODO |
| HL-2 | Higher/Lower gameplay | Start playing | Two cards, top fee visible, bottom "?", HIGHER/LOWER buttons | TODO |
| HL-3 | Higher/Lower reveal | Tap Higher or Lower | Fee reveals green (correct) or red (wrong), auto-advances | TODO |
| HL-4 | Higher/Lower result | Complete 10 or get one wrong | Result modal with rounds + score out of 55 | TODO |

---

## Creating Test Puzzles for New Game Modes

Who's That? and Higher/Lower only appear on the home screen when puzzles exist for today's date. Create them first:

```bash
# Create a Who's That? puzzle for today
curl -X PUT https://www.football-iq.app/api/puzzles \
  -H "Authorization: Bearer $FOOTBALL_IQ_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"puzzle_date":"2026-04-04","game_mode":"whos-that","status":"live","source":"manual","content":{"answer":{"player_name":"Bukayo Saka","player_id":"Q59306386","club":"Arsenal","league":"Premier League","nationality":"England","position":"Forward","age":24}}}'

# Create a Higher/Lower puzzle for today (chain format — winner carries forward)
curl -X PUT https://www.football-iq.app/api/puzzles \
  -H "Authorization: Bearer $FOOTBALL_IQ_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"puzzle_date":"2026-04-04","game_mode":"higher_lower","status":"live","source":"manual","content":{"players":[{"name":"Neymar","club":"PSG","fee":222},{"name":"Mbappe","club":"Real Madrid","fee":180},{"name":"Coutinho","club":"Barcelona","fee":135},{"name":"Pogba","club":"Man United","fee":105},{"name":"Hazard","club":"Real Madrid","fee":115},{"name":"Griezmann","club":"Barcelona","fee":120},{"name":"Joao Felix","club":"Atletico","fee":127},{"name":"Lukaku","club":"Chelsea","fee":97.5},{"name":"Grealish","club":"Man City","fee":100},{"name":"Haaland","club":"Man City","fee":60},{"name":"Nunez","club":"Liverpool","fee":85}]}}'
```

---

## Manual Test Checklist — Web

Run: `cd web && source ~/.nvm/nvm.sh && nvm use 22 && npm run dev` then visit localhost:3000.

| # | Test | Steps | Expected | Status |
|---|------|-------|----------|--------|
| W-1 | Email form on landing | Homepage, scroll below game grid | Email input + "Subscribe" button | TODO |
| W-2 | Email form on blog | Visit `/blog/[slug]` | Email form at bottom of article | TODO |
| W-3 | Email form on scout | Visit `/scout/[userId]` | Email form after report | TODO |
| W-4 | Email form on download | Visit `/download` | Email form with Android waitlist messaging | TODO |
| W-5 | Subscribe API | POST to `/api/email/subscribe` with valid email | `{ success: true }` | TODO |
| W-6 | Quiz — Premier League | Visit `/quiz/premier-league` | H1, 4 question sections, CTAs, FAQ accordion | TODO |
| W-7 | Quiz — Champions League | Visit `/quiz/champions-league` | Same layout, CL questions | TODO |
| W-8 | Quiz — World Cup | Visit `/quiz/world-cup` | Same layout, WC questions | TODO |
| W-9 | Quiz — Guess the Footballer | Visit `/quiz/guess-the-footballer` | Clue-based questions | TODO |
| W-10 | JSON-LD schema | View source on quiz page | `application/ld+json` with FAQPage | TODO |
| W-11 | Sitemap | Visit `/sitemap.xml` | Contains `/quiz/premier-league`, etc. | TODO |
| W-12 | Challenge page | Visit `/challenge/[valid-uuid]` | Challenger name, score, download CTA | TODO |
| W-13 | Challenge 404 | Visit `/challenge/invalid-id` | "Challenge Not Found" page | TODO |
| W-14 | Post-game download banner | Complete web game | Green "Want more?" banner with App Store link | TODO |
| W-15 | Social proof strip | Visit homepage | Strip showing "X+ GAMES PLAYED" and "15 MODES" | TODO |
| W-16 | UTM on App Store links | Click App Store button | URL contains `?mt=8&ct=web_home` | TODO |
| W-17 | Growth dashboard | Admin > Growth tab | 4 sections: overview, retention, virality, push | TODO |

---

## Pre-existing Issues (not caused by growth work)

| Issue | File | Notes |
|-------|------|-------|
| TS error | `src/features/auth/services/SubscriptionSync.ts:71` | `upgrade_to_premium` not in typed RPC list |
| Lint warning | `web/app/(dashboard)/calendar/actions.ts` | no-explicit-any |
| Missing dep | `country-flag-icons/string/3x2` | Import warning |
| Date-sensitive tests | `archive/LockHierarchy`, `auth/PremiumGating`, `archive/Gating` | 3 suites with hardcoded dates fail on date rollover |
| Reanimated mock | `settings/RateAppModal`, `settings/LegalModal`, etc. | `.mass()` not mocked |
