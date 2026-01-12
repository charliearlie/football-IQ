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
puzzles           - Cached puzzles (offline play)
attempts          - User attempts (synced flag)
sync_queue        - Pending sync to Supabase
unlocked_puzzles  - Ad-unlocked puzzles (permanent)
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
validateGuess('Son', 'Son Heung-min')     // { isMatch: true, score: 0.92 } (surname)
validateGuess('Saka', 'Bukayo Saka')      // { isMatch: true, score: 0.92 } (surname)

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
state.attemptId          // UUID for progressive saves
state.restoredTimeRemaining // Timer value restored from save

// Timer hook (reusable)
const timer = useCountdownTimer({
  initialSeconds: 60,
  onTick: (remaining) => console.log(remaining),
  onFinish: () => console.log('Time up!'),
});
timer.start();
timer.stop();
timer.reset();
timer.setTo(35);  // Set to specific value (for resume)

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

## The Grid Game
```typescript
import {
  TheGridScreen,
  useTheGridGame,
  validateCellGuess,
  getCellCategories,
  calculateGridScore,
  generateGridEmojiDisplay,
  shareTheGridResult,
} from '@/features/the-grid';

// Puzzle content structure
type CategoryType = 'club' | 'nation' | 'stat' | 'trophy';

interface GridCategory {
  type: CategoryType;
  value: string;
}

interface TheGridContent {
  xAxis: [GridCategory, GridCategory, GridCategory];  // Column headers
  yAxis: [GridCategory, GridCategory, GridCategory];  // Row headers
  valid_answers: {
    [cellIndex: string]: string[];  // "0"-"8" → valid player names
  };
}

// Hook usage (internal to TheGridScreen)
const {
  state,
  gridContent,
  selectedCellCategories,
  selectCell,
  deselectCell,
  setCurrentGuess,
  submitGuess,
  shareResult,
} = useTheGridGame(puzzle);

// State values
state.cells              // Array of 9 (FilledCell | null)
state.selectedCell       // CellIndex (0-8) or null
state.currentGuess       // Current text input value
state.gameStatus         // 'playing' | 'complete'
state.score              // TheGridScore | null
state.lastGuessIncorrect // Triggers shake animation

// Validation: check if player name is valid for a specific cell
validateCellGuess('Vinícius Júnior', 0, gridContent)
// { isValid: true, matchedPlayer: 'Vinícius Júnior' }

// Get categories for a cell
getCellCategories(4, gridContent)
// { row: { type: 'club', value: 'Barcelona' }, col: { type: 'nation', value: 'France' } }

// Scoring: ~11 points per cell, max 100
calculateGridScore(9)   // { points: 100, maxPoints: 100, cellsFilled: 9 }
calculateGridScore(7)   // { points: 78, maxPoints: 100, cellsFilled: 7 }

// Emoji grid:
// ✅✅✅
// ✅✅❌
// ✅❌❌
generateGridEmojiDisplay(cells);
```

## Player Search Service
```typescript
import {
  searchPlayers,
  getPlayerById,
  didPlayerPlayFor,
  hasNationality,
  findPlayersMatchingCriteria,
  normalizeSearchName,
  levenshteinDistance,
  countryCodeToEmoji,
  calculateRelevance,
  clubsMatch,
} from '@/services/player';

// Search players by name (min 3 chars)
const results = await searchPlayers('messi', 10);
// Returns: PlayerSearchResult[] sorted by relevance

// Get player by ID
const player = await getPlayerById('player-123');
// Returns: ParsedPlayer | null

// Check if player played for club
await didPlayerPlayFor('player-123', 'Barcelona')  // true
await didPlayerPlayFor('player-123', 'Real Madrid CF')  // true (fuzzy: "Real Madrid")

// Check nationality
await hasNationality('player-123', 'AR')  // true (Argentina)
await hasNationality('player-123', 'br')  // works (case-insensitive)

// Combined search + filter
const players = await findPlayersMatchingCriteria('messi', 'Barcelona', 'AR');
// Returns players matching name AND club AND nationality

// Utility functions
normalizeSearchName('Özil')           // "ozil"
normalizeSearchName('Sørloth')        // "sorloth"
normalizeSearchName('Ibrahimović')    // "ibrahimovic"

levenshteinDistance('messi', 'mesi')  // 1 (deletion)
levenshteinDistance('kitten', 'sitting')  // 3

countryCodeToEmoji('BR')              // "🇧🇷"
countryCodeToEmoji('FR')              // "🇫🇷"

calculateRelevance('messi', 'lionel messi')  // ~0.85

clubsMatch('Real Madrid', 'Real Madrid CF')  // true (fuzzy)
clubsMatch('Barcelona', 'Barca', 2)          // true (tolerance: 2)
```

