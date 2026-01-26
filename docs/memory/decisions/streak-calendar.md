# Streak Calendar Architecture Decision

## Overview
The Streak Calendar is a mobile-optimized calendar showing daily completion history on the "My IQ" tab. It uses 3D depth cells, haptic tooltips, and premium gating for historical data.

## Key Decisions

### 1. Component Architecture: Embedded ScrollView
**Decision:** Keep the existing `ScrollView` in `stats.tsx` and embed `StreakCalendar` within it.

**Rationale:**
- Current stats screen has ~5-6 components totaling ~800px
- Calendar adds ~400px for expanded month + ~100px per collapsed month
- FlashList optimized for 100+ items; we have 12-24 months max
- Maintains existing pull-to-refresh and loading patterns

### 2. Data Hook: Separate `useStreakCalendar`
**Decision:** Create dedicated hook separate from `usePerformanceStats`.

**Rationale:**
- Different data shape (grouped by month/day) vs flat proficiency data
- Independent caching and refresh cycles
- `usePerformanceStats` already has complex aggregation logic

### 3. Tooltip: Absolute Positioned with Reanimated
**Decision:** Use absolute positioning within the `StreakCalendar` container.

**Rationale:**
- No need for portals/modals - calendar is contained
- Simpler than modal-based approach with fewer z-index issues
- Reanimated provides smooth enter/exit animations
- Position calculated from cell's `measureInWindow`

### 4. Premium Gating: 60-Day Free Window
**Decision:** Free users see current + previous month (~60 days).

**Rationale:**
- Matches existing 7-day puzzle access pattern (scaled up)
- Provides enough history for engagement without giving away everything
- Clear value proposition for premium upgrade

### 5. Launch Date Hard Floor (January 20, 2026)
**Decision:** Implement a hard floor date of January 20, 2026 for all calendar functionality.

**Rationale:**
- App launched on this date, no valid activity data exists before
- Prevents nonsensical empty calendar cells for pre-launch period
- Streak and perfect week calculations should not include pre-launch dates

**Implementation:**
- `LAUNCH_DATE` constant exported from `useStreakCalendar.ts`
- Days before Jan 20, 2026 are visually dimmed (same as future dates)
- Days before Jan 20, 2026 are non-pressable (no bottom sheet)
- `calculateMonthStreak()` skips pre-launch dates
- `findPerfectWeeks()` cannot include pre-launch dates
- `calculateOverallStreak()` filters out pre-launch dates

## Implementation Details

### Cell Intensity Thresholds
- `empty`: 0 games completed (Stadium Navy #16212B)
- `low`: 1-3 games completed (Pitch Green 50% opacity)
- `high`: 4+ games completed (Pitch Green 100%)

### 3D Depth Values
- Empty cells: `depthOffset.sunk` (1px) - "sunk" effect
- Filled cells: `depthOffset.cell` (3px) - "pop-up" effect

### Perfect Week Detection
A week is "perfect" when all 7 days (Mon-Sun) have at least one completion. Indicated by gold left border on the week row.

### Month Streak Flame
Each month shows a flame icon with the longest consecutive day streak within that month. Creates a "micro-challenge" every 30 days.

## File Structure
```
src/features/stats/
├── components/StreakCalendar/
│   ├── StreakCalendar.tsx    # Main container
│   ├── MonthGrid.tsx         # 7-column calendar grid
│   ├── DayCell.tsx           # 3D depth cell
│   ├── DayTooltip.tsx        # Floating tooltip
│   ├── MonthHeader.tsx       # Month name + flame
│   └── LockedMonthOverlay.tsx # Premium blur overlay
├── hooks/useStreakCalendar.ts
└── types/calendar.types.ts
```

## Database Query
```sql
SELECT p.puzzle_date, p.game_mode, a.score, a.metadata
FROM attempts a
JOIN puzzles p ON a.puzzle_id = p.id
WHERE a.completed = 1
ORDER BY p.puzzle_date DESC
```

## Related Decisions
- [solid-layer-3d.md](solid-layer-3d.md) - 3D depth system used for cells
- [archive-completed-unlock.md](archive-completed-unlock.md) - Premium gating patterns
