# Football IQ: Engagement Improvement Proposals

**Date:** February 2026
**Source:** Trivia Engagement Expert analysis of full codebase
**Status:** Proposals for review

---

## Executive Summary: Top 10 Priorities

Based on Impact x Effort x Strategic Alignment:

### Tier 1: Immediate Implementation (Next 2 Sprints)

1. **Async Friend Challenges** - Creates viral loop, drives retention via competition. Single highest-impact feature for growth.
2. **Streak Freeze Economy** - Removes biggest frustration point. Duolingo-proven mechanic. Easy win for retention.
3. **Free Daily Limit (5 games)** - Clarifies premium value prop, creates conversion pressure. Essential for revenue.
4. **Guided First Game Tutorial** - Ensures positive first experience. Critical for Day 1 retention.
5. **Tier Level-Up Celebration** - Creates shareable moment, reinforces progression system. High emotional impact.

### Tier 2: High-Value Medium-Term (Next Quarter)

6. **Add Friends System** - Enables friend challenges, creates network effect. Foundation for social features.
7. **Expand Premium Perks** - Justifies price, increases perceived value. Required to hit revenue targets.
8. **12-Month Content Calendar** - Makes game feel alive, professional. Ties to cultural moments. Low effort, high impact.
9. **Leaderboard Change Notifications** - Drives next-day return via competitive urgency. High engagement lever.
10. **Weekly Collection Challenges** - Creates FOMO, drives daily engagement. Appeals to completionists.

---

## 1. Game Modes & Gameplay

### What Currently Exists

**10 Game Modes Active** (`src/features/puzzles/constants/rules.ts`, `src/features/puzzles/utils/gameModeConfig.tsx`):

1. **Career Path** - Progressive reveal (clubs shown one at a time), guess player
2. **Career Path Pro** (Premium) - Harder variant with legendary/obscure players
3. **Transfer Guess** - Identify player from transfer fee/clubs with optional hints
4. **Goalscorer Recall** - 60-second timed challenge to name all scorers from a historic match
5. **Starting XI** - Identify hidden players in tactical formation
6. **Top Tens** (Premium) - Complete ranked lists (e.g., top Premier League scorers)
7. **The Grid** (Premium/Beta) - 3x3 matrix matching row/column criteria
8. **The Chain** - Connect players through shared club history
9. **The Thread** - Identify club from kit sponsor/supplier chronology
10. **Topical Quiz** - 5 multiple-choice questions on current football topics

**Special Events**: System exists for time-limited puzzles (`src/features/home/config/events.ts`, special event columns in database)

### Gaps Identified

- No asynchronous multiplayer - all games are solo
- Limited variability within modes - no difficulty settings per puzzle
- The Grid stuck in beta with no clear graduation criteria
- No speed-based scoring - Goalscorer Recall has timer but score doesn't reward speed
- Missing collection mechanics - no "complete all players from X team"
- Event system underutilised - special events exist but no recurring seasonal content strategy

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Async Head-to-Head** - "Challenge Friend" flow: play puzzle, generate sharable link, friend plays same puzzle, winner notified. Store in new `challenges` table. Show pending challenges on home screen. | HIGH | MEDIUM | P0 |
| 2 | **Speed Bonuses for Timed Games** - Goalscorer Recall awards bonus IQ for fast answers (10s = +5, 30s = +3, 60s = +0). "Lightning Round" badge for sub-30s completions. | MEDIUM | LOW | P1 |
| 3 | **Weekly Collection Challenges** - "Complete the 2008 CL Final XI this week" - special badge + 50 bonus IQ. Surfaced via Event Banner. Uses existing special events system. | HIGH | MEDIUM | P0 |
| 4 | **Difficulty Tiers within Modes** - Puzzles tagged Easy/Medium/Hard. Harder puzzles award more IQ (1.5x multiplier). Users can filter archive by difficulty. | MEDIUM | LOW | P2 |
| 5 | **Seasonal Event Calendar** - 12-month content calendar tied to football calendar: Transfer Window (Jan/Aug), CL Final (May), World Cup Anniversary, etc. | HIGH | MEDIUM | P1 |

---

## 2. Engagement Loops & Retention Mechanics

### What Currently Exists

