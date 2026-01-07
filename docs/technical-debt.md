# Technical Debt

This document tracks known architectural improvements and refactoring opportunities. These items are not bugs but represent opportunities to reduce code duplication, improve maintainability, and establish better patterns.

---

## High Priority

### 1. Extract Shared Game Persistence Hook

**Current State:** Three game hooks contain ~60% duplicate code for game state persistence:
- [useCareerPathGame.ts](../src/features/career-path/hooks/useCareerPathGame.ts)
- [useTransferGuessGame.ts](../src/features/transfer-guess/hooks/useTransferGuessGame.ts)
- [useGoalscorerRecallGame.ts](../src/features/goalscorer-recall/hooks/useGoalscorerRecallGame.ts)

**Duplicated Logic:**
- AppState change handlers for background/foreground transitions
- Attempt persistence to SQLite (save/restore)
- Timer pause/resume on app state changes
- Game completion detection and attempt finalization

**Proposed Solution:**
Create `src/hooks/useGamePersistence.ts` with:
```typescript
interface UseGamePersistenceOptions<TState> {
  puzzleId: string;
  gameMode: GameMode;
  serializeState: (state: TState) => string;
  deserializeState: (data: string) => TState;
  isComplete: (state: TState) => boolean;
}

function useGamePersistence<TState>(options: UseGamePersistenceOptions<TState>) {
  // Shared AppState handling
  // Shared attempt persistence
  // Returns: { saveState, restoreState, finalizeAttempt }
}
```

**Impact:** ~400 lines of duplicate code removed, consistent behavior across all games.

---

### 2. Unify Result Modal Components

**Current State:** Five nearly identical result modal implementations:
- [GameResultModal.tsx](../src/features/career-path/components/GameResultModal.tsx) (Career Path)
- [TransferResultModal.tsx](../src/features/transfer-guess/components/TransferResultModal.tsx)
- [TicTacToeResultModal.tsx](../src/features/tic-tac-toe/components/TicTacToeResultModal.tsx)
- [RecallResultModal.tsx](../src/features/goalscorer-recall/components/RecallResultModal.tsx)
- [TopicalQuizResultModal.tsx](../src/features/topical-quiz/components/TopicalQuizResultModal.tsx)

**Duplicated Logic:**
- Modal structure and animations
- Win/loss state rendering
- Share button functionality
- "Play Tomorrow" / "View Archive" actions
- Score display formatting

**Proposed Solution:**
Create `src/components/GameResultModal/`:
```
GameResultModal/
├── GameResultModalBase.tsx  # Shared structure and logic
├── styles.ts                # Shared styles
└── index.ts                 # Exports
```

Each game mode would pass game-specific content via props:
```typescript
<GameResultModalBase
  isWin={isWin}
  title="Career Path"
  score={score}
  scoreDisplay={scoreDisplay}
  customContent={<CareerPathSummary />}  // Game-specific details
  onShare={handleShare}
  onClose={handleClose}
/>
```

**Impact:** ~1000 lines reduced to ~300, consistent UX across all games.

---

## Medium Priority

### 3. Centralize GameMode Type Definition

**Current State:** `GameMode` type defined in [puzzle.types.ts](../src/features/puzzles/types/puzzle.types.ts) but imported by 23+ files across the codebase.

**Issue:** Feature-specific type is used application-wide, creating implicit coupling.

**Proposed Solution:**
1. Create `src/types/game.types.ts`:
```typescript
export type GameMode =
  | 'career_path'
  | 'transfer_guess'
  | 'tic_tac_toe'
  | 'goalscorer_recall'
  | 'topical_quiz';
```

2. Re-export from puzzle.types.ts for backward compatibility
3. Gradually update imports to use new location

**Impact:** Clearer architecture, easier to add new game modes.

---

### 4. Centralize Game Mode Configuration

