# Scouting Report Sharing Engine

## Overview

This document describes the implementation of image-based sharing for the Football IQ app, including the "Field Experience" metrics aggregation and "Scouting Report" shareable cards.

## Architecture

### Field Experience Aggregation

Field Experience tracks puzzle completion counts per game mode:

```typescript
interface FieldExperience {
  byMode: Record<GameMode, number>;  // Count per game mode
  totalAppearances: number;           // Sum of all completions
  dominantMode: GameMode | null;      // Mode with highest count
}
```

**Files:**
- `src/features/stats/types/fieldExperience.types.ts` - Type definitions
- `src/features/stats/utils/fieldExperience.ts` - Calculation logic
- `src/features/stats/__tests__/FieldExperience.test.ts` - TDD tests (20 cases)
- `src/features/stats/components/FieldExperienceSection.tsx` - UI component

**Integration:**
- Added to `usePerformanceStats` hook
- Added to `PerformanceStats` interface
- Displayed in Scout Report screen between ElitePlayerCard and Season Progress

### Scouting Report Cards

Two types of shareable cards:

#### 1. ScoutingReportCard (Profile)
Used for sharing overall Scout Report from stats screen.

**Visual Layout:**
```
┌─────────────────────────────────────┐
│      FOOTBALL IQ SCOUT REPORT       │
│         [TierCrest Badge]           │
│                                     │
│    [Tier Name: "Impact Sub"]        │
│         1,234 IQ Points             │
│                                     │
│  ────────────────────────────────── │
│   Archetype: Market Analyst         │
│   Field Experience: 156 Reports     │
│   Current Streak: 7 Days            │
│  ────────────────────────────────── │
│                                     │
│   footballiq://scout/abc123         │
│        football-iq.app              │
└─────────────────────────────────────┘
```

**Files:**
- `src/features/stats/components/ScoutingReportCard.tsx`
- `src/features/stats/utils/shareScoutingReport.ts`
- `src/features/stats/components/ScoutingReportOverlay.tsx`

#### 2. ResultShareCard (Game Results)
Used for sharing individual puzzle completion results.

**Visual Layout:**
```
┌─────────────────────────────────────┐
│        FOOTBALL IQ                  │
│     [GameMode Icon + Name]          │
│                                     │
│      [RESULT STATUS]                │
│     (Perfect/Complete/Game Over)    │
│                                     │
│         [Emoji Grid]                │
│          2026-01-15                 │
│                                     │
│  ────────────────────────────────── │
│  Tier: Impact Sub | 1,234 IQ        │
│        football-iq.app              │
└─────────────────────────────────────┘
```

**Files:**
- `src/components/GameResultModal/ResultShareCard.tsx`
- `src/components/GameResultModal/useResultShare.ts`
- `src/components/GameResultModal/BaseResultModal.tsx` (modified)

### Deep Link System

**URL Format:** `footballiq://scout/[userId]`

**Route Handler:** `app/scout/[userId].tsx`

**Behavior:**
- Logged in users: Redirect to Scout Report tab
- Anonymous/new users: Show welcome screen with "Get Started" CTA

**Configuration:** App scheme `footballiq` configured in `app.json`

## Data Flow

### Share Flow (Image-Based)

```
User taps Share → ViewShot captures card → Native Share API
                                        → Image + Text shared
                                        → Deep link included
```

### Fallback Flow

```
ViewShot capture fails → Fallback to text-only share
                      → Clipboard copy on web
```

## Game Mode Integration

### Modals Updated (6 of 8)

| Game Mode | Modal | Status |
|-----------|-------|--------|
| Career Path | GameResultModal | ✅ Updated |
| Career Path Pro | (shares GameResultModal) | ✅ Updated |
| Transfer Guess | TransferResultModal | ✅ Updated |
| Goalscorer Recall | RecallResultModal | ✅ Updated |
| Topical Quiz | TopicalQuizResultModal | ✅ Updated |
| Top Tens | TopTensResultModal | ✅ Updated |
| Starting XI | StartingXIResultModal | ✅ Updated |
| The Grid | TheGridResultModal | Custom (not BaseResultModal) |

### BaseResultModal Changes

Added optional props for image sharing:
```typescript
shareCardContent?: React.ReactNode;  // Content for ViewShot capture
shareData?: ResultShareData;         // Data for share text generation
```

When provided, BaseResultModal:
1. Renders hidden ViewShot with shareCardContent
2. Overrides default share behavior to capture image first
3. Falls back to text-based sharing on capture failure

## Design Tokens Used

| Token | Usage |
|-------|-------|
| `colors.stadiumNavy` | Card backgrounds |
| `colors.pitchGreen` | Accent color, tier dots |
| `colors.floodlightWhite` | Primary text |
| `colors.textSecondary` | Secondary text |
| `colors.glassBorder` | Dividers, borders |
| `fonts.headline` | Titles |
| `fonts.body` | Body text |
| `borderRadius['2xl']` | Card corners |

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern="FieldExperience"
```

### Manual Testing Checklist
- [ ] Field Experience shows correct counts per mode
- [ ] Dominant mode matches highest count
- [ ] Scouting Report card renders tier badge correctly
- [ ] Share generates high-quality PNG image
- [ ] Result modals show image-based share button
- [ ] Achievement badges display (perfect score)
- [ ] Deep link opens app when installed
- [ ] Fallback to text works on capture failure
- [ ] Web fallback copies to clipboard

## Future Enhancements

1. **User Profile Deep Links** - View another user's Scout Report
2. **Animated Share Cards** - Lottie animations for achievements
3. **Social Platform Optimization** - Platform-specific image ratios
4. **Streak Celebrations** - Special cards for milestone streaks
