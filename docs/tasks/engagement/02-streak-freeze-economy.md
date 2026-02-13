# Task 2: Streak Freeze Economy

## Context
The current streak system in `useUserStats.ts` has no protection mechanism — users lose their entire streak if they miss a single day. This is the biggest frustration point cited in engagement research. Duolingo's streak freeze mechanic is proven to retain users through occasional missed days.

## Requirements

### Freeze Mechanics
- **Starting inventory**: 1 free freeze granted on first app launch (stored in AsyncStorage)
- **Earning freezes**: Award 1 freeze at every 7-day streak milestone (7, 14, 21, 28...)
- **Premium users**: Unlimited freezes (auto-apply, never consume from inventory)
- **Maximum inventory**: Cap at 3 freezes for free users
- **Auto-apply**: When streak calculation detects a missed day, automatically consume a freeze
- **Freeze record**: Store used freeze dates in AsyncStorage to maintain streak continuity

### Streak Calculation Changes
In `calculateStreak()` in `useUserStats.ts`:
1. Load freeze dates from AsyncStorage
2. When iterating through dates and finding a gap of exactly 1 day (i.e., 2-day difference between consecutive play dates):
   - Check if a freeze was used on that gap day
   - If freeze exists for that date, treat as consecutive (don't break streak)
3. When a new gap is detected and freeze is available:
   - Auto-consume freeze for the missed day
   - Record the freeze date in AsyncStorage

### UI Indicators
- **StreakHeader**: Show shield icon (ShieldCheck from lucide-react-native) next to streak count when freezes > 0
  - Tap shield to show tooltip: "You have X streak freezes"
- **HomeHeader**: When it's after 20:00, user has active streak, 0 plays today:
  - If freeze available: Show "Protected by streak freeze" in blue
  - If no freeze: Show "X day streak at risk!" in red/amber with pulse

### Analytics Events
- `STREAK_FREEZE_USED`: `{ streak_length: number, freeze_source: 'earned' | 'initial' | 'premium' }`
- `STREAK_FREEZE_EARNED`: `{ streak_milestone: number, total_freezes: number }`

## Files to Create
- `src/features/streaks/services/streakFreezeService.ts` — Core freeze logic:
  ```typescript
  // AsyncStorage keys
  const FREEZE_KEYS = {
    AVAILABLE_COUNT: '@streak_freeze_count',
    USED_DATES: '@streak_freeze_used_dates',
    LAST_MILESTONE: '@streak_freeze_last_milestone',
    INITIAL_GRANTED: '@streak_freeze_initial_granted',
  };

  export async function getAvailableFreezes(): Promise<number>
  export async function consumeFreeze(date: string): Promise<boolean>
  export async function awardFreeze(milestone: number): Promise<void>
  export async function getUsedFreezeDates(): Promise<string[]>
  export async function grantInitialFreeze(): Promise<void>
  export async function checkAndAwardMilestoneFreeze(currentStreak: number): Promise<boolean>
  ```
- `src/features/streaks/types/streakFreeze.types.ts` — Type definitions:
  ```typescript
  export interface StreakFreezeState {
    availableFreezes: number;
    usedDates: string[];
    lastMilestone: number;
    isPremium: boolean;
  }
  ```

## Files to Modify
- `src/features/home/hooks/useUserStats.ts` — Modify `calculateStreak()`:
  - Accept optional `freezeDates: string[]` parameter
  - When detecting a gap day, check if it's in freezeDates
  - In `useUserStats()` hook: load freeze dates before calculating streak
  - After streak calculation: check if milestone freeze should be awarded
  - Add `availableFreezes: number` to UserStats interface
- `src/features/home/components/StreakHeader.tsx` — Add shield icon when freezes > 0
- `src/features/home/components/new/HomeHeader.tsx` — Add freeze/at-risk indicator
- `src/hooks/useAnalytics.ts` — Add `STREAK_FREEZE_USED` and `STREAK_FREEZE_EARNED` events

## Key Implementation Notes

### calculateStreak modification
The current function iterates dates descending and checks `getDaysDifference`. Modify to:
```typescript
export function calculateStreak(
  attemptDates: string[],
  freezeDates: string[] = []
): { current: number; longest: number } {
  // ... existing logic but when diffDays === 2:
  // Check if the gap day is in freezeDates
  // If so, treat as consecutive (tempStreak++ instead of resetting)
}
```

### Auto-freeze consumption
In the `useUserStats` hook's `loadStats` callback:
1. Get freeze dates and available count
2. Calculate streak with freeze dates
3. Detect if today has a gap that needs a new freeze
4. If gap detected and freeze available, consume it
5. Check milestone awards after streak is calculated

### Premium handling
Access `isPremium` from AuthContext or SubscriptionSyncContext. Premium users:
- Always have freeze applied (treat as unlimited)
- Don't consume from inventory
- Don't earn milestone freezes (not needed)

## Acceptance Criteria
- [ ] New users start with 1 streak freeze
- [ ] Missing 1 day with freeze available preserves the streak
- [ ] Freeze is consumed (count decremented) when auto-applied
- [ ] 7-day streak milestones award +1 freeze (capped at 3)
- [ ] Premium users never lose streaks (unlimited auto-freeze)
- [ ] Shield icon shows in StreakHeader when freezes > 0
- [ ] At-risk state shows in HomeHeader after 20:00 with 0 plays
- [ ] `STREAK_FREEZE_USED` and `STREAK_FREEZE_EARNED` analytics events fire
- [ ] Existing streak calculation still works correctly without freezes
- [ ] No TypeScript errors

## Agent Assignment
- **Primary**: rn-developer
