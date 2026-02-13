# Bug Fix & Feature Sprint — Confetti, First-Game Welcome, Notification Timing, Back Button

## Context

We're building **Football IQ**, a React Native (Expo) trivia app. We recently added celebration modals (FirstWinCelebration, TierLevelUpCelebration, PerfectDayCelebration) and a first-game tutorial flow. Several bugs remain. **Deploy multiple sub-agents in parallel** where tasks are independent.

### How to see what changed
Run `git diff HEAD` to see all uncommitted changes on the `app-optimisations` branch. This shows every file touched for the engagement features sprint.

---

## Bug 1: Confetti not visible on ANY celebration modal

**Priority: HIGH**

### Symptoms
- FirstWinCelebration, TierLevelUpCelebration, and PerfectDayCelebration all show their card + buttons correctly
- Confetti component renders (confirmed via React DevTools) but is **not visible on screen**
- The `<Confetti>` component works in isolation — it uses `absoluteFillObject` + `zIndex: 1000`

### What we already tried (didn't fix it)
1. Moved `<Confetti>` to render AFTER the content in JSX (last child of overlay `<View>`)
2. Changed the content wrapper from `<Animated.View entering={FadeIn.duration(200)}>` to a plain `<View>` to avoid Reanimated creating a native layer above confetti

### Files to investigate
- `@src/components/Confetti.tsx` — The confetti component itself. Uses `Animated.View` pieces with `position: 'absolute'`, container has `absoluteFillObject` + `zIndex: 1000`
- `@src/features/stats/components/TierLevelUpCelebration.tsx` — Uses `<Modal>` > `<View style={overlay}>` > `<View style={container}>` content + `<Confetti>`
- `@src/features/notifications/components/PerfectDayCelebration.tsx` — Same structure
- `@src/features/notifications/components/FirstWinCelebration.tsx` — Same structure

### Key questions to investigate
- Is the React Native `<Modal>` component creating its own native view hierarchy that prevents `zIndex` from working?
- Does `pointerEvents="none"` on the Confetti container affect visibility?
- Could `overflow: 'hidden'` on any parent be clipping the confetti pieces?
- Are the confetti animation values (`progress`, `translateY`) actually changing? The pieces start at `translateY: -50` — are they animating downward?
- Is the `useMemo` with `active` as dependency correctly generating pieces, or does the timing of `setShowConfetti(true)` (200ms delay) cause a rendering issue?

### Suggested approach
1. Add temporary `backgroundColor: 'rgba(255,0,0,0.3)'` to the Confetti container to check if it's visible and positioned correctly
2. Check if the confetti pieces are animating or stuck at their initial position
3. Try rendering Confetti OUTSIDE the `<Modal>` using a portal pattern, or render it as a sibling with absolute positioning
4. Consider if `<Modal>` needs a specific `supportedOrientations` or `statusBarTranslucent` prop

---

## Bug 2: Notification permission modal appears DURING first game

**Priority: HIGH**

### Symptoms
- User opens app for the first time → completes onboarding (enters display name) → gets routed to Career Path (`/career-path?tutorial=true`)
- The notification permission modal immediately appears OVER the game before the user has even played
- User should NOT see ANY notification modals until AFTER they finish their first game

### Root cause analysis
In `@src/features/notifications/context/NotificationContext.tsx`:
- Lines 213-246: The permission prompt is queued when `pendingPermissionPrompt.current = true`
- Lines 237-246: It waits for `isOnboardingActive === false` then shows after 1.5s delay
- **Problem**: `isOnboardingActive` becomes `false` as soon as the FirstRunModal completes (display name entered), which happens BEFORE the user starts/finishes their first game
- The 1.5s delay is not enough — the user is now in the Career Path game screen and the permission modal pops up over it

### Files to investigate
- `@src/features/notifications/context/NotificationContext.tsx` — Permission prompt timing logic (lines 210-250)
- `@src/features/notifications/components/NotificationWrapper.tsx` — Modal rendering, `isOnboardingActive` gate
- `@src/features/auth/context/OnboardingContext.tsx` — `isOnboardingActive` state machine, `isTutorialComplete`