## Player Search Overlay
```typescript
import { PlayerSearchOverlay, PlayerResultItem } from '@/components/PlayerSearchOverlay';

// Full overlay with search
<PlayerSearchOverlay
  visible={showSearch}
  onSelectPlayer={(player) => {
    // player: ParsedPlayer with id, name, clubs, nationalities
    handleSelection(player);
  }}
  onClose={() => setShowSearch(false)}
  title="Search Players"
  isLoading={false}  // For future API integration
  testID="player-search"
/>

// Individual result item (used internally)
<PlayerResultItem
  player={parsedPlayer}
  onPress={() => handleSelect(player)}
  testID="player-result-1"
/>
```

## The Grid DB Validation
```typescript
import { validateCellWithDB } from '@/features/the-grid/utils/validation';

// Validate player selection against database
const result = await validateCellWithDB('player-123', 4, gridContent);
// result: { isValid: true, matchedCriteria: { row: true, col: true } }

// Cell index mapping (3x3 grid):
// 0 1 2
// 3 4 5
// 6 7 8

// Supported category types:
// - 'club': Uses didPlayerPlayFor()
// - 'nation': Uses hasNationality() with name→code mapping
// - 'stat'/'trophy': Not yet supported (returns false)
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

## Top Tens Game (Premium)
```typescript
import {
  TopTensScreen,
  useTopTensGame,
  calculateTopTensScore,
  formatTopTensScore,
  generateTopTensEmojiGrid,
  shareTopTensResult,
  PremiumOnlyGate,
} from '@/features/top-tens';

// Puzzle content structure
interface TopTensContent {
  title: string;                    // "Top 10 Premier League Goalscorers"
  category?: string;                // "Premier League"
  answers: TopTensAnswer[];         // 10 items, index 0 = rank #1
}

interface TopTensAnswer {
  name: string;                     // Primary display name
  aliases?: string[];               // Alternative accepted names
  info?: string;                    // Optional stat (e.g., "260 goals")
}

// Hook usage (internal to TopTensScreen)
const {
  state,
  content,
  submitGuess,
  giveUp,
  shareResult,
} = useTopTensGame(puzzle);

// State values
state.gameStatus         // 'playing' | 'won' | 'lost'
state.rankSlots          // Array of 10 { rank, found, answer }
state.foundCount         // 0-10 (answers found)
state.wrongGuessCount    // Count of incorrect guesses
state.currentGuess       // Current input text
state.score              // TopTensScore | null (set on game end)
state.lastGuessIncorrect // Triggers shake animation
state.lastGuessDuplicate // Triggers duplicate feedback

// Scoring: 1 point per answer found, max 10
calculateTopTensScore(7, 3, false)  // { points: 7, maxPoints: 10, won: false }
calculateTopTensScore(10, 2, true)  // { points: 10, maxPoints: 10, won: true }

// Format: "7/10"
formatTopTensScore(score)

// Emoji grid: ✅✅✅✅✅✅✅❌❌❌
generateTopTensEmojiGrid(rankSlots, score)

// Premium gating (route-level)
<PremiumOnlyGate>
  <TopTensScreen puzzleId={puzzleId} />
