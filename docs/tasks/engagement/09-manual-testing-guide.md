# Manual Testing Guide: Engagement Features (Phase 1)

**Target Audience:** QA Testers, Developers
**Last Updated:** February 2026
**Scope:** Features 1-6 from engagement improvement implementation

---

## Feature 1: Tier Level-Up Celebration

### How to Trigger

The tier system has 10 levels based on cumulative IQ. Crossing any threshold triggers the celebration.

**Tier Thresholds:**
| Tier | Name | Min IQ | Test Strategy |
|------|------|--------|---------------|
| 1 | Trialist | 0 | Starting tier (no celebration) |
| 2 | Youth Team | 25 | Play 3-5 easy games from fresh install |
| 3 | Reserve Team | 100 | Continue playing (~10-15 games total) |
| 4 | Impact Sub | 250 | ~25-30 games total |
| 5 | Rotation Player | 500 | ~50-60 games total |
| 6 | First Team Regular | 1000 | Extended testing or mock data |
| 7 | Key Player | 2000 | Mock data recommended |
| 8 | Club Legend | 4000 | Mock data recommended |
| 9 | National Treasure | 8000 | Mock data recommended |
| 10 | GOAT | 20000 | Mock data recommended |

**Quick Test:**

1. Fresh install or clear app data
2. Complete BriefingScreen onboarding
3. Play 3-5 Career Path puzzles (score well: 8-10/10 per game)
4. After 3rd-5th game, you should cross the 25 IQ threshold and see the celebration

**Using Mock Data (Advanced):**

```typescript
// In NotificationContext.tsx or test environment
// Manually set totalIQ to 99 via Supabase or mock
// Complete one game (earns 8-12 IQ)
// Should trigger Reserve Team celebration at 100 IQ
```

### Verification Checklist

