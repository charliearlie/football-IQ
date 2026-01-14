# Decision: Permanent Unlock for Completed Archive Puzzles

**Date:** 2026-01-14
**Status:** Implemented
**Context:** Archive Screen UX

## Problem

Free users completing puzzles within the 7-day window would see those puzzles become "locked" after the window expired. This created confusion and frustration:
- Users: "I beat this puzzle last week, why can't I see my result now?"
- Reduced perceived value of completing puzzles
- Negative UX: taking away access to earned content

## Decision

**Completed puzzles are permanently unlocked for viewing results**, regardless of the 7-day free window or premium status.

### Implementation

**Lock Logic Update** (`src/features/archive/utils/dateGrouping.ts`):
```typescript
export function isPuzzleLocked(
  puzzleDate: string,
  isPremium: boolean,
  puzzleId?: string,
  adUnlocks?: UnlockedPuzzle[],
  hasCompletedAttempt?: boolean  // NEW PARAMETER
): boolean {
  // HIGHEST PRIORITY: Completed puzzles are never locked
  if (hasCompletedAttempt) return false;

  // Premium users: never locked
  if (isPremium) return false;

  // Within free window: not locked
  if (isWithinFreeWindow(puzzleDate)) return false;

  // Has valid ad unlock: not locked
  if (puzzleId && adUnlocks && hasValidAdUnlock(puzzleId, adUnlocks)) {
    return false;
  }

  // Otherwise: locked
  return true;
}
```

**Archive Hook Update** (`src/features/archive/hooks/useArchivePuzzles.ts`):
```typescript
const transformEntry = useCallback(
  async (entry: LocalCatalogEntry, allUnlocks: UnlockedPuzzle[]): Promise<ArchivePuzzle> => {
    // Fetch attempt data first to check completion status
    const attempt = await getAttemptByPuzzleId(entry.id);
    const hasCompletedAttempt = attempt?.completed === true;

    // Check lock status - completed puzzles are NEVER locked
    const isLocked = isPuzzleLocked(
      entry.puzzle_date,
      isPremium,
      entry.id,
      allUnlocks,
      hasCompletedAttempt  // Pass completion status
    );
    // ... rest of function
  },
  [isPremium]
);
```

### Consequences

**Positive:**
- Users maintain permanent access to their achievements
- Encourages daily engagement ("complete before it locks")
- Better perceived value of the free tier
- Aligns with user expectations (earned content stays accessible)

**Negative:**
- Slightly reduced premium pressure (users can review old results without upgrade)
- Mitigation: They still can't *play* locked puzzles, only view results

**Technical:**
- No performance impact (attempt data already fetched for status)
- Lock recheck logic updated to preserve completion state
- All 55 archive tests still pass

## Alternatives Considered

1. **Keep current behavior** (lock completed puzzles after 7 days)
   - Rejected: Poor UX, taking away earned content

2. **Only unlock if user scored perfectly**
   - Rejected: Arbitrary, still feels punishing for non-perfect completions

3. **Add "View Result" premium feature**
   - Rejected: Over-complicating the premium tier

## Related Changes

### 1. Incomplete Filter (SQL-Level Implementation)
Added special SQL query handling for incomplete filter:
- Uses LEFT JOIN: `SELECT pc.* FROM puzzle_catalog pc LEFT JOIN attempts a ON pc.id = a.puzzle_id`
- Filter condition: `WHERE (a.id IS NULL OR a.completed = 0)`
- Shows puzzles with no attempt OR `completed=0` (not started OR in-progress)
- Performance optimized with index on `attempts(puzzle_id, completed)`
- New functions: `getCatalogEntriesIncomplete()` and `getCatalogEntryCountIncomplete()`

### 2. Anonymous User Attempt Syncing (RLS Policy Update)
Fixed RLS policy to allow anonymous users to insert puzzle attempts:
- Migration: `supabase/migrations/010_allow_anonymous_attempts.sql`
- Policy change: Split "Own attempts" policy into 4 separate policies (INSERT, SELECT, UPDATE, DELETE)
- Anonymous INSERT: Allows `auth.uid() IS NULL` with client-generated UUID as user_id
- Grants `INSERT` and `SELECT` permissions to `anon` role
- Updated `attemptSyncService.ts` to use `userId ?? attempt.id` for anonymous users
- Updated `PuzzleContext.tsx` to allow sync for both authenticated and anonymous users

## References

- **Implementation Files:**
  - `src/features/archive/utils/dateGrouping.ts` (lock logic)
  - `src/features/archive/hooks/useArchivePuzzles.ts` (transform function)
  - `src/lib/database.ts` (incomplete filter queries)
  - `src/features/puzzles/services/attemptSyncService.ts` (anonymous sync)
  - `src/features/puzzles/context/PuzzleContext.tsx` (sync calls)

- **Database:**
  - Migration: `supabase/migrations/010_allow_anonymous_attempts.sql`
  - RLS Tests: `tests/supabase_rls_test.sql` (Tests 7-9)

- **Tests:**
  - `src/features/archive/__tests__/CompletedUnlock.test.ts` (12 tests, all passing)
  - `src/features/archive/__tests__/IncompleteFilter.test.ts` (8 tests, all passing)
  - All archive tests: 75 tests passing

- **Documentation:**
  - `docs/memory/project-context.md` (Archive Screen section updated)
  - `docs/memory/quick-reference.md` (Archive Screen section updated)

- **Plan:** `/Users/charlie/.claude/plans/deep-hopping-duckling.md`
