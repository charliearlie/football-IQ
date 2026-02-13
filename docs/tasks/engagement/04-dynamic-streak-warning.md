# Task 4: Dynamic Streak Warning

## Context
Currently, the only streak protection is the 20:30 local notification. There's no visual indicator on the home screen that a streak is at risk. Adding an in-app warning after 20:00 creates urgency and drives same-session play.

## Requirements

### Warning Logic
- Trigger conditions (ALL must be true):
  - Current time is after 20:00 local
  - User has an active streak (currentStreak > 0)
  - User has played 0 games today (gamesPlayedToday === 0)
- Warning disappears as soon as user completes any game
- Re-checks on a 60-second interval + on app foregrounding

### UI Treatment
- In HomeHeader (the new header design): Replace the streak pill content
- Normal state: "🔥 X" (fire icon + streak count)
- At-risk state: Pill turns red/amber, text changes to "X day streak at risk! Nh left"
  - E.g., "5 day streak at risk! 3h left"
- Pulsing animation on the at-risk pill (opacity 0.7 -> 1.0, 1.5s loop)
- Hours calculation: `24 - currentHour` (hours until midnight)

### Hook Design
```typescript
interface StreakAtRiskState {
  isAtRisk: boolean;
  hoursLeft: number;
  streakCount: number;
}
```

## Files to Create
- `src/features/home/hooks/useStreakAtRisk.ts`:
  ```typescript
  export function useStreakAtRisk(
    currentStreak: number,
    gamesPlayedToday: number
  ): StreakAtRiskState {
    // Check time, set interval for re-checking
    // Return { isAtRisk, hoursLeft, streakCount }
  }
  ```

## Files to Modify
- `src/features/home/components/new/HomeHeader.tsx`:
  - Import and use `useStreakAtRisk` hook
  - Conditionally render at-risk streak pill vs normal streak pill
  - Add pulsing animation using Reanimated's `withRepeat` + `withTiming` on opacity
  - At-risk colours: background `rgba(239, 68, 68, 0.2)` (red tint), text `#EF4444` (Red Card colour)

## Key Implementation Notes

### Time Checking
Use `new Date().getHours()` for local time check. The existing time integrity system (`getAuthorizedDateUnsafe`) handles date, but for hour-of-day we can use local clock since we're only creating urgency UI, not gating content.

### Interval Management
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Re-evaluate isAtRisk based on current time
  }, 60_000); // Every minute

  return () => clearInterval(interval);
}, [currentStreak, gamesPlayedToday]);
```

### AppState Integration
Also re-check when app comes to foreground:
```typescript
useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') recheck();
  });
  return () => sub.remove();
}, []);
```

### Animation Pattern
```typescript
const pulseOpacity = useSharedValue(1);

useEffect(() => {
  if (isAtRisk) {
    pulseOpacity.value = withRepeat(
      withTiming(0.5, { duration: 1000 }),
      -1, // infinite
      true // reverse
    );
  } else {
    pulseOpacity.value = 1;
  }
}, [isAtRisk]);
```

## Acceptance Criteria
- [ ] After 20:00 with active streak and 0 plays, header shows red warning
- [ ] Warning displays correct hours remaining until midnight
- [ ] Warning pill has pulsing opacity animation
- [ ] Warning disappears immediately when user completes a game
- [ ] Normal streak display shown when not at risk
- [ ] Hook re-evaluates on 60-second interval
- [ ] Hook re-evaluates on app foregrounding
- [ ] No TypeScript errors

## Agent Assignment
- **Primary**: rn-developer