</PremiumOnlyGate>
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
  tic_tac_toe: 0.05,       // Legacy
  the_grid: 0.10,          // Replaced Tic Tac Toe
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

## Score Distribution Graph ("How You Compare")
```typescript
import {
  ScoreDistributionContainer,
  ScoreDistributionGraph,
  ScoreDistributionSkeleton,
  useScoreDistribution,
  getPuzzleScoreDistribution,
  normalizeScoreForMode,
} from '@/features/stats';

// In result modals - container handles data fetching
<ScoreDistributionContainer
  puzzleId={puzzle.id}
  gameMode="top_tens"
  userScore={score.points * 10}  // Normalized to 0-100
/>

// Hook usage (for custom implementations)
const {
  distribution,   // DistributionEntry[]
  totalAttempts,  // number
  isLoading,
  error,
  refetch,
} = useScoreDistribution(puzzleId, gameMode);

// Distribution entry structure
interface DistributionEntry {
  score: number;      // Bucket: 0, 10, 20, ..., 100
  count: number;      // Players in this bucket
  percentage: number; // % of total attempts
}

// Score normalization per game mode
normalizeScoreForMode('top_tens', 7)                    // 70 (7*10)
normalizeScoreForMode('career_path', 80, 100)           // 80 (80/100*100)
normalizeScoreForMode('guess_the_goalscorers', 75)      // 75 (already %)
normalizeScoreForMode('the_grid', 9, 9)                 // 100 (9/9*100)

// Service function (direct RPC call)
const result = await getPuzzleScoreDistribution(puzzleId);
// result.distribution = [{ score: 100, count: 5, percentage: 10 }, ...]
// result.totalAttempts = 50
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

// Modal states (RevenueCat-powered)
type ModalState = 'idle' | 'loading' | 'selecting' | 'purchasing' | 'success' | 'error';
```

## Skeleton Loaders
```typescript
import {
  SkeletonBox,
  SkeletonGroup,
  SKELETON_COLORS,
  DailyStackCardSkeleton,
  MonthHeaderSkeleton,
  ArchiveCardSkeleton,
  ArchiveSkeletonList,
  ProfileHeaderSkeleton,
  IQScoreDisplaySkeleton,
  ProficiencyBarSkeleton,
  ProficiencySectionSkeleton,
  StatsGridSkeleton,
  FullStatsSkeleton,
} from '@/components/ui/Skeletons';

// Base skeleton box
<SkeletonBox width={100} height={20} radius={4} />
<SkeletonBox width={48} height={48} circle />

// Conditional skeleton group
<SkeletonGroup show={isLoading}>
  <DailyStackCardSkeleton />
</SkeletonGroup>

// Home screen loading
{isLoading && (
  <View>
    {[0, 1, 2, 3, 4].map((i) => (
      <DailyStackCardSkeleton key={i} />
    ))}
  </View>
)}

// Archive loading
{isLoading && <ArchiveSkeletonList />}

// Stats loading
{isLoading && <FullStatsSkeleton />}
```

