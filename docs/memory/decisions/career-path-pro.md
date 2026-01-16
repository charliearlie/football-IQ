# Decision: Career Path Pro - Premium Game Mode

**Date:** 2026-01-16
**Status:** Implemented

## Context

Career Path is the flagship game mode in Football IQ. To provide additional value for premium subscribers, we wanted to add a premium-exclusive variant featuring more challenging puzzles with obscure or historical players.

Goals:
1. Create a premium-only game mode to increase subscription value
2. Reuse existing Career Path engine without code duplication
3. Track statistics separately from standard Career Path
4. Display a distinct "PRO" branding on the UI

## Decision

Implement "Career Path Pro" as a separate game mode (`career_path_pro`) that shares the entire Career Path engine through the `gameMode` prop pattern.

### Key Design Choices

1. **Unified Engine Architecture**
   - `CareerPathScreen` accepts a `gameMode` prop: `'career_path' | 'career_path_pro'`
   - All game logic, validation, and scoring is shared
   - Only title and branding differ between modes

2. **Premium-Only Access**
   - Uses `PremiumOnlyGate` component (NOT `PremiumGate`)
   - Blocks all non-premium users regardless of puzzle date
   - No 7-day free window like standard puzzles

3. **UI Differentiation**
   - Home screen card shows diagonal "PRO" sash in gold (#FACC15)
   - Title displays "CAREER PATH PRO" in gold styling
   - Share text shows "Football IQ - Career Path Pro"

4. **Separate Statistics Tracking**
   - `career_path_pro` has its own entry in IQ_WEIGHTS (0.10)
   - Radar chart expanded to 7 axes (heptagon) to include Pro mode
   - Perfect scores tracked independently

5. **IQ Weight Rebalancing**
   After adding career_path_pro, weights were rebalanced:
   ```
   career_path: 0.15 (was 0.25)
   career_path_pro: 0.10 (new)
   guess_the_transfer: 0.15 (was 0.25)
   guess_the_goalscorers: 0.12 (was 0.20)
   tic_tac_toe: 0.05 (unchanged)
   the_grid: 0.10 (unchanged)
   topical_quiz: 0.10 (was 0.15)
   top_tens: 0.13 (new)
   starting_xi: 0.10 (new)
   Total: 1.00
   ```

## Files Changed

### New Files
- `app/career-path-pro/index.tsx` - Today's Pro puzzle route
- `app/career-path-pro/[puzzleId].tsx` - Archive Pro puzzle route

### Modified Files
- `src/features/puzzles/types/puzzle.types.ts` - Added to GameMode union
- `src/features/home/hooks/useDailyPuzzles.ts` - Added to GAME_MODE_ORDER and PREMIUM_ONLY_MODES
- `src/features/archive/constants/routes.ts` - Added route mapping
- `src/features/career-path/screens/CareerPathScreen.tsx` - Added gameMode prop
- `src/features/career-path/utils/share.ts` - Dynamic title in share text
- `src/components/UniversalGameCard.tsx` - PRO badge styling
- `src/features/stats/types/stats.types.ts` - GAME_MODE_DISPLAY and IQ_WEIGHTS
- `src/features/stats/utils/iqCalculation.ts` - normalizeScore and isPerfectScore cases
- `src/features/stats/hooks/usePerformanceStats.ts` - ALL_GAME_MODES array
- `src/features/stats/components/ScoutReport/TacticalRadarChart.tsx` - 7-axis heptagon
- `tools/content-creator.html` - Career Path Pro option

## Alternatives Considered

1. **Separate Feature Module**
   - Rejected: Would duplicate all Career Path code
   - Maintenance burden for identical game logic

2. **Difficulty Flag on Existing Mode**
   - Rejected: Would muddle statistics
   - Users expect separate tracking for premium content

3. **Premium-Only Difficulty Setting**
   - Rejected: Harder to market as distinct value proposition
   - Separate mode is clearer for subscription benefits

## Consequences

**Positive:**
- No code duplication for game logic
- Clear premium value proposition
- Statistics tracked independently
- Easy to create harder puzzles without affecting free content

**Negative:**
- Radar chart expanded to 7 axes (slightly more crowded)
- IQ weights needed rebalancing across all modes
- Two sets of puzzles to create for content team
