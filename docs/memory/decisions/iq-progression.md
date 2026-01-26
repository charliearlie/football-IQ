# IQ Progression System Architecture Decision

## Overview
The IQ Progression System uses a 10-tier cumulative points system (0 to 20,000 total_iq) replacing the previous 5-tier weighted average (0-100 globalIQ). Points are accumulated from puzzle scores and persist permanently, creating a sense of continuous progression.

## Key Decisions

### 1. Cumulative Points vs Weighted Average
**Decision:** Use cumulative total points (total_iq) instead of normalized weighted average (globalIQ).

**Rationale:**
- Cumulative points provide constant progression incentive
- No plateau at "max IQ" - always room to grow
- Matches player expectations from RPG/leveling systems
- Simpler mental model: "play more, earn more"

### 2. 10-Tier Exponential Progression
**Decision:** Use non-linear tier thresholds with exponential growth.

| Tier | Name | Min Points | To Next |
|------|------|------------|---------|
| 1 | Trialist | 0 | 25 |
| 2 | Youth Squad | 25 | 75 |
| 3 | Reserve Team | 100 | 150 |
| 4 | Impact Sub | 250 | 250 |
| 5 | Rotation Player | 500 | 500 |
| 6 | First Team Regular | 1,000 | 1,000 |
| 7 | Key Player | 2,000 | 2,000 |
| 8 | Club Legend | 4,000 | 4,000 |
| 9 | National Treasure | 8,000 | 12,000 |
| 10 | GOAT | 20,000 | - |

**Rationale:**
- Early tiers are quick to achieve (dopamine hits for new users)
- Later tiers require sustained engagement
- GOAT tier is aspirational but achievable with ~2000 games
- Football-themed names resonate with target audience

### 3. Server-Side Atomic Increment
**Decision:** Use PostgreSQL trigger to increment total_iq on attempt INSERT.

**Rationale:**
- Atomic: Point increment in same transaction as attempt insert
- Prevents double-counting: Client retries don't inflate scores
- Prevents manipulation: No client-injectable point values
- Consistent: All score sources use same increment path

### 4. Raw Points (No Normalization)
**Decision:** Use raw puzzle scores directly, not normalized 0-100 values.

**Rationale:**
- Active game modes award 0-10 points, providing balanced progression
- The Grid (inactive) awards 0-100 but won't inflate scores while disabled
- Simpler to reason about: "I scored 7, I got 7 IQ"
- TODO: Revisit The Grid scoring when reactivated

### 5. Scouting Archetype System
**Decision:** Assign users an "archetype" based on their dominant game mode.

| Game Mode | Archetype | Icon |
|-----------|-----------|------|
| career_path | Detective | Search |
| career_path_pro | Master Detective | ShieldCheck |
| guess_the_transfer | Market Analyst | TrendingUp |
| guess_the_goalscorers | Historian | Clock |
| the_grid | Pattern Master | Grid3X3 |
| topical_quiz | News Hound | Newspaper |
| top_tens | Statistician | ListOrdered |
| starting_xi | Tactical Mind | Users |

**Selection Logic:** `gamesPlayed × percentage` product (weighted proficiency)

**Rationale:**
- Gives users a unique identity beyond raw numbers
- Encourages exploration of different game modes
- Scouting/Intelligence theme fits the "Football IQ" brand

## Implementation Details

### Database Schema
```sql
-- profiles table
total_iq INTEGER NOT NULL DEFAULT 0

-- Trigger on puzzle_attempts INSERT
CREATE TRIGGER trigger_increment_total_iq
  AFTER INSERT ON puzzle_attempts
  FOR EACH ROW EXECUTE FUNCTION increment_total_iq();
```

### Tier Utility Functions
```typescript
// src/features/stats/utils/tierProgression.ts
getTierForPoints(totalIQ: number): IQTier
getProgressToNextTier(totalIQ: number): number  // 0-100
getPointsToNextTier(totalIQ: number): number
getTierColor(tier: number): string
getNextTier(tier: IQTier): IQTier | null
formatTotalIQ(totalIQ: number): string
```

### Tier Colors
- Tiers 1-3: Pitch Green (#58CC02)
- Tiers 4-6: Card Yellow (#FACC15)
- Tiers 7-8: Orange (#F97316)
- Tier 9: Pink (#EC4899)
- Tier 10 (GOAT): Cyan (#06B6D4)

## File Structure
```
src/features/stats/
├── __tests__/tierProgression.test.ts    # TDD tests (written first)
├── utils/tierProgression.ts             # Tier logic
├── components/ScoutReport/
│   ├── RankBadge.tsx                    # Tier + progress bar
│   ├── ArchetypeLabel.tsx               # Dominant archetype display
│   └── ElitePlayerCard.tsx              # Updated for totalIQ
supabase/migrations/
└── 018_total_iq_progression.sql         # Schema + trigger + backfill
```

## Migration Strategy

### Backfill Existing Users
```sql
UPDATE profiles p SET total_iq = COALESCE(
  (SELECT SUM(COALESCE(score, 0))
   FROM puzzle_attempts
   WHERE user_id = p.id AND completed = true AND score IS NOT NULL), 0
);
```

### Backward Compatibility
- `globalIQ` (0-100) kept for leaderboard display
- `totalIQ` used for tier progression
- ElitePlayerCard accepts both props (totalIQ preferred)

## Related Decisions
- [solid-layer-3d.md](solid-layer-3d.md) - 3D depth for RankBadge progress bar
- [streak-calendar.md](streak-calendar.md) - Engagement tracking patterns
