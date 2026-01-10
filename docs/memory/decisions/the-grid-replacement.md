# Decision: Replace Tic Tac Toe with The Grid

**Date:** 2026-01-10
**Status:** Implemented

## Context

The original Tic Tac Toe game mode had several issues:
1. AI opponent logic was complex and sometimes unpredictable
2. Win/lose mechanics felt punishing for a knowledge-based game
3. Turn-based gameplay slowed the experience
4. User feedback indicated frustration with AI "cheating"

## Decision

Replace Tic Tac Toe with "The Grid" - a pure knowledge challenge where players fill all 9 cells of a 3x3 matrix by naming footballers who satisfy both row and column criteria.

### Key Design Choices

1. **Game Mode ID: `the_grid`**
   - Uses underscore pattern consistent with existing modes
   - Keeps `tic_tac_toe` for legacy data compatibility

2. **No AI Opponent**
   - Players fill all 9 cells themselves
   - Removes frustration of AI "stealing" cells
   - Pure test of football knowledge

3. **Completion-Based Scoring**
   - ~11 points per cell, max 100
   - No win/lose, just "complete"
   - Rewards partial progress

4. **Category Types with Icons**
   - `club`: Shield icon
   - `nation`: Flag icon
   - `stat`: TrendingUp icon
   - `trophy`: Trophy icon

5. **No Rarity System (v1)**
   - Skipped for initial release
   - Can add in future ticket for obscurity bonuses

## Migration Strategy

**Coexistence, not migration:**
- Both game modes exist in codebase
- `the_grid` replaces `tic_tac_toe` in Daily 5 loop
- `tic_tac_toe` remains accessible in Archive for legacy puzzles
- No data migration needed

## IQ Weight Redistribution

| Mode | Before | After |
|------|--------|-------|
| career_path | 25% | 25% |
| guess_the_transfer | 25% | 25% |
| guess_the_goalscorers | 20% | 20% |
| tic_tac_toe | 15% | 5% (legacy) |
| the_grid | - | 10% |
| topical_quiz | 15% | 15% |

## Files Created

```
src/features/the-grid/
├── index.ts
├── types/theGrid.types.ts
├── screens/TheGridScreen.tsx
├── components/
│   ├── TheGridBoard.tsx
│   ├── GridCell.tsx
│   ├── CategoryHeader.tsx
│   ├── TheGridActionZone.tsx
│   └── TheGridResultModal.tsx
├── hooks/useTheGridGame.ts
├── utils/
│   ├── validation.ts
│   ├── scoring.ts
│   ├── scoreDisplay.ts
│   └── share.ts
└── __tests__/
    ├── GridLogic.test.ts
    ├── SchemaMigration.test.ts
    └── TheGridUI.test.tsx

app/the-grid/
├── index.tsx
└── [puzzleId].tsx
```

## Files Modified

- `src/features/puzzles/types/puzzle.types.ts` - Added `'the_grid'` to GameMode
- `src/components/UniversalGameCard.tsx` - Added `the_grid` case
- `src/features/home/hooks/useDailyPuzzles.ts` - Replaced `tic_tac_toe` with `the_grid`
- `src/features/archive/components/GameModeFilter.tsx` - Added `the_grid` filter
- `src/features/home/components/CompletedGameModal.tsx` - Added `the_grid` case
- `app/(tabs)/index.tsx` - Added route mapping
- `app/(tabs)/archive.tsx` - Added route mapping
- `src/features/archive/hooks/useGatedNavigation.ts` - Added route mapping
- `src/features/stats/types/stats.types.ts` - Added display name, IQ weight, badge
- `src/features/stats/utils/iqCalculation.ts` - Added normalization
- `src/features/leaderboard/utils/rankingUtils.ts` - Added normalization

## Consequences

### Positive
- Simpler game loop (no AI logic)
- Faster gameplay experience
- Fair scoring based on knowledge
- Less code complexity

### Negative
- Loss of competitive "vs AI" element
- Existing Tic Tac Toe fans may prefer old mode
- Two grid-based game modes in codebase

### Neutral
- Legacy puzzles still playable in Archive
- New content creation follows same `valid_answers` pattern