**Hook Model Implementation** (`src/features/notifications/services/notificationService.ts`, `src/features/home/hooks/useDailyProgress.ts`):

- **Trigger**: Local notifications at 08:30 (Daily Kickoff) and 20:30 (Streak Saver)
- **Action**: Home screen with Daily Progress Ring showing X/10 completion
- **Variable Reward**: Score reveal, IQ tier progression, leaderboard rank changes
- **Investment**: Streak counter, cumulative IQ points, tier progression (10 tiers: Trialist to GOAT)

**Streak System** (`src/features/home/hooks/useUserStats.ts`):
- Tracks consecutive days with 1+ completed puzzle
- Shown in home header
- NO streak freeze/protection mechanism

**Daily Progress** (`src/features/home/hooks/useDailyProgress.ts`):
- Shows X/10 games completed today
- No reward for completing all 10

### Gaps Identified

- No streak freeze mechanic - users lose streak on first miss
- No "perfect day" bonus for completing all 10 puzzles
- Notifications are basic - time-based only, no smart timing
- No onboarding drip campaign for days 2-7
- No re-engagement for lapsed users
- Leaderboard not surfaced as a hook (no "you dropped to #15!" notifications)

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Streak Freeze Economy** - 1 free freeze. Earn 1 per 7-day milestone. Premium = unlimited freezes. Auto-apply on missed day. Show "Streak Freeze Available" banner when at risk. | HIGH | MEDIUM | P0 |
| 2 | **Perfect Day Rewards** - Complete all 10 daily puzzles = "Daily Champion" badge + 100 bonus IQ + confetti. Track monthly perfect days count. | MEDIUM | LOW | P1 |
| 3 | **Smart Notification Timing** - Track user's typical play time. Schedule notifications 30 mins before. Fall back to defaults for first week. | MEDIUM | MEDIUM | P2 |
| 4 | **Onboarding Drip Campaign** - Day 2: "Try a different mode". Day 3: "Check the leaderboard". Day 7: "7-day streak celebration!" | HIGH | MEDIUM | P1 |
| 5 | **Lapsed User Re-engagement** - 7 days inactive: "Your rival just beat your score". 14 days: "New players added this week". 30 days: "3 free games on us." | MEDIUM | MEDIUM | P2 |

---

## 3. Scoring & Progression

### What Currently Exists

**Tier Progression** (`src/features/stats/utils/tierProgression.ts`):
- 10 Tiers: Trialist (0) > Youth Squad (25) > Reserve Team (100) > Impact Sub (250) > Rotation Player (500) > First Team Regular (1,000) > Key Player (2,000) > Club Legend (4,000) > National Treasure (8,000) > GOAT (20,000)
- Cumulative points via `profiles.total_iq` PostgreSQL trigger
- Exponential curve: early tiers in days, top tiers require months

**Per-Game Intelligence Tiers** (`src/features/puzzles/constants/rules.ts`):
- Separate 15-tier system (Trainee > Hall of Famer)
- Shown in game result modal
- Confusing overlap with global tiers

### Gaps Identified

- Two parallel tier systems with different naming - confusing
- No seasonal resets - IQ is cumulative forever
- Mid-tier progression feels invisible (2,000 > 4,000 takes weeks with no milestones)
- No leaderboard tier segregation - beginners vs veterans on same board
- Perfect scores on hard puzzles same value as easy puzzles

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Unify Tier Naming** - Align per-game tiers with global tiers. "You played like a Club Legend!" instead of "Hall of Famer". | MEDIUM | LOW | P1 |
| 2 | **Seasonal Leagues** - 4-week seasons with separate leaderboard (resets monthly). "Season Champion" badge for top 100. | HIGH | HIGH | P2 |
| 3 | **Micro-Milestones** - Every 500 IQ within a tier: "2,500 IQ! Halfway to Club Legend." Progress bar on Stats screen showing % to next tier. | MEDIUM | LOW | P1 |
| 4 | **Difficulty Multipliers** - Easy = 1x, Medium = 1.25x, Hard = 1.5x, Very Hard = 2x. "2x IQ Week!" event banners. | MEDIUM | MEDIUM | P2 |
| 5 | **Perfect Score Bonuses** - First perfect on any mode = special badge. 10 perfects in a month = "Perfectionist" monthly badge. | MEDIUM | LOW | P1 |

