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

## Puzzle Sync
```typescript
import { PuzzleProvider, usePuzzleContext, usePuzzle } from '@/features/puzzles';

// Get puzzle state and sync actions
const { puzzles, syncStatus, syncPuzzles, syncAttempts } = usePuzzleContext();

// Get today's puzzle for a game mode
const { puzzle, isLoading, refetch } = usePuzzle('career_path');

// Sync status values: 'idle' | 'syncing' | 'success' | 'error'
// Use syncStatus to show "Downloading Puzzles..." vs "Ready to Play"
```

## Career Path Game
```typescript
import {
  CareerPathScreen,
  useCareerPathGame,
  validateGuess,
  calculateScore,
  generateScoreDisplay,
  shareGameResult,
} from '@/features/career-path';

// Puzzle content structure
interface CareerPathContent {
  answer: string;
  career_steps: Array<{
    type: 'club' | 'loan';
    text: string;
    year: string;
    apps?: number;   // Appearances (optional)
    goals?: number;  // Goals scored (optional)
  }>;
}

// Hook usage (internal to CareerPathScreen)
const { state, careerSteps, revealNext, submitGuess, shareResult } = useCareerPathGame(puzzle);

// State values
state.revealedCount      // Number of steps shown (starts at 1)
state.gameStatus         // 'playing' | 'won' | 'lost'
state.score              // GameScore | null (set on game end)
state.attemptSaved       // Whether saved to local DB
state.lastGuessIncorrect // Triggers shake animation

// Validation (fuzzy matching)
validateGuess('Messi', 'Lionel Messi')    // { isMatch: true, score: 0.95 }
validateGuess('Ozil', 'Özil')             // { isMatch: true, score: 1.0 }

// Scoring: Score = Total Steps - (Revealed - 1)
calculateScore(10, 3, true)  // { points: 8, maxPoints: 10, won: true }

// Share: opens native sheet or copies to clipboard
await shareResult();  // Returns ShareResult { success, method }
```

## Transfer Guess Game
```typescript
import {
  TransferGuessScreen,
  useTransferGuessGame,
  calculateTransferScore,
  generateTransferEmojiGrid,
  shareTransferResult,
} from '@/features/transfer-guess';

// Puzzle content structure
interface TransferGuessContent {
  answer: string;
  from_club: string;
  to_club: string;
  year: number;
  fee: string;
  hints: [string, string, string]; // [nationality, position, achievement]
}

// Hook usage (internal to TransferGuessScreen)
const { state, transferContent, hints, revealHint, submitGuess, giveUp, shareResult } = useTransferGuessGame(puzzle);

// State values
state.hintsRevealed       // Number of hints shown (starts at 0)
state.guesses             // Array of incorrect guesses
state.gameStatus          // 'playing' | 'won' | 'lost'
state.score               // TransferGuessScore | null

// Scoring: 10 - (hints × 2) - (wrong × 1), min 1
calculateTransferScore(2, 0, true)   // { points: 6, ... } (2 hints, 0 wrong)
calculateTransferScore(3, 4, true)   // { points: 1, ... } (min score on win)
calculateTransferScore(0, 5, false)  // { points: 0, ... } (5 wrong = lost)

// Emoji grid: 🟡🟡⚫ ❌❌✅
generateTransferEmojiGrid(score)

// Share: opens native sheet or copies to clipboard
await shareResult();
```

## Goalscorer Recall Game
```typescript
import {
  GoalscorerRecallScreen,
  useGoalscorerRecallGame,
  useCountdownTimer,
  calculateGoalscorerScore,
  generateGoalscorerEmojiGrid,
} from '@/features/goalscorer-recall';

// Puzzle content structure
interface GoalscorerRecallContent {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  competition: string;
  match_date: string;
  goals: Array<{
    scorer: string;
    minute: number;
    team: 'home' | 'away';
    isOwnGoal?: boolean;
  }>;
}

// Hook usage (internal to GoalscorerRecallScreen)
const {
  state,
  timeRemaining,
  totalScorers,
  foundScorersCount,
  homeGoals,
  awayGoals,
  startGame,
  submitGuess,
  giveUp,
} = useGoalscorerRecallGame(puzzle);

// State values
state.gameStatus         // 'idle' | 'playing' | 'won' | 'lost'
state.foundScorers       // Set<string> of found scorer names
state.lastGuessCorrect   // Triggers "GOAL!" flash
state.lastGuessIncorrect // Triggers shake animation

// Timer hook (reusable)
const timer = useCountdownTimer({
  initialSeconds: 60,
  onTick: (remaining) => console.log(remaining),
  onFinish: () => console.log('Time up!'),
});
timer.start();
timer.stop();
timer.reset();

// Scoring: percentage + time bonus if all found
calculateGoalscorerScore(3, 5, 30, true)
// { percentage: 60, timeBonus: 60, won: true }

// Emoji grid: ⏱️42s | ✅✅✅❌❌
generateGoalscorerEmojiGrid(goals, 42);
```

