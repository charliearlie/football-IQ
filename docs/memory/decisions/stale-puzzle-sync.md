# Version-Aware Puzzle Sync (Stale Puzzle Fix)

## Decision
Implement per-puzzle staleness detection using `updated_at` timestamps to catch CMS edits and refresh stale cached puzzles when the app returns to foreground.

## Context
When puzzles are edited in the CMS (e.g., changing "Cristiano Ronaldo" to "Lionel Messi"):
- The Supabase `daily_puzzles.updated_at` changes
- But the mobile app didn't detect this change
- Users would see stale content until the next midnight refresh

This was problematic for:
- Fixing content errors in live puzzles
- Making last-minute corrections
- A/B testing different puzzle versions

## Solution

### Architecture
```
App Foreground Event (AppState)
            ↓
    Light Sync (30s cooldown)
            ↓
  Phase 1: Fetch id, updated_at from Supabase
            ↓
  Phase 2: Compare with local SQLite timestamps
            ↓
  Phase 3: Fetch full content only for stale puzzles
            ↓
  Sentry.captureMessage('Puzzle Cache Invalidated')
            ↓
      Toast notification
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sync trigger | AppState 'active' | Catches edits made while app backgrounded |
| Cooldown | 30 seconds | Prevents rapid-fire checks on quick bg/fg cycles |
| Comparison | Per-puzzle updated_at | Precise - only refreshes actually changed puzzles |
| Phase 1 | Fetch only timestamps | Minimizes bandwidth - doesn't fetch full content |
| Date range | 7 days (free) / 30 days (premium) | Matches RLS access tiers |
| Offline handling | Silent skip | Graceful degradation - no error toast |
| Toast | Non-blocking, auto-dismiss | Informs user without interrupting flow |

### Schema Migration (v5)
```sql
ALTER TABLE puzzles ADD COLUMN updated_at TEXT;
UPDATE puzzles SET updated_at = synced_at WHERE updated_at IS NULL;
```

The `updated_at` column stores the server's timestamp (from Supabase), distinct from `synced_at` which tracks when *we* synced. This enables precise staleness detection.

### Why Not Just Use Global lastSyncedAt?
- **Precision**: Global timestamp would re-fetch ALL puzzles, not just changed ones
- **Bandwidth**: Light sync fetches ~100 bytes per puzzle (id + timestamp), not full content
- **UX**: Only refreshes puzzles that actually changed

### Why 30-Second Cooldown?
- **Rapid cycling**: Users might quickly switch apps multiple times
- **Battery**: Prevents excessive network calls
- **Realistic editing**: CMS edits typically aren't sub-30-second rapid-fire

## Files
- `src/lib/database.ts` - Schema v5 migration, `getPuzzleTimestampsForDateRange()`
- `src/types/database.ts` - `LocalPuzzle.updated_at` field
- `src/features/puzzles/services/puzzleSyncService.ts` - Transform preserves `updated_at`
- `src/features/puzzles/services/puzzleLightSyncService.ts` - Light sync logic
- `src/features/puzzles/context/PuzzleContext.tsx` - AppState listener, toast state
- `src/features/puzzles/types/puzzle.types.ts` - Toast-related context properties
- `src/components/PuzzleUpdateToast.tsx` - Toast UI component
- `app/_layout.tsx` - Toast renderer integration

## Testing
1. Install app, load a puzzle (e.g., Career Path)
2. Edit puzzle in CMS (change answer)
3. Background the app for 5+ seconds
4. Foreground the app
5. **Expected**: Toast appears "Puzzle updated", content shows new answer

### Sentry Monitoring
- Check for `Puzzle Cache Invalidated` messages after deployment
- `extra.puzzleIds` shows which puzzles were refreshed
- `tags.updated_count` shows frequency of cache misses

## Success Criteria
- CMS edit detected within 5 seconds of app foreground
- Toast appears with correct count
- Content updates without user action
- No false positives (toast only when actually stale)
