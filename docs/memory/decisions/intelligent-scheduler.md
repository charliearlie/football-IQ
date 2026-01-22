# Intelligent Scheduler

## Status
Implemented - January 2026

## Context
The Football IQ CMS needed a more robust puzzle scheduling system. Content creators were manually tracking which puzzles needed to be created for each day, with no visibility into coverage gaps or an efficient workflow for batch content creation.

## Decision

Implement an "Intelligent Scheduler" system that:

1. **Defines a weekly schedule** - Codifies which game modes run on which days
2. **Supports backlog puzzles** - Allows creating puzzles without a scheduled date
3. **Provides visual coverage indicators** - Shows progress and highlights gaps
4. **Enables batch initialization** - Creates draft placeholders for a week at once
5. **Streamlines editing workflow** - "Save & Next Gap" for rapid content creation

## Weekly Schedule

| Game Mode | Days | Premium |
|-----------|------|---------|
| career_path | Daily | No |
| career_path_pro | Daily | Yes |
| guess_the_transfer | Daily | No |
| guess_the_goalscorers | Wed, Sat | No |
| topical_quiz | Tue | Yes |
| topical_quiz | Fri | No |
| top_tens | Mon, Thu | Yes |
| starting_xi | Sun | No |

**Note:** `the_grid` is excluded from the schedule as it's not yet live.

## Implementation Details

### Database Changes
- Made `puzzle_date` nullable on `daily_puzzles` table to support backlog puzzles
- Added `is_premium` column to track premium status (derived from schedule when assigning)
- Created partial unique index that only enforces uniqueness for scheduled puzzles

### Key Components
- **Scheduler Engine** (`web/lib/scheduler.ts`): Core logic for schedule requirements, gap detection, and coverage calculations
- **Backlog Sheet**: Left-side panel showing unscheduled puzzles grouped by game mode
- **Initialize Week**: Button that creates draft placeholders for all missing required slots in a week
- **Save & Next Gap**: Editor button that saves current puzzle and opens the next gap

### UI Indicators
- Progress indicator on each day showing `populatedRequired/requiredCount`
- Yellow border on days in next 14 days with missing required puzzles
- Green text when all required puzzles are populated

## Consequences

### Positive
- Clear visibility into schedule coverage and gaps
- Efficient batch workflow for content creation
- Reduced risk of missing daily puzzles
- Backlog enables preparing content in advance

### Negative
- Increased complexity in the calendar view
- Need to maintain schedule configuration in code

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/014_intelligent_scheduler.sql` | Database migration |
| `web/lib/scheduler.ts` | New scheduler engine |
| `web/app/(dashboard)/calendar/actions.ts` | Added backlog, assign, initialize actions |
| `web/hooks/use-calendar-data.ts` | Schedule-aware calendar data |
| `web/hooks/use-backlog-puzzles.ts` | New backlog puzzles hook |
| `web/components/calendar/day-cell.tsx` | Progress indicators and gap warnings |
| `web/components/calendar/month-header.tsx` | Initialize Week and Backlog buttons |
| `web/components/puzzle/backlog-sheet.tsx` | New backlog panel |
| `web/components/puzzle/puzzle-editor-modal.tsx` | Save & Next Gap button |
| `web/app/(dashboard)/calendar/page.tsx` | Orchestration of all components |

## Usage

### Creating a Backlog Puzzle
1. Open the puzzle editor without selecting a date
2. Create and save the puzzle
3. It appears in the Backlog panel

### Assigning a Backlog Puzzle
1. Select a date on the calendar
2. Open the Backlog panel
3. Click "Assign" on a compatible puzzle (same mode required on that day)

### Initialize Week
1. Navigate to the target week
2. Click "Initialize Week" button
3. Draft placeholders are created for all missing required slots

### Save & Next Gap Workflow
1. Open any puzzle with a scheduled date
2. Edit the content
3. Click "Save & Next Gap"
4. Editor reopens on the next chronological gap
5. Repeat until all gaps filled

---

## Bonus Puzzles & Smart Displacement

Added in January 2026 to handle ad-hoc content and scheduling conflicts.

### Bonus Puzzles (`is_bonus`)

Bonus puzzles are extra content that don't count toward daily schedule requirements:
- **Use cases**: Special events, extra content, time-sensitive puzzles
- **Visual indicator**: Gold ring around the game mode dot in calendar
- **Coverage exclusion**: A day showing "5/5" may have 6 puzzles if one is marked bonus
- **Toggle**: Available in QuickViewSheet expanded content for any puzzle

### Smart Displacement

When assigning a backlog puzzle to a date that already has a puzzle of the same mode:

1. **Conflict Detection**: System checks for existing puzzle before assignment
2. **Resolution Modal**: Three options presented to the user:
   - **Add as Bonus** (yellow): Keep both puzzles, mark incoming as bonus
   - **Displace Existing** (green): Move existing puzzle to next available slot
   - **Swap** (blue): Exchange dates (for scheduled puzzles only)

### Displacement Algorithm

Located in `web/lib/displacement.ts`:

```typescript
// Constants
MAX_DISPLACEMENT_DAYS = 90  // Max search range for available slots
MAX_RIPPLE_DEPTH = 5        // Max chain length to prevent infinite loops

// Core function
calculateDisplacementChain(puzzleId, targetDate, gameMode, existingPuzzles)
  → Returns array of moves: { puzzleId, fromDate, toDate }[]
```

**Ripple Effect**: If the target slot for displacement is also occupied, the algorithm recursively finds slots for each displaced puzzle. Execution order is deepest-first to avoid constraint violations.

**Example**:
- Moving A to Monday (occupied by B)
- B needs to move to Tuesday (occupied by C)
- C moves to Wednesday (empty)
- Execution: C→Wed, B→Tue, A→Mon

### Database Changes

```sql
-- Migration 015_bonus_puzzles.sql
ALTER TABLE daily_puzzles
  ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN DEFAULT false;
