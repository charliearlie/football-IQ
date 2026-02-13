# Task 3: Guided First Game Tutorial

## Context
The current onboarding flow (BriefingScreen) shows all 11 game modes at once and dumps the user on the home screen with no guidance on what to play first. First-time users may pick a hard mode and have a bad experience. A guided tutorial auto-navigates to an easy Career Path puzzle with overlay tooltips.

## Requirements

### Tutorial Flow
1. User completes BriefingScreen (enters display name, taps "START YOUR CAREER")
2. Instead of navigating to home screen, navigate directly to today's Career Path puzzle
3. Skip the GameIntroScreen for Career Path during tutorial (user already saw schedule)
4. Show a 3-step tooltip overlay guiding the user through the gameplay:
   - Step 1: Points at the revealed clue — "This is your first clue. A club from the player's career!"
   - Step 2: Points at the search input — "Search for the player you think it is"
   - Step 3: Points at the submit/guess button — "Submit your guess! Don't worry, wrong guesses reveal more clues"
5. Each tooltip dismisses on tap, advances to next step
6. After step 3 dismisses, user plays normally
7. Track completion via AsyncStorage `@tutorial_completed`

### TutorialOverlay Component
- Transparent overlay with semi-opaque backdrop
- Spotlight/cutout effect around target element (optional, can be simple arrow + tooltip)
- Tooltip positioned relative to target (above or below with arrow)
- Tooltip has: text content + "Tap to continue" hint + step counter (1/3, 2/3, 3/3)
- Animated entrance (FadeIn + slide)
- Each step auto-advances on tap anywhere

### Integration Points
- BriefingScreen `onSubmit`: After successful name save, check if Career Path puzzle exists for today, navigate to it
- OnboardingContext: Add `isTutorialComplete` boolean + `completeTutorial()` callback
- Career Path screen: Conditionally render TutorialOverlay when `!isTutorialComplete`
- GameIntroScreen: Skip display when coming from tutorial flow (check a navigation param or context flag)

## Files to Create
- `src/features/auth/components/TutorialOverlay.tsx` — Tooltip overlay component:
  ```typescript
  interface TutorialStep {
    text: string;
    position: 'top' | 'bottom';
    targetY: number; // approximate Y position for arrow
  }

  interface TutorialOverlayProps {
    steps: TutorialStep[];
    onComplete: () => void;
    visible: boolean;
  }
  ```

## Files to Modify
- `src/features/auth/context/OnboardingContext.tsx` — Add:
  ```typescript
  // New context values:
  isTutorialComplete: boolean;
  completeTutorial: () => void;
  // AsyncStorage key: '@tutorial_completed'
  ```
- `src/features/auth/components/BriefingScreen.tsx` — Modify `handleSubmit`:
  - After successful name save + onboarding completion
  - Navigate to Career Path: `router.replace('/career-path/{todaysPuzzleId}')`
  - Pass `tutorial=true` as a search param
- Career Path screen (likely `app/career-path/[puzzleId].tsx`) — Add:
  - Check `isTutorialComplete` from OnboardingContext
  - If not complete, render TutorialOverlay with 3 steps
  - On TutorialOverlay complete, call `completeTutorial()`
- `src/features/puzzles/components/GameIntroScreen/GameIntroScreen.tsx` — Add check:
  - If navigation param `tutorial=true` or `!isTutorialComplete`, skip showing intro

## Key Implementation Notes

### Navigation from BriefingScreen
The BriefingScreen currently calls `onSubmit()` which is handled by the parent. The post-onboarding navigation happens in the auth flow. We need to:
1. After onboarding completes, find today's Career Path puzzle ID from PuzzleContext
2. Use `router.replace()` to navigate directly to it
3. The home screen will still load in the background (it's a tab)

### Tooltip Positioning
For simplicity, use fixed Y positions based on the Career Path screen layout:
- Step 1 (clue area): roughly 30% from top
- Step 2 (search input): roughly 60% from top
- Step 3 (submit button): roughly 75% from top

These don't need to be pixel-perfect — approximate positions with arrows work well for tutorials.

### Fallback
If no Career Path puzzle exists for today (edge case), skip the tutorial and go to home screen normally. Set `@tutorial_completed` to avoid showing it later.

## Acceptance Criteria
- [ ] After BriefingScreen submit, user navigates to Career Path (not home screen)
- [ ] 3-step tooltip overlay guides user through the game UI
- [ ] Each tooltip dismisses on tap and advances to next step
- [ ] After step 3, overlay disappears and user plays normally
- [ ] GameIntroScreen is skipped during tutorial flow
- [ ] Tutorial state persisted in AsyncStorage (doesn't show again)
- [ ] OnboardingContext exposes `isTutorialComplete` and `completeTutorial()`
- [ ] If no Career Path puzzle available, gracefully falls back to home screen
- [ ] No TypeScript errors

## Agent Assignment
- **Primary**: rn-developer
- **Consultation**: trivia-engagement-expert (for tutorial copy and step design)
