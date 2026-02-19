# Polish Sprint Testing Plan

## Prerequisites

- **Mobile**: Run `npx expo start` and open on a device/simulator
- **Web**: Run `source ~/.nvm/nvm.sh && nvm use 22 && cd web && npm run dev`

---

## Stream A: Post-Game Retention Loops

### A1+A2: TierProgressBar & StreakBadge in Result Modal

- [x] Play any game mode to completion (Quiz is fastest -- 5 questions)
- [x] On the result modal, verify:
  - [x] Streak badge appears above the tier bar (flame icon + count + "day streak") with a spring pop animation
  - [x] Tier progress bar animates from old progress to new progress after ~300ms delay
  - [x] Bar shows tier name (left, colored), "+X IQ" (right, green)
  - [x] Below the bar: "Y to [NextTierName]" text
  - [x] If streak is 0, the streak badge should NOT appear
  - [x] If no IQ was gained (e.g. replaying), the tier bar should NOT appear

### A3: Percentile in Score Distribution

- [x] Go to Stats tab, tap into any game mode that has score distribution data
- [x] Below the distribution graph, verify "Better than X% of players" text appears (green, centered)
- [x] If insufficient data, the label should not render
- [x] Percentile label has breathing room above buttons (marginBottom: 16)

### A4: Daily Complete Card

- [x] Complete all non-premium daily puzzles (or use a premium account and complete everything)
- [x] Return to home screen -- verify "ALL DONE FOR TODAY" card appears above the game list:
  - [x] Green checkmark icon
  - [x] "ALL DONE FOR TODAY" heading
  - [x] "Your streak is safe" subtitle
  - [x] "Next puzzles in Xh Ym" countdown (should tick down every minute)
- [x] As a free user, verify the card appears after completing only the free modes (not blocked by locked premium cards)

### Result Modal Layout (vertical space optimization)

- [x] Title visibly smaller (40px vs 48px)
- [x] ScoreDisplay compact (28px vs 36px), not oversized
- [x] Distribution chart tighter spacing, bars slightly shorter
- [x] Buttons not crowded by content above

### Redundant Message Removal

- [x] **Timeline**: No "X IQ . Y/5 guesses" text -- title + ScoreDisplay + TierProgressBar cover it
- [x] **Connections**: Message shows only score label ("Flawless!", "Clean!", etc.), not "X IQ . ..."

### Distribution Label Fix

- [x] **Timeline**: "1 guess", "2 guesses", "3 guesses", "4 guesses", "5 guesses" all fully visible (not truncated)
- [x] **Career Path**: "1 club", "2 clubs", etc. fully visible
- [x] **Other modes**: "5/5", "10%", etc. still right-aligned and looking normal

### CompletedGameModal Consistency

- [x] **Revisit modal**: Uses standard "SHARE RESULT" + "CLOSE" buttons (not the old custom layout with share icon)
- [x] **Review button**: If game supports review, shows "SHARE RESULT" + "REVIEW" + "CLOSE"

### Modes to Spot-Check

- [x] Timeline (5-bar chart, no message)
- [x] Connections (5-bar chart, score label message)
- [x] Career Path (variable bars, "X clubs" labels)
- [x] Top Tens (11-bar chart -- tallest, verify fits on screen)
- [x] Topical Quiz (6-bar chart, has review button)
- [x] Tic Tac Toe (no distribution, has stats row)

---

## Stream B: Premium Value Enhancement

### B1: Locked Proficiency Bars

- [ ] As a free user, go to Stats tab
- [ ] In the "Skills Breakdown" section, verify:
  - [ ] Each bar still animates its fill (you can see the shape)
  - [ ] Percentage text (e.g. "68%") is replaced with a Lock icon + PRO badge
  - [ ] "X games played" text still shows normally
- [ ] As a premium user, verify percentages show normally (no lock/badge)

### B2: Streak Freeze Indicator

- [ ] As a free user with 0 freezes: verify NO shield icon appears next to streak
- [ ] As a free user with 1+ freezes: verify green shield + freeze count appears
- [ ] As a premium user: verify green shield + infinity symbol appears
- [ ] Tap the shield -- verify tooltip appears for 2 seconds with correct message

### B3: Timeline as Pro Mode

- [ ] On home screen, find the Timeline card
- [ ] As a free user: verify it shows locked state (WATCH AD / GO PRO buttons)
- [ ] As a premium user: verify it shows normally as playable

