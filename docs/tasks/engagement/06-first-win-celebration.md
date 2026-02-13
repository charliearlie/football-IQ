# Task 6: First Win Celebration

## Context
A user's very first completed puzzle is a critical moment for retention. Currently, they just see the standard result modal. Adding a special celebration creates a positive emotional anchor and encourages sharing, which drives organic growth.

## Requirements

### Detection Logic
- Track `totalGamesPlayed` in NotificationContext (already passed as prop)
- Use a ref `prevTotalGamesPlayedRef` to detect transition from 0 -> 1
- Guard with AsyncStorage key `@first_win_celebrated` to prevent duplicate shows
- Must fire AFTER the standard result modal has been seen (add a small delay or chain after result dismiss)

### Celebration Modal
- Full-screen modal (same pattern as PerfectDayCelebration)
- Party icon (PartyPopper from lucide-react-native, or Trophy with special styling)
- Title: "YOU'RE A NATURAL!" in pitch green
- Subtitle: "You completed your first puzzle!"
- Stats: Show score earned + "Welcome to Football IQ"
- Confetti burst
- Share button: "Share your first score" — captures card + shares
- "Continue" dismiss link
- Share message: "Just completed my first Football IQ puzzle! Think you can beat my score?"

### Haptic Pattern
- Reuse `triggerPerfectDay()` — it's a celebration pattern that fits

### Analytics
- New `FIRST_WIN_CELEBRATED` event with properties: `{ game_mode: string, score: number }`

### Bonus IQ Consideration
The plan mentions +50 bonus IQ. This requires modifying the IQ calculation flow. **For now, skip the bonus IQ** — it adds complexity (needs to sync to Supabase, modify total_iq trigger). The celebration modal is the high-impact piece. Bonus IQ can be added in a follow-up.

## Files to Create
- `src/features/notifications/components/FirstWinCelebration.tsx`:
  ```typescript
  interface FirstWinCelebrationProps {
    visible: boolean;
    onDismiss: () => void;
    onShare: () => Promise<void>;
    testID?: string;
  }
  ```

## Files to Modify
- `src/features/notifications/context/NotificationContext.tsx`:
  - Add `prevTotalGamesPlayedRef` ref
  - Add `isFirstWinCelebrating` state
  - Add `dismissFirstWinCelebration` callback
  - Add detection effect: when `totalGamesPlayed` changes from 0 to >= 1, check AsyncStorage, trigger celebration
  - Export new values in context
- `src/features/notifications/components/NotificationWrapper.tsx`:
  - Import and render `FirstWinCelebration` component
  - Pass props from NotificationContext
- `src/hooks/useAnalytics.ts`:
  - Add `FIRST_WIN_CELEBRATED` event constant
  - Add `trackFirstWinCelebrated` function

## Pattern to Follow
Identical structure to PerfectDayCelebration:
```
Modal (transparent, fade)
  ├─ Overlay (dark background)
  ├─ Confetti (active when visible)
  ├─ Animated.View (FadeIn)
  │   ├─ Close button (X icon, top-right)
  │   ├─ Animated.View (spring scale card)
  │   │   └─ ViewShot
  │   │       └─ ShareCard (icon + title + subtitle + stats + footer)
  │   ├─ Subtitle text
  │   ├─ ElevatedButton (Share)
  │   └─ Pressable (Continue/dismiss)
```

Key difference from PerfectDayCelebration:
- Icon: PartyPopper or Star instead of Trophy
- Color: Pitch green theme instead of gold/yellow
- No puzzle count or streak stats — just a welcoming message
- Footer: "football-iq.app" (same)

## NotificationContext Integration
```typescript
// Detection effect:
useEffect(() => {
  const prev = prevTotalGamesPlayedRef.current;
  prevTotalGamesPlayedRef.current = totalGamesPlayed;

  // Only trigger on first completion (0 -> 1+)
  if (prev === 0 && totalGamesPlayed > 0) {
    AsyncStorage.getItem('@first_win_celebrated').then(shown => {
      if (!shown) {
        setIsFirstWinCelebrating(true);
        AsyncStorage.setItem('@first_win_celebrated', 'true');
      }
    });
  }
}, [totalGamesPlayed]);
```

## Priority Note
This celebration should NOT conflict with PerfectDay celebration. If user's first game also happens to complete a perfect day (unlikely but possible), PerfectDay should take precedence. Add a check: `if (isPerfectDayCelebrating) return;` before showing first win.

## Acceptance Criteria
- [ ] After completing first-ever puzzle, celebration modal appears
- [ ] Modal shows "YOU'RE A NATURAL!" with party icon and confetti
- [ ] Haptic pattern fires on modal open
- [ ] Share button captures card and opens native share sheet
- [ ] Modal dismisses on "Continue" and X button
- [ ] Does not show twice (AsyncStorage guard)
- [ ] Does not conflict with PerfectDay celebration
- [ ] `FIRST_WIN_CELEBRATED` event fires in PostHog
- [ ] No TypeScript errors

## Agent Assignment
- **Primary**: rn-developer
- **Secondary**: ui-designer (celebration card design)