---

## 4. Onboarding & First Session

### What Currently Exists

**First-Run Flow** (`src/features/auth/components/BriefingScreen.tsx`):
1. Anonymous Auth on first launch
2. Briefing Screen: tactical formation background, weekly schedule grid, display name input, "START YOUR CAREER" CTA
3. Stored in AsyncStorage: `@app_onboarding_completed`

**Game Intro Modals** (`src/features/puzzles/components/GameIntroScreen/`):
- Shown first time user plays each mode
- Rules bullets, scoring explanation, "GOT IT" dismissal
- State tracked in OnboardingContext

### Gaps Identified

- No guided first game - user might pick hardest mode first
- Briefing shows all 10 modes at once - overwhelming
- No tutorial puzzle - users read rules but might not understand
- First game failure is punishing (0 IQ)
- No celebration of first win
- Weekly schedule doesn't emphasise "start with today's puzzle"

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Guided First Game** - After Briefing, auto-navigate to today's Career Path with overlay tutorial. Pre-select an easy puzzle. Guaranteed success + high IQ boost. | HIGH | MEDIUM | P0 |
| 2 | **Progressive Onboarding** - Briefing shows only today's 3 core modes. After first game: "5 more modes unlocked! Swipe to explore." | MEDIUM | MEDIUM | P1 |
| 3 | **First Win Celebration** - After first completed puzzle: confetti + "You're a natural!" + "Share your first score" CTA + 50 bonus IQ. | MEDIUM | LOW | P1 |
| 4 | **Suggested Start Mode** - Briefing highlights Career Path with "Recommended for beginners" badge. | LOW | LOW | P2 |
| 5 | **Safety Net Scoring** - First 3 puzzles have minimum IQ floor of 5. Labelled "Trainee Bonus" in UI. | MEDIUM | LOW | P1 |

---

## 5. Retention Mechanics

### What Currently Exists

**Notifications** (`src/features/notifications/services/notificationService.ts`):
- Daily Kickoff (08:30) and Streak Saver (20:30)
- Push token saved to Supabase `push_tokens` table
- Deep linking support

**Daily Progress Ring** (`src/features/home/components/new/DailyProgressRing.tsx`):
- Hero element on home screen, X/10 completion
- No reward for 100%

### Gaps Identified

- No push for leaderboard rank changes
- No weekly summary notification
- No comeback mechanics after missed days
- Generic notification content for all users
- No in-app engagement nudges
- Streak counter doesn't show "at risk" state

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Leaderboard Change Notifications** - 21:00 daily: "You slipped to #8! Play tomorrow to reclaim." Track last notified rank to avoid spam. | HIGH | MEDIUM | P0 |
| 2 | **Weekly Digest Push** - Sunday 18:00: "This week: 6-day streak, 180 IQ earned, Career Path mastery at 85%". Include "Share your week" CTA. | MEDIUM | MEDIUM | P1 |
| 3 | **Dynamic Streak Warning** - After 20:00 with 0 plays, change header to "5 day streak at risk! 4 hours left" in red. | MEDIUM | LOW | P1 |
| 4 | **Personalised Notifications** - Track user's best mode. "New Career Path just dropped - your best mode!" instead of generic messaging. | MEDIUM | MEDIUM | P2 |
| 5 | **Catch-Up Challenges** - Missed a day? Next day shows "Yesterday's Puzzle" as free unlock. Complete within 24h to preserve streak. | HIGH | MEDIUM | P0 |

---

## 6. Monetisation

### What Currently Exists

**Premium Model** (`app/premium-modal.tsx`, `src/features/subscription/`):
- RevenueCat integration with Monthly + Annual plans
- Intro offer detection and display
- Premium-gated modes: Career Path Pro, Top Tens, The Grid

**Ad Monetisation** (`src/features/ads/`):
- AdMob rewarded ads to unlock archived puzzles
- UnlockChoiceModal: "Watch Ad" or "Go Premium"
- PremiumUpsellBanner on home screen

**Pricing** (`src/features/subscription/components/PremiumUpsellContent.tsx`):
- Annual shows monthly equivalent
- "BEST VALUE / SAVE XX%" badges

