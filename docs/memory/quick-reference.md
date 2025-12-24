# Football IQ - Quick Reference

## Supabase Project
- **URL**: https://pgqtkmfjdyjthzlcectg.supabase.co
- **Project Ref**: `pgqtkmfjdyjthzlcectg`

## Database Tables
```
daily_puzzles    - Puzzles (RLS: 3-tier access)
profiles         - User profiles (RLS: read all, update own)
puzzle_attempts  - Attempts (RLS: owner-only)
user_streaks     - Streaks (RLS: owner-only)
agent_runs       - AI logs (RLS: blocked, admin-only)
match_data       - Match data (RLS: blocked, admin-only)
```

## 3-Tier Puzzle Access
```
Anonymous  → Today only
Logged in  → Last 7 days
Premium    → Full archive
```

## Auth Methods
- Anonymous Sign-in (auto on first launch)
- Email OTP (passwordless upgrade)

## Auth Hooks
```typescript
// Get auth state and actions
const { user, isAnonymous, isPremium, signInWithOTP, verifyOTP } = useAuth();

// Get profile with realtime updates
const { profile, isPremium, needsDisplayName } = useProfile(userId);
```

## Auth Components
```
<AuthProvider>       # Wraps app, provides auth context
<AuthGate>           # Blocks until auth initialized
<AuthLoadingScreen>  # Loading indicator (pitchGreen)
<FirstRunModal>      # Display name prompt
```

## Local SQLite Database
```
puzzles      - Cached puzzles (offline play)
attempts     - User attempts (synced flag)
sync_queue   - Pending sync to Supabase
```

```typescript
import { initDatabase, savePuzzle, saveAttempt } from '@/lib/database';

// Initialize in _layout.tsx (already done)
await initDatabase();

// Save/retrieve puzzles
await savePuzzle({ id, game_mode, puzzle_date, content, difficulty, synced_at });
const puzzle = await getPuzzle(id);

// Save/retrieve attempts
await saveAttempt({ id, puzzle_id, completed: 1, score, synced: 0 });
const unsynced = await getUnsyncedAttempts();
```

## Key Files
- PRD: `docs/app-prd.md`
- Design System: `docs/design-system.md`
- Roadmap: `docs/roadmap.md`
- RLS Tests: `tests/supabase_rls_test.sql`
- Auth Feature: `src/features/auth/`
- Local DB: `src/lib/database.ts`

## Expo App Structure
```
app/
  _layout.tsx           # Root layout (fonts, DB init, AuthProvider)
  (tabs)/_layout.tsx    # Tab navigator
  design-lab.tsx        # Component showcase
src/
  components/           # ElevatedButton, GlassCard
  theme/               # colors, typography, spacing
  hooks/               # useHaptics
  lib/
    supabase.ts        # Supabase client (cloud)
    database.ts        # SQLite client (local)
  types/
    supabase.ts        # Supabase DB types
    database.ts        # Local DB types
  features/
    auth/              # AuthProvider, useAuth, useProfile
    home/
    games/
    archive/
    stats/
```

## Design Tokens
```
@/theme/colors      # pitchGreen, stadiumNavy, etc.
@/theme/typography  # fonts, textStyles
@/theme/spacing     # spacing, borderRadius
```

## Core Components
```
<ElevatedButton title="Play" onPress={fn} />
<GlassCard>{children}</GlassCard>
```

## Scripts
```
npm start            # Start Expo dev server
npm test             # Run Jest tests
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
```

## Migrations
```
001_create_base_tables
002_enable_rls_policies
003_create_triggers
004_security_fixes
```