- [x] **Modal Appearance:** Full-screen modal appears immediately after game result modal
- [ ] **Confetti Animation:** Confetti bursts from top of screen (green/gold particles)
- [x] **Tier Colors:** Modal accent color matches tier (Trialist=gray, Youth Team=gray, Reserve Team=blue, Impact Sub=green, etc.)
- [x] **Tier Badge:** TrendingUp icon visible with tier color, animates scale 0 → 1.2 → 1.0 on entrance
- [x] **Title:** "LEVEL UP!" in tier-specific color
- [x] **Subtitle:** "You've reached {TierName}!" (e.g., "You've reached Reserve Team!")
- [x] **Stats Display:** Shows total IQ count (e.g., "127 IQ")
- [x] **Share Button:** Green elevated button labeled "SHARE YOUR ACHIEVEMENT"
- [x] **Continue Link:** Pressable text link "Continue" below share button
- [ x **Haptic Pattern:** Fires Heavy → Success → Success → Heavy sequence on modal open (must have device haptics enabled)
- [ ] **Share Functionality:**
  - [ ] Tapping "SHARE YOUR ACHIEVEMENT" captures modal as image
  - [ ] Native share sheet appears with image + message: "Just reached {TierName} on Football IQ! {totalIQ} IQ and climbing!"
  - [ ] Share completes successfully (test with Messages, Notes, or Cancel)
- [x] **Analytics Event:** PostHog event `tier_level_up` fires with properties:
  - `new_tier`: string (e.g., "Reserve Team")
  - `new_tier_number`: number (e.g., 3)
  - `total_iq`: number (e.g., 127)
- [x] **AsyncStorage Guard:** Modal does NOT show twice for same tier (stored as `@tier_up_shown_{tierNumber}`)
  - Test: Force close app after seeing celebration, reopen → should not show again
- [ ] **Priority System:** If tier-up AND first win happen simultaneously, first win takes precedence
- [ ] **No TypeScript Errors:** No red console errors or type violations

---

## Feature 2: Streak Freeze Economy

### How to Trigger

**Initial Freeze:**

1. Fresh install
2. Complete onboarding
3. Check StreakHeader: should show shield icon (🛡️) next to streak count
4. AsyncStorage should have `@streak_freeze_count` = "1"

**Consuming a Freeze:**

1. Build a 3+ day streak (play at least 1 game per day for 3 consecutive days)
2. On day 4, do NOT play any games
3. On day 5, open app and play a game
4. Streak should remain intact (e.g., 3 days → 4 days) instead of resetting to 1
5. Available freezes should decrease by 1 (from 1 → 0)

**Earning Freezes (7-Day Milestones):**

1. Build a 7-day streak
2. On day 7, complete a game
3. Available freezes should increase by 1 (max 3 for free users)
4. Repeat at days 14, 21, 28, etc.

**Premium Unlimited Freezes:**

1. Purchase premium subscription
2. Build a streak, skip multiple days in a row
3. Streak should never break regardless of gaps

### Verification Checklist

**Initial State:**

- [ ] **Initial Freeze Granted:** New users start with 1 freeze (`@streak_freeze_count` = "1")
- [ ] **Shield Icon Visible:** StreakHeader shows ShieldCheck icon next to streak count when freezes > 0
- [ ] **Shield Tap:** Tapping shield shows tooltip: "You have 1 streak freeze"

**Auto-Consume Behavior:**

- [ ] **Gap Detection:** Missing exactly 1 day triggers auto-consume
- [ ] **Streak Continuity:** Streak continues across freeze-protected gap (e.g., play Mon/Tue/Wed → skip Thu → play Fri = 5-day streak, not reset to 1)
- [ ] **Freeze Decrement:** Available freezes count decreases by 1 after consumption
- [ ] **Used Dates Recorded:** AsyncStorage `@streak_freeze_used_dates` contains the skipped date in YYYY-MM-DD format
- [ ] **Shield Icon Disappears:** When freezes reach 0, shield icon hidden

**Milestone Awards:**

- [ ] **7-Day Milestone:** Reaching 7-day streak awards +1 freeze
- [ ] **14-Day Milestone:** Reaching 14-day streak awards another +1 freeze
- [ ] **Max Cap:** Free users cannot exceed 3 freezes in inventory (awards stop)
- [ ] **Last Milestone Tracking:** AsyncStorage `@streak_freeze_last_milestone` updates correctly

**Premium Users:**

- [ ] **Unlimited Freezes:** Premium users can skip indefinitely without breaking streak
- [ ] **No Inventory Deduction:** Premium freeze uses don't consume from inventory
- [ ] **Shield Icon:** Still shows shield icon with "Unlimited" indicator

**At-Risk Indicator (Integration with Feature 4):**

- [ ] **No Freeze + At Risk:** After 20:00 with 0 plays and 0 freezes → HomeHeader shows red "X day streak at risk!"
- [ ] **Has Freeze + At Risk:** After 20:00 with 0 plays but freeze available → HomeHeader shows blue "Protected by streak freeze"

**Analytics:**

- [ ] **STREAK_FREEZE_USED Event:** Fires when freeze is auto-consumed
  - `streak_length`: number (e.g., 5)
  - `freeze_source`: 'earned' | 'initial' | 'premium'
- [ ] **STREAK_FREEZE_EARNED Event:** Fires when milestone freeze is awarded
  - `streak_milestone`: number (e.g., 7, 14, 21)
  - `total_freezes`: number (current inventory after award)

**Edge Cases:**

- [ ] **Multiple Gaps:** Skipping 2+ consecutive days only consumes 1 freeze (for the first gap), streak breaks on second gap
- [ ] **Same-Day Re-Check:** Streak calculation is consistent across app restarts on the same day

---

## Feature 3: Guided First Game Tutorial

### How to Trigger

**Fresh Install:**

1. Uninstall app completely
2. Reinstall and open
3. Complete BriefingScreen (enter display name, tap "START YOUR CAREER")
4. Should auto-navigate to today's Career Path puzzle (instead of home screen)
5. Tutorial overlay appears with 3 steps

**Clear AsyncStorage (Dev):**

```typescript
AsyncStorage.removeItem("@tutorial_completed");
AsyncStorage.removeItem("@app_onboarding_completed");
// Restart app, go through onboarding again
```

### Verification Checklist

**Navigation:**

- [ ] **Auto-Navigate to Career Path:** After BriefingScreen submit, app navigates directly to Career Path puzzle (not home screen)
- [ ] **Skip GameIntroScreen:** GameIntroScreen (rules modal) does NOT appear during tutorial flow
- [ ] **Fallback:** If no Career Path puzzle available for today, gracefully navigates to home screen and marks tutorial as complete

**Tutorial Overlay:**

- [ ] **Overlay Renders:** Semi-transparent dark overlay appears over game screen
- [ ] **Step Counter:** Shows "1/3", "2/3", "3/3" in corner or tooltip
- [ ] **Tap to Continue Hint:** Each tooltip shows "Tap to continue" or similar hint

**Step 1: Clue Highlight**

- [ ] **Text Content:** "This is your first clue. A club from the player's career!"
- [ ] **Positioning:** Tooltip positioned near the revealed clue area (top ~30% of screen)
- [ ] **Dismissal:** Tapping anywhere on screen dismisses step 1 and advances to step 2

**Step 2: Search Input**

- [ ] **Text Content:** "Search for the player you think it is"
- [ ] **Positioning:** Tooltip positioned near the search input (~60% from top)
- [ ] **Dismissal:** Tapping anywhere dismisses and advances to step 3

**Step 3: Submit Button**

- [ ] **Text Content:** "Submit your guess! Don't worry, wrong guesses reveal more clues"
- [ ] **Positioning:** Tooltip positioned near submit/guess button (~75% from top)
- [ ] **Dismissal:** Tapping anywhere dismisses tutorial, overlay disappears

**Post-Tutorial:**

- [ ] **Normal Gameplay:** After step 3 dismisses, user can play the puzzle normally
- [ ] **Persistence:** AsyncStorage `@tutorial_completed` = "true"
- [ ] **No Re-Show:** Restarting app or completing onboarding again does NOT show tutorial again
- [ ] **OnboardingContext:** `isTutorialComplete` returns true after completion

**Animations:**

- [ ] **Entrance:** Overlay fades in with smooth animation
- [ ] **Step Transitions:** Tooltips animate smoothly between steps (fade out/in or slide)

---

## Feature 4: Dynamic Streak Warning

### How to Trigger

**At-Risk Conditions (ALL must be true):**

1. User has an active streak (currentStreak > 0)
2. User has played 0 games today (gamesPlayedToday === 0)
3. Current local time is after 20:00 (8:00 PM)

**Setup:**

1. Build a 3+ day streak (play 1 game per day for 3 days)
2. On day 4, do NOT play any games
3. Wait until after 20:00 local time (or mock device time)
4. Open app and check HomeHeader

**Quick Test (Time Mock):**

- Change device system time to 21:00 (9:00 PM)
- Open app with active streak and 0 plays today
- Warning should appear immediately

### Verification Checklist

**At-Risk State (Red/Amber):**

- [ ] **Pill Color Change:** Streak pill in HomeHeader turns red background (`rgba(239, 68, 68, 0.2)`) with red text (`#EF4444`)
- [ ] **Text Content:** Shows "X day streak at risk! Nh left" (e.g., "5 day streak at risk! 3h left")
- [ ] **Hours Countdown:** Hours remaining updates correctly (24 - currentHour)
  - At 20:00 → "4h left"
  - At 22:00 → "2h left"
  - At 23:00 → "1h left"
- [ ] **Pulsing Animation:** Red pill pulses opacity 0.7 ↔ 1.0 in 1.5s loop

**Normal State (Before 20:00 or After Game):**

- [ ] **Default Streak Display:** Shows "🔥 X" (fire emoji + streak count) in normal pitch green style
- [ ] **No Pulse:** No pulsing animation

**Dismissal Conditions:**

- [ ] **After Completing Game:** Warning disappears immediately after user completes any game
- [ ] **Before 20:00:** Warning does NOT appear before 20:00 even with 0 plays
- [ ] **No Active Streak:** Warning does NOT appear if currentStreak === 0

**Polling/Re-Check:**

- [ ] **60-Second Interval:** Hook re-evaluates every 60 seconds (hours countdown updates live)
- [ ] **App Foregrounding:** When app returns from background, warning state re-checks immediately

**Integration with Freeze:**

- [ ] **Freeze Available:** If user has freeze available, shows "Protected by streak freeze" in blue instead of at-risk warning
- [ ] **No Freeze:** If user has 0 freezes, shows red at-risk warning

---

## Feature 5: Haptics Toggle

### How to Trigger

1. Open app
2. Navigate to Settings screen (Profile tab → Settings icon or Settings tab)
3. Scroll to "PREFERENCES" section
4. Toggle "Haptic Feedback" switch

### Verification Checklist

**Settings UI:**

- [ ] **Toggle Exists:** "Haptic Feedback" row appears in PREFERENCES section
- [ ] **Default State:** Toggle is ON by default on fresh install
- [ ] **Switch Component:** Uses native Switch component (iOS/Android appropriate styling)
- [ ] **Label:** Clear label text "Haptic Feedback"

**Toggle Behavior:**

- [ ] **ON → OFF:** Tapping switch changes from green (ON) to gray (OFF)
- [ ] **OFF → ON:** Tapping again changes back to green (ON)
- [ ] **Persistence:** AsyncStorage `@haptics_enabled` stores state ("true" or "false")
- [ ] **Restart Persistence:** Closing and reopening app preserves toggle state

**Haptic Gating (ON State):**

- [ ] **Game Haptics:** Complete a game with correct/wrong answers → haptics fire
- [ ] **Tier Level-Up:** Trigger tier celebration → Heavy-Success-Success-Heavy pattern fires
- [ ] **First Win:** Trigger first win celebration → haptic pattern fires
- [ ] **Perfect Day:** Trigger perfect day celebration → haptic pattern fires
- [ ] **Success/Error in Games:** Correct answer = success haptic, wrong answer = error haptic

**Haptic Gating (OFF State):**

- [ ] **No Game Haptics:** Complete a game with correct/wrong answers → NO haptics
- [ ] **No Celebration Haptics:** Tier/first win/perfect day → NO haptics
- [ ] **All Haptics Disabled:** No haptic feedback anywhere in app

**Affected Hooks:**

- [ ] **useFeedback:** Checks `@haptics_enabled` and gates all trigger functions
- [ ] **useHaptics:** Direct haptic calls also check the setting (if using raw haptics lib)

**Edge Case:**

- [ ] **Mid-Game Toggle:** If user disables haptics mid-game, subsequent actions in that session respect new setting

---

## Feature 6: First Win Celebration

### How to Trigger

**Fresh Install:**

1. Uninstall app completely
2. Reinstall, complete BriefingScreen onboarding
3. Complete your very first puzzle (any game mode)
4. After standard result modal dismisses, first win celebration appears

**Clear AsyncStorage (Dev):**

```typescript
AsyncStorage.removeItem("@first_win_celebrated");
// Complete a game (must be totalGamesPlayed transitioning from 0 → 1)
```

**Note:** The celebration triggers when `totalGamesPlayed` changes from 0 to 1+, not on AsyncStorage check alone.

### Verification Checklist

**Modal Appearance:**

- [ ] **Timing:** Appears AFTER the standard game result modal dismisses (not simultaneously)
- [ ] **Full-Screen:** Modal covers entire screen with dark overlay
- [ ] **Confetti:** Confetti animation bursts from top (green particles)

**Content:**

- [ ] **Icon:** PartyPopper or Trophy icon visible with pitch green color
- [ ] **Title:** "YOU'RE A NATURAL!" in pitch green (`colors.pitchGreen`)
- [ ] **Subtitle:** "You completed your first puzzle!"
- [ ] **Stats Display:** Shows score earned (e.g., "8/10") or "Welcome to Football IQ"
- [ ] **Footer:** "football-iq.app" branding at bottom

**Actions:**

- [ ] **Share Button:** Green elevated button labeled "SHARE YOUR FIRST SCORE"
- [ ] **Continue Link:** Pressable text link "Continue" below share button
- [ ] **Close Button:** X icon in top-right corner dismisses modal
- [ ] **Share Functionality:**
  - [ ] Tapping share captures card as image via ViewShot
  - [ ] Native share sheet opens with message: "Just completed my first Football IQ puzzle! Think you can beat my score?"
  - [ ] Share completes successfully

**Haptic Pattern:**

- [ ] **Fires on Open:** `triggerPerfectDay()` haptic pattern (or similar celebration pattern)
- [ ] **Respects Toggle:** No haptic if haptics disabled in settings

**Analytics:**

- [ ] **FIRST_WIN_CELEBRATED Event:** Fires in PostHog with properties:
  - `game_mode`: string (optional, e.g., "Career Path")
  - `score`: number (optional, e.g., 8)

**AsyncStorage Guard:**

- [ ] **No Duplicate Shows:** Modal only appears once, even if app restarts
- [ ] **Key Stored:** `@first_win_celebrated` = "true" after first show

**Priority System:**

- [ ] **Does Not Conflict with Perfect Day:** If first game completes all daily puzzles (extremely rare), Perfect Day celebration takes precedence
- [ ] **Does Not Conflict with Tier-Up:** If first game also triggers tier-up, tier-up may show first (test both scenarios)

**Edge Case:**

- [ ] **Tutorial + First Win:** If user completes tutorial game as first game, celebration should still fire after tutorial completes

---

## Quick Smoke Test Checklist

Use this rapid 10-minute test to verify all features are working:

- [ ] **Fresh Install:** Uninstall and reinstall app
- [ ] **Onboarding → Tutorial:** Complete BriefingScreen, auto-navigate to Career Path, see 3-step tutorial
- [ ] **First Win Celebration:** Complete first puzzle, see "YOU'RE A NATURAL!" modal
- [ ] **Tier Level-Up:** Complete 2-3 more games, cross 25 IQ threshold, see "LEVEL UP!" modal for Youth Team
- [ ] **Initial Freeze:** Check StreakHeader, confirm shield icon visible (1 freeze available)
- [ ] **Haptics Toggle:** Go to Settings → PREFERENCES → toggle Haptic Feedback OFF → complete a game → no haptics
- [ ] **Streak At-Risk:** Mock device time to 21:00 with 0 plays today → see red warning in HomeHeader
- [ ] **Share Functionality:** Test share button in any celebration modal → native sheet opens
- [ ] **PostHog Events:** Open PostHog dashboard, verify events: `first_win_celebrated`, `tier_level_up`, `onboarding_completed`

---

## AsyncStorage Keys Reference

All new AsyncStorage keys introduced by these features:

| Key                              | Type                    | Purpose                                                                  | Feature               |
| -------------------------------- | ----------------------- | ------------------------------------------------------------------------ | --------------------- |
| `@haptics_enabled`               | string ("true"/"false") | Haptic feedback toggle state (default: "true")                           | Haptics Toggle        |
| `@tutorial_completed`            | string ("true")         | Marks guided tutorial as completed                                       | First Game Tutorial   |
| `@first_win_celebrated`          | string ("true")         | Prevents duplicate first win celebrations                                | First Win Celebration |
| `@tier_up_shown_{tierNumber}`    | string ("true")         | Prevents duplicate tier celebrations (e.g., `@tier_up_shown_3`)          | Tier Level-Up         |
| `@streak_freeze_count`           | string (number)         | Number of available streak freezes (0-3 for free, unlimited for premium) | Streak Freeze         |
| `@streak_freeze_used_dates`      | JSON array              | Array of YYYY-MM-DD dates where freezes were used                        | Streak Freeze         |
| `@streak_freeze_last_milestone`  | string (number)         | Last milestone where freeze was awarded (7, 14, 21, etc.)                | Streak Freeze         |
| `@streak_freeze_initial_granted` | string ("true")         | Flag to ensure initial freeze is only granted once                       | Streak Freeze         |

**Testing Tip:** Use React Native Debugger or `npx react-native-async-storage` to inspect/clear keys during testing.

---

## PostHog Analytics Events Reference

All new analytics events with their properties:

### `tier_level_up`

Fired when user crosses a tier threshold.

```typescript
{
  new_tier: string; // "Reserve Team"
  new_tier_number: number; // 3
  total_iq: number; // 127
}
```

### `first_win_celebrated`

Fired when first win celebration modal is shown.

```typescript
{
  game_mode?: string;   // "Career Path" (optional)
  score?: number;       // 8 (optional)
}
```

### `streak_freeze_used`

Fired when a freeze is auto-consumed to preserve streak.

```typescript
{
  streak_length: number; // 5
  freeze_source: "earned" | "initial" | "premium"; // 'initial'
}
```

### `streak_freeze_earned`

Fired when user earns a freeze at 7-day milestone.

```typescript
{
  streak_milestone: number; // 7
  total_freezes: number; // 2
}
```

**Verification:** Open PostHog dashboard → Events → filter by event name → check properties match expected schema.

---

## Known Limitations and Edge Cases

1. **Tier Celebration Timing:** If multiple games are completed rapidly (e.g., in archive), only the first tier-up shows. Subsequent tier-ups require app restart or wait for context re-check.

2. **Tutorial Fallback:** If no Career Path puzzle exists for today (extremely rare), tutorial is skipped and user goes to home screen. This is expected behavior.

3. **Streak Freeze Multiple Gaps:** Only the first 1-day gap is protected by a freeze. A 2+ day gap will break the streak even with freezes available.

4. **Haptics Platform Differences:** iOS haptics are more nuanced than Android. Test patterns on both platforms for consistency.

5. **Time Zone Edge Cases:** Streak at-risk uses local device time. Changing time zones mid-day may cause unexpected behavior (by design, we use local time).

6. **Premium Freeze Icon:** Premium users always see shield icon even with "unlimited" freezes, which may be confusing. Consider UX improvement in future.

---

## Troubleshooting

**Issue: Tier celebration doesn't appear**

- Check AsyncStorage for `@tier_up_shown_{tierNumber}` — may have already been shown
- Verify `totalIQ` actually crossed threshold (check Supabase `profiles.total_iq`)
- Check NotificationContext logs for tier detection logic

**Issue: Tutorial doesn't trigger**

- Verify `@tutorial_completed` is not set (clear AsyncStorage)
- Ensure Career Path puzzle exists for today (check PuzzleContext)
- Check navigation logs for auto-navigate behavior

**Issue: Haptics don't work**

- Verify device has haptics enabled (system settings)
- Check `@haptics_enabled` is "true" in AsyncStorage
- iOS Simulator does not support haptics (test on device)

**Issue: Streak freeze not consuming**

- Check `@streak_freeze_count` is > 0
- Verify gap is exactly 1 day (not 2+)
- Check `@streak_freeze_used_dates` array for duplicate entries

**Issue: PostHog events not firing**

- Verify PostHog initialized (check logs for PostHog API key)
- Ensure events are not mocked (check `jest-setup.ts`)
- Events may be batched — wait 30s or force flush

---

**End of Testing Guide**

For implementation details, see individual task files:

- `01-tier-levelup-celebration.md`
- `02-streak-freeze-economy.md`
- `03-guided-first-game.md`
- `04-dynamic-streak-warning.md`
- `05-comprehensive-haptics.md`
- `06-first-win-celebration.md`
