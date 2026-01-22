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