## Tic Tac Toe Game
```typescript
import {
  TicTacToeScreen,
  useTicTacToeGame,
  validateCellGuess,
  checkWin,
  checkDraw,
  generateTicTacToeEmojiGrid,
  shareTicTacToeResult,
} from '@/features/tic-tac-toe';

// Puzzle content structure
interface TicTacToeContent {
  rows: [string, string, string];      // e.g., ["Real Madrid", "Barcelona", "Man City"]
  columns: [string, string, string];   // e.g., ["Brazil", "Argentina", "France"]
  valid_answers: {
    [cellIndex: string]: string[];     // "0" → ["Vinícius Júnior", "Rodrygo"]
  };
}

// Hook usage (internal to TicTacToeScreen)
const {
  state,
  puzzleContent,
  isGameOver,
  isPlayerTurn,
  selectedCellCategories,
  selectCell,
  deselectCell,
  submitGuess,
  shareResult,
} = useTicTacToeGame(puzzle);

// State values
state.cells              // Array of 9 CellState objects
state.gameStatus         // 'playing' | 'won' | 'lost' | 'draw'
state.selectedCell       // CellIndex (0-8) or null
state.currentTurn        // 'player' | 'ai'
state.winningLine        // [CellIndex, CellIndex, CellIndex] or null

// Validation: check if player name is valid for a specific cell
validateCellGuess('Vinícius Júnior', 0, puzzleContent)
// { isValid: true, matchedPlayer: 'Vinícius Júnior', score: 1.0 }

// Win detection
checkWin(cells, 'player')  // Returns winning line or null
checkDraw(cells)           // Returns true if draw

// Scoring: Win=10, Draw=5, Loss=0
// { points: 10, maxPoints: 10, result: 'win', playerCells: 4, aiCells: 3 }

// Emoji grid:
// 🟢🔴⬜
// 🔴🟢⬜
// ⬜⬜🟢
generateTicTacToeEmojiGrid(cells);
```

## Topical Quiz Game
```typescript
import {
  TopicalQuizScreen,
  useTopicalQuizGame,
  calculateQuizScore,
  generateQuizEmojiGrid,
  shareQuizResult,
} from '@/features/topical-quiz';

// Puzzle content structure
interface TopicalQuizContent {
  questions: [QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion, QuizQuestion];
}

interface QuizQuestion {
  id: string;
  question: string;
  imageUrl?: string;           // Optional image
  options: [string, string, string, string];
  correctIndex: number;        // 0-3
}

// Hook usage (internal to TopicalQuizScreen)
const {
  state,
  currentQuestion,
  getOptionState,
  handleAnswer,
  shareResult,
} = useTopicalQuizGame(puzzle);

// State values
state.currentQuestionIndex   // 0-4 (current question)
state.answers                // Array of { questionId, selectedIndex, isCorrect }
state.gameStatus             // 'playing' | 'complete'
state.score                  // TopicalQuizScore | null
state.showingResult          // true during 1.5s feedback delay

// Scoring: 2 points per correct answer
calculateQuizScore(4)  // { points: 8, maxPoints: 10, correctCount: 4 }
calculateQuizScore(5)  // { points: 10, maxPoints: 10, correctCount: 5 }

// Emoji grid: ✅✅❌✅❌
generateQuizEmojiGrid(answers)
```