**Current State:** Game mode metadata (icons, colors, labels) duplicated in:
- [DailyStackCard.tsx](../src/features/home/components/DailyStackCard.tsx)
- [ArchivePuzzleCard.tsx](../src/features/archive/components/ArchivePuzzleCard.tsx)

**Duplicated Logic:**
```typescript
// This switch statement exists in both files
switch (gameMode) {
  case 'career_path':
    return { icon: <CareerIcon />, color: '#4CAF50', label: 'Career Path' };
  case 'transfer_guess':
    return { icon: <TransferIcon />, color: '#2196F3', label: 'Transfer Guess' };
  // ... etc
}
```

**Proposed Solution:**
Create `src/config/gameModes.tsx`:
```typescript
export const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
  career_path: {
    label: 'Career Path',
    icon: CareerPathIcon,
    primaryColor: '#4CAF50',
    description: 'Guess the player from their career history',
  },
  // ... other modes
};

export function getGameModeConfig(mode: GameMode): GameModeConfig;
export function renderGameModeIcon(mode: GameMode, size?: number): ReactNode;
```

**Impact:** Single source of truth for game mode presentation.

---

### 5. Break Circular Dependency

**Current State:** Circular import between puzzles and archive features:
```
puzzles/context/PuzzleContext.tsx
    ↓ imports
archive/services/catalogSyncService.ts
    ↓ imports
puzzles/types/puzzle.types.ts
    ↓ imports (indirect)
puzzles/context/PuzzleContext.tsx
```

**Issue:** While not causing runtime issues currently, circular dependencies can cause:
- Unpredictable initialization order
- Difficult-to-debug import errors
- Problems with tree shaking

**Proposed Solution:**
Extract shared sync types to `src/lib/syncService.ts`:
```typescript
// Types used by both puzzles and archive sync
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  error?: Error;
}

export interface SyncOptions {
  userId: string;
  lastSyncedAt: string | null;
  isPremium: boolean;
}
```

**Verification:** Use `npx madge --circular src/` to verify resolution.

---

## Low Priority

### 6. Add Comprehensive Accessibility Labels

**Current State:** Many interactive elements lack proper accessibility attributes.

**Files Affected:** 10+ component files

**Proposed Additions:**
- `accessibilityLabel` on all close/action buttons
- `accessibilityRole="button"` on all Pressable components
- `accessibilityHint` for complex interactions

**Example:**
```typescript
// Before
<Pressable onPress={onClose}>
  <CloseIcon />
</Pressable>

// After
<Pressable
  onPress={onClose}
  accessibilityLabel="Close modal"
  accessibilityRole="button"
>
  <CloseIcon />
</Pressable>
```

---

## Completed Items

Items that have been addressed (kept for historical reference):

- [x] **Timer Race Condition** - Fixed in useGoalscorerRecallGame.ts (Jan 2025)
- [x] **Stale Closure in PuzzleContext** - Fixed with ref pattern (Jan 2025)
- [x] **Memory Leak in Leaderboard Polling** - Fixed with ref-based interval (Jan 2025)
- [x] **Sync Service Error Resilience** - Added continuation on failures (Jan 2025)
- [x] **DST Timezone Bug in Streak Calculation** - Fixed with UTC comparison (Jan 2025)
- [x] **Shared Validation Library** - Extracted to src/lib/validation.ts (Jan 2025)
- [x] **Batch Database Inserts** - Implemented 50-entry batching (Jan 2025)
- [x] **Null Check in DailyStackCard** - Added guard for empty scoreDisplay (Jan 2025)
- [x] **Exhaustive Deps in useArchivePuzzles** - Fixed with ref pattern (Jan 2025)

---

## Adding New Items

When adding technical debt items, include:
1. **Current State** - Where the issue exists (with file links)
2. **Issue** - Why it's problematic
3. **Proposed Solution** - Concrete implementation approach
4. **Impact** - Expected benefits (lines saved, consistency gained, etc.)
