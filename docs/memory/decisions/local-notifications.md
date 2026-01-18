# Local Notifications & Streak Rescue System

## Decision Date: 2026-01-18

## Context
To maximize Daily Active Users (DAU) and long-term retention, we need a system to:
1. Remind users to play daily
2. Protect existing streaks with timely alerts
3. Celebrate perfect days to encourage completion

## Decision

### Notification Types

1. **Daily Kick-off (08:30 local)**
   - Morning reminder if user hasn't played yet
   - Rotating football-themed messages for variety
   - Cancelled automatically when user plays

2. **Streak Saver (20:00 local)**
   - High-priority evening alert
   - Only fires if: `streak > 0 AND gamesPlayedToday === 0`
   - Copy: "Your {count} day streak ends in 4 hours!"

3. **Perfect Day Celebration**
   - Full-screen confetti + unique haptic pattern
   - Triggered when `completedCount === totalPuzzles`
   - Shareable card for social media

### True-Time Integration

Notifications use the Time Integrity system to schedule at correct "real" times:
- `getTimeDriftMs()` adjusts scheduled times for clock drift
- `onMidnight()` triggers daily rescheduling
- `isTimeTampered()` prevents scheduling when clock manipulated

### Permission Flow

Permission is requested after first puzzle completion:
1. User completes first puzzle
2. 2-second delay (let result modal show first)
3. Custom modal explains benefits ("Don't lose your streak!")
4. On accept: Request system permission
5. On decline: Never ask again (tracked in AsyncStorage)

### Perfect Day Detection

- Watches `completedCount` and `totalPuzzles` from `useDailyPuzzles()`
- Triggers on transition from `completedCount < total` to `completedCount === total`
- Only triggers once per day (tracked in AsyncStorage)
- Handles variable puzzle counts (3-8 per day)

## File Structure

```
src/features/notifications/
├── index.ts                              # Public exports
├── types.ts                              # Type definitions
├── context/
│   └── NotificationContext.tsx           # Main provider
├── components/
│   ├── NotificationPermissionModal.tsx   # Permission request UI
│   ├── PerfectDayCelebration.tsx         # Full-screen celebration
│   └── NotificationWrapper.tsx           # Integrates hooks with provider
├── services/
│   └── notificationService.ts            # expo-notifications wrapper
└── utils/
    ├── scheduleCalculator.ts             # Time calculations with drift
    └── messageRotation.ts                # Morning message selection
```

## Integration

Provider wraps inside `PuzzleProvider` in `app/_layout.tsx`:

```tsx
<PuzzleProvider>
  <NotificationWrapper>
    {children}
  </NotificationWrapper>
</PuzzleProvider>
```

`NotificationWrapper` uses `useUserStats` and `useDailyPuzzles` to pass
data to `NotificationProvider`.

## Storage Keys (AsyncStorage)

- `@notifications_permission_asked` - Whether permission modal was shown
- `@notifications_last_scheduled_date` - Prevents duplicate scheduling
- `@notifications_perfect_day_shown` - Array of dates celebration was shown

## Dependencies Added

- `expo-notifications` - Local notification scheduling

## Analytics (Sentry Breadcrumbs)

- `notification_scheduled` - When notification is scheduled
- `notification_received` - When notification received (app foreground)
- `notification_opened` - When user taps notification

## Edge Cases Handled

1. **Variable puzzle count**: Perfect Day checks dynamic `cards.length`
2. **Time tampering**: Skips scheduling when `isTimeTampered()` returns true
3. **Duplicate notifications**: Stable IDs + date tracking
4. **Permission denied**: Graceful fallback, no re-prompting
5. **Midnight race**: `onMidnight()` subscription for rescheduling
6. **App backgrounded**: System handles scheduled notifications