## My IQ Profile Screen
```typescript
import {
  usePerformanceStats,
  ProfileHeader,
  IQScoreDisplay,
  ProficiencySection,
  TrophyRoom,
  StatsGrid,
  calculateGlobalIQ,
  normalizeScore,
  isPerfectScore,
  calculateBadges,
} from '@/features/stats';

// Hook usage (in stats.tsx screen)
const { stats, isLoading, error, refresh } = usePerformanceStats();

// Stats object structure
interface PerformanceStats {
  globalIQ: number;                    // 0-100 weighted average
  proficiencies: GameProficiency[];    // 5 items (one per mode)
  totalPuzzlesSolved: number;
  totalPerfectScores: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];                     // 8 badges with earnedAt
}

// Proficiency per game mode
interface GameProficiency {
  gameMode: GameMode;          // 'career_path', etc.
  displayName: string;         // 'Deduction', 'Market Knowledge', etc.
  percentage: number;          // 0-100 normalized
  gamesPlayed: number;
  perfectScores: number;
}

// Badge structure
interface Badge {
  id: string;          // 'streak_7', 'perfect_career', etc.
  name: string;        // '7-Day Streak', 'Detective', etc.
  description: string;
  icon: string;        // Lucide icon name
  earnedAt: string | null;  // ISO date or null if not earned
}

// IQ Weights (sum to 1.0)
const IQ_WEIGHTS = {
  career_path: 0.25,
  guess_the_transfer: 0.25,
  guess_the_goalscorers: 0.20,
  tic_tac_toe: 0.15,
  topical_quiz: 0.15,
};

// Normalize a single attempt's score to 0-100
normalizeScore('career_path', { points: 8, maxPoints: 10 })  // 80
normalizeScore('tic_tac_toe', { result: 'win' })             // 100
normalizeScore('guess_the_goalscorers', { percentage: 75 })  // 75

// Check if attempt was perfect
isPerfectScore('career_path', { points: 10, maxPoints: 10 }) // true
isPerfectScore('tic_tac_toe', { result: 'draw' })            // false

// Calculate global IQ from proficiencies
calculateGlobalIQ(proficiencies)  // Returns weighted average 0-100

// Calculate badges based on proficiencies, streak, and total puzzles
calculateBadges(proficiencies, currentStreak, totalPuzzles)  // Badge[]
```

## Leaderboard
```typescript
import {
  useLeaderboard,
  useStickyMe,
  getDailyLeaderboard,
  getGlobalIQLeaderboard,
  getUserRank,
  LeaderboardToggle,
  LeaderboardEntry,
  LeaderboardList,
  StickyMeBar,
  LeaderboardEmptyState,
  normalizeModeScore,
  calculateDailyScore,
  shouldShowStickyBar,
} from '@/features/leaderboard';

// Main hook usage
const {
  entries,
  userRank,
  isLoading,
  isRefreshing,
  error,
  refresh,
} = useLeaderboard('daily'); // or 'global'

// Leaderboard entry structure
interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;              // daily: 0-500, global: 0-100
  gamesPlayed?: number;       // daily: games today, global: total games
  lastCompletedAt?: string;   // For tie-breaking
}

// User rank structure
interface UserRank {
  rank: number;
  score: number;
  totalUsers: number;
}

// Sticky bar visibility hook
const { viewableItemsConfig, onViewableItemsChanged, shouldShowStickyBar } = useStickyMe(entries, userId);

// Service functions (direct RPC calls)
const dailyEntries = await getDailyLeaderboard({ date: '2026-01-02', limit: 100 });
const globalEntries = await getGlobalIQLeaderboard({ limit: 100 });
const myRank = await getUserRank(userId, 'daily');

// Utility functions
normalizeModeScore('career_path', 8, { maxPoints: 10 });  // 80
normalizeModeScore('tic_tac_toe', 10, { result: 'win' }); // 100
calculateDailyScore(attempts);  // Sum of normalized scores (0-500)
shouldShowStickyBar(config);    // true if user not visible in list
```

## IQ Card Sharing
```typescript
import {
  IQCardOverlay,
  IQCardData,
  captureIQCard,
  shareIQCard,
  captureAndShareIQCard,
} from '@/features/stats';

// IQ Card data structure
interface IQCardData {
  globalIQ: number;           // 0-100
  currentStreak: number;
  rank: number | null;        // User's global rank
  totalUsers: number | null;
  topBadgeName: string | null;
  displayName: string;
}

// Component usage (in Stats screen)
<IQCardOverlay
  visible={showIQCard}
  onClose={() => setShowIQCard(false)}
  data={iqCardData}
/>

// Direct capture/share (used internally by overlay)
const imageUri = await captureIQCard(viewShotRef);
await shareIQCard(imageUri, iqCardData);
// Or combined:
await captureAndShareIQCard(viewShotRef, iqCardData);
```

## Archive Screen
```typescript
import {
  useArchivePuzzles,
  useGatedNavigation,
  ArchiveList,
  GameModeFilter,
  PremiumUpsellModal,
  ArchivePuzzle,
  isPuzzleLocked,
  formatPuzzleDate,
} from '@/features/archive';

// Hook usage
const { sections, isLoading, isRefreshing, hasMore, loadMore, refresh } = useArchivePuzzles('all');
const { sections } = useArchivePuzzles('career_path'); // Filter by mode

// Lock check
isPuzzleLocked('2024-12-15', false) // true (>7 days, non-premium)
isPuzzleLocked('2024-12-15', true)  // false (premium sees all)

// Date formatting
formatPuzzleDate('2024-12-24') // "Tuesday, Dec 24"
```

