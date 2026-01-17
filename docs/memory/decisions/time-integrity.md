# Time Integrity System

## Decision
Implement server-authoritative time validation to prevent clock manipulation exploits.

## Context
Users could manipulate their device clock to:
- Access unreleased future puzzles by setting clock forward
- Replay old archived puzzles without premium by setting clock back
- Bypass the 7-day free access window

## Solution

### Architecture
```
worldtimeapi.org → Supabase RPC (fallback) → AsyncStorage cache (offline)
                         ↓
              Unix timestamp comparison (drift detection)
                         ↓
              Local date string for puzzle filtering
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drift detection | Unix timestamps | Timezone-agnostic - compares moments in time |
| Date display | Local timezone | Users wake up to fresh puzzles at their midnight |
| Threshold | ±5 minutes | Accounts for natural clock skew, NTP sync delays |
| Blocking | Non-dismissible overlay | Security requirement - no bypass without fixing clock |
| Offline | Cached time comparison | Detects backward clock manipulation |

### Why Local Timezone (Not UTC)?
- **User expectation**: Wordle, NYT Games, etc. use local midnight
- **Fair play**: UTC midnight = 7 PM EST, users would get "tomorrow's" puzzles in evening
- **Consistency**: Puzzles roll over when user's day rolls over

### Why Non-Blocking Startup?
- **UX**: Don't delay app startup for network call
- **Safety**: Overlay appears after content loads, still blocking interaction
- **Offline**: App remains usable with cached verification

## Files
- `src/lib/time.ts` - Core time utility
- `src/features/integrity/` - IntegrityGuardProvider, useIntegrity hook
- `src/components/TimeTamperedOverlay.tsx` - Blocking overlay UI
- `supabase/migrations/013_create_get_server_time_rpc.sql` - Server time RPC

## Testing
1. Set device clock +10 minutes → Overlay should appear
2. Set device clock -10 minutes → Overlay should appear
3. Set device clock +2 minutes → App works normally
4. Wait for local midnight → Puzzles auto-refresh
5. Airplane mode + clock back → Tampering detected via cache
