# Decision: Sync Safety with Completion Protection

**Date:** 2026-01-14
**Status:** Implemented
**Context:** Puzzle Sync Engine Data Integrity

## Problem

SDET audit identified critical data loss vulnerabilities in the puzzle sync engine:

1. **Anonymous User Duplication** (Critical): `userId ?? attempt.id` fallback created new rows each sync
2. **Stale Overwrite** (Critical): Last-write-wins UPSERT allowed old incomplete data to overwrite completions
3. **Missing Unique Constraint**: No `UNIQUE (user_id, puzzle_id)` enabled duplicate rows
4. **Overly Permissive RLS**: Anonymous INSERT allowed ANY user_id

### Root Cause Analysis

The `userId ?? attempt.id` fallback was a misunderstanding. Anonymous users via `signInAnonymously()` already have a persistent `user.id` from Supabase. The bug occurred when `syncAttempts()` was called before auth initialized, causing `userId` to be null and falling back to `attempt.id` (unique per attempt).

## Decision

Implement "Completion Protection" - once a puzzle attempt is marked `completed=true`, it can never be overwritten by incomplete data from stale devices.

### Implementation

**1. Guard Against Null UserId** (`src/features/puzzles/context/PuzzleContext.tsx`):
```typescript
const syncAttempts = useCallback(async (): Promise<SyncResult> => {
  // Guard: Don't sync if auth hasn't provided a user ID yet
  if (!userId) {
    return { success: true, syncedCount: 0 };
  }
  const result = await syncAttemptsToSupabase(userId);
  return result;
}, [userId]);
```

**2. Require Non-Null UserId** (`src/features/puzzles/services/attemptSyncService.ts`):
```typescript
// Changed from userId: string | null to userId: string
export async function syncAttemptsToSupabase(userId: string): Promise<SyncResult>
```

**3. Safe Upsert Function** (`supabase/migrations/012_safe_attempt_upsert.sql`):
```sql
CREATE OR REPLACE FUNCTION safe_upsert_attempt(...)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO puzzle_attempts (...)
  ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
    -- COMPLETION PROTECTION: Never un-complete a completed attempt
    completed = CASE
      WHEN puzzle_attempts.completed = true THEN true
      ELSE COALESCE(EXCLUDED.completed, false)
    END,
    -- ... similar CASE logic for score, metadata, etc.
  WHERE
    COALESCE(EXCLUDED.completed, false) = true
    OR puzzle_attempts.completed IS NOT TRUE;
END;
$$;
```

**4. Unique Constraint**:
```sql
ALTER TABLE puzzle_attempts
  ADD CONSTRAINT unique_user_puzzle UNIQUE (user_id, puzzle_id);
```

**5. Hardened RLS Policy**:
```sql
-- Remove overly permissive anonymous branch
DROP POLICY IF EXISTS "Insert own attempts" ON puzzle_attempts;
CREATE POLICY "Insert own attempts" ON puzzle_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Revoke grants from anon role (anonymous users use authenticated role)
REVOKE INSERT ON puzzle_attempts FROM anon;
```

### Consequences

**Positive:**
- Completed attempts are protected from stale device syncs
- No more duplicate rows per user/puzzle
- Proper authorization: users can only insert their own attempts
- Anonymous users work correctly via `signInAnonymously()`

**Negative:**
- Migration must clean up existing duplicates (handled in migration)
- Requires schema change (unique constraint)

**Technical:**
- RPC call replaces direct `.upsert()` for attempts
- Existing completion data is preserved during migration

## Alternatives Considered

1. **Timestamp-based conflict resolution**
   - Rejected: Complex, clock skew issues, still doesn't protect completions

2. **Client-side completion check before sync**
   - Rejected: Race condition still possible, doesn't fix server-side

3. **Keep last-write-wins with client deduplication**
   - Rejected: Doesn't protect against stale syncs from offline devices

## Verification

### SQL Verification
```sql
-- Check for duplicates (should return 0)
SELECT user_id, puzzle_id, COUNT(*)
FROM puzzle_attempts
GROUP BY user_id, puzzle_id
HAVING COUNT(*) > 1;

-- Check constraint exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'puzzle_attempts' AND constraint_type = 'UNIQUE';
```

### Test Scenarios
1. Anonymous user plays puzzle - single row created
2. Same user plays again - row updated (not duplicated)
3. Device A completes, Device B syncs old incomplete - completion preserved
4. Verify Archive screen loads without crashes
5. Verify distribution graph shows accurate data

## References

- **Migration:** `supabase/migrations/012_safe_attempt_upsert.sql`
- **Service:** `src/features/puzzles/services/attemptSyncService.ts`
- **Context:** `src/features/puzzles/context/PuzzleContext.tsx`
- **SDET Audit:** `SDET_AUDIT_REPORT.md`
- **Plan:** `/Users/charlie/.claude/plans/federated-watching-porcupine.md`