```

### Server Actions

| Action | Purpose |
|--------|---------|
| `toggleBonusPuzzle(puzzleId, isBonus)` | Toggle bonus status |
| `checkSlotConflict(gameMode, targetDate)` | Detect conflicts before assignment |
| `displacePuzzle(puzzleId, newDate)` | Execute displacement with ripple |
| `swapPuzzleDates(puzzleId1, puzzleId2)` | Exchange dates between puzzles |
| `assignPuzzleDateWithConflictHandling(puzzleId, date, opts)` | Assign with forceAsBonus option |

### Files Added/Changed

| File | Change |
|------|--------|
| `supabase/migrations/015_bonus_puzzles.sql` | Add is_bonus column |
| `web/lib/displacement.ts` | New displacement algorithm |
| `web/components/puzzle/conflict-resolution-modal.tsx` | New conflict resolution UI |
| `web/components/calendar/game-mode-dot.tsx` | Bonus gold ring styling |
| `web/components/puzzle/quick-view-sheet.tsx` | Bonus toggle switch |
| `web/components/puzzle/puzzle-editor-modal.tsx` | Bonus badge indicator |
| `web/app/(dashboard)/calendar/page.tsx` | Conflict flow integration |
| `web/app/(dashboard)/calendar/actions.ts` | New server actions |
| `web/hooks/use-calendar-data.ts` | Exclude bonus from coverage |

---

## Schedule-Strict Day Cell Rendering

Added in January 2026 to clean up the calendar UI and only show relevant game modes per day.

### Problem
Previously, day cells showed all 8 game modes as dots regardless of the weekly schedule. This was confusing because:
- Empty dots appeared for modes not scheduled that day (e.g., "Goalscorer Recall" on Monday)
- No way to distinguish between "missing required content" vs "not scheduled today"

### Solution

**Schedule-Strict Rendering:**
- Day cells now only show dots for modes defined in `WEEKLY_SCHEDULE` for that specific weekday
- A Friday cell shows 4 dots (CP, GT, CPP, TQ), not 8
- Extra content (puzzles that exist but aren't in the schedule) still renders with a gold ring indicator

**New Data Fields:**
```typescript
// In GameModeStatus
isScheduled: boolean  // Is this mode required by the schedule for this day?
isExtra: boolean      // Has content but NOT in schedule (or marked as bonus)

// In CalendarDay
displayModes: GameModeStatus[]  // Only modes to render (scheduled + extras)
```

**Visual Changes:**
- Dots render from `displayModes` instead of all `gameModes`
- Flex layout with centering instead of fixed 8-column grid
- Red dots now mean "Mandatory Gap" (scheduled but missing content)
- Gold ring indicates "Extra Content" (outside schedule or bonus)

### Legend Updates
- "Empty" → "Mandatory Gap" (red dot)
- Added "Extra Content" indicator (green dot with gold ring)
- Added schedule note explaining variable dot counts

### Files Changed

| File | Change |
|------|--------|
| `web/hooks/use-calendar-data.ts` | Added `isScheduled`, `isExtra`, `displayModes` fields |
| `web/components/calendar/day-cell.tsx` | Render `displayModes` with flex centering |
| `web/components/calendar/game-mode-dot.tsx` | New props `isScheduled`/`isExtra`, updated tooltips |
| `web/components/calendar/legend.tsx` | New terminology and indicators |

---

## Create Puzzle Button

Added in January 2026 to allow creating puzzles without clicking a calendar date first.

### Usage
1. Click "Create Puzzle" button in the calendar header
2. Select a game mode from the dropdown
3. Select a target date
4. Click "Create Puzzle" to open the puzzle editor

### Implementation
- **AdhocPuzzleModal** (`web/components/puzzle/adhoc-puzzle-modal.tsx`): Mode/date picker modal
- **MonthHeader**: Added green "Create Puzzle" button with `Plus` icon
- **CalendarPage**: State management and handler to open editor after confirm

### Files Added/Changed

| File | Change |
|------|--------|
| `web/components/puzzle/adhoc-puzzle-modal.tsx` | New modal component |
| `web/components/calendar/month-header.tsx` | Added `onCreateAdhoc` prop and button |
| `web/app/(dashboard)/calendar/page.tsx` | Modal state and handlers |

---

## QuickViewSheet Mandatory/Optional Grouping

Added in January 2026 to provide clear visibility into which game modes are required vs optional for each day.

### Problem
Previously, the QuickViewSheet (day detail panel) showed all 8 game modes in a flat list without indicating which were required by the schedule for that specific day. This made it difficult to identify mandatory gaps.

### Solution

**Schedule-Aware Grouping:**
- Game modes are now grouped into "Mandatory" and "Optional" sections
- Uses `isRequiredOnDate()` from the scheduler to determine grouping
- Section headers show progress: "Mandatory (2/4)" and "Optional (1/4)"

**Badge Terminology:**
- **Gap** (red): Mandatory mode without content - needs attention
- **Not Set** (gray): Optional mode without content - no action required
- **Draft** (yellow): Puzzle exists in draft state
- **Live** (green): Puzzle is published

**Visual Styling:**
- Mandatory modes render at full opacity
- Optional modes render at 75% opacity for visual de-emphasis

### Description Format
Changed from:
```
3 of 8 puzzles populated
```
To:
```
2 of 4 mandatory + 1 extra
```

### Files Changed

| File | Change |
|------|--------|
| `web/components/puzzle/quick-view-sheet.tsx` | Grouped modes, new GameModeCard component, updated badges |