## Quiz Image Prefetch
```typescript
import {
  QuizPrefetchProvider,
  useQuizPrefetch,
  extractImageUrls,
  prefetchQuizImages,
} from '@/features/topical-quiz';

// Provider (in app/_layout.tsx, inside AuthGate)
<PuzzleProvider>
  <QuizPrefetchProvider>
    {/* App content */}
  </QuizPrefetchProvider>
</PuzzleProvider>

// Hook usage (in TopicalQuizScreen)
const { status, isPrefetched, triggerPrefetch } = useQuizPrefetch();

// Status values: 'idle' | 'prefetching' | 'ready' | 'error'
// isPrefetched: true when status === 'ready'

// Manual prefetch trigger (usually not needed)
await triggerPrefetch();

// Low-level utilities (for custom usage)
const urls = extractImageUrls(quizContent);  // string[]
const result = await prefetchQuizImages(urls);
// result: { total, succeeded, failed }
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
- Tic Tac Toe: `src/features/tic-tac-toe/` (legacy)
- The Grid: `src/features/the-grid/`
- Topical Quiz: `src/features/topical-quiz/`
- Top Tens: `src/features/top-tens/` (premium-only)
- Archive: `src/features/archive/`
- My IQ (Stats): `src/features/stats/`
- Leaderboard: `src/features/leaderboard/`
- Ads: `src/features/ads/`
- Local DB: `src/lib/database.ts`

## Expo App Structure
```
app/
  _layout.tsx           # Root layout (fonts, DB init, AuthProvider)
  (tabs)/_layout.tsx    # Tab navigator
  career-path/          # Career Path game routes
  tic-tac-toe/          # Tic Tac Toe game routes (legacy)
  the-grid/             # The Grid game routes
  transfer-guess/       # Transfer Guess game routes
  goalscorer-recall/    # Goalscorer Recall game routes
  topical-quiz/         # Topical Quiz game routes
  top-tens/             # Top Tens game routes (premium-only)
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
    top-tens/          # TopTensScreen, useTopTensGame (premium-only)
    home/
    games/
    archive/
    stats/             # usePerformanceStats, IQCardOverlay
    leaderboard/       # useLeaderboard, LeaderboardList, StickyMeBar
    ads/               # AdProvider, AdBanner, UnlockChoiceModal
```

## Design Tokens
```
@/theme/colors      # pitchGreen, stadiumNavy, etc.
@/theme/typography  # fonts, textStyles
@/theme/spacing     # spacing, borderRadius
```

## Core Components
```typescript
// ElevatedButton - Tactile 3D button with haptic feedback
<ElevatedButton title="Play" onPress={fn} />                         // Primary (default)
<ElevatedButton title="Cancel" onPress={fn} variant="secondary" />   // Stadium Navy
<ElevatedButton title="Give Up" onPress={fn} variant="danger" />     // Red Card
<ElevatedButton title="Maybe Later" onPress={fn} variant="outline" />// Glass + white border
<ElevatedButton title="Continue" onPress={fn} fullWidth />           // Stretch to container
<ElevatedButton title="Submit" onPress={fn} size="large" />          // Large size (6px offset)

// Override variant colors (backward compatible)
<ElevatedButton title="Custom" topColor="#FACC15" shadowColor="#D4A500" />

// GlassCard - Frosted glass container with optional shadow
<GlassCard>{children}</GlassCard>                    // With shadow (default)
<GlassCard showShadow={false}>{children}</GlassCard> // Without shadow

// UniversalGameCard - Unified card for Home and Archive screens
import { UniversalGameCard } from '@/components';

// Home screen usage (daily variant - no date, no lock)
<UniversalGameCard
  gameMode="career_path"
  status="play"  // 'play' | 'resume' | 'done'
  onPress={handlePress}
  variant="daily"
/>

// Archive screen usage (archive variant - shows date, can be locked)
<UniversalGameCard
  gameMode="career_path"
  status="done"
  onPress={handlePress}
  variant="archive"
  date="2024-12-20"        // Shows compact date like "Fri, Dec 20"
  isLocked={false}         // true shows dimmed card with Lock button
  scoreDisplay="🟩🟩⬛⬛⬛" // Emoji grid for done state
/>
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

Supported game modes: `career_path`, `guess_the_transfer`, `guess_the_goalscorers`, `tic_tac_toe`, `the_grid`, `topical_quiz`, `top_tens`

