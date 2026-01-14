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
In `useArchivePuzzles.ts` `transformEntry()`:
```typescript
// Always fetch attempt data first
const attempt = await getAttemptByPuzzleId(entry.id);

// Determine status
if (attempt?.completed) {
  status = 'done';
}

// Completed puzzles bypass lock check
const isLocked = status === 'done'
  ? false  // Always unlocked for viewing results
  : isPuzzleLocked(entry.puzzle_date, isPremium, entry.id, adUnlocks);
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

Added "Incomplete" filter to help users focus on unfinished puzzles:
- Shows puzzles with `status !== 'done'` (not started OR in-progress)
- Works across all game modes and dates
- Complements the permanent unlock behavior

## References

- Implementation: `src/features/archive/hooks/useArchivePuzzles.ts`
- Tests: `src/features/archive/__tests__/Gating.test.tsx`
- Plan: `/Users/charlie/.claude/plans/effervescent-soaring-elephant.md`
