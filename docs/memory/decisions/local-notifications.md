# Local Notifications & Streak Rescue System

## Decision Date: 2026-01-18
## Updated: 2026-01-28

## Context
To maximize Daily Active Users (DAU) and long-term retention, we need a system to:
1. Remind users to play daily
2. Protect existing streaks with timely alerts
3. Celebrate perfect days to encourage completion

## Decision

### Notification Types

1. **Daily Kick-off (08:30 local)** - ID: `101`
   - Morning reminder if user hasn't played yet
   - Rotating football-themed messages for variety
   - Cancelled automatically when user completes a puzzle

2. **Streak Saver (20:30 local)** - ID: `102`
   - High-priority evening alert (12 hours after Daily Kick-off)
   - Only fires if: `streak > 0 AND gamesPlayedToday === 0`
   - Copy: "Your {count} day streak ends in 4 hours!"
   - Timing configurable via `SCHEDULE_CONFIG.streakSaverOffsetHours`

3. **Ad-hoc CMS (future)** - ID: `103`
   - Reserved for remote push notifications from CMS
   - Requires FCM infrastructure (Phase 2)

4. **Perfect Day Celebration**
   - Full-screen confetti + unique haptic pattern
   - Triggered when `completedPuzzlesToday === totalPuzzlesToday`
   - Shareable card for social media

### Numeric ID System

Uses stable numeric string IDs for precise notification management:
- `101` - Daily Kick-off
- `102` - Streak Saver
- `103` - Ad-hoc CMS (reserved)

Benefits:
- Overwrite specific notifications without clearing entire queue
- Stable IDs survive app restarts
- No collision with user-generated or test notifications

### Configurable Timing

```typescript
// scheduleCalculator.ts
export const DEFAULT_SCHEDULE_CONFIG: NotificationScheduleConfig = {
  dailyReminder: { hour: 8, minute: 30 },
  streakSaverOffsetHours: 12, // 08:30 + 12 = 20:30
};
```

### True-Time Integration

Notifications use the Time Integrity system to schedule at correct "real" times:
- `getTimeDriftMs()` adjusts scheduled times for clock drift
- `onMidnight()` triggers daily rescheduling
- `isTimeTampered()` prevents scheduling when clock manipulated

### Permission Flow

Permission is requested after first puzzle completion:
1. User completes first puzzle
2. 2-second delay (let result modal show first)
3. Custom modal explains benefits with three items:
   - "Daily briefing reminders each morning"
   - "Streak-at-risk alerts before it's too late"
   - "Live ad-hoc challenges from our scouts"
4. On accept: Request system permission
5. On decline: Never ask again (tracked in AsyncStorage)

### Perfect Day Detection

- Watches `completedPuzzlesToday` and `totalPuzzlesToday` from context
- Triggers on transition from `completed < total` to `completed === total`
- Only triggers once per day (tracked in AsyncStorage)
- Handles variable puzzle counts (3-8 per day)

### Bug Fix: completedCount Calculation (2026-01-28)

Fixed bug in `NotificationWrapper.tsx` where `NotificationModals` component incorrectly calculated `completedCount` as `todaysPuzzles.length` (total puzzles) instead of actual completed count. Now uses `completedPuzzlesToday` from context.

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

## Settings Test Buttons

Available in the dev menu (7-tap version text to activate):
- **Test Morning Notification** - Schedules morning notification in 5 seconds
- **Test Streak Saver Notification** - Schedules high-priority streak notification in 5 seconds

## Dependencies Added

- `expo-notifications` - Local notification scheduling

## Analytics (Sentry Breadcrumbs)

- `notification_scheduled` - When notification is scheduled
- `notification_received` - When notification received (app foreground)
- `notification_opened` - When user taps notification

## Edge Cases Handled

1. **Variable puzzle count**: Perfect Day checks dynamic `totalPuzzlesToday`
2. **Time tampering**: Skips scheduling when `isTimeTampered()` returns true
3. **Duplicate notifications**: Stable numeric IDs (101, 102) + date tracking
4. **Permission denied**: Graceful fallback, no re-prompting
5. **Midnight race**: `onMidnight()` subscription for rescheduling
6. **App backgrounded**: System handles scheduled notifications
7. **Puzzle completion**: Cancels both Daily and Streak notifications with Sentry logging

## Future Work: Remote Push Notifications (Phase 2)

### Infrastructure Required
1. Firebase/FCM project setup
2. Expo notification plugin configuration
3. Push token registration service
4. Backend endpoint for storing tokens
5. CMS integration for sending pushes

### In-App Alert Banner
When push arrives with app in foreground:
- Show "Pitch Green tactical alert" banner instead of system notification
- Slide-in from top animation
- Auto-dismiss after 5s
- Tap to navigate to relevant content
