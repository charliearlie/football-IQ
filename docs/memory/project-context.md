# Football IQ - Project Context

## Project Overview
Football IQ is a mobile trivia game for football fans featuring daily puzzles across 5 game modes:
1. Career Path - Guess player from sequential clues
2. Tic Tac Toe - 3x3 grid of categories
3. Guess the Transfer - Identify player from transfer info
4. Guess the Goalscorers - Name scorers from match result
5. Topical Quiz - 10 multiple-choice questions

## Tech Stack
- **Mobile App**: React Native + Expo
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Local Storage**: Expo SQLite (offline play)
- **CMS**: Next.js (Admin Dashboard)
- **AI Agents**: TBD (puzzle generation)

## Database Schema (Supabase)
Initialized: 2025-12-23

### Tables
| Table | RLS | Purpose |
|-------|-----|---------|
| `daily_puzzles` | Yes | One puzzle per game mode per day |
| `profiles` | Yes | User profiles with premium status |
| `puzzle_attempts` | Yes | Track user puzzle attempts |
| `user_streaks` | Yes | Track streaks per game mode |
| `agent_runs` | Yes (blocked) | AI agent execution logs (admin-only) |
| `match_data` | Yes (blocked) | Football match data (admin-only) |

### Puzzle Access Model (3-tier RLS)
| Tier | User Type | Access |
|------|-----------|--------|
| 1 | Anonymous (no account) | Today's puzzle only |
| 2 | Authenticated (free) | Last 7 days |
| 3 | Premium | Full archive |

### Key Triggers
- `on_auth_user_created`: Auto-creates profile when user signs up
- `update_*_updated_at`: Auto-updates `updated_at` on all tables

### Migrations Applied
1. `001_create_base_tables` - 6 tables with constraints
2. `002_enable_rls_policies` - RLS + access policies
3. `003_create_triggers` - Profile creation + updated_at
4. `004_security_fixes` - Function search_path + admin table RLS

## Authentication
Initialized: 2025-12-23

### Auth Flow (Zero Friction)
1. **App Mount**: Check for existing session via `supabase.auth.getSession()`
2. **No Session**: Auto sign-in anonymously via `signInAnonymously()`
3. **First Run**: Prompt user for display_name via FirstRunModal
4. **OTP Upgrade**: Users can link email to keep data across devices

### Auth Methods
- Anonymous Sign-in (auto on first launch)
- Email OTP (passwordless login for account upgrade)
- OTP links to existing anonymous account (preserves uid and all data)

### Auth Architecture
```
AuthProvider (wraps app)
  └─ AuthGate (blocks until initialized)
       ├─ AuthLoadingScreen (while initializing)
       └─ FirstRunModal (if no display_name)
```

### Key Hooks
| Hook | Purpose |
|------|---------|
| `useAuth()` | Auth state + actions (signInWithOTP, verifyOTP, etc.) |
| `useProfile(userId)` | Profile data with realtime subscription |

### Session Persistence
- Uses `@react-native-async-storage/async-storage` for session storage
- Auto token refresh enabled
- Session persists across app restarts

## Key Decisions
- Puzzle content stored as JSONB for flexibility across game modes
- 7-day free window to encourage engagement before purchase
- RLS enforces access at database level (cannot bypass)
- Admin tables (agent_runs, match_data) blocked from public API

## Local Storage (SQLite)
Initialized: 2025-12-24

### Purpose
Offline-first data persistence that:
1. Mirrors puzzle data from Supabase for offline play
2. Caches user attempts locally until sync
3. Queues changes for eventual sync to cloud

### Library
- **expo-sqlite**: Native SQLite for React Native/Expo

### Schema (Version 1)
| Table | Purpose |
|-------|---------|
| `puzzles` | Cached puzzle data from Supabase |
| `attempts` | User puzzle attempts (synced flag tracks cloud sync) |
| `sync_queue` | Queue of changes pending sync to Supabase |

### Tables
```sql
puzzles (
  id TEXT PRIMARY KEY,
  game_mode TEXT,
  puzzle_date TEXT,
  content TEXT,       -- JSON stringified
  difficulty TEXT,
  synced_at TEXT
)

attempts (
  id TEXT PRIMARY KEY,
  puzzle_id TEXT,
  completed INTEGER,  -- 0/1 boolean
  score INTEGER,
  score_display TEXT,
  metadata TEXT,      -- JSON stringified
  started_at TEXT,
  completed_at TEXT,
  synced INTEGER      -- 0=pending, 1=synced
)

sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT,
  record_id TEXT,
  action TEXT,        -- INSERT/UPDATE/DELETE
  payload TEXT,       -- JSON stringified
  created_at TEXT
)
```

### Key Functions
| Function | Purpose |
|----------|---------|
| `initDatabase()` | Initialize DB, run migrations |
| `savePuzzle()` / `getPuzzle()` | Puzzle CRUD |
| `saveAttempt()` / `getAttempt()` | Attempt CRUD |
| `getUnsyncedAttempts()` | Get attempts pending sync |
| `addToSyncQueue()` | Queue change for sync |

### Initialization
Database initializes in `app/_layout.tsx` via `useEffect`, blocking splash screen until ready. Graceful degradation if init fails (app continues with network-only mode).

### Migration Strategy
Uses `PRAGMA user_version` for incremental schema versioning.

## Mobile App Architecture
Initialized: 2025-12-23

### Framework
- **Expo SDK**: ~52.0.0
- **Expo Router**: ~4.0.x (file-based routing)
- **TypeScript**: ~5.6.x with path aliases

### Folder Structure
```
app/                    # Expo Router screens
  (tabs)/              # Bottom tab navigator
    index.tsx          # Home tab
    games.tsx          # Games tab
    archive.tsx        # Archive tab
    stats.tsx          # Stats tab
  design-lab.tsx       # Component showcase (dev)
src/
  components/          # Shared UI components
  features/            # Folder-by-feature modules
    home/
    games/
    archive/
    stats/
  hooks/               # Shared hooks
  lib/                 # Utilities (Supabase client)
  theme/               # Design system tokens
  types/               # TypeScript types
```

### Design System ("Digital Pitch")
| Token | Value | Usage |
|-------|-------|-------|
| Pitch Green | #58CC02 | Primary actions |
| Grass Shadow | #46A302 | Button shadows |
| Stadium Navy | #0F172A | Background |
| Floodlight White | #F8FAFC | Text |
| Card Yellow | #FACC15 | Highlights |
| Red Card | #EF4444 | Errors |

### Core Components
- **ElevatedButton**: Neubrutalist 3D button with haptic feedback
- **GlassCard**: Frosted glass container (expo-blur)

### Typography
- **Headlines**: Bebas Neue
- **Body/UI**: Inter (Regular + Bold)

### Navigation
- Bottom tabs: Home, Games, Archive, Stats
- Icons: lucide-react-native (2px stroke)
