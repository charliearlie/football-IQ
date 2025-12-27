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
- **GlassCard**: Frosted glass container (expo-blur)

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
  │   └── GoalscorerRecallScreen.tsx
  ├── components/
  │   ├── MatchHeader.tsx
  │   ├── Scoreboard.tsx
  │   ├── GoalSlot.tsx
  │   ├── TimerDisplay.tsx
  │   ├── RecallActionZone.tsx
  │   ├── StartOverlay.tsx
  │   ├── GoalFlash.tsx
  │   └── RecallResultModal.tsx
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
      └── scoring.test.ts         # Percentage + time bonus tests
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

## Daily Loop System
Initialized: 2025-12-25

### Overview
The Daily Loop connects the database to the UI, providing a centralized Home Screen dashboard that shows today's puzzles with dynamic states (Play/Resume/Done), streak tracking, and navigation to game screens via dynamic routes.

### Home Screen Dashboard
**Location:** `app/(tabs)/index.tsx`

Components:
- **StreakHeader**: Displays current streak (fire icon + count) and daily progress (X/5)
- **DailyStackCard**: Individual game card with state-dependent UI

Card States:
| State | UI | Trigger |
|-------|----|---------|
| Play | Green "Play" button | No attempt exists |
| Resume | Yellow "Resume" button | Attempt exists, not completed |
| Done | Score emoji grid + checkmark | Attempt completed |
| Coming Soon | Lock icon (Quiz mode) | Game not implemented |

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
└── tic-tac-toe/
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
| `useDailyPuzzles()` | Today's 5 puzzle cards with status |
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
- 35 puzzles: 5 modes × 7 days (CURRENT_DATE -3 to +3)
- 10 match_data rows for Goalscorer Recall
- All puzzles set to `status: 'live'` for RLS access
