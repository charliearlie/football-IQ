# Timeline Game Mode Design

## Overview

**Timeline** is a chronological ordering puzzle. Players are shown 6 career events from a footballer's life in random order and must drag them into the correct chronological sequence. Multiple attempts are allowed but each costs points. The mode prioritizes retention and daily habit formation over high-pressure knockout mechanics.

**Schedule**: 3x per week (Tuesday, Thursday, Saturday) | **Access**: Free tier | **Game mode key**: `timeline`

---

## Core Mechanic

1. Player sees 6 career events (transfers, trophies, milestones) in shuffled order
2. Drag cards to reorder them chronologically
3. Tap "Submit" to check — cards reveal one-by-one (cascade animation) showing correct/incorrect + year
4. Correct cards lock in place between attempts
5. Remaining incorrect cards can be reordered for another attempt
6. Game ends when all cards are correctly placed or player gives up

### Attempt Penalties

| Attempt | Max Points Available |
|---------|---------------------|
| 1st     | 100% (full score)   |
| 2nd     | 75%                 |
| 3rd     | 50%                 |
| 4th+    | 25%                 |

### Feedback Per Attempt

- Each card flips to reveal: year + green checkmark or red X
- Summary: "X of 6 are correct" (locked cards not counted in remaining)
- Correct cards lock with green glow — cannot be moved
- Incorrect cards shake red, then return to movable state

---

## Scoring

IQ points are based on first-attempt accuracy (how many correct on first submit):

| 1st Attempt Accuracy | IQ Points | Label            |
|----------------------|-----------|------------------|
| 6/6 (perfect)        | 10        | Perfect Timeline |
| 5/6                  | 8         | World Class      |
| 4/6                  | 6         | Expert           |
| 3/6                  | 4         | Promising        |
| 1-2/6                | 2         | Rookie           |
| Gave up              | 0         | -                |

**Rationale**: First-attempt accuracy rewards knowledge while the multi-attempt system ensures everyone can complete the puzzle. This creates the retention-optimized pattern: "I got 4/6 first try, I'll do better tomorrow."

---

## Share Format

```
Football IQ - Timeline
Cristiano Ronaldo
17 Feb 2026

⏱️⏱️⏱️⏱️⏱️⏱️
✅✅❌✅✅✅

5/6 correct - 8 IQ
footballiq.app
```

### Emoji Grid Logic