## RevenueCat Integration
```typescript
import { getRevenueCatApiKey, PREMIUM_OFFERING_ID, PREMIUM_ENTITLEMENT_ID } from '@/config/revenueCat';
import { SubscriptionSyncProvider, useSubscriptionSync } from '@/features/auth';

// Configuration (use offering identifier, NOT internal ID)
PREMIUM_OFFERING_ID = 'default_offering'
PREMIUM_ENTITLEMENT_ID = 'premium_access'

// Environment-aware key selection
getRevenueCatApiKey()  // Returns sandbox key in __DEV__, production otherwise

// API Keys (DO NOT COMMIT TO PUBLIC REPOS)
// Production: appl_QWyaHOEVWcyFzTWkykxesWlqhDo
// Sandbox:    test_otNRIIDWLJwJlzISdCbUzGtwwlD

// SDK Initialization (in app/_layout.tsx)
Purchases.configure({ apiKey: getRevenueCatApiKey() });

// Sync Provider (wraps inside AuthProvider)
<AuthProvider>
  <SubscriptionSyncProvider>
    {/* App content */}
  </SubscriptionSyncProvider>
</AuthProvider>

// Force manual sync
const { forceSync } = useSubscriptionSync();
await forceSync();

// Purchase flow (in PremiumUpsellModal)
const offerings = await Purchases.getOfferings();
const pkg = offerings.all[PREMIUM_OFFERING_ID].availablePackages[0];
const { customerInfo } = await Purchases.purchasePackage(pkg);

// Restore purchases
const customerInfo = await Purchases.restorePurchases();

// Check entitlement
if (customerInfo.entitlements.active['premium_access']) {
  // User has premium
}
```

## Ad Monetization (Google AdMob)
```typescript
import {
  AdProvider,
  useAds,
  useAdsOptional,
  AdBanner,
  UnlockChoiceModal,
  PremiumUpsellBanner,
  getAdUnitId,
  isAdsSupportedPlatform,
  grantPuzzleUnlock,
  checkPuzzleUnlock,
} from '@/features/ads';

// Context usage
const {
  shouldShowAds,       // true if non-premium user on mobile
  isRewardedAdReady,   // true if rewarded ad is loaded
  loadRewardedAd,      // Load a rewarded ad
  showRewardedAd,      // Show rewarded ad, returns true if completed
  adUnlocks,           // List of ad-unlocked puzzles (permanent)
  isAdUnlockedPuzzle,  // Check if puzzle is ad-unlocked
  grantAdUnlock,       // Grant permanent unlock after ad watch
} = useAds();

// AdBanner (game screens) - auto-hides for premium
<AdBanner testID="game-ad-banner" />

// PremiumUpsellBanner (Home screen) - auto-hides for premium
<PremiumUpsellBanner testID="home-upsell" />

// UnlockChoiceModal (Archive) - two unlock options
<UnlockChoiceModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  puzzleId="puzzle-123"
  puzzleDate="2024-12-15"
  onUnlockSuccess={() => navigateToPuzzle(puzzle)}
/>

// Extended lock check with ad unlocks (permanent)
import { isPuzzleLocked } from '@/features/archive';

isPuzzleLocked('2024-12-15', false)                  // true (no premium, no ad unlock)
isPuzzleLocked('2024-12-15', false, 'p-123', [])     // true (no unlock in array)
isPuzzleLocked('2024-12-15', false, 'p-123', [{ puzzle_id: 'p-123', ... }])  // false (unlocked forever)

// Ad Unit IDs (test IDs in __DEV__, production otherwise)
getAdUnitId('banner')    // Returns iOS/Android banner ad unit ID
getAdUnitId('rewarded')  // Returns iOS/Android rewarded ad unit ID

// AdMob App IDs (app.json config plugin)
// iOS: ca-app-pub-9426782115883407~8797195643
// Android: ca-app-pub-9426782115883407~1712062487
```

### Local SQLite: unlocked_puzzles Table
```
unlocked_puzzles  - Ad-unlocked puzzles (permanent)
  puzzle_id TEXT PRIMARY KEY
  unlocked_at TEXT (ISO timestamp)
```

```typescript
import { saveAdUnlock, isAdUnlocked, getValidAdUnlocks } from '@/lib/database';

await saveAdUnlock('puzzle-123');           // Grant permanent unlock
const valid = await isAdUnlocked('puzzle-123');  // Check if unlocked
const unlocks = await getValidAdUnlocks();  // All unlocked puzzles
```

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
