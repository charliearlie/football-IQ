# Football IQ - Project Context

## Project Overview
Football IQ is a mobile trivia game for football fans featuring daily puzzles across 6 game modes:
1. Career Path - Guess player from sequential clues
2. The Grid - Fill 3x3 matrix with players matching row/column criteria
3. Guess the Transfer - Identify player from transfer info
4. Guess the Goalscorers - Name scorers from match result
5. Topical Quiz - 5 multiple-choice questions on current events
6. Top Tens (Premium) - Name all 10 answers in a ranked list

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

### Schema (Version 3)
| Table | Purpose |
|-------|---------|
| `puzzles` | Cached puzzle data from Supabase |
| `attempts` | User puzzle attempts (synced flag tracks cloud sync) |
| `sync_queue` | Queue of changes pending sync to Supabase |
| `unlocked_puzzles` | Ad-unlocked puzzles (permanent) |

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

unlocked_puzzles (    -- Added in migration v3
  puzzle_id TEXT PRIMARY KEY,
  unlocked_at TEXT    -- ISO timestamp (permanent unlock)
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
| `saveAdUnlock()` / `isAdUnlocked()` | Ad unlock CRUD (permanent) |
| `getValidAdUnlocks()` | Get all ad unlocks |

### Initialization
Database initializes in `app/_layout.tsx` via `useEffect`, blocking splash screen until ready. Graceful degradation if init fails (app continues with network-only mode).

### Migration Strategy
Uses `PRAGMA user_version` for incremental schema versioning.

## Player Database
Initialized: 2026-01-10

### Overview
Centralized SQLite database for local-first player search functionality. Powers "The Grid" game mode validation with plans to extend to "Goalscorer Recall".

### Schema (Added in Migration v4)
```sql
player_database (
  id TEXT PRIMARY KEY,
  external_id INTEGER UNIQUE,      -- For sync deduplication
  name TEXT,                       -- Display name (e.g., "Lionel Messi")
  search_name TEXT,                -- Normalized for search (e.g., "lionel messi")
  clubs TEXT,                      -- JSON array ["Barcelona", "PSG", "Inter Miami"]
  nationalities TEXT,              -- JSON array of ISO codes ["AR"]
  is_active INTEGER,               -- 0/1 boolean
  last_synced_at TEXT
)

-- Indexes for performance
idx_player_search_name ON player_database(search_name)
idx_player_external_id ON player_database(external_id)
```

### Search Service
**Location:** `src/services/player/`

Key functions:
| Function | Purpose |
|----------|---------|
| `searchPlayers(query, limit)` | LIKE query on search_name, ranked by relevance |
| `getPlayerById(id)` | Single player lookup |
| `didPlayerPlayFor(playerId, clubName)` | Club membership check with fuzzy tolerance |
| `hasNationality(playerId, code)` | Nationality check (ISO code) |
| `findPlayersMatchingCriteria(name, club?, nationality?)` | Combined search + filter |

### Search Algorithm
1. Minimum 3 characters required
2. LIKE query on normalized `search_name`
3. Results ranked by relevance score:
   - Exact prefix match: 1.0
   - Contains query: 0.8-0.9 (position-based)
   - Fuzzy match: 0.0-0.6 (Levenshtein distance)

### Utility Functions
**Location:** `src/services/player/playerUtils.ts`

| Function | Purpose |
|----------|---------|
| `normalizeSearchName(name)` | Lowercase, NFD normalization, special char mapping |
| `levenshteinDistance(a, b)` | Edit distance for fuzzy matching |
| `countryCodeToEmoji(code)` | ISO code to flag emoji (e.g., "BR" → "🇧🇷") |
| `calculateRelevance(query, searchName)` | Relevance score 0-1 |
| `clubsMatch(playerClub, targetClub, tolerance)` | Fuzzy club name matching |

### UI Components
**Location:** `src/components/PlayerSearchOverlay/`

| Component | Purpose |
|-----------|---------|
| `PlayerSearchOverlay` | Modal overlay with debounced search (200ms) |
| `PlayerResultItem` | Player row with flags, name, clubs |

### The Grid Integration
The Grid uses database validation instead of pre-defined `valid_answers`:
1. User taps cell → opens `PlayerSearchOverlay`
2. User searches and selects player
3. `validateCellWithDB(playerId, cellIndex, content)` checks:
   - Row criterion: club → `didPlayerPlayFor()`, nation → `hasNationality()`
   - Column criterion: same checks
   - Player must match BOTH criteria

**Supported category types:**
- `club`: Database lookup via `didPlayerPlayFor()`
- `nation`: Database lookup via `hasNationality()` (converts name to ISO code)
- `stat`/`trophy`: Not yet supported (returns false)

### Files
```
src/services/player/
  ├── index.ts                    # Barrel exports
  ├── playerSearch.ts             # Search service
  ├── playerUtils.ts              # Utility functions
  └── __tests__/
      └── SearchEngine.test.ts    # 37 TDD tests

src/components/PlayerSearchOverlay/
  ├── index.ts                    # Barrel exports
  ├── PlayerSearchOverlay.tsx     # Modal overlay
  └── PlayerResultItem.tsx        # Result row

src/features/the-grid/
  └── utils/validation.ts         # validateCellWithDB function

src/lib/database.ts               # Migration v4 + player CRUD operations
src/types/database.ts             # LocalPlayer, ParsedPlayer, PlayerSearchResult
```

### Tests
- `src/services/player/__tests__/SearchEngine.test.ts` - 37 tests (normalize, levenshtein, emoji, search)
- `src/features/the-grid/__tests__/DBValidation.test.ts` - 16 tests (validateCellWithDB)

## Sync Engine
Initialized: 2025-12-24

### Purpose
Bridges Supabase (cloud) and SQLite (local) for offline-first puzzle data:
1. Downloads puzzles from Supabase to SQLite for offline play
2. Pushes local attempts to Supabase when online
3. Respects 3-tier RLS access model automatically

### Architecture
```
PuzzleProvider (wraps app inside AuthGate)
  └─ usePuzzleContext() - state + sync actions
       ├─ puzzles: ParsedLocalPuzzle[]
       ├─ syncStatus: 'idle' | 'syncing' | 'success' | 'error'
       ├─ syncPuzzles() - Supabase → SQLite
       └─ syncAttempts() - SQLite → Supabase
```

### Sync Flow

#### Puzzle Sync (Supabase → SQLite)
```
1. PuzzleProvider mounts
2. Load cached puzzles from SQLite
3. Load lastSyncedAt from AsyncStorage
4. Call syncPuzzles():
   - Query Supabase daily_puzzles (RLS filters by user tier)
   - Premium users: incremental sync via lastSyncedAt
   - Transform JSON → stringified JSON
   - Upsert to local SQLite
5. Update state → UI shows "Ready to Play"
```

#### Attempt Sync (SQLite → Supabase)
```
1. User completes puzzle
2. saveAttempt() with synced=0
3. (Later) syncAttempts():
   - Get local attempts where synced=0
   - Add user_id from auth context
   - Insert to Supabase puzzle_attempts
   - markAttemptSynced() on success
```

### Key Hooks
| Hook | Purpose |
|------|---------|
| `usePuzzleContext()` | Full puzzle state + sync actions |
| `usePuzzle(gameMode)` | Today's puzzle for specific game mode |

### Persistence
- `lastSyncedAt` stored in AsyncStorage (`@puzzles_last_synced_at`)
- Enables incremental sync for premium users across app restarts

### Files
```
src/features/puzzles/
  ├── context/PuzzleContext.tsx     # Provider + usePuzzleContext
  ├── hooks/usePuzzle.ts            # usePuzzle(gameMode)
  ├── services/
  │   ├── puzzleSyncService.ts      # Supabase → SQLite
  │   └── attemptSyncService.ts     # SQLite → Supabase
  └── types/puzzle.types.ts         # Type definitions
```

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
  - `variant: 'primary' | 'secondary' | 'danger' | 'outline'`: Semantic color presets
    - `primary`: Pitch Green (default, main CTAs)
    - `secondary`: Stadium Navy (cancel, less emphasis)
    - `danger`: Red Card (destructive actions)
    - `outline`: Glass + white border (ghost buttons)
  - `topColor`/`shadowColor`: Override variant colors (backward compatible)
  - `fullWidth` prop: Stretches button to fill container width
  - `size: 'small' | 'medium' | 'large'`: Size variants with different offsets
  - Uses `triggerMedium()` haptics for prominent tactile feedback
- **GlassCard**: Frosted glass container (expo-blur)
  - `showShadow?: boolean`: Enables subtle drop shadow for depth (default: true)
  - Shadow: iOS shadowOffset + Android elevation for cross-platform consistency
- **UniversalGameCard**: Unified game card for Home and Archive screens
  - `variant: 'daily' | 'archive'`: Controls layout behavior
  - `date?: string`: Shows compact date (archive variant only)
  - `isLocked?: boolean`: Shows lock state (archive variant only)
  - `scoreDisplay?: string`: Emoji grid for done state
  - Uses `extractEmojiGrid()` from `@/utils/scoreDisplay` for text overflow prevention
  - Done state shows "Result" button (yellow) on both variants for consistency
  - Archive screen shows CompletedGameModal when clicking completed cards (matches Home behavior)

### Typography
- **Headlines**: Bebas Neue
- **Body/UI**: Inter (Regular + Bold)

### Navigation
- Bottom tabs: Home, Games, Archive, Stats
- Icons: lucide-react-native (2px stroke)

## Career Path Game Mode
Initialized: 2025-12-24
Updated: 2025-12-24 (Validation, Scoring, Persistence)

### Overview
Flagship game mode where players guess a footballer based on their career history. Career steps are revealed sequentially, with each incorrect guess revealing the next step as a penalty.

### Puzzle Content Structure
```typescript
interface CareerPathContent {
  answer: string;  // Correct player name
  career_steps: Array<{
    type: 'club' | 'loan';
    text: string;   // Club name
    year: string;   // Year range
    apps?: number;  // Appearances (optional)
    goals?: number; // Goals scored (optional)
  }>;
}
```

### Game State
```
revealedCount: 1 → starts with first step revealed
gameStatus: 'playing' | 'won' | 'lost'
score: GameScore | null → calculated on game end
attemptSaved: boolean → tracks persistence to SQLite
lastGuessIncorrect: triggers shake animation
```

### Validation (Fuzzy Matching)
Uses `string-similarity` library with Dice coefficient for intelligent name matching:
- **Case insensitive**: "MESSI" matches "Messi"
- **Accent normalization**: "Ozil" matches "Özil", "Sorloth" matches "Sørloth"
- **Partial names**: "Messi" matches "Lionel Messi" (surname matching)
- **Typo tolerance**: "Rogrers" matches "Rogers" (threshold: 0.85)
- **Short surname matching**: "Son" matches "Son Heung-min", "Saka" matches "Bukayo Saka"
  - Extracts first/last name parts for direct comparison
  - Lower containment threshold (0.25) for short inputs

### Scoring System
Dynamic scoring based on career steps revealed:
```
Formula: Score = Total Steps - (Revealed Steps - 1)

Examples (10-step career):
- Guessed on step 1: 10 points (perfect)
- Guessed on step 3: 8 points
- Lost (all revealed): 0 points
```

### Score Display (Wordle-style)
Emoji grid for sharing results:
- `⬛` = Hidden step (never revealed)
- `⬜` = Revealed step
- `🟩` = Winning step
- `🟥` = Final step (lost)

Example: `⬜⬜🟩⬛⬛` (won on step 3/5)

### Game Persistence
On game end (win/loss):
1. Generate score and emoji display
2. Save attempt to local SQLite via `saveAttempt()`
3. Queue for Supabase sync (synced: 0)
4. Mark `attemptSaved: true` in state

### Reveal Logic
1. **Manual Reveal**: "Reveal Next" button (Warning Orange #FF4D00)
2. **Penalty Reveal**: Incorrect guess auto-reveals next step
3. **Safety Net**: Reveal button hidden when all steps shown
4. **Lost State**: All steps revealed without correct guess

### Components
| Component | Purpose |
|-----------|---------|
| `CareerPathScreen` | Main screen with FlatList + ActionZone |
| `CareerStepCard` | Revealed career step with spring animation |
| `LockedCard` | Blurred locked step with lock icon |
| `ActionZone` | TextInput + Submit/Reveal buttons |
| `GameResultModal` | Full-screen modal with confetti + share |
| `Confetti` | Animated confetti effect on win |
| `GameResultBanner` | Legacy inline result display |

### Animations
- **Card entrance**: Spring animation (damping: 12, stiffness: 100)
- **Shake on error**: withSequence oscillation on input
- **Auto-scroll**: scrollToEnd on FlatList when step revealed
- **Confetti**: 30 animated pieces using Reanimated

### Files
```
src/features/career-path/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── CareerPathScreen.tsx
  ├── components/
  │   ├── CareerStepCard.tsx
  │   ├── LockedCard.tsx
  │   ├── ActionZone.tsx
  │   ├── GameResultModal.tsx     # NEW: Result modal with share
  │   ├── Confetti.tsx            # NEW: Win celebration
  │   └── GameResultBanner.tsx
  ├── hooks/
  │   └── useCareerPathGame.ts    # Fuzzy validation + scoring
  ├── utils/                       # NEW: Utility functions
  │   ├── validation.ts           # Fuzzy matching logic
  │   ├── scoring.ts              # Score calculation
  │   ├── scoreDisplay.ts         # Emoji grid generation
  │   └── share.ts                # Clipboard/share
  ├── types/
  │   └── careerPath.types.ts     # Includes GameScore
  └── __tests__/
      ├── CareerGame.test.tsx
      ├── Scrolling.test.tsx
      ├── validation.test.ts      # NEW: Fuzzy matching tests
      └── scoring.test.ts         # NEW: Score calculation tests
```

### Dependencies Added
- `string-similarity` - Fuzzy string matching
- `expo-clipboard` - Clipboard for sharing
- `uuid` - Generate attempt IDs

## Guess the Transfer Game Mode
Initialized: 2025-12-24

### Overview
Game mode where players guess a footballer based on transfer details (clubs, year, fee). Players can reveal hints for point penalties. Unlike Career Path, incorrect guesses do NOT reveal hints - hint revelation is voluntary.

### Puzzle Content Structure
```typescript
interface TransferGuessContent {
  answer: string;           // Correct player name
  from_club: string;        // Origin club name
  to_club: string;          // Destination club name
  year: number;             // Transfer year
  fee: string;              // e.g., "€80M", "Free"
  hints: [string, string, string];  // [nationality, position, achievement]
}
```

### Game State
```
hintsRevealed: 0 → starts with no hints (voluntary reveal)
guesses: string[] → tracks all incorrect guesses
gameStatus: 'playing' | 'won' | 'lost'
score: TransferGuessScore | null → calculated on game end
attemptSaved: boolean → tracks persistence to SQLite
lastGuessIncorrect: triggers shake animation
```

### Key Differences from Career Path
| Aspect | Career Path | Transfer Guess |
|--------|-------------|----------------|
| Initial reveals | 1 step | 0 hints |
| Wrong guess penalty | Reveals next step | No reveal (just counts) |
| Max wrong guesses | Until all revealed | 5 fixed |
| Give Up option | No | Yes |
| Scoring | totalSteps - (revealed - 1) | 10 - (hints×2) - (wrong×1), min 1 |

### Scoring System
Dynamic scoring with penalties:
```
Formula: Score = 10 - (hintsRevealed × 2) - (incorrectGuesses × 1)

Constants:
- Base: 10 points
- -2 per hint revealed (max -6)
- -1 per incorrect guess (max -4)
- Minimum: 1 point if eventually correct
- Loss: 0 points

Examples:
- Perfect (0 hints, 0 wrong): 10 points
- 2 hints, 0 wrong: 6 points
- 0 hints, 4 wrong: 6 points
- 3 hints, 4 wrong: 1 point (minimum)
```

### Score Display (Emoji Grid)
```
Hints:
- ⚫ = Hint not revealed
- 🟡 = Hint revealed

Guesses:
- ❌ = Incorrect guess
- ✅ = Correct guess (won)
- 💀 = Gave up or lost

Example: 🟡🟡⚫ ❌❌✅ (2 hints, 2 wrong, then correct)
```

### Validation
Reuses Career Path's fuzzy matching from `validation.ts`:
- Case insensitive, accent normalization
- Partial name matching (surname only)
- Typo tolerance (0.85 threshold)

### Components
| Component | Purpose |
|-----------|---------|
| `TransferGuessScreen` | Main screen with ScrollView layout |
| `TransferCard` | Transfer details with floating animation |
| `HintSlot` | Individual hint (locked/revealed) |
| `HintsSection` | Container for 3 hint slots |
| `TransferActionZone` | Input + Submit/Reveal/Give Up buttons |
| `TransferResultModal` | Result modal with confetti + share |

### Animations
- **TransferCard float**: Subtle up/down hover using `withRepeat`
- **HintSlot entrance**: Spring animation on reveal
- **Shake on error**: Same pattern as Career Path ActionZone

### Files
```
src/features/transfer-guess/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── TransferGuessScreen.tsx
  ├── components/
  │   ├── TransferCard.tsx
  │   ├── HintSlot.tsx
  │   ├── HintsSection.tsx
  │   ├── TransferActionZone.tsx
  │   └── TransferResultModal.tsx
  ├── hooks/
  │   └── useTransferGuessGame.ts
  ├── utils/
  │   ├── transferScoring.ts      # Scoring logic
  │   ├── transferScoreDisplay.ts # Emoji grid generation
  │   └── transferShare.ts        # Share functionality
  ├── types/
  │   └── transferGuess.types.ts
  └── __tests__/
      ├── transferScoring.test.ts # TDD scoring tests
      └── HintSlot.test.tsx       # UI visibility tests
```

### Navigation
- Route: `/transfer-guess`
- Accessible from Games tab card

## Goalscorer Recall Game Mode
Initialized: 2025-12-24
Updated: 2026-01-05 (Name matching, keyboard handling, UI polish)

### Overview
Timed challenge where players must name all goalscorers from a classic football match within 60 seconds. Tests football memory with multi-goal handling and fuzzy name matching.

### Puzzle Content Structure
```typescript
interface GoalscorerRecallContent {
  home_team: string;        // e.g., "Arsenal"
  away_team: string;        // e.g., "Leicester"
  home_score: number;       // Final home score
  away_score: number;       // Final away score
  competition: string;      // e.g., "Premier League"
  match_date: string;       // Display format: "15 May 2023"
  goals: Array<{
    scorer: string;         // Player name
    minute: number;         // Minute scored
    team: 'home' | 'away';  // Which team
    isOwnGoal?: boolean;    // Own goals auto-revealed
  }>;
}
```

### Game State
```
gameStatus: 'idle' | 'playing' | 'won' | 'lost'
timeRemaining: 60 → counts down to 0
foundScorers: Set<string> → unique scorers guessed
goals: GoalWithState[] → all goals with found status
```

### Key Mechanics
| Mechanic | Behavior |
|----------|----------|
| Timer | 60 seconds, turns red at 10s |
| Multi-goal | Naming a player fills ALL their slots |
| Own goals | Auto-revealed at start, excluded from scoring |
| Duplicates | Silently ignored (no feedback) |
| Give Up | Always available, ends game |

### Scoring System
```
Percentage: (scorersFound / totalScorers) × 100
Time Bonus: timeRemaining × 2 (only if ALL found)
Won: allFound && timeRemaining > 0
```

### Score Display (Emoji Grid)
Format: `⏱️42s | ✅✅✅❌❌`
- `⏱️` + time remaining
- `✅` = Goal found
- `❌` = Goal missed
- Own goals excluded from grid

### Validation
Reuses Career Path's fuzzy matching from `validation.ts`:
- Case insensitive, accent normalization
- Partial name matching (surname only)
- Typo tolerance (0.85 threshold)

### Components
| Component | Purpose |
|-----------|---------|
| `GoalscorerRecallScreen` | Main screen with timer + scoreboard |
| `MatchHeader` | Match info in GlassCard |
| `Scoreboard` | Two-column goal layout (home/away) |
| `GoalSlot` | Individual goal (locked/revealed) |
| `TimerDisplay` | Circular countdown (green→red at 10s) |
| `RecallActionZone` | TextInput + Guess/Give Up buttons |
| `StartOverlay` | Pre-game overlay with Start button |
| `GoalFlash` | "GOAL!" celebration animation |
| `RecallResultModal` | Result modal with share |

### Animations
- **TimerDisplay**: Color transition green→red via `interpolateColor`
- **GoalSlot**: Spring entrance when found
- **GoalFlash**: Scale + fade "GOAL!" text
- **RecallActionZone**: Shake on incorrect guess

### UX Improvements (2026-01-05, 2026-01-06)
- **KeyboardAvoidingView**: Input field never obscured by keyboard
- **Auto-scroll**: Scoreboard scrolls to end when goal found
- **Text truncation fix**: Long names wrap to 2 lines with font scaling
- **Result modal**: Loading state when score calculation pending
- **fullWidth buttons**: Modal buttons stretch to container width
- **Progressive save**: Game state saved on each correct guess, restored on return
  - Saves with `completed: 0` during gameplay
  - Restores `foundScorers`, `timeRemaining`, `attemptId` from metadata
  - Home screen shows "Resume" button for in-progress games
  - Uses `setTo()` on timer hook for restored time
- **GlassCard fix (2026-01-06)**: BlurView uses absolute positioning so content sizes properly in modals

### Hooks
| Hook | Purpose |
|------|---------|
| `useGoalscorerRecallGame` | Main game reducer + timer integration |
| `useCountdownTimer` | Reusable 1-second tick countdown |

### Files
```
src/features/goalscorer-recall/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── GoalscorerRecallScreen.tsx  # KeyboardAvoidingView, auto-scroll
  ├── components/
  │   ├── MatchHeader.tsx
  │   ├── Scoreboard.tsx          # ScrollView ref for auto-scroll
  │   ├── GoalSlot.tsx            # 2-line text with font scaling
  │   ├── TimerDisplay.tsx
  │   ├── RecallActionZone.tsx
  │   ├── StartOverlay.tsx
  │   ├── GoalFlash.tsx
  │   └── RecallResultModal.tsx   # Defensive rendering, fullWidth buttons
  ├── hooks/
  │   ├── useGoalscorerRecallGame.ts
  │   └── useCountdownTimer.ts
  ├── utils/
  │   ├── scoring.ts              # Score calculation
  │   ├── scoreDisplay.ts         # Emoji grid generation
  │   └── share.ts                # Share functionality
  ├── types/
  │   └── goalscorerRecall.types.ts
  └── __tests__/
      ├── timer.test.ts           # Countdown timer tests
      ├── recallLogic.test.ts     # Multi-goal, fuzzy matching tests
      ├── scoring.test.ts         # Percentage + time bonus tests
      ├── RecallResultModal.test.tsx  # Modal rendering tests (9 tests)
      └── ProgressiveSave.test.ts # Save/restore progress tests (7 tests)
```

### Navigation
- Route: `/goalscorer-recall`
- Accessible from Games tab card ('goalscorers')

## Tic Tac Toe Game Mode
Initialized: 2025-12-24

### Overview
3x3 grid game where players compete against AI. Each cell requires naming a footballer who satisfies BOTH the row category (e.g., "Real Madrid") and column category (e.g., "Brazil"). Turn-based gameplay with random AI opponent.

### Puzzle Content Structure
```typescript
interface TicTacToeContent {
  rows: [string, string, string];      // Row categories (left side)
  columns: [string, string, string];   // Column categories (top)
  valid_answers: {
    [cellIndex: string]: string[];     // Cell 0-8 → array of valid player names
  };
}
```

### Game State
```
cells: CellState[9] → each cell has owner ('player' | 'ai' | null) and playerName
gameStatus: 'playing' | 'won' | 'lost' | 'draw'
selectedCell: CellIndex | null → currently targeted cell
currentTurn: 'player' | 'ai' → whose turn
winningLine: [CellIndex, CellIndex, CellIndex] | null → winning combination
```

### Key Mechanics
| Mechanic | Behavior |
|----------|----------|
| Cell Selection | Tap empty cell to target it |
| Validation | Fuzzy matching against valid_answers for that cell |
| AI Turn | 600ms delay, picks random empty cell with random valid player |
| Win Detection | Standard Tic-Tac-Toe (3 in row/column/diagonal) |
| Draw | All 9 cells filled with no winner |

### Scoring System
```
Win:  10 points
Draw: 5 points
Loss: 0 points
```

### Score Display (Emoji Grid)
3x3 grid format:
- 🟢 = Player's cell
- 🔴 = AI's cell
- ⬜ = Empty cell

Example:
```
🟢🔴⬜
🔴🟢⬜
⬜⬜🟢
```

### Validation
Reuses Career Path's fuzzy matching from `validation.ts`:
- Case insensitive, accent normalization
- Partial name matching (surname only)
- Typo tolerance (0.85 threshold)
- Checks against all valid_answers for the specific cell

### Components
| Component | Purpose |
|-----------|---------|
| `TicTacToeScreen` | Main screen with grid + action zone |
| `TicTacToeGrid` | 3x3 grid with category headers |
| `GridCell` | Individual cell (empty/player/AI states) |
| `TicTacToeActionZone` | Input when cell selected |
| `TicTacToeResultModal` | Result modal with confetti + share |

### Animations
- **GridCell press**: Spring-based 3D button effect
- **Winning line**: Animated strike-through overlay
- **Win pulse**: Scale animation on winning cells
- **Action zone**: Slide-in/out + shake on error

### Files
```
src/features/tic-tac-toe/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── TicTacToeScreen.tsx
  ├── components/
  │   ├── GridCell.tsx
  │   ├── TicTacToeGrid.tsx
  │   ├── TicTacToeActionZone.tsx
  │   └── TicTacToeResultModal.tsx
  ├── hooks/
  │   └── useTicTacToeGame.ts
  ├── utils/
  │   ├── validation.ts           # Cell-specific validation
  │   ├── gameLogic.ts            # Win/draw detection, AI logic
  │   ├── scoreDisplay.ts         # Emoji grid generation
  │   └── share.ts                # Share functionality
  ├── types/
  │   └── ticTacToe.types.ts
  └── __tests__/
      ├── GridLogic.test.ts       # Cell validation tests
      └── WinCondition.test.ts    # 8 winning combinations tests
```

### Navigation
- Route: `/tic-tac-toe`
- Accessible from Games tab card ('tic-tac-toe')

## The Grid Game Mode
Initialized: 2026-01-10

### Overview
Replacement for Tic Tac Toe. A 3x3 matrix puzzle where players fill all 9 cells by naming footballers who satisfy both row (Y-axis) and column (X-axis) criteria. No AI opponent - pure knowledge challenge.

### Puzzle Content Structure
```typescript
type CategoryType = 'club' | 'nation' | 'stat' | 'trophy';

interface GridCategory {
  type: CategoryType;
  value: string;  // e.g., "Real Madrid", "France", "100+ Goals"
}

interface TheGridContent {
  xAxis: [GridCategory, GridCategory, GridCategory];  // Column headers
  yAxis: [GridCategory, GridCategory, GridCategory];  // Row headers
  valid_answers: {
    [cellIndex: string]: string[];  // "0"-"8" → valid player names
  };
}
```

### Game State
```
cells: (FilledCell | null)[9] → each cell has player name or null
selectedCell: CellIndex | null → currently targeted cell (0-8)
currentGuess: string → text input value
gameStatus: 'playing' | 'complete'
score: TheGridScore | null → calculated on game complete
attemptSaved: boolean → tracks persistence to SQLite
lastGuessIncorrect: triggers shake animation
```

### Key Mechanics
| Mechanic | Behavior |
|----------|----------|
| Cell Selection | Tap empty cell to target it |
| Validation | Fuzzy matching against valid_answers for that cell |
| Fill Cell | Correct guess fills cell, clears selection |
| Incorrect Guess | Shake animation, no penalty (retry allowed) |
| Game Complete | All 9 cells filled |

### Scoring System
Completion-based scoring: ~11 points per cell, max 100.
```
Formula: cellsFilled === 9 ? 100 : Math.round((cellsFilled / 9) * 100)

Examples:
- 9 cells filled: 100 points (perfect)
- 7 cells filled: 78 points
- 5 cells filled: 56 points
```

### Score Display (Emoji Grid)
3x3 grid format:
- ✅ = Cell filled
- ❌ = Cell empty

Example:
```
✅✅✅
✅✅❌
✅❌❌
```

### Validation
Reuses Career Path's fuzzy matching from `@/lib/validation`:
- Case insensitive, accent normalization
- Partial name matching (surname only)
- Typo tolerance (0.85 threshold)
- Checks against all valid_answers for the specific cell

### Components
| Component | Purpose |
|-----------|---------|
| `TheGridScreen` | Main screen with grid + action zone |
| `TheGridBoard` | 3x3 grid with category headers |
| `GridCell` | Individual cell (empty/filled states) |
| `CategoryHeader` | Icon + label for row/col headers |
| `TheGridActionZone` | Input when cell selected |
| `TheGridResultModal` | Result modal with confetti + share |

### Animations
- **GridCell press**: Spring-based 3D button effect
- **Fill animation**: Spring entrance for player name
- **Action zone**: Slide-in/out + shake on error
- **Confetti**: On perfect score (all 9 cells)

### Files
```
src/features/the-grid/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── TheGridScreen.tsx
  ├── components/
  │   ├── TheGridBoard.tsx
  │   ├── GridCell.tsx
  │   ├── CategoryHeader.tsx
  │   ├── TheGridActionZone.tsx
  │   └── TheGridResultModal.tsx
  ├── hooks/
  │   └── useTheGridGame.ts
  ├── utils/
  │   ├── validation.ts           # Cell-specific validation
  │   ├── scoring.ts              # Score calculation
  │   ├── scoreDisplay.ts         # Emoji grid generation
  │   └── share.ts                # Share functionality
  ├── types/
  │   └── theGrid.types.ts
  └── __tests__/
      ├── GridLogic.test.ts
      ├── SchemaMigration.test.ts
      └── TheGridUI.test.tsx
```

### Navigation
- Route: `/the-grid`
- Accessible from Home screen Daily 5 loop

### Legacy Tic Tac Toe
The original Tic Tac Toe game mode (`tic_tac_toe`) is preserved for:
- Archive review mode (completed games can still be viewed)
- Legacy puzzle data in database

Both game modes coexist - no data migration needed.

## Topical Quiz Game Mode
Initialized: 2025-12-27

### Overview
5-question multiple-choice quiz focused on current football events. Each question may optionally include an image. Auto-advances after answer with visual feedback.

### Puzzle Content Structure
```typescript
interface QuizQuestion {
  id: string;              // Unique question ID
  question: string;        // Question text
  imageUrl?: string;       // Optional image URL
  options: [string, string, string, string];  // 4 options (A-D)
  correctIndex: number;    // 0-3 correct answer index
}

interface TopicalQuizContent {
  questions: [QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion];
}
```

### Game State
```
currentQuestionIndex: 0 → 0-4
answers: QuizAnswer[] → records of each answer
gameStatus: 'playing' | 'complete'
score: TopicalQuizScore | null
attemptSaved: boolean
showingResult: boolean → true during 1.5s feedback
```

### Key Mechanics
| Mechanic | Behavior |
|----------|----------|
| Answer Selection | Tap option to select answer |
| Feedback | Correct = green, Wrong = red + show correct in green |
| Auto-advance | 1.5s delay after answer |
| Image | Optional per question with loading skeleton |
| Progress | 5 circles showing current position |

### Scoring System
```
Formula: 2 points per correct answer
Max: 10 points (5 correct)
Min: 0 points (0 correct)
```

### Score Display (Emoji Grid)
Format: `✅✅❌✅❌` (one per question)
- `✅` = Correct answer
- `❌` = Incorrect answer

Example: `✅✅✅❌✅` → 4/5 correct = 8 points

### Option Button States
| State | Appearance |
|-------|------------|
| default | Glass background, pressable |
| correct | pitchGreen (user picked correct) |
| incorrect | redCard (user picked wrong) |
| reveal | pitchGreen faded (show correct when user wrong) |
| disabled | Gray (during feedback) |

### Components
| Component | Purpose |
|-----------|---------|
| `TopicalQuizScreen` | Main screen with question flow |
| `QuizProgressBar` | 5 animated circles showing progress |
| `QuizQuestionCard` | GlassCard with optional image + question |
| `QuizOptionButton` | Option with feedback colors |
| `TopicalQuizResultModal` | Result modal with confetti + share |

### Animations
- **Progress bar**: Scale + color transitions on circles
- **Option buttons**: Spring press, color transitions
- **Question card**: Opacity fade between questions
- **Result modal**: Confetti reused from career-path

### Files
```
src/features/topical-quiz/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── TopicalQuizScreen.tsx
  ├── components/
  │   ├── QuizProgressBar.tsx
  │   ├── QuizQuestionCard.tsx
  │   ├── QuizOptionButton.tsx
  │   └── TopicalQuizResultModal.tsx
  ├── hooks/
  │   └── useTopicalQuizGame.ts   # Reducer + auto-advance timer
  ├── utils/
  │   ├── quizScoring.ts          # Score calculation
  │   ├── quizScoreDisplay.ts     # Emoji grid generation
  │   └── quizShare.ts            # Share functionality
  ├── types/
  │   └── topicalQuiz.types.ts
  └── __tests__/
      └── quizScoring.test.ts     # Scoring tests
```

### Navigation
- Route: `/topical-quiz`
- Accessible from Games tab card ('topical-quiz')
- Dynamic route: `/topical-quiz/[puzzleId]`

## Top Tens Game Mode
Initialized: 2026-01-11

### Overview
Premium-only ranking puzzle where players guess all 10 items in a top 10 list (inspired by TV show "Tenable"). Correct guesses reveal answers at their rank position. Players can continue guessing or give up to reveal all remaining answers.

### Premium Access
Top Tens is the first premium-only game mode. Non-premium users see it in the Daily Loop but must upgrade to play. Route-level protection via `PremiumOnlyGate` component.

### Puzzle Content Structure
```typescript
interface TopTensAnswer {
  name: string;           // Primary display name (e.g., "Alan Shearer")
  aliases?: string[];     // Alternative names (e.g., ["Shearer"])
  info?: string;          // Optional stat (e.g., "260 goals")
}

interface TopTensContent {
  title: string;          // Puzzle title (e.g., "Top 10 Premier League Goalscorers")
  category?: string;      // Category (e.g., "Premier League")
  answers: TopTensAnswer[]; // Ordered array where index 0 = Rank #1
}
```

### Game State
```
gameStatus: 'playing' | 'won' | 'lost'
rankSlots: RankSlotState[10] → each slot has rank, found flag, answer
foundCount: 0 → counts up to 10
wrongGuessCount: 0 → increments on incorrect guess
currentGuess: string → text input
lastGuessCorrect: triggers reveal animation
lastGuessIncorrect: triggers shake animation
lastGuessDuplicate: triggers feedback message
score: TopTensScore | null → calculated on game end
```

### Key Mechanics
| Mechanic | Behavior |
|----------|----------|
| Guessing | Type answer into input, submit to check |
| Correct Guess | Reveals at correct rank position (1-10) |
| Incorrect Guess | Shake animation, count incremented |
| Duplicate Guess | Feedback shown, no penalty |
| Win Condition | All 10 answers found |
| Give Up | Reveals all remaining answers, ends game |

### Scoring System
```
Formula: Score = foundCount (0-10)

Simple scoring: 1 point per answer found
Max: 10 points (all found)
Min: 0 points (none found)

Format: "7/10"
```

### Score Display (Emoji Grid)
Format: `✅✅✅✅✅✅✅❌❌❌` (one per rank)
- `✅` = Answer found
- `❌` = Answer missed

Example: 7/10 = `✅✅✅✅✅✅✅❌❌❌`

### Validation
Reuses shared fuzzy matching from `@/lib/validation.ts`:
- Case insensitive, accent normalization
- Alias matching (checks all aliases per answer)
- Surname matching (e.g., "Shearer" matches "Alan Shearer")
- Typo tolerance (0.85 threshold)

### Components
| Component | Purpose |
|-----------|---------|
| `TopTensScreen` | Main screen with grid + action zone |
| `RankCard` | Individual rank slot (hidden/revealed states) |
| `RankGrid` | Vertical list of 10 RankCards |
| `TopTensActionZone` | TextInput + Submit/Give Up buttons |
| `TopTensResultModal` | Result modal with confetti + share |
| `PremiumOnlyGate` | HOC that blocks non-premium users |

### Animations
- **RankCard reveal**: Spring animation when answer found
- **Action zone shake**: On incorrect guess
- **Confetti**: On win (all 10 found)

### Files
```
src/features/top-tens/
  ├── index.ts                    # Public exports
  ├── screens/
  │   └── TopTensScreen.tsx
  ├── components/
  │   ├── RankCard.tsx
  │   ├── RankGrid.tsx
  │   ├── TopTensActionZone.tsx
  │   ├── TopTensResultModal.tsx
  │   └── PremiumOnlyGate.tsx
  ├── hooks/
  │   └── useTopTensGame.ts       # Reducer + validation + persistence
  ├── utils/
  │   ├── validation.ts           # Answer matching logic
  │   ├── scoring.ts              # Score calculation
  │   ├── scoreDisplay.ts         # Emoji grid generation
  │   └── share.ts                # Share functionality
  ├── types/
  │   └── topTens.types.ts        # Type definitions
  └── __tests__/
      ├── validation.test.ts      # TDD validation tests
      ├── scoring.test.ts         # TDD scoring tests
      └── gameLogic.test.ts       # TDD reducer tests
```

### Navigation
- Route: `/top-tens`
- Route: `/top-tens/[puzzleId]`
- Premium-only: `PremiumOnlyGate` wraps screens
- Home screen shows locked state for non-premium users

## Daily Loop System
Initialized: 2025-12-25

### Overview
The Daily Loop connects the database to the UI, providing a centralized Home Screen dashboard that shows today's puzzles with dynamic states (Play/Resume/Done), streak tracking, and navigation to game screens via dynamic routes.

### Home Screen Dashboard
**Location:** `app/(tabs)/index.tsx`

Components:
- **StreakHeader**: Displays current streak (fire icon + count) and daily progress (X/6)
- **DailyStackCard**: Individual game card with state-dependent UI

Card States:
| State | UI | Trigger |
|-------|----|---------|
| Play | Green "Play" button | No attempt exists |
| Resume | Yellow "Resume" button | Attempt exists, not completed |
| Done | Score emoji grid + checkmark | Attempt completed |

### Dynamic Routing
Routes support both game mode (today's puzzle) and specific puzzle ID:

```
app/
├── career-path/
│   ├── index.tsx          # Today's puzzle (fallback)
│   └── [puzzleId].tsx     # Specific puzzle by ID
├── transfer-guess/
│   ├── index.tsx
│   └── [puzzleId].tsx
├── goalscorer-recall/
│   ├── index.tsx
│   └── [puzzleId].tsx
├── tic-tac-toe/
│   ├── index.tsx
│   └── [puzzleId].tsx
└── topical-quiz/
    ├── index.tsx
    └── [puzzleId].tsx
```

### Streak Calculation
**Location:** `src/features/home/hooks/useUserStats.ts`

Algorithm:
1. Query all completed attempts from SQLite with puzzle_date
2. Get unique dates, sort descending (most recent first)
3. Check if most recent is today or yesterday (streak active)
4. Count consecutive days backward until gap found
5. Track longest streak during iteration

Global streak increments when user completes at least 1 puzzle per day.

### Key Hooks
| Hook | Purpose |
|------|---------|
| `useUserStats()` | Streak calculation, games played stats |
| `useDailyPuzzles()` | Today's 6 puzzle cards with status |
| `usePuzzle(gameModeOrPuzzleId)` | Get puzzle by game mode OR puzzle ID |

### State Machine
```
App Launch
    ↓
Load cached puzzles from SQLite
    ↓
Sync puzzles from Supabase (if authenticated)
    ↓
Home Screen renders:
  - StreakHeader (from useUserStats)
  - DailyStackCard × 5 (from useDailyPuzzles)
    ↓
User taps card → Navigate to /{game}/{puzzleId}
    ↓
Game screen loads puzzle via usePuzzle(puzzleId)
    ↓
User completes game → saveAttempt() to SQLite
    ↓
Return to Home → Card shows "Done" + emoji grid
    ↓
Streak increments (if first completion of day)
```

### Midnight Refresh
AppState listener in Home Screen and useUserStats:
- When app comes to foreground ("active")
- Check if date changed since last refresh
- If yes, refresh stats and puzzle cards

### Files
```
src/features/home/
  ├── index.ts                           # Exports
  ├── hooks/
  │   ├── useUserStats.ts                # Streak calculation
  │   └── useDailyPuzzles.ts             # Today's puzzles with status
  ├── components/
  │   ├── StreakHeader.tsx               # Streak + progress display
  │   └── DailyStackCard.tsx             # Game card component
  └── __tests__/
      └── Integration.test.tsx           # Home screen tests

src/features/stats/
  └── __tests__/
      └── Streak.test.ts                 # Streak calculation tests

src/lib/database.ts (additions)
  ├── getAttemptByPuzzleId()             # For card status
  └── getAllCompletedAttemptsWithDates() # For streak calculation
```

### Seed Data
**Location:** `scripts/seed_data.sql`

Development seed includes:
- 42 puzzles: 6 modes × 7 days (CURRENT_DATE -3 to +3)
- 10 match_data rows for Goalscorer Recall
- All puzzles set to `status: 'live'` for RLS access

## Archive Screen
Initialized: 2025-12-27

### Overview
The Archive screen is the primary value proposition for Premium tier. It displays all historical puzzles with visual gating for premium content. Free users see 7 days of playable puzzles + locked placeholders for older content.

### Architecture

#### Puzzle Catalog (Metadata Sync)
To show locked puzzles that aren't in local SQLite (RLS blocks them for free users), we use a separate catalog table:

1. **Supabase RPC function** `get_puzzle_catalog()`: Returns puzzle metadata (id, game_mode, puzzle_date, difficulty) without content. Uses `SECURITY DEFINER` to bypass RLS.
2. **SQLite `puzzle_catalog` table**: Stores catalog entries for all users.
3. **Merge logic**: If puzzle exists in `puzzles` table → unlocked, else → locked based on 7-day rule.

#### Lock Logic
```typescript
function isPuzzleLocked(puzzleDate: string, isPremium: boolean): boolean {
  if (isPremium) return false;
  const date = new Date(puzzleDate);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return date < sevenDaysAgo;
}
```

### Screen Layout
```
Archive Screen
├── Header: "Archive" (h1)
├── GameModeFilter: Horizontal scroll chips (All, Career Path, etc.)
├── ArchiveList (SectionList)
│   ├── MonthHeader: "December 2024" (sticky, cardYellow)
│   ├── UniversalGameCard (variant="archive", isLocked based on premium status)
│   └── ... more cards
├── PremiumUpsellModal (shown on locked card tap)
└── CompletedGameModal (shown on completed card tap - matches Home behavior)
```

### Card States ("Velvet Rope" Design)
Uses `UniversalGameCard` (shared with Home screen):
| Status | isLocked | UI |
|--------|----------|-----|
| play | false | Green "Play" button, date shown above title |
| resume | false | Yellow "Resume" button |
| done | false | Yellow "Result" button + emoji grid |
| any | true | **Vibrant card** with gold border + Crown "Unlock" button (no opacity dimming) |

**Velvet Rope UX (Updated 2026-01-12):**
- Locked cards stay **fully opaque** to create desire, not frustration
- Gold border (`rgba(250, 204, 21, 0.3)`) differentiates locked from unlocked
- Crown icon + "Unlock" button replaces static lock icon (premium CTA)
- Heavy haptic feedback on locked press reinforces "hitting a gate"

### Components
| Component | Purpose |
|-----------|---------|
| `GameModeFilter` | Horizontal scroll filter chips |
| `ArchiveList` | SectionList with month grouping |
| `MonthHeader` | Sticky section header |
| `DayHeader` | Day sub-header within month |
| `PremiumUpsellModal` | Upgrade prompt with RevenueCat |
| `UniversalGameCard` | Unified card (from @/components) |
| `CompletedGameModal` | Result modal for completed games (from @/features/home) |

### Hooks
| Hook | Purpose |
|------|---------|
| `useArchivePuzzles(filter)` | Main data hook with pagination, grouping, and attempt data |
| `useGatedNavigation` | Premium gating for navigation |

### Navigation
- Tapping completed puzzle → Shows `CompletedGameModal` (matches Home screen)
- Tapping play/resume puzzle → `router.push(`/${route}/${puzzleId}`)`
- Tapping locked puzzle → Opens `PremiumUpsellModal` or `UnlockChoiceModal` (ad option)

### Files
```
src/features/archive/
  ├── index.ts                    # Feature exports
  ├── types/
  │   └── archive.types.ts        # ArchivePuzzle (includes attempt field), ArchiveSection, etc.
  ├── hooks/
  │   ├── useArchivePuzzles.ts    # Main data hook (stores full attempt for completed games)
  │   └── useGatedNavigation.ts   # Premium gating hook
  ├── components/
  │   ├── ArchiveList.tsx         # SectionList (uses UniversalGameCard)
  │   ├── GameModeFilter.tsx      # Filter chips
  │   ├── MonthHeader.tsx         # Month section header
  │   ├── DayHeader.tsx           # Day sub-header
  │   └── PremiumUpsellModal.tsx  # Upgrade modal
  ├── services/
  │   └── catalogSyncService.ts   # Supabase RPC sync
  ├── utils/
  │   └── dateGrouping.ts         # Month grouping, lock logic
  └── __tests__/
      ├── Gating.test.tsx         # Lock visibility tests
      └── PaywallFlow.test.tsx    # Paywall flow tests

src/lib/database.ts (additions)
  ├── puzzle_catalog table        # Migration v2
  ├── saveCatalogEntries()        # Bulk upsert
  ├── getCatalogEntriesPaginated()# With filter
  └── getCatalogEntryCount()      # For pagination

src/features/puzzles/context/PuzzleContext.tsx
  └── Calls syncCatalogFromSupabase() after puzzle sync
```

### Migrations Applied
5. `005_create_puzzle_catalog_rpc` - RPC function for catalog sync

## Leaderboard Feature
Initialized: 2026-01-02

### Overview
Real-time leaderboard system ranking users by daily cumulative score (0-500) and global IQ (0-100). Includes a shareable "IQ Card" for social sharing.

### Leaderboard Types
| Type | Score Range | Ranking |
|------|-------------|---------|
| Daily | 0-500 | Sum of normalized daily scores |
| Global IQ | 0-100 | Weighted average across all games |

### Daily Score Calculation
Each game mode contributes 0-100 points, summed for 0-500 total:
- Career Path: (points / maxPoints) × 100
- Transfer Guess: (points / 10) × 100
- Goalscorer Recall: percentage (already 0-100)
- Tic Tac Toe: Win=100, Draw=50, Loss=0
- Topical Quiz: (points / 10) × 100

### Tie-Breaking
Uses DENSE_RANK with earliest completion time as tiebreaker:
- Same score → earlier completion wins
- Ranks: [300, 300, 200] → [1, 1, 2] (not [1, 1, 3])

### Supabase RPCs
| RPC | Purpose |
|-----|---------|
| `get_daily_leaderboard(for_date, limit_count)` | Top users by daily score |
| `get_global_iq_leaderboard(limit_count)` | Top users by global IQ |
| `get_user_rank(target_user_id, type, for_date)` | User's rank + total users |

All RPCs use `SECURITY DEFINER` to bypass RLS for aggregation.

### Screen Layout
```
Leaderboard Screen
├── Header: "Leaderboard" + close button
├── LeaderboardToggle: Daily / All-Time chips
├── LeaderboardList (FlatList)
│   └── LeaderboardEntry × 100
└── StickyMeBar (when user scrolled out of view)
```

### Components
| Component | Purpose |
|-----------|---------|
| `LeaderboardToggle` | Daily/All-Time filter chips |
| `LeaderboardEntry` | Rank, avatar, name, score row |
| `LeaderboardList` | FlatList with pull-to-refresh |
| `StickyMeBar` | Fixed bottom bar with user's rank |
| `LeaderboardEmptyState` | Loading/empty/error states |

### IQ Card Sharing
Shareable image card containing:
- Global IQ score with tier badge
- Current streak
- Top badge (first earned)
- Global rank

Uses `react-native-view-shot` for image capture and native Share API.

### Key Hooks
| Hook | Purpose |
|------|---------|
| `useLeaderboard(type)` | Fetch entries + polling (30s) |
| `useStickyMe(entries, currentUserId)` | Track user visibility in list |

### Files
```
src/features/leaderboard/
├── index.ts                    # Feature exports
├── types/leaderboard.types.ts
├── services/leaderboardService.ts
├── hooks/
│   ├── useLeaderboard.ts
│   └── useStickyMe.ts
├── utils/rankingUtils.ts       # Normalization, ranking logic
├── components/
│   ├── LeaderboardToggle.tsx
│   ├── LeaderboardEntry.tsx
│   ├── LeaderboardList.tsx
│   ├── StickyMeBar.tsx
│   └── LeaderboardEmptyState.tsx
└── __tests__/
    ├── Ranking.test.ts         # 29 tests
    └── LeaderboardUI.test.tsx  # 25 tests

src/features/stats/
├── components/IQCardOverlay.tsx
└── utils/shareIQ.ts

app/leaderboard/index.tsx
```

### Navigation Integration
- Trophy icon in Stats tab header → `/leaderboard`
- Trophy icon in Home screen header → `/leaderboard?type=daily`
- "Share My IQ" button in Stats screen → Opens IQCardOverlay modal

### Migrations Applied
6. `006_create_leaderboard_rpcs` - 3 RPCs + performance indexes

## Premium Gating System
Initialized: 2026-01-02

### Overview
Two-layer defense system to enforce 7-day free window for puzzle access. Prevents both UI navigation and deep-link bypass of premium content.

### Gating Layers

| Layer | Type | Location | Purpose |
|-------|------|----------|---------|
| 1 - UI | Hook | `useGatedNavigation` | Intercepts Archive card clicks |
| 2 - Defense | HOC | `PremiumGate` | Wraps all `[puzzleId].tsx` routes |

### Navigation Decision Tree
```
User taps puzzle card
    ↓
isPuzzleLocked(date, isPremium)?
    ├─ Yes → Show PremiumUpsellModal (no navigation)
    └─ No → Navigate to /{game}/{puzzleId}
                    ↓
            PremiumGate HOC checks:
                    ↓
            RLS returned puzzle?
            ├─ No → Show modal (mode='blocked')
            └─ Yes → isPuzzleLocked?
                    ├─ Yes → Show modal (mode='locked')
                    └─ No → Render game screen
```

### Lock Logic
```typescript
function isPuzzleLocked(puzzleDate: string, isPremium: boolean): boolean {
  if (isPremium) return false;  // Premium sees all
  const date = new Date(puzzleDate);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return date < sevenDaysAgo;  // >7 days old = locked for free
}
```

### PremiumUpsellModal State Machine
```
                ┌──────────────────────────────────────┐
                │                                      │
                ▼                                      │
            ┌──────┐                                   │
            │ idle │ ← (onClose)                       │
            └──┬───┘                                   │
               │ (select plan)                         │
               ▼                                       │
         ┌───────────┐                                 │
         │ selecting │                                 │
         └─────┬─────┘                                 │
               │ (confirm purchase)                    │
               ▼                                       │
        ┌────────────┐       error                     │
        │ purchasing │ ─────────────────┐              │
        └──────┬─────┘                  ▼              │
               │                   ┌─────────┐         │
               │ success           │  error  │─────────┘
               ▼                   └─────────┘   (retry)
         ┌─────────┐
         │ success │ → (auto-close 3s OR tap)
         └─────────┘
```

### Subscription Plans (Mock)
| Plan | Price | ID |
|------|-------|-----|
| Weekly | $1.99 | `weekly` |
| Monthly | $4.99 | `monthly` (recommended) |
| Yearly | $29.99 | `yearly` |

Mock purchase updates `profiles.is_premium = true` in Supabase.

### Success Celebration
- Confetti animation (reused from career-path)
- Haptic feedback (`Success` type)
- "Welcome to Premium!" message
- Auto-dismiss after 3 seconds

### RLS Policy
```sql
CREATE POLICY "Premium puzzle access" ON daily_puzzles
FOR SELECT USING (
  status = 'live' AND (
    -- Premium users: full archive access
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_premium = true
    )
    OR
    -- Free users: last 7 days only
    puzzle_date >= CURRENT_DATE - INTERVAL '7 days'
  )
);
```

### Files
```
src/features/archive/
  ├── hooks/
  │   └── useGatedNavigation.ts    # Layer 1: UI hook
  ├── components/
  │   └── PremiumUpsellModal.tsx   # Redesigned with state machine
  └── utils/
      └── dateGrouping.ts          # isPuzzleLocked, isWithinFreeWindow

src/features/auth/
  └── components/
      └── PremiumGate.tsx          # Layer 2: Route HOC

app/
  ├── career-path/[puzzleId].tsx   # Wrapped with PremiumGate
  ├── transfer-guess/[puzzleId].tsx
  ├── goalscorer-recall/[puzzleId].tsx
  ├── tic-tac-toe/[puzzleId].tsx
  └── topical-quiz/[puzzleId].tsx
```

### Tests
- `src/features/auth/__tests__/PremiumGating.test.ts` - RLS simulation (11 tests)
- `src/features/archive/__tests__/PaywallFlow.test.tsx` - Modal flow (12 tests)

### Migrations Applied
7. `007_premium_puzzle_access` - RLS policy for premium gating

## Skeleton Loaders
Initialized: 2026-01-04

### Overview
High-fidelity loading placeholders using moti/skeleton with shimmer animations. Eliminates layout shifts by matching exact dimensions of loaded content.

### Dependencies
- `moti` - Reanimated-based animation library
- `@motify/skeleton` - Skeleton shimmer component

### Skeleton Colors
```typescript
const SKELETON_COLORS = {
  dark: [
    'rgba(255, 255, 255, 0.05)',  // Base
    'rgba(255, 255, 255, 0.12)',  // Highlight
    'rgba(255, 255, 255, 0.05)',  // Base
  ],
};
```

### Components
| Component | Location | Dimensions |
|-----------|----------|------------|
| `SkeletonBox` | Base | Configurable width/height/radius |
| `SkeletonGroup` | Wrapper | Conditionally renders children |
| `DailyStackCardSkeleton` | Home | 48x48 icon, 120x18 title, 80x12 subtitle |
| `MonthHeaderSkeleton` | Archive | 140x24 rectangle |
| `ArchiveCardSkeleton` | Archive | 44x44 icon, 80x12 date, 100x16 title |
| `ProfileHeaderSkeleton` | Stats | 56x56 avatar circle |
| `IQScoreDisplaySkeleton` | Stats | 96px score circle |
| `ProficiencyBarSkeleton` | Stats | 8px height progress bar |
| `FullStatsSkeleton` | Stats | All stats components combined |

### Integration
- Home screen: 5x `DailyStackCardSkeleton` when loading
- Archive screen: 2 month sections + 3 cards each via `ArchiveSkeletonList`
- Stats screen: `FullStatsSkeleton` during initial load

### Files
```
src/components/ui/Skeletons/
├── SkeletonBase.tsx           # Base SkeletonBox + SkeletonGroup
├── DailyStackCardSkeleton.tsx # Home screen card skeleton
├── ArchiveSkeletons.tsx       # Archive list skeletons
├── StatsSkeletons.tsx         # Stats screen skeletons
├── index.ts                   # Barrel exports
└── __tests__/
    └── SkeletonVisibility.test.tsx  # 12 tests
```

## Image Prefetching
Initialized: 2026-01-04

### Overview
Background image prefetching for Topical Quiz using expo-image's `Image.prefetch()`. Images are cached before user navigates to quiz, ensuring instant display.

### Architecture
```
QuizPrefetchProvider (inside AuthGate, after PuzzleProvider)
  └─ useQuizPrefetch()
       ├─ status: 'idle' | 'prefetching' | 'ready' | 'error'
       ├─ isPrefetched: boolean
       ├─ lastResult: PrefetchResult | null
       └─ triggerPrefetch(): Promise<void>
```

### Prefetch Flow
1. Provider mounts inside AuthGate
2. Watches for puzzles to load via `usePuzzleContext()`
3. When puzzles available, extracts imageUrls from today's topical_quiz
4. Prefetches all images in parallel via `Promise.allSettled()`
5. Tracks success/failure counts in `PrefetchResult`
6. AppState listener re-triggers on foreground if needed

### Files
```
src/features/topical-quiz/
├── utils/imagePrefetch.ts        # extractImageUrls, prefetchQuizImages
├── context/QuizPrefetchContext.tsx  # Provider + useQuizPrefetch hook
└── __tests__/
    └── ImagePrefetch.test.ts     # 6 tests
```

### Integration
- `QuizPrefetchProvider` added to `app/_layout.tsx`
- `TopicalQuizScreen` uses `useQuizPrefetch()` for loading state optimization

## Admin Tools
Initialized: 2025-12-27

## My IQ Profile Screen
Initialized: 2026-01-02

### Overview
Comprehensive profile screen that aggregates all puzzle attempt data to calculate a "Football IQ" score and display proficiency across game modes. Replaced the placeholder Stats tab.

### Global IQ Calculation
Weighted average of proficiency across 6 game modes:

| Game Mode | Weight | Normalization |
|-----------|--------|---------------|
| Career Path | 25% | (points / maxPoints) × 100 |
| Transfer Guess | 25% | (points / 10) × 100 |
| Goalscorer Recall | 20% | percentage (already 0-100) |
| Tic Tac Toe | 15% | Win=100, Draw=50, Loss=0 |
| Topical Quiz | 15% | (points / 10) × 100 |

If a mode hasn't been played, its weight is redistributed to played modes.

### Screen Layout
```
My IQ Screen
├── ProfileHeader (display name + member since)
├── IQScoreDisplay (large IQ number with tier label)
├── ProficiencySection (5 progress bars)
├── TrophyRoom (horizontal badge scroll)
└── StatsGrid (2×2 stat cards)
```

### IQ Tier Labels
| Score | Tier |
|-------|------|
| 90+ | Elite |
| 70-89 | Expert |
| 50-69 | Intermediate |
| 30-49 | Apprentice |
| 0-29 | Rookie |

### Badge System
| Badge ID | Name | Criteria |
|----------|------|----------|
| streak_7 | 7-Day Streak | currentStreak >= 7 |
| perfect_career | Detective | Perfect Career Path score |
| perfect_transfer | Scout | Perfect Transfer Guess (10 pts) |
| perfect_goalscorer | Historian | 100% on Goalscorer Recall |
| perfect_tictactoe | Tactician | Win Tic Tac Toe |
| perfect_quiz | Pundit | Perfect Topical Quiz (10 pts) |
| games_10 | Getting Started | 10+ puzzles solved |
| games_50 | Dedicated Fan | 50+ puzzles solved |

### Key Hooks
| Hook | Purpose |
|------|---------|
| `usePerformanceStats()` | Aggregates attempt data, calculates IQ + proficiencies + badges |

### Components
| Component | Purpose |
|-----------|---------|
| `ProfileHeader` | User name + member since date |
| `IQScoreDisplay` | Large IQ number with tier badge |
| `ProficiencyBar` | Animated skill progress bar |
| `ProficiencySection` | 5 bars grouped in GlassCard |
| `TrophyRoom` | Horizontal scrolling badges |
| `StatsGrid` | 2×2 grid of stat cards |

### Files
```
src/features/stats/
  ├── index.ts                    # Feature exports
  ├── types/
  │   └── stats.types.ts          # PerformanceStats, Badge, etc.
  ├── utils/
  │   └── iqCalculation.ts        # normalizeScore, calculateGlobalIQ, etc.
  ├── hooks/
  │   └── usePerformanceStats.ts  # Main aggregation hook
  ├── components/
  │   ├── ProfileHeader.tsx
  │   ├── IQScoreDisplay.tsx
  │   ├── ProficiencyBar.tsx
  │   ├── ProficiencySection.tsx
  │   ├── TrophyRoom.tsx
  │   └── StatsGrid.tsx
  └── __tests__/
      └── IQCalculation.test.ts   # 44 tests for IQ math

src/lib/database.ts (additions)
  └── getAllCompletedAttemptsWithGameMode()  # Query for stats aggregation

app/(tabs)/_layout.tsx
  └── Tab renamed from "Stats" to "My IQ" with Brain icon
```

## Score Distribution Graph ("How You Compare")
Initialized: 2026-01-11

### Overview
Wordle-style horizontal bar chart showing how a user's score compares to all other players who completed the same puzzle globally. Displayed in result modals for all 6 main game modes.

### Features
- **Per-puzzle distribution**: Shows how this puzzle's scores are distributed (not game mode aggregate)
- **Game modes supported**: Top Tens, Transfer Guess, Topical Quiz, Career Path, Goalscorer Recall, The Grid
- **Always visible**: Graph shows even with 1 attempt (100% at user's score)
- **Score normalization**: All scores normalized to 0-100 scale for consistent bucketing
- **User highlighting**: User's score bucket highlighted in Pitch Green

### Visual Design
- **Header**: "HOW YOU COMPARE" (Bebas Neue, 14px, letter-spacing: 2)
- **Bars**: 11 rows (0-100 in 10s), horizontal bars
- **User's bar**: Pitch Green (#58CC02)
- **Other bars**: Glass background (rgba(255,255,255,0.08))
- **Score labels**: Left side (e.g., "100", "90", "80"...)
- **Percentage labels**: Right side (e.g., "25%")
- **Footer**: "Based on X global attempts"
- **Loading**: Skeleton placeholder with shimmer animation

### Score Normalization by Game Mode
| Game Mode | Raw Score | Normalized |
|-----------|-----------|------------|
| Top Tens | 0-10 points | × 10 → 0-100 |
| Transfer Guess | 0-10 points | × 10 → 0-100 |
| Topical Quiz | 0-10 points | × 10 → 0-100 |
| Career Path | points/maxPoints | × 100 → 0-100 |
| Goalscorer Recall | percentage | Already 0-100 |
| The Grid | cells/9 | × 100 → 0-100 |

### Files
```
src/features/stats/
  ├── __tests__/
  │   └── DistributionLogic.test.ts      # 19 TDD tests
  ├── components/
  │   ├── ScoreDistributionContainer.tsx # Smart container
  │   ├── ScoreDistributionGraph.tsx     # Horizontal bar chart
  │   └── ScoreDistributionSkeleton.tsx  # Loading state
  ├── hooks/
  │   └── useScoreDistribution.ts        # Data fetching hook
  ├── services/
  │   └── distributionService.ts         # Supabase RPC calls
  └── utils/
      ├── distributionLogic.ts           # Bucket calculation
      └── distributionConfig.ts          # Per-mode config

supabase/migrations/
  └── 008_score_distribution_rpc.sql     # RPC function
```

### Supabase RPC
**Function**: `get_puzzle_score_distribution(target_puzzle_id UUID)`

Returns normalized score distribution:
- Groups scores into 10-point buckets (0, 10, 20, ..., 100)
- Calculates percentage of attempts in each bucket
- Returns total attempt count

### Integration
Each result modal passes `puzzleId` to `ScoreDistributionContainer`:
```tsx
<ScoreDistributionContainer
  puzzleId={puzzle.id}
  gameMode="top_tens"
  userScore={score.points * 10}
/>
```

## Admin Tools

### Content Creator
**Location:** `tools/content-creator.html`

A standalone HTML/JS utility for Product Owners to manually create and push puzzle data to Supabase's `daily_puzzles` table.

#### Features
- **Supabase Configuration**: URL + Service Role Key stored in localStorage
- **5 Game Mode Forms**: Career Path, Transfer Guess, Goalscorer Recall, Tic Tac Toe, Topical Quiz
- **Live JSON Preview**: Updates as user types
- **Pre-flight Validation**: Blocks incomplete puzzles
- **Push to Supabase**: Upserts directly with `status: 'live'`
- **Toast Notifications**: Success/error feedback
- **Reset Form**: Quick clear for rapid entry

#### Usage
1. Open `tools/content-creator.html` in a browser
2. Enter Supabase URL and Service Role Key (saved to localStorage)
3. Select date, game mode, and difficulty
4. Fill out the form for the selected game mode
5. Review JSON preview
6. Click "Pre-flight Check" to validate
7. Click "Push to Supabase" to insert/update

#### Tech Stack
- Tailwind CSS (via CDN)
- Supabase JS SDK (via CDN)
- Vanilla JavaScript (no build required)

#### Supported Game Modes
| Mode | Fields |
|------|--------|
| Career Path | answer, career_steps[] (type, text, year) |
| Transfer Guess | answer, from_club, to_club, year, fee, hints[3] |
| Goalscorer Recall | home_team, away_team, scores, competition, match_date, goals[] |
| Tic Tac Toe | rows[3], columns[3], valid_answers{0-8: string[]} |
| Topical Quiz | questions[5] (id, question, imageUrl?, options[4], correctIndex) |

## RevenueCat Integration
Initialized: 2026-01-03

### Overview
In-app purchases powered by RevenueCat SDK. RevenueCat is the source of truth for premium status, synced to Supabase `profiles.is_premium` for RLS enforcement.

### Configuration
| Key | Value |
|-----|-------|
| Offering Identifier | `default_offering` |
| Entitlement ID | `premium_access` |
| Production API Key | `appl_QWyaHOEVWcyFzTWkykxesWlqhDo` |
| Sandbox API Key | `test_otNRIIDWLJwJlzISdCbUzGtwwlD` |

### Environment-Aware Key Selection
```typescript
// src/config/revenueCat.ts
export function getRevenueCatApiKey(): string {
  return __DEV__ ? REVENUECAT_API_KEYS.sandbox : REVENUECAT_API_KEYS.production;
}
```
- Development builds (`__DEV__=true`): Use sandbox key for App Store sandbox testing
- Production builds (`__DEV__=false`): Use production key for real purchases

### SDK Initialization
**Location:** `app/_layout.tsx`

RevenueCat SDK initializes in parallel with font loading and database init:
1. Check if web platform (skip if web)
2. Get API key via `getRevenueCatApiKey()`
3. Call `Purchases.configure({ apiKey })`
4. Set `rcReady` state
5. Splash screen hides when fonts + db + rc all ready

### Subscription Sync Flow
**Location:** `src/features/auth/context/SubscriptionSyncContext.tsx`

Auth-scoped lifecycle:
1. User authenticates → `SubscriptionSyncProvider` calls `Purchases.logIn(userId)`
2. Initial sync: Check current entitlement, update Supabase
3. Start listener: `Purchases.addCustomerInfoUpdateListener()`
4. On entitlement change → Update `profiles.is_premium` in Supabase
5. User signs out → Stop listener, call `Purchases.logOut()`

### Purchase Flow (PremiumUpsellModal)
**State Machine:**
```
idle → loading → selecting → purchasing → success
                     ↓              ↓
                  error ←──────────┘
```

**Key Operations:**
- `Purchases.getOfferings()` - Fetch packages from offering
- `Purchases.purchasePackage(pkg)` - Native payment sheet
- `Purchases.restorePurchases()` - Restore previous purchases
- Localized pricing via `product.priceString`

### Key Files
```
src/config/
  └── revenueCat.ts               # API keys + constants

src/features/auth/
  ├── services/
  │   └── SubscriptionSync.ts     # Core sync logic
  ├── context/
  │   └── SubscriptionSyncContext.tsx  # Auth-scoped provider
  ├── index.ts                    # Feature exports
  └── __tests__/
      └── RevenueCatSync.test.ts  # 15 tests

src/features/archive/components/
  └── PremiumUpsellModal.tsx      # Purchase UI

app/_layout.tsx                   # SDK initialization
```

### Testing
- `src/config/__tests__/revenueCat.test.ts` - 5 tests (key selection)
- `src/features/auth/__tests__/RevenueCatSync.test.ts` - 15 tests (sync logic)

## Ad Monetization (Google AdMob)
Initialized: 2026-01-03

### Overview
Hybrid monetization system with Google AdMob providing:
1. **Banner ads**: Bottom of game screens for non-premium users
2. **Rewarded ads**: Watch-to-unlock for archived puzzles (permanent access)
3. **Premium upsell**: Home screen banner encouraging subscription

### AdMob Configuration
| Platform | App ID |
|----------|--------|
| iOS | `ca-app-pub-9426782115883407~8797195643` |
| Android | `ca-app-pub-9426782115883407~1712062487` |

### Ad Unit IDs
| Type | iOS (Test) | Android (Test) |
|------|------------|----------------|
| Banner | `ca-app-pub-3940256099942544/2934735716` | `ca-app-pub-3940256099942544/6300978111` |
| Rewarded | `ca-app-pub-3940256099942544/1712485313` | `ca-app-pub-3940256099942544/5224354917` |

Production ad unit IDs to be created in AdMob console.

### Architecture
```
AdProvider (wraps app inside AuthProvider)
  └─ useAds() - Ad state + actions
       ├─ shouldShowAds: boolean
       ├─ isRewardedAdReady: boolean
       ├─ loadRewardedAd()
       ├─ showRewardedAd() → Promise<boolean>
       ├─ adUnlocks: UnlockedPuzzle[]
       ├─ isAdUnlockedPuzzle(puzzleId)
       └─ grantAdUnlock(puzzleId)  # Permanent unlock
```

### Ad-to-Unlock Flow
```
User taps locked archive puzzle
    ↓
UnlockChoiceModal shows:
  ├─ "Go Premium" → Opens PremiumUpsellModal
  └─ "Watch Ad to Unlock" →
        ↓
    State: loading_ad → showing_ad
        ↓
    Rewarded ad displayed
        ↓
    User completes ad?
    ├─ Yes → grantAdUnlock() → permanent SQLite unlock → puzzle accessible forever
    └─ No → Return to idle (can retry)
```

### Extended Lock Logic
```typescript
// src/features/archive/utils/dateGrouping.ts
function isPuzzleLocked(
  puzzleDate: string,
  isPremium: boolean,
  puzzleId?: string,
  adUnlocks?: UnlockedPuzzle[]
): boolean {
  if (isPremium) return false;              // Premium sees all
  if (isWithinFreeWindow(puzzleDate)) return false;  // Last 7 days
  if (puzzleId && hasAdUnlock(puzzleId, adUnlocks)) return false;  // Permanent ad unlock
  return true;
}
```

### UnlockChoiceModal State Machine
```
           ┌───────────────────────────────────────┐
           │                                       │
           ▼                                       │
       ┌──────┐                                    │
       │ idle │ ← (ad closed without reward)       │
       └──┬───┘                                    │
          │                                        │
    ┌─────┴─────┐                                  │
    │           │                                  │
    ▼           ▼                                  │
┌────────┐  ┌─────────────┐                        │
│premium │  │ loading_ad  │                        │
│ _flow  │  └──────┬──────┘                        │
│        │         │                               │
│ (opens │         ▼                               │
│ modal) │  ┌─────────────┐                        │
│        │  │ showing_ad  │                        │
└────────┘  └──────┬──────┘                        │
                   │                               │
           ┌──────┴──────┐                         │
           ▼             ▼                         │
    ┌────────────┐  ┌────────────┐                 │
    │ ad_success │  │  ad_error  │─────────────────┘
    └──────┬─────┘  └────────────┘       (retry)
           │
           ▼
    Auto-close (2s)
```

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `AdBanner` | Game screens | Anchored adaptive banner |
| `UnlockChoiceModal` | Archive | Two-option unlock modal |
| `PremiumUpsellBanner` | Home screen | Subscription CTA |

### AdBanner Placement
Added to all game screens (returns null for premium users):
- `CareerPathScreen`
- `TransferGuessScreen`
- `GoalscorerRecallScreen`
- `TicTacToeScreen`
- `TopicalQuizScreen`

### Key Files
```
src/features/ads/
  ├── index.ts                    # Feature exports
  ├── types/
  │   └── ads.types.ts            # AdContextValue, UnlockChoiceState, etc.
  ├── config/
  │   └── adUnits.ts              # Ad unit IDs (test/production)
  ├── context/
  │   └── AdContext.tsx           # AdProvider + useAds hook
  ├── services/
  │   └── adUnlockService.ts      # SQLite operations wrapper
  ├── components/
  │   ├── AdBanner.tsx            # Banner ad component
  │   ├── UnlockChoiceModal.tsx   # Two-option unlock modal
  │   └── PremiumUpsellBanner.tsx # Home screen upsell
  └── __tests__/
      ├── AdVisibility.test.ts    # 5 tests
      └── AdUnlock.test.ts        # 5 tests

app.json                          # AdMob config plugin
app/_layout.tsx                   # AdProvider in component tree
jest-setup.ts                     # AdMob mock

src/lib/database.ts (migration v3)
  ├── unlocked_puzzles table (permanent unlocks)
  ├── saveAdUnlock()       # Save permanent unlock
  ├── isAdUnlocked()       # Check if puzzle unlocked
  └── getValidAdUnlocks()  # Get all unlocks
```

### Testing
- `src/features/ads/__tests__/AdVisibility.test.ts` - 5 tests (banner visibility)
- `src/features/ads/__tests__/AdUnlock.test.ts` - 5 tests (unlock database operations)

## UX Polish (2026-01-06)

### State Persistence (All Game Modes)
Initialized: 2026-01-06

All 6 game modes now support progressive save:
- Game state saved to SQLite when app backgrounds (AppState listener)
- State restored on mount if incomplete attempt exists (`completed: 0`)
- Uses `attemptId` to track in-progress games
- Home screen shows "Resume" button for in-progress games

**Pattern implemented:**
```typescript
// 1. Add stateRef to track current state for async callbacks
const stateRef = useRef(state);
stateRef.current = state;

// 2. Generate attemptId on mount
useEffect(() => {
  if (!state.attemptId && state.gameStatus === 'playing') {
    dispatch({ type: 'SET_ATTEMPT_ID', payload: Crypto.randomUUID() });
  }
}, [state.attemptId, state.gameStatus]);

// 3. Check for resume on mount
useEffect(() => {
  async function checkForResume() {
    const attempt = await getAttemptByPuzzleId(puzzle.id);
    if (attempt && !attempt.completed && attempt.metadata) {
      dispatch({ type: 'RESTORE_PROGRESS', payload: JSON.parse(attempt.metadata) });
    }
  }
  if (puzzle) checkForResume();
}, [puzzle?.id]);

// 4. Save on background
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') saveProgressToSQLite();
  });
  return () => subscription.remove();
}, [puzzle]);
```

**Files modified:**
| Game Mode | Types File | Hook File |
|-----------|------------|-----------|
| Career Path | `careerPath.types.ts` | `useCareerPathGame.ts` |
| Transfer Guess | `transferGuess.types.ts` | `useTransferGuessGame.ts` |
| Tic Tac Toe | `ticTacToe.types.ts` | `useTicTacToeGame.ts` |
| Topical Quiz | `topicalQuiz.types.ts` | `useTopicalQuizGame.ts` |
| Goalscorer Recall | Already had this | (template for others) |

**Types added per game mode:**
- `attemptId: string | null` in state interface
- `RestoreProgressPayload` interface
- `SET_ATTEMPT_ID` action
- `RESTORE_PROGRESS` action

### Keyboard Handling
Initialized: 2026-01-06

Added `KeyboardAvoidingView` wrapper to 3 game screens:
- `CareerPathScreen.tsx`
- `TransferGuessScreen.tsx`
- `TicTacToeScreen.tsx`

**Pattern:**
```typescript
<KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
  {/* screen content */}
</KeyboardAvoidingView>
```

Also added `keyboardDismissMode="on-drag"` to ScrollViews for better UX.

### Homepage Score Display
Initialized: 2026-01-06

Fixed cluttered appearance on completed game cards.

**Problem:** Full share text displayed (multi-line) instead of compact emoji grid.

**Solution:** Added `extractEmojiGrid()` helper to `DailyStackCard.tsx`:
```typescript
function extractEmojiGrid(scoreDisplay: string): string {
  const lines = scoreDisplay.trim().split('\n');
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u2B1B\u2B1C\u2705\u274C\u2B55]/u;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line && emojiPattern.test(line) && !line.includes(':') && !line.includes('Football IQ')) {
      return line;
    }
  }
  return scoreDisplay;
}
```

**Result:** Cards now show only emoji grid (e.g., `🟩⬛⬛🟩🟩`) instead of full share text.

### My IQ Tab Refresh + IQ Calculation Fix
Initialized: 2026-01-09

**Problem 1 (Tab Navigation):** Global IQ and proficiency bars didn't update when navigating to the My IQ tab after completing a game.

**Root Cause 1:** `usePerformanceStats` used `AppState.addEventListener('change')` which only fires on app foreground, not on tab navigation.

**Solution 1:** Added `useFocusEffect` from `@react-navigation/native` to trigger refresh when the tab gains focus.

**Problem 2 (IQ Always 0):** Global IQ showed 0% despite games being played. Proficiency bars were all empty.

**Root Cause 2 (CRITICAL):** Metadata field mismatch between what game hooks save and what `normalizeScore()` expected:

| Game Mode | What Games Save | What normalizeScore Expected |
|-----------|-----------------|------------------------------|
| career_path | `won`, `totalSteps`, `revealedCount` | `points`, `maxPoints` |
| guess_the_transfer | `won`, `hintsRevealed`, `guesses` | `points` |
| guess_the_goalscorers | `scorersFound`, `totalScorers` | `percentage` |
| tic_tac_toe | `result` | `result` ✅ |
| topical_quiz | `correctCount` | `points` |

**Solution 2:** Updated `normalizeScore()` and `isPerfectScore()` in `iqCalculation.ts` to use the actual metadata fields saved by game hooks:

```typescript
// career_path: Score = totalSteps - (revealedCount - 1) if won
case 'career_path': {
  const won = data.won === true;
  if (!won) return 0;
  const totalSteps = getMetadataNumber(data, 'totalSteps');
  const revealedCount = getMetadataNumber(data, 'revealedCount');
  const points = totalSteps - (revealedCount - 1);
  return Math.round((points / totalSteps) * 100);
}

// topical_quiz: correctCount out of 5
case 'topical_quiz': {
  const correctCount = getMetadataNumber(data, 'correctCount');
  return Math.round((correctCount / 5) * 100);
}
```

**Retroactive Fix:** Because IQ is calculated from stored attempts (not cached), existing users' scores automatically corrected after the fix.

**Files modified:**
- `app/(tabs)/stats.tsx` - Added useFocusEffect import and hook
- `src/features/stats/utils/iqCalculation.ts` - Fixed normalizeScore() and isPerfectScore() to use actual saved metadata fields
- `src/features/stats/types/stats.types.ts` - Reordered BADGE_DEFINITIONS (Getting Started first)
- `src/features/stats/components/TrophyRoom.tsx` - Added modal view for all badges

**Tests updated:**
- `src/features/stats/__tests__/DataPipeline.test.ts` - Updated to use actual metadata fields

## Dead Code Cleanup
Performed: 2026-01-10

### Overview
Comprehensive audit and removal of unused files, components, and exports to reduce bundle size and cognitive load.

### Files Deleted (309 lines total)
| File | Lines | Reason |
|------|-------|--------|
| `src/features/home/components/CompletedStamp.tsx` | 64 | Never imported anywhere |
| `src/features/home/components/TruncatedEmojiDisplay.tsx` | 89 | Never imported anywhere |
| `src/features/career-path/components/GameResultBanner.tsx` | 156 | Replaced by GameResultModal/BaseResultModal pattern |

### Exports Removed
| Export | From | Reason |
|--------|------|--------|
| `GameResultBanner` | `src/features/career-path/index.ts` | Component deleted |
| `formatScore` | `src/features/career-path/index.ts` | Only used in tests, not production |

### Previously Deleted (before this cleanup)
| File | Replacement |
|------|-------------|
| `src/features/archive/components/ArchivePuzzleCard.tsx` | `UniversalGameCard` |
| `src/features/archive/components/LockedArchiveCard.tsx` | `UniversalGameCard` with `isLocked` prop |

### Build Verification
TypeScript compilation verified - no errors related to deleted code.

## Review Mode Enhancement
Implemented: 2026-01-10

### Overview
Enhanced Review Mode for Career Path, Transfer Guess, and Topical Quiz to visually display user-specific choices, hints used, and success/failure indicators.

### Career Path Review - "Step Narrative"
- **Winning Step Highlight**: Green border + glow on the step where user made correct guess
- **Missed Badge**: Red "MISSED" badge on final step when lost
- Uses `revealedCount` from metadata to identify winning step

**Props added to `CareerStepCard`:**
- `isWinningStep?: boolean` - Green border/glow for success step
- `isMissedStep?: boolean` - Red border + "MISSED" badge for final step when lost

### Transfer Guess Review - "Valuation Narrative"
- **Actual Hints**: Shows only hints that were actually revealed (0-3), not all 3
- **Review Mode State**: Unrevealed hints show "Not revealed" text with EyeOff icon (no blur)
- Uses `hintsRevealed` from metadata to show correct number

**Props added to components:**
- `HintsSection`: `isReviewMode?: boolean`
- `HintSlot`: `isReviewMode?: boolean` - Shows "Not revealed" instead of blur/lock

### Topical Quiz Review - "Correction Narrative"
Already complete - shows:
- Score summary (X/5 and points)
- All questions with colored options
- Green highlight for correct answers
- Red highlight for user's wrong answers
- "✓ Your answer" / "✗ Your answer" indicators

### Shared Component Typography
- `ReviewGuessesSection` label now uses Bebas Neue (`fonts.headline`) with uppercase + letter-spacing

### Files Modified
```
src/features/career-path/components/CareerStepCard.tsx
  - Added isWinningStep/isMissedStep props
  - Added winning/missed styles (green glow, red badge)
  - Added CheckCircle icon for winning badge

src/features/career-path/screens/CareerPathScreen.tsx
  - Calculates winningStepIndex and missedStepIndex from metadata
  - Passes flags to CareerStepCard in review mode

src/features/transfer-guess/screens/TransferGuessScreen.tsx
  - Fixed hintsRevealed to use actual metadata value (not hardcoded 3)
  - Added isReviewMode prop to HintsSection

src/features/transfer-guess/components/HintsSection.tsx
  - Added isReviewMode prop, passes to HintSlot

src/features/transfer-guess/components/HintSlot.tsx
  - Added isReviewMode prop
  - Added review-specific locked state (no blur, "Not revealed" text)

src/components/ReviewMode/ReviewGuessesSection.tsx
  - Updated label typography to use Bebas Neue (fonts.headline)
```

### Tests Added (Phase 1)
```
src/features/review/__tests__/ReviewNarrative.test.tsx  # 8 tests
  - Winning step highlight
  - Missed badge on final step
  - Combined states (winning + latest, loan + winning)

src/features/review/__tests__/QuizReview.test.tsx  # 6 tests
  - Correct answer in green when user was wrong
  - User wrong choice in red with X indicator
  - User correct choice in green with checkmark
  - All 4 options display correctly
```

## Review Mode Enhancement - Phase 2
Implemented: 2026-01-10

### Overview
Added Goalscorer Recall "Found vs Missed" comparison view, global review mode banner for all game screens, and legacy mode notice for Tic Tac Toe.

### Goalscorer Recall Review - "Found vs Missed" Comparison
**Component:** `RecallComparisonView`

Displays a partitioned view showing which scorers the user found vs missed:
- **FOUND Section**: Green checkmark icon, scorers correctly named
- **MISSED Section**: Red X icon, scorers the user overlooked
- **OWN GOALS Section**: Gray styling (only shown if own goals exist)

Uses `normalizeString()` from `@/lib/validation` to match found scorer names (stored normalized in metadata) against goal data.

**Props:**
- `goals: Goal[]` - All goals from the puzzle
- `foundScorerNames: string[]` - Normalized names from metadata
- `testID?: string`

### "REVIEWING COMPLETED GAME" Banner
**Component:** `ReviewModeBanner`

Thin, high-contrast banner displayed at the top of ALL game screens when in review mode:
- Stadium Navy background with Pitch Green text
- Eye icon from lucide-react-native
- Uses Bebas Neue font (`fonts.headline`)

Added to all 6 game screens:
- CareerPathScreen
- TransferGuessScreen
- TopicalQuizScreen
- GoalscorerRecallScreen
- TicTacToeScreen

### Tic Tac Toe Legacy Mode Notice
When viewing completed Tic Tac Toe games, a legacy notice is shown:
- Yellow (cardYellow) AlertTriangle icon + text
- "LEGACY MODE - PREVIEW ONLY" label
- Indicates the game mode is being rebuilt

### Files Created
```
src/features/goalscorer-recall/components/RecallComparisonView.tsx
  - ScorerRow component for each goal
  - EmptyState component for empty sections
  - Partitions goals into found/missed/ownGoals

src/components/ReviewMode/ReviewModeBanner.tsx
  - Eye icon + "REVIEWING COMPLETED GAME" text
  - Stadium Navy bg, Pitch Green text

src/features/review/__tests__/RecallReview.test.tsx  # 9 tests
  - Found/Missed count validation
  - Row styling by variant
  - Own goals section visibility
  - Empty state rendering
  - Name normalization (accents/case)

src/features/ui/__tests__/ReviewBanner.test.tsx  # 4 tests
  - Banner text and testID
  - Visibility when rendered/not rendered
  - Icon rendering

src/features/tic-tac-toe/__tests__/LegacyMode.test.tsx  # 4 tests
  - Legacy notice text and testID
  - Visibility in review mode
  - AlertTriangle icon rendering
```

### Files Modified
```
src/features/goalscorer-recall/screens/GoalscorerRecallScreen.tsx
  - Replaced flat scorer list with RecallComparisonView
  - Added ReviewModeBanner import and usage

src/features/career-path/screens/CareerPathScreen.tsx
  - Added ReviewModeBanner to review mode ScrollView

src/features/transfer-guess/screens/TransferGuessScreen.tsx
  - Added ReviewModeBanner to review mode ScrollView

src/features/topical-quiz/screens/TopicalQuizScreen.tsx
  - Added ReviewModeBanner to review mode ScrollView

src/features/tic-tac-toe/screens/TicTacToeScreen.tsx
  - Added ReviewModeBanner to review mode ScrollView
  - Added legacy notice with AlertTriangle icon
  - Added legacyNotice/legacyNoticeText styles

src/components/ReviewMode/index.ts
  - Added ReviewModeBanner export

src/components/index.ts
  - Added ReviewModeBanner to main exports
```

### Test Summary (Phase 2)
- RecallReview.test.tsx: 9 tests
- ReviewBanner.test.tsx: 4 tests
- LegacyMode.test.tsx: 4 tests
- **Total: 17 new tests passing**