### Gaps Identified

- No daily play limit for free users - unclear conversion trigger
- Premium value prop is weak (only 3 extra modes)
- No soft paywall moment in the natural flow
- Conservative ad placement (rewarded only, no interstitials)
- No limited-time offer urgency messaging
- No free trial
- No A/B testing of conversion funnel

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Free Daily Limit (5 games)** - 6th game: "Out of games! Watch ad for +1 or Go Pro for unlimited". 5 games = 30-40 mins (healthy session). | HIGH | MEDIUM | P0 |
| 2 | **Expand Premium Perks** - Add: profile customisation (avatar borders, badge showcase), early access to new modes, monthly exclusive challenge with premium badge. Make premium feel like a VIP club. | HIGH | MEDIUM | P0 |
| 3 | **7-Day Free Trial** - Trigger after 10 total games. "You're on fire! Try Pro free for 7 days." Trial users convert at 40%+ vs 2-5% without. | HIGH | LOW | P1 |
| 4 | **Limited-Time Offer Urgency** - Countdown timer: "50% off ends in 23h 14m". Push 12h before expiry. | MEDIUM | MEDIUM | P1 |
| 5 | **Strategic Interstitial Ads** - After every 3rd completed game (not during gameplay). Max 1/day. Premium removes. | MEDIUM | LOW | P2 |
| 6 | **Conversion Funnel A/B Testing** - Test: (A) Feature-focused, (B) Identity-focused ("Join 10,000 Pro players"), (C) FOMO-focused. Track conversion per variant. | MEDIUM | MEDIUM | P2 |

---

## 7. Social & Competitive Features

### What Currently Exists

**Leaderboards** (`src/features/leaderboard/`):
- Daily (resets daily) and Global (all-time IQ)
- Real-time polling, sticky "Me" bar
- Tap entry to view Scout Report

**Sharing** (`src/features/career-path/utils/share.ts`, `src/features/stats/utils/shareIQ.ts`):
- Wordle-style emoji grids per game
- IQ Card image sharing from Stats screen
- Platform-aware (native share sheet / clipboard)

**Scout Report** (`app/(tabs)/stats.tsx`):
- FIFA-inspired player card with tier, badges, radar chart
- Shareable via ViewShot image export
- Public profile at `/scout/[userId]`

### Gaps Identified

- No friend system - can't add friends or filter leaderboard
- No direct challenges
- Sharing is passive (manual only)
- No social proof in game ("15,432 players tried this today")
- No comments or reactions on friends' scores
- Leaderboard is anonymous - no friend discovery
- No fan clubs/teams

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Async Friend Challenges** - After puzzle: "Challenge a Friend" button, sharable link, friend plays same puzzle, winner notified + head-to-head record on profile. | HIGH | HIGH | P0 |
| 2 | **Friends System** - Search by username, friend requests, friends list. "All Players" / "Friends Only" leaderboard toggle. Contact import for discovery. | HIGH | HIGH | P0 |
| 3 | **Social Proof in Results** - "You scored better than 68% of players today" + "12,450 players attempted this puzzle". | MEDIUM | LOW | P1 |
| 4 | **Auto Share Prompts** - After perfect score or personal best, auto-show share sheet: "Just got a perfect score on Football IQ! Can you beat it?" + download link. | MEDIUM | LOW | P1 |
| 5 | **Fan Club Teams** - Join club (Arsenal, Barcelona, etc.). Weekly club leaderboard: which club's members scored highest combined IQ. | MEDIUM | MEDIUM | P2 |

---

## 8. Content Strategy & Freshness

### What Currently Exists

- Manual puzzle creation via standalone HTML CMS (`tools/content-creator.html`)
- Puzzles stored in Supabase `daily_puzzles` with game_mode, date, content JSON, difficulty, special event fields
- Archive system with ad-unlock for free users, unlimited for premium
- ~4,900 elite players bundled with delta sync

### Gaps Identified

