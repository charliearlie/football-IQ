# Content Oracle Implementation

**Date:** 2026-01-22
**Status:** Implemented
**Feature:** Content Oracle + Error Reporting System

## Overview

The Content Oracle system provides two key capabilities for the Football IQ app:

1. **AI-Powered Bulk Generation:** "Magic Wand" button in CMS that automatically fills content gaps with AI-generated puzzles
2. **User Error Reporting:** Mobile users can report inaccuracies in AI-scouted data, which CMS operators can triage

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Mobile App (React Native)                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  CareerPathScreen                                         │  │
│  │  ├── ScoutingDisclaimer (shows scouted_at date)           │  │
│  │  └── ReportErrorSheet (submit error reports)              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Supabase: content_reports table                          │  │
│  │  (puzzle_id, report_type, comment, status, timestamps)    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ▲                                  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│  CMS (Next.js)               │                                  │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │  Calendar View                                            │  │
│  │  ├── Magic Wand button (bulk generation)                  │  │
│  │  └── Report badges on GameModeDot (red indicators)        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PuzzleEditorModal                                        │  │
│  │  ├── Reports section (view, resolve, dismiss)             │  │
│  │  └── Metadata footer (scouted_at, generated_by)           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

### Database
| File | Purpose |
|------|---------|
| `supabase/migrations/016_content_reports.sql` | Reports table with RLS policies |
| `web/types/supabase.ts` | TypeScript types for content_reports |
| `src/types/supabase.ts` | Mobile mirror of content_reports types |

### CMS (Web)
| File | Purpose |
|------|---------|
| `web/lib/ai/oracle.ts` | Oracle suggestion engine for bulk generation |
| `web/lib/ai/career-scout.ts` | Enhanced with Wikipedia metadata extraction |
| `web/types/ai.ts` | ContentMetadata, OracleSuggestion, ReportType |
| `web/hooks/use-reports.ts` | Report fetching and resolution hooks |
| `web/components/calendar/month-header.tsx` | Magic Wand button |
| `web/components/calendar/game-mode-dot.tsx` | Report badge indicator |
| `web/components/calendar/day-cell.tsx` | Passes report data to dots |
| `web/components/puzzle/puzzle-editor-modal.tsx` | Reports triage section |
| `web/app/(dashboard)/calendar/actions.ts` | Oracle server actions |

### Mobile (React Native)
| File | Purpose |
|------|---------|
| `src/features/career-path/components/ScoutingDisclaimer.tsx` | Metadata footer |
| `src/features/career-path/components/ReportErrorSheet.tsx` | Error report modal |
| `src/features/career-path/services/reportService.ts` | Supabase report submission |
| `src/features/career-path/screens/CareerPathScreen.tsx` | Integration |

## Design Decisions

### 1. Metadata Storage: JSONB `_metadata` Key

```typescript
interface ContentMetadata {
  scouted_at?: string;           // ISO timestamp when AI Scout extracted data
  wikipedia_revision_id?: string; // MediaWiki revision ID for provenance
  wikipedia_revision_date?: string; // When Wikipedia was last edited
  generated_by?: 'manual' | 'ai_oracle' | 'ai_scout';
}
```

**Rationale:** No schema migration needed for the `daily_puzzles.content` column. Metadata stays co-located with puzzle content.

### 2. Report Types: Fixed Enum + Other Escape Hatch

```typescript
type ReportType =
  | 'retired_moved'    // Player retired or changed clubs
  | 'incorrect_stats'  // Wrong appearances, goals, or years
  | 'name_visible'     // Player name appears in clues
  | 'wrong_club'       // Club name incorrect/misspelled
  | 'other';           // Free-text for edge cases
```

**Rationale:** Covers 95%+ of expected reports. "Other" provides escape hatch without infinite enum expansion.

### 3. Oracle Strategy: AI + Deduplication

The Oracle engine:
1. Uses AI (gpt-4o) to suggest appropriate players for the game mode
2. Cross-references against puzzles from the last 30 days to avoid duplicates
3. Returns suggestions with Wikipedia URLs for immediate scouting

**Mode-specific prompts:**
- `career_path`: High-profile players, household names, diverse leagues
- `career_path_pro`: Cult heroes, journeymen, obscure legends

### 4. Wikipedia Revision Tracking

Each AI-scouted puzzle now stores:
- `wikipedia_revision_id`: Exact revision for reproducibility
- `wikipedia_revision_date`: When Wikipedia was last edited
- `scouted_at`: When our AI extracted the data

This enables:
- Audit trail for data provenance
- Detection of stale data (Wikipedia updated after scouting)
- User transparency via "Records as of {date}" footer

## Report Lifecycle

```
1. User plays Career Path puzzle
2. Notices incorrect data → taps "Report Error"
3. Selects report type + optional comment
4. Report saved to content_reports (status: 'pending')
5. CMS shows red badge on affected puzzle
6. Operator opens puzzle → sees report details
7. Operator fixes data → clicks "Resolve" (or "Dismiss" if invalid)
8. Report status updated → badge disappears
```

## Security & RLS

```sql
-- content_reports RLS policies
CREATE POLICY "Anyone can create reports" ON content_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users read own reports" ON content_reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Service role full access" ON content_reports
  FOR ALL USING (true);
```

**CMS uses service role key** to read all reports and resolve them.

## Usage

### Mobile: Report an Error
1. Complete a Career Path puzzle
2. See "Scouting Intelligence: Records as of Jan 2026" footer
3. Tap "Report Error" button
4. Select error type (chips: "Retired/Moved", "Incorrect Stats", etc.)
5. Optionally add comment
6. Tap "Submit" → see "Scout Notified" confirmation

### CMS: Fill Content Gaps
1. Open Calendar view
2. Click "Magic Wand" (purple wand icon)
3. Select "Fill Career Path Gaps" or "Fill Career Path Pro Gaps"
4. Oracle identifies dates with missing puzzles
5. AI suggests players for each gap
6. Puzzles created as drafts with `source: 'ai_oracle'`
7. Review and publish

### CMS: Triage Reports
1. Red badge appears on GameModeDot for puzzles with pending reports
2. Click day → open puzzle editor
3. View reports section (type, comment, timestamp)
4. Fix the data
5. Click "Resolve" (or "Dismiss" if report invalid)

## Future Improvements

1. **Report notifications:** Push notification to CMS operators for new reports
2. **Batch resolution:** Resolve multiple reports at once
3. **Reporter feedback:** Notify users when their report is resolved
4. **Auto-refresh detection:** Flag puzzles where Wikipedia was updated since scouting
5. **Oracle learning:** Track which suggestions lead to good puzzles
