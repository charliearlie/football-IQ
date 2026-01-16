# Victory Reveal Animation - Career Path

## Date: 2026-01-16

## Context
When a user correctly guesses the player in Career Path, the result modal appeared immediately, blocking the view of the full career path. This felt abrupt and didn't give users a chance to see and learn the complete career they just solved.

## Decision
Implement a "Victory Reveal" sequence that reveals all hidden career steps with staggered animations before showing the result modal.

## Implementation

### State Machine
Added `isVictoryRevealing: boolean` to `CareerPathState` in the reducer:
- Set to `true` when `CORRECT_GUESS` action dispatches
- Set to `false` when `VICTORY_REVEAL_COMPLETE` action dispatches

### Animation Sequence
1. User submits correct guess → `triggerSuccess()` haptic
2. `gameStatus` becomes `'won'`, `isVictoryRevealing` becomes `true`
3. Hidden cards animate in one-by-one with 200ms stagger (top to bottom)
4. Each card uses spring animation: scale 0.9 → 1.05 → 1.0, translateY 20 → 0
5. Cards show green glow (`victoryCard` style) during reveal
6. After all cards reveal (+ 300ms buffer):
   - `triggerCompletion()` haptic (double success)
   - `completeVictoryReveal()` dispatches `VICTORY_REVEAL_COMPLETE`
7. 1.5 seconds after animation completes, result modal appears

### View Full Path Toggle
- Result modal now has "View Full Path" button (win state only)
- Tapping closes modal and sets `viewingFullPath` to `true`
- Header shows "Home" link to return to home screen
- Action zone is hidden when viewing full path

### Keyboard Stability
Added animated keyboard height tracking following GoalscorerRecallScreen pattern:
- `keyboardVisible` shared value (0 or 1)
- Smooth 200-250ms transitions on keyboard show/hide
- FlatList wrapper uses `Animated.View` with animated `paddingBottom`

## Files Changed
- `src/features/career-path/types/careerPath.types.ts` - Added state/action types
- `src/features/career-path/hooks/useCareerPathGame.ts` - Reducer changes, new exports
- `src/features/career-path/components/CareerStepCard.tsx` - `forceReveal`, `revealDelay`, `isVictoryReveal` props
- `src/features/career-path/components/GameResultModal.tsx` - Added `onViewPath` prop and button
- `src/features/career-path/screens/CareerPathScreen.tsx` - Orchestration, modal state, keyboard animation

## Rationale
Like Wordle showing the answer before the stats modal, this approach:
1. Teaches users - they see the full career path they just solved
2. Creates a satisfying "cascade" moment with haptic feedback
3. Increases perceived value - users feel their "Football IQ" is growing
4. Differentiates from immediate-modal patterns that feel clinical

## Shared Engine
All changes are in the shared `src/features/career-path/` feature module. Career Path Pro automatically inherits this behavior with zero code duplication.