### Fix approach
The notification permission modal should be deferred until AFTER the user completes their first game. Options:
- Gate the permission prompt on `totalGamesPlayed > 0` (user has completed at least one game)
- OR gate on `isTutorialComplete === true` (tutorial flow is done)
- Ensure the 1.5s delay timer only starts after the gate condition is met

---

## Feature 3: Replace tutorial with GameIntroScreen welcome

**Priority: MEDIUM**

### Current behavior
- After onboarding (display name), user is routed to `/career-path?tutorial=true`
- A `TutorialOverlay` appears with step-by-step tooltips pointing at UI elements
- This is unnecessary — Career Path is an easy, intuitive game

### Desired behavior
- **Remove the tutorial overlay entirely** from the first-game flow
- Instead, if it's the user's first game (right after opening the app), show the standard `GameIntroScreen` component as a welcome
- The `GameIntroScreen` already exists and shows game rules + a "Start Game" button
- Currently, `GameIntroScreen` is SKIPPED during tutorial mode (line 393: `if (shouldShowIntro && !isTutorialMode)`)
- We want the opposite: ALWAYS show the `GameIntroScreen` for first-time users, and REMOVE the tutorial overlay

### Files to modify
- `@src/features/career-path/screens/CareerPathScreen.tsx`:
  - Remove `TutorialOverlay` usage and related state (`tutorialVisible`, `tutorialSteps`, `handleTutorialComplete`)
  - Change the intro screen logic: show `GameIntroScreen` for first-time users regardless of tutorial mode
  - When `GameIntroScreen` completes (onStart), call both `completeIntro()` AND `completeTutorial()`
- `@src/features/auth/context/OnboardingContext.tsx`:
  - The `handlePostOnboardingNavigation` still routes to `/career-path?tutorial=true` — this can stay (the param just marks it as the first-game flow) OR we can simplify by removing the tutorial param
- `@src/features/puzzles/components/GameIntroScreen/GameIntroScreen.tsx` — Read only, no changes needed. Already has the right UX.

### What NOT to do
- Do NOT remove the `GameIntroModal` (help button modal) — that's separate and still useful
- Do NOT change the `PuzzleOnboardingProvider` or `useOnboarding` hook — those track per-game-mode intro screens correctly

---

## Bug 4: Back button broken on first game (no history)

**Priority: MEDIUM**

### Symptoms
- User completes onboarding → routed to `/career-path?tutorial=true` via `router.replace()`
- This is the FIRST route in the navigation stack (no history)
- The back button / `router.back()` has nowhere to go → crashes or does nothing
- Same issue in the GameResultModal's close button (`onClose={() => router.back()}`)

### Files to investigate
- `@src/features/career-path/screens/CareerPathScreen.tsx`:
  - Line 281: `handleBackToHome` calls `router.back()`
  - Line 498: Review mode close calls `router.back()`
  - Line 584: GameResultModal close calls `router.back()`

### Fix approach
- Use `router.canGoBack()` to check if there's history
- If no history, use `router.replace('/(tabs)')` to navigate home instead
- Apply this fix to ALL instances of `router.back()` in CareerPathScreen:
  ```typescript
  const handleBackToHome = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);
  ```
- Apply the same pattern to the GameResultModal `onClose` and ReviewMode `onClose`

---

## Execution Strategy

**Deploy sub-agents in parallel:**

1. **Agent A — Confetti Investigation & Fix**: Deep-dive into why confetti is invisible. Read the Confetti component, the Modal structure, and test various z-index/positioning approaches. This is the most investigative task.

2. **Agent B — Notification Timing + Back Button**: Fix the permission modal appearing during the first game (gate on `totalGamesPlayed > 0`). Also fix the `router.back()` crash when there's no history (use `canGoBack()` guard). These are in related code paths.

3. **Agent C — Replace Tutorial with GameIntroScreen**: Remove `TutorialOverlay` from CareerPathScreen, ensure `GameIntroScreen` shows for first-time users, wire up `completeTutorial()` on intro completion.

After all agents complete, run `npx jest --passWithNoTests` to verify no regressions.