### B4: Context-Sensitive Premium Upsell

- [ ] As a free user, complete a game where you score in the top 25%
- [ ] Below the tier progress bar, verify yellow text: "You're in the top X% today. Unlock your full skills breakdown with Pro."
- [ ] Tap the underlined text -- verify it opens the premium modal
- [ ] As a premium user, verify this text NEVER appears regardless of percentile

### Premium Modal

- [ ] Open the premium modal (tap GO PRO on any locked card)
- [ ] Verify 4 benefit rows:
  - [ ] UNLIMITED ARCHIVE ACCESS
  - [ ] AD-FREE EXPERIENCE
  - [ ] PER-MODE ACCURACY (was "Coming soon")
  - [ ] UNLIMITED STREAK PROTECTION (new)
- [ ] Verify ProBadge hero has two concentric glow circles (subtle gold halos)
- [ ] Verify green glow is centered at top (not left-aligned)

---

## Stream C: Landing Page Marketing

### C1: Post-Demo Download Hook

- [ ] Play the Career Path demo on the landing page to completion (win or lose)
- [ ] On success: verify score shows as "X / 8 CLUBS REVEALED", large store badges, "Play all 11 modes" copy
- [ ] On loss: verify similar download-focused messaging with score

### C2: Hero Copy

- [ ] Verify subtitle reads: "Daily football puzzles that sort the real fans from the tourists..."
- [ ] On desktop (>768px): verify QR code placeholder appears below CTA buttons with "Scan to download"
- [ ] On mobile: verify QR code is hidden

### C3: SocialProofStrip

- [ ] Below the hero, verify three proof points:
  - [ ] "11 MODES / Something new every day"
  - [ ] "7-DAY ARCHIVE / Miss one? Play the last week free"
  - [ ] "DAILY / Fresh puzzles at midnight"

### C4: GameModeGrid

- [ ] Scroll to game modes section
- [ ] Verify heading: "11 GAME MODES"
- [ ] Verify NO "BETA" badges on any card
- [ ] Verify Timeline shows a crown/premium badge (not BETA)
- [ ] Verify The Grid, The Chain, Threads show "PLAY ANYTIME" schedule
- [ ] Verify Timeline shows "TUE, THU & SAT"

### C5: Closing CTA

- [ ] Scroll to bottom, just above Footer
- [ ] Verify "READY TO PROVE IT?" section with:
  - [ ] "Every day. 11 puzzles. One leaderboard."
  - [ ] Both App Store and Google Play buttons
- [ ] Verify both links open correct store URLs

### C6: ShareCardPreview

- [ ] Find the share card section
- [ ] Verify copy: "Every mode generates a score card. One tap and it's in the group chat. No spoilers -- just your score, your tier, and enough context to make your mates want to play."
- [ ] Verify no duplicate/redundant paragraph below it

---

## Stream D: Visual Polish

### D1: GlassGameCard Press Animation

- [ ] On home screen, press and hold any game card
- [ ] Verify it translates down slightly (2px) with a spring -- NOT scale/opacity
- [ ] Verify haptic feedback on press
- [ ] On locked cards: verify WATCH AD and GO PRO buttons also have translateY press animation + haptics

### D2: Settings Profile Card

- [ ] Go to Settings
- [ ] Verify avatar has green gradient background (brighter at top, fading down)
- [ ] Verify avatar has solid green border (2px, full opacity)
- [ ] Verify tier badge below name has slightly larger text/padding than before
- [ ] Verify card corners are more rounded (16px)

### D3: PremiumUpsellContent Hero Glow

(covered in B4/Premium Modal section above)

### D4: Settings Toggle Rows

- [ ] In Settings, scroll to Notifications and Haptic Feedback toggle rows
- [ ] Verify both rows have an icon in a container on the left (Bell for notifications, Smartphone for haptics)
- [ ] Verify both rows have identical visual structure

### D5: ProfileHeader (Stats Screen)

- [ ] Go to Stats tab
- [ ] Verify avatar shows your initial letter (not a generic User icon)
- [ ] Verify avatar is larger than before (~68px)
- [ ] Verify tier badge appears below "Member since" date (colored text matching your tier)
- [ ] As a premium user: verify gold ring border on avatar + small PRO badge overlaid at bottom-right of avatar (not inline next to name)
