# Future Tasks: Phase 3 (Sprint 3+)

These are larger features requiring significant backend infrastructure. Documented for long-term roadmap.

---

## 3.1: Add Friends System
**Priority**: P0 | **Effort**: Large
- Search by username, send friend requests, manage friends list
- "All Players" / "Friends Only" leaderboard toggle
- Contact import for discovery
- Requires: `friendships` + `friend_requests` tables, RLS policies, push notifications for requests
- Foundation for all social features (challenges, clubs)

## 3.2: Async Friend Challenges
**Priority**: P0 | **Effort**: Large
- "Challenge a Friend" button after completing any puzzle
- Generates shareable link, friend plays same puzzle, winner notified
- Head-to-head record on profile
- Requires: `challenges` table, deep linking for challenge acceptance, push notifications
- Depends on: Friends System (3.1) OR standalone with share links

## 3.3: 7-Day Free Trial Trigger
**Priority**: P1 | **Effort**: Medium
- After 10 total games, show premium trial offer
- "You're on fire! Try Pro free for 7 days"
- Uses RevenueCat's intro offer/free trial support
- Requires: RevenueCat configuration for trial period
- Key files: `src/features/subscription/`, `app/premium-modal.tsx`

## 3.4: Speed Bonuses for Timed Games
**Priority**: P1 | **Effort**: Low
- Goalscorer Recall: bonus IQ for fast answers (10s=+5, 30s=+3, 60s=+0)
- "Lightning Round" badge for sub-30s completions
- Key files: `src/features/goalscorer-recall/`, `src/features/stats/`

## 3.5: Micro-Milestones
**Priority**: P1 | **Effort**: Low
- Every 500 IQ within a tier: "2,500 IQ! Halfway to Club Legend"
- Progress bar on Stats screen showing % to next tier
- Already have `getProgressToNextTier()` utility — just needs UI
- Key files: `src/features/stats/`, `app/(tabs)/stats.tsx`