- Row 1: `⏱️` repeated for each event (always 6)
- Row 2: `✅` for events correctly placed on first attempt, `❌` for incorrect
- Events are shown in their CORRECT chronological order in the share (not the user's initial order)

### Share Text Generation

```typescript
function generateTimelineShareText(
  subject: string,
  events: TimelineEvent[],
  firstAttemptResults: boolean[], // true = correct on first try
  score: TimelineScore,
  puzzleDate?: string
): string
```

---

## Content Structure

### daily_puzzles.content JSON

```json
{
  "subject": "Cristiano Ronaldo",
  "subject_id": "Q11571",
  "events": [
    {
      "text": "Signed for Sporting CP from youth academy",
      "year": 2002,
      "month": null,
      "type": "transfer"
    },
    {
      "text": "Joined Manchester United",
      "year": 2003,
      "month": 8,
      "type": "transfer"
    },
    {
      "text": "Won first Ballon d'Or",
      "year": 2008,
      "month": 12,
      "type": "achievement"
    },
    {
      "text": "Signed for Real Madrid",
      "year": 2009,
      "month": 7,
      "type": "transfer"
    },
    {
      "text": "Won Euro 2016 with Portugal",
      "year": 2016,
      "month": 7,
      "type": "achievement"
    },
    {
      "text": "Moved to Juventus",
      "year": 2018,
      "month": 7,
      "type": "transfer"
    }
  ]
}
```

### Event Types

| Type          | Source                    | Example                          |
|---------------|---------------------------|----------------------------------|
| `transfer`    | `player_appearances`      | "Joined Manchester United"       |
| `achievement` | `player_achievements`     | "Won first Ballon d'Or"          |
| `milestone`   | Manual / future enrichment| "Scored 50th Champions League goal" |
| `international`| Manual / future enrichment| "Won Euro 2016 with Portugal"   |

### Validation Rules

- Exactly 6 events per puzzle
- All events must have a `year` (month optional but helps resolve same-year ties)
- No two events should share the same year unless month is specified for both
- Events must be in a valid chronological order (the content stores them in correct order; the app shuffles on load)
- `subject_id` must reference a valid player in the `players` table

---

## Data Sources

### V1: Existing Data (Launch)

Transfer events can be auto-generated from `player_appearances`:
```sql
SELECT c.display_name || COALESCE(' (' || c.country_code || ')', '') as club,
       pa.start_year as year,
       'transfer' as type
FROM player_appearances pa
JOIN clubs c ON c.id = pa.club_id
WHERE pa.player_id = 'Q11571'
ORDER BY pa.start_year;
```

Achievement events from `player_achievements`:
```sql
SELECT a.name as achievement,
       pa.year,
       'achievement' as type
FROM player_achievements pa
JOIN achievements a ON a.id = pa.achievement_id
WHERE pa.player_id = 'Q11571'
ORDER BY pa.year;
```

Combine and curate the best 6 events per player in CMS.

### V2: Enriched Data (Future)

New `timeline_events` table for richer content beyond transfers and trophies:

```sql
CREATE TABLE timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text REFERENCES players(id),
  event_text text NOT NULL,
  event_year integer NOT NULL,
  event_month integer,
  event_type text CHECK (event_type IN ('transfer', 'achievement', 'milestone', 'international')),
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);
```

---

## UX Interaction Design

### Emotional Arc (2-3 minute session)

1. **Curiosity (0-5s)**: "Oh, these all feel familiar... but which came first?"
2. **Uncertainty (5-30s)**: "Was his first Ballon d'Or before or after leaving United?"
3. **Confidence/Doubt (30-60s)**: Reorder twice, second-guessing yourself
4. **Commitment (60s)**: Deep breath, tap Submit
5. **Suspense (60-65s)**: Cascading card reveals build tension
6. **Peak Moment (65s)**:
   - Perfect (6/6) → Confetti burst, "Perfect Timeline!" overlay
   - Close (5/6) → "So close!" — strong share impulse
   - Mixed (3-4/6) → Locked cards give hope, "Try again" motivation

### Card Interaction

- **Long-press (150ms)**: Card lifts with shadow + haptic bump (`impactMedium`)
- **Drag**: Card follows thumb, other cards spring aside (Reanimated `withSpring`)
- **Drop**: Spring animation snap to position + haptic thunk (`impactLight`)
- **All cards**: 80pt minimum height, positioned in middle 60% of screen (thumb-friendly)

### Submit Reveal

- Cards flip one by one, top to bottom (200ms delay between each)
- Correct: Green glow + small scale pulse + `notificationSuccess` haptic
- Incorrect: Red flash + horizontal shake (3 cycles) + show correct year label underneath
- After all revealed: 500ms pause → summary overlay ("5/6 correct on first try!")

### Locked Card State

- Green left border + subtle green tint
- Lock icon in corner
- Non-interactive (drag disabled)
- Positioned in their correct chronological slot

### Result Modal

Standard `ConnectionsResultModal` pattern:
- Subject name + puzzle date
- Emoji grid
- Score + label
- Share button (native share / clipboard fallback)
- Score distribution graph (reuse `ScoreDistribution` component)

---

## Schedule Integration

### Weekly Schedule (`web/lib/scheduler.ts`)

Add to `WEEKLY_SCHEDULE`:
```typescript
{ gameMode: "timeline", days: [2, 4, 6], isPremium: false }, // Tue, Thu, Sat
```

Add to `SCHEDULED_MODES`:
```typescript
export const SCHEDULED_MODES: GameMode[] = [
  // ... existing modes
  "timeline",
];
```

### Constants (`web/lib/constants.ts`)

Add to `GAME_MODES`, `GAME_MODE_DISPLAY_NAMES`, `GAME_MODE_SHORT_NAMES`:
```typescript
// GAME_MODES array:
"timeline"

// Display names:
timeline: "Timeline"

// Short names:
timeline: "TL"
```

---

## Implementation Pattern

### Feature Directory

```
src/features/timeline/
  index.ts                          -- barrel export
  types/timeline.types.ts           -- TimelineEvent, TimelineContent, TimelineState, etc.
  hooks/useTimelineGame.ts          -- Game state reducer + useGamePersistence
  utils/scoring.ts                  -- IQ calculation from first-attempt accuracy
  utils/share.ts                    -- Emoji grid + share text generation
  components/TimelineCard.tsx       -- Draggable event card
  components/TimelineList.tsx       -- Vertical list of draggable cards
  components/TimelineActionBar.tsx  -- Submit / Give Up buttons
  components/TimelineResultModal.tsx-- Result display with share
  components/LockedCard.tsx         -- Green locked card variant
  screens/TimelineScreen.tsx        -- Main screen (follows ConnectionsScreen pattern)
```

### App Routes

```
app/timeline/
  index.tsx       -- Today's timeline puzzle
  [puzzleId].tsx  -- Specific puzzle by ID (archive)
```

### CMS Admin

```
web/app/(dashboard)/admin/timeline/
  page.tsx        -- Timeline puzzle list + creation
```

### Key Reusable Patterns

| Pattern | Source | Reuse |
|---------|--------|-------|
| Game persistence | `src/hooks/useGamePersistence.ts` | Progress save/restore |
| Puzzle loading | `src/features/puzzles/` | `usePuzzle('timeline')` |
| Onboarding intro | `src/features/puzzles/` | `useOnboarding('timeline')` |
| Share mechanics | `src/features/connections/utils/share.ts` | Pattern for share function |
| Score distribution | `src/features/stats/components/ScoreDistribution*.tsx` | Result modal graph |
| Haptic feedback | `src/hooks/useHaptics.ts` | All interactions |
| Game container | `src/components/GameContainer.tsx` | Screen wrapper |
| Elevated button | `src/components/ElevatedButton.tsx` | Submit/action buttons |

### Drag Library

Use `react-native-reanimated` + `react-native-gesture-handler` for drag-to-reorder (both already in the project). Consider `react-native-draggable-flatlist` for the sortable list if the custom implementation proves complex.

---

## Content Curation Strategy

### Launch Content (First 2 Weeks = 6 Puzzles)

| Day | Subject | Difficulty |
|-----|---------|------------|
| Tue | Cristiano Ronaldo | Easy (wide year spread) |
| Thu | Lionel Messi | Easy |
| Sat | David Beckham | Easy |
| Tue | Thierry Henry | Medium |
| Thu | Zinedine Zidane | Medium |
| Sat | Kylian Mbappe | Medium (recent, tighter years) |

### Difficulty Levers

- **Easy**: Wide year spread (10+ years between events), iconic players everyone knows
- **Medium**: Narrower year spread (3-5 years), mix of transfers and achievements
- **Hard**: Same-era events (2-3 year window), requires specific date knowledge

### Content Pipeline

1. CMS admin selects a player
2. Auto-populate events from `player_appearances` + `player_achievements`
3. Editor curates best 6 events, adds text polish, verifies years
4. Preview and publish

---

## Future Enhancements

- **Club timelines**: "Put these Arsenal managers in order" — extends beyond player careers
- **Era timelines**: "Put these 2006 World Cup moments in order" — event-based rather than player-based
- **Community voting**: Users vote on which player's timeline they want next
- **Difficulty filter**: Choose easy/medium/hard timelines from the archive
