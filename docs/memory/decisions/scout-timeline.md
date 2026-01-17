# Scout Timeline UI Overhaul

**Date**: 2026-01-16
**Status**: Implemented
**Files**: `src/features/career-path/components/TimelineStepRow.tsx`, `src/features/career-path/constants/timeline.ts`, `src/features/career-path/screens/CareerPathScreen.tsx`

## Context

The original Career Path game used a "Bulky Card" design with `GlassCard` wrappers for each career step. This resulted in:
- Only 4-5 steps visible on screen at once
- Heavy visual weight that distracted from information density
- Step numbers that added visual clutter without value

## Decision

Replace the card-based UI with a compact "Scout Timeline" design featuring:

### 1. TimelineStepRow Component (60px height)

**Layout Structure:**
```
[Timeline Axis 40px] [Year 80px] [Club Info flex:1]
```

**Timeline Axis:**
- 2px vertical line in `stadiumNavy` color
- 10px circular node centered on axis
- Node states:
  - **Revealed**: Solid `pitchGreen` fill
  - **Current Active**: `pitchGreen` with pulsing animation (1.0 → 1.3 → 1.0 scale, 1600ms cycle)
  - **Locked**: Hollow circle with `stadiumNavy` border only

**Year Column:**
- `BebasNeue-Regular` font at 18px
- Locked state: dimmed to 40% opacity

**Club Info Column:**
- Club name: `Montserrat` semiBold (600 weight), 16px
- Loan badge: Yellow pill inline (existing pattern)
- Optional stats (apps/goals) below in caption style
- Locked state: Gray placeholder bar (no "???" text)

### 2. Animations ("Drawing the Career")

**Line Drawing (New Step Reveal):**
- Vertical line animates from height 0 to full step height (300ms, cubic easing)
- Node appears with scale pop via spring animation

**Node Pulsing:**
- Current active step pulses continuously
- Uses `withRepeat` + `withSequence` for smooth loop
- Stops immediately when step is no longer current

**Club Slide-In:**
- Club info slides in from right (X: 20 → 0)
- Delayed 200ms after line draw starts
- Spring animation for natural feel

**Error Flash:**
- Red glow pulse around timeline node (not whole card)
- Triggers on incorrect guess for current step

### 3. Responsive Scaling

**Device Categories:**
- Small (iPhone SE, < 700pt): 52px step height
- Default (iPhone 14, 700-900pt): 60px step height
- Large (Pro Max, > 900pt): 64px step height

**Visibility Targets:**
- iPhone Pro Max: ~10 steps without scrolling
- iPhone 14 Pro: ~8-9 steps
- iPhone SE: ~6-7 steps

### 4. State Management

All existing game states preserved:
- `isRevealed`: Normal revealed state
- `isLatest`: Current active step (pulsing node)
- `isWinningStep`: Review mode - correct guess highlight
- `isMissedStep`: Review mode - lost game highlight
- `forceReveal` + `revealDelay`: Victory reveal sequence
- `isVictoryReveal`: Victory styling

New props added:
- `isFirstStep`: No line segment above
- `isLastStep`: Line continues to next if needed
- `shouldShake`: Triggers node error flash

## Consequences

### Positive
- 8-10 steps visible simultaneously (vs 4-5 before)
- Cleaner, more "data visualization" aesthetic
- Removed step numbers for tech-forward feel
- Consistent with professional timeline UIs

### Negative
- Legacy `CareerStepCard` and `LockedCard` kept for reference (not deleted)
- Stats row (apps/goals) is more compact - may be harder to read

### Files Changed
- `src/features/career-path/components/TimelineStepRow.tsx` - New component
- `src/features/career-path/constants/timeline.ts` - Responsive constants
- `src/features/career-path/screens/CareerPathScreen.tsx` - Uses TimelineStepRow
- `src/features/career-path/index.ts` - Exports new components

## Bug Fixes (2026-01-16)

### Issue 1: Auto-scroll on user input
**Problem**: List auto-scrolled to bottom when user typed incorrect guesses, pushing input out of view.
**Cause**: `scrollToEnd()` was triggered on every `revealedCount` change in `useCareerPathGame.ts`.
**Fix**: Removed the auto-scroll `useEffect` entirely. Timeline is compact enough that auto-scroll is unnecessary.

### Issue 2: Deadzone gap between list and ActionZone
**Problem**: ~156-236px gap between FlatList content and ActionZone.
**Cause**: Padding applied at two levels - `Animated.View` wrapper (140-220px) + `contentContainerStyle` (16px).
**Fix**:
- Removed `Animated.View` wrapper around FlatList
- Removed keyboard animation listeners
- Set static `paddingBottom: 160` in `contentContainerStyle` to account for ActionZone height

---

## Testing

Run on multiple device sizes:
```bash
npm run ios -- --device "iPhone SE (3rd generation)"
npm run ios -- --device "iPhone 15 Pro Max"
```

Verify:
1. Locked steps show hollow node + gray placeholder
2. Current step node pulses
3. New reveal triggers line drawing + slide-in animation
4. Incorrect guess flashes red around node
5. Victory reveal shows staggered animation
6. Review mode shows winning/missed steps correctly
