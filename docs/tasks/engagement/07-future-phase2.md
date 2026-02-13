# Future Tasks: Phase 2 (Sprint 2)

These tasks require more effort and/or Supabase migrations. Documented here for future sprints.

---

## 2.1: Free Daily Limit (5 Games)
**Priority**: P0 | **Effort**: Large
- Free users can play 5 games/day. 6th game triggers "Out of games!" modal
- Options: Watch rewarded ad for +1 game, or Go Pro for unlimited
- Premium users unaffected
- Tracked locally (AsyncStorage daily counter)
- Key files: `app/(tabs)/index.tsx`, `src/features/ads/`, `src/features/home/hooks/useDailyProgress.ts`

## 2.2: Leaderboard Change Notifications
**Priority**: P0 | **Effort**: Medium
- Supabase Edge Function checks rank changes daily at 21:00
- Push notification: "You slipped to #8! Play tomorrow to reclaim"
- Track `last_notified_rank` to avoid spam
- Requires: new migration for `notification_state` table, Edge Function, Expo Push API integration
- Key files: `supabase/functions/`, `src/features/notifications/`

## 2.3: Premium Profile Customisation
**Priority**: P0 | **Effort**: Medium
- 5 avatar border styles (gold, emerald, ruby, diamond, platinum)
- Showcase 3 selected badges on profile
- Free users see locked options with upgrade CTA
- Requires: migration adding `avatar_border`, `showcase_badges` to profiles table
- Key files: `src/features/stats/`, `app/scout/[userId].tsx`

## 2.4: Weekly Collection Challenges
**Priority**: P0 | **Effort**: Medium
- "Complete the 2008 CL Final XI this week" with progress tracking
- Special badge + 50 bonus IQ for completion
- Uses existing EventBanner and special events system
- Key files: `src/features/home/hooks/useSpecialEvent.ts`, `src/features/home/components/new/EventBanner.tsx`

## 2.5: 12-Month Content Calendar
**Priority**: P0 | **Effort**: Low-Medium
- Document full-year calendar tied to football events
- Admin UI for viewing/managing calendar
- Pre-schedule events: CL Final (May), Transfer Window (Jan/Aug), Ballon d'Or (Oct)
- Key files: `web/app/(dashboard)/admin/`, `src/features/home/config/events.ts`