## Premium Gating (Navigation + Route Protection)
```typescript
// Layer 1: UI Hook (Archive screen)
import { useGatedNavigation } from '@/features/archive';

const [lockedPuzzle, setLockedPuzzle] = useState<ArchivePuzzle | null>(null);

const { navigateToPuzzle, isPremium } = useGatedNavigation({
  onShowPaywall: (puzzle) => setLockedPuzzle(puzzle),
});

// Use single handler for all cards
<ArchiveList onPuzzlePress={navigateToPuzzle} />

// Show modal when locked puzzle tapped
<PremiumUpsellModal
  visible={!!lockedPuzzle}
  onClose={() => setLockedPuzzle(null)}
  puzzleDate={lockedPuzzle?.puzzleDate}
/>
```

```typescript
// Layer 2: Route HOC (puzzle routes)
import { PremiumGate } from '@/features/auth';

export default function CareerPathRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return (
    <PremiumGate puzzleId={puzzleId}>
      <CareerPathScreen puzzleId={puzzleId} />
    </PremiumGate>
  );
}

// PremiumGate handles:
// - Loading states (auth + puzzle)
// - RLS blocked puzzles (shows modal mode='blocked')
// - Deep-link protection (shows modal mode='locked')
// - Successful access (renders children)
```

```typescript
// Lock check utility
import { isPuzzleLocked, isWithinFreeWindow } from '@/features/archive';

isPuzzleLocked('2024-12-15', false)  // true (>7 days, non-premium)
isPuzzleLocked('2024-12-15', true)   // false (premium sees all)
isWithinFreeWindow('2024-12-30')     // true if within 7 days

// PremiumUpsellModal modes
type ModalMode = 'upsell' | 'locked' | 'blocked';
// upsell: general upgrade prompt
// locked: specific puzzle locked (shows date)
// blocked: RLS denied access (deep-link)

// Modal states
type ModalState = 'idle' | 'selecting' | 'purchasing' | 'success' | 'error';
```

## Key Files
- PRD: `docs/app-prd.md`
- Design System: `docs/design-system.md`
- Roadmap: `docs/roadmap.md`
- RLS Tests: `tests/supabase_rls_test.sql`
- Auth Feature: `src/features/auth/`
- Puzzle Feature: `src/features/puzzles/`
- Career Path: `src/features/career-path/`
- Transfer Guess: `src/features/transfer-guess/`
- Goalscorer Recall: `src/features/goalscorer-recall/`
- Tic Tac Toe: `src/features/tic-tac-toe/`
- Topical Quiz: `src/features/topical-quiz/`
- Archive: `src/features/archive/`
- My IQ (Stats): `src/features/stats/`
- Leaderboard: `src/features/leaderboard/`
- Local DB: `src/lib/database.ts`

## Expo App Structure
```
app/
  _layout.tsx           # Root layout (fonts, DB init, AuthProvider)
  (tabs)/_layout.tsx    # Tab navigator
  career-path.tsx       # Career Path game route
  tic-tac-toe.tsx       # Tic Tac Toe game route
  transfer-guess.tsx    # Transfer Guess game route
  goalscorer-recall.tsx # Goalscorer Recall game route
  topical-quiz.tsx      # Topical Quiz game route
  leaderboard/          # Leaderboard screen with Daily/Global toggle
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
    puzzles/           # PuzzleProvider, usePuzzle, sync services
    career-path/       # CareerPathScreen, useCareerPathGame
    tic-tac-toe/       # TicTacToeScreen, useTicTacToeGame
    transfer-guess/    # TransferGuessScreen, useTransferGuessGame
    goalscorer-recall/ # GoalscorerRecallScreen, useGoalscorerRecallGame
    topical-quiz/      # TopicalQuizScreen, useTopicalQuizGame
    home/
    games/
    archive/
    stats/             # usePerformanceStats, IQCardOverlay
    leaderboard/       # useLeaderboard, LeaderboardList, StickyMeBar
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

## Admin Tools

### Content Creator
```
# Open in browser to create puzzles
open tools/content-creator.html

# Configure
1. Enter Supabase URL + Service Role Key (saved to localStorage)
2. Select date/mode/difficulty
3. Fill form → Review JSON → Push to Supabase
```

Supported game modes: `career_path`, `guess_the_transfer`, `guess_the_goalscorers`, `tic_tac_toe`, `topical_quiz`

## Migrations
```
001_create_base_tables
002_enable_rls_policies
003_create_triggers
004_security_fixes
005_create_puzzle_catalog_rpc
006_create_leaderboard_rpcs
007_premium_puzzle_access
```