- No 12-month content calendar tied to football calendar
- Content creation is entirely manual
- No automated puzzle generation from player database
- Special events are ad-hoc, not recurring
- No user-generated content
- No themed weeks

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **12-Month Content Calendar** - Plan year ahead: CL Final (May), Transfer Window (Jan/Aug), Ballon d'Or (Oct), Boxing Day (Dec). Pre-schedule events. Publicly share "Coming next month" teasers. | HIGH | LOW | P0 |
| 2 | **Programmatic Puzzle Generation** - Auto-generate Top Tens from player database. Weekly script creates next week's puzzles. Reduces manual work by ~50%. | MEDIUM | MEDIUM | P1 |
| 3 | **Seasonal Themed Weeks** - Monthly theme: "January: Transfer Window Trivia", "May: European Finals Month". 7 related puzzles + bonus IQ for completing all 7. | HIGH | MEDIUM | P1 |
| 4 | **User-Submitted Questions** - "Submit a Question" form. Community votes. Top 10 monthly get featured + "Contributor" badge. | MEDIUM | MEDIUM | P2 |
| 5 | **Dynamic Difficulty Adjustment** - Track win rate per mode. >75% = harder puzzles, <40% = easier. Personalised difficulty keeps everyone challenged. | MEDIUM | HIGH | P2 |
| 6 | **"On This Day" Content** - "On this day in 2005, Liverpool won the CL in Istanbul. Name the starting XI." Auto-generated from historical data. | MEDIUM | MEDIUM | P2 |

---

## 9. UX/UI Polish & Feedback

### What Currently Exists

- **Confetti** on premium purchase (`components/Confetti`)
- **Reanimated** transitions (SlideInDown, FadeIn)
- **Haptics** on premium purchase + onboarding submit only (`src/hooks/useFeedback.ts`)
- **Skeletons** for loading states (`components/ui/Skeletons`)
- **Design System** in `.superdesign/` (colours, typography, spacing tokens)

### Gaps Identified

- Haptics only used in 2 places - massively underutilised
- No celebration for level-ups (only premium purchase gets confetti)
- No sound effects at all
- Result modal is text-heavy, could be more visual
- Error messages are developer-focused
- No micro-interactions on buttons/cards

### Proposals

| # | Proposal | Impact | Effort | Priority |
|---|----------|--------|--------|----------|
| 1 | **Comprehensive Haptics** - Wrong answer (error), correct answer (success), streak milestone (success), level up (success), button press (light). Toggleable in settings. | MEDIUM | LOW | P1 |
| 2 | **Tier Level-Up Celebration** - Full-screen modal with badge animation (scale + glow), confetti, sound, "Share your new tier" CTA. | HIGH | MEDIUM | P0 |
| 3 | **Sound Effects** - Correct: ding chime. Wrong: subtle thud. Level up: fanfare. Perfect: applause. Toggleable. Use expo-av. | MEDIUM | MEDIUM | P2 |
| 4 | **Visualised Score Results** - Replace "Score: 8/10" with animated progress bar filling 0 > 80%, tier badge sliding in, comparison to previous best. | MEDIUM | MEDIUM | P1 |
| 5 | **Friendly Error Messages** - Replace "Failed to sync attempts" with "Connection lost. Don't worry, your progress is saved." + Retry button. | LOW | LOW | P2 |
| 6 | **Button Micro-Interactions** - All primary buttons scale to 0.95 on press + light haptic. Cards lift on touch. 150ms spring animation. | MEDIUM | LOW | P1 |

---

## Key File References

| Area | Files |
|------|-------|
| Game Modes | `src/features/puzzles/constants/rules.ts`, individual game feature dirs |
| Scoring | `src/features/stats/utils/iqCalculation.ts`, `src/features/stats/utils/tierProgression.ts` |
| Onboarding | `src/features/auth/components/BriefingScreen.tsx`, `src/features/puzzles/components/GameIntroScreen/` |
| Retention | `src/features/notifications/services/notificationService.ts`, `src/features/home/hooks/useUserStats.ts` |
| Monetisation | `app/premium-modal.tsx`, `src/features/subscription/`, `src/features/ads/` |
| Social | `src/features/leaderboard/`, `src/features/career-path/utils/share.ts` |
| Content | `tools/content-creator.html`, `src/features/home/config/events.ts` |
| UX/UI | `src/hooks/useFeedback.ts`, `components/Confetti` |
