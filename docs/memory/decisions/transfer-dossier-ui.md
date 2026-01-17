# Transfer Guess UI - "Scout's Dossier" Theme

**Date:** 2026-01-17
**Status:** Implemented

## Context

The original Transfer Guess UI used circular badges with club initials and emoji placeholders for hints. This overhaul transforms the game mode into a premium "Deadline Day briefing" experience with:
- Typography-focused club names (no external badges/imagery)
- Custom PNG icons for hint types
- Solid Layer 3D depth effects
- Inline game-over answer reveal

## Decision

### 1. MarketMovementHeader (replaces TransferCard)

**Before:** GlassCard with circular badge initials, floating animation, separate year/fee rows

**After:** Clean typography-based banner
- Large Bebas Neue club names with `adjustsFontSizeToFit` for long names
- Pitch Green arrow connector (was cardYellow)
- Combined metadata line: "€80M | 2024/25"
- No floating animation (grounded, authoritative feel)

### 2. DossierSlot (replaces HintSlot)

**Before:** Emoji placeholders (#, ⚽, 🏴), simple scale animation

**After:** Custom PNG icons with Solid Layer 3D
- Icons: `transfer-number.png`, `transfer-position.png`, `transfer-nationality.png`
- 4px depth (depthOffset.tictacCell)
- 10% white background tint (`#FFFFFF10`) for dossier paper effect
- Reveal animation: scale 0.8 → 1.05 → 1.0 + border color transition (stadiumNavy → pitchGreen)

### 3. DossierGrid (replaces HintsSection)

**Before:** 3-column horizontal row

**After:** 2-column grid with spanning
```
┌─────────────┬─────────────┐
│  [#] Number │ [⚽] Position│
├─────────────┴─────────────┤
│       [🏴] Nationality     │
└───────────────────────────┘
```
- Number + Position side-by-side (top row)
- Nationality spans full width (bottom row) - the "big reveal"
- Maximizes vertical density on mobile screens

### 4. TransferGameOverZone (NEW)

Replaces DossierGrid inline when game ends (not a modal):
- "Glowing badge" container with pitchGreen tint/border/shadow
- Fade-in + scale-up entry animation
- Share button (IconButton) + "See how you scored" button
- TransferResultModal still available for detailed score breakdown

### 5. Keyboard Handling

Added KeyboardAvoidingView wrapper to ensure:
- Header (club names) stays visible when keyboard appears
- DossierGrid compresses gracefully
- Smooth keyboard dismiss on scroll drag

## Files Changed

| Old File | New File | Change |
|----------|----------|--------|
| TransferCard.tsx | MarketMovementHeader.tsx | Renamed + rewritten |
| HintSlot.tsx | DossierSlot.tsx | Renamed + rewritten |
| HintsSection.tsx | DossierGrid.tsx | Renamed + rewritten |
| — | TransferGameOverZone.tsx | New component |
| TransferGuessScreen.tsx | (same) | Updated imports + layout |
| HintSlot.test.tsx | DossierSlot.test.tsx | Updated tests |

## Constraints Applied

1. **TransferActionZone NOT modified** - Input field and submit buttons unchanged
2. **No club badges/imagery** - Typography is the hero for club names
3. **Custom icons required** - All 3 PNG icons rendered via Image component
4. **Solid Layer 3D** - 4px depth with two-layer View architecture

## Related Patterns

- **Solid Layer 3D**: See `solid-layer-3d.md` for architecture details
- **GameOverActionZone**: Career Path pattern for inline answer reveal
- **PlayerMarker**: Starting XI pattern for reveal animations with interpolateColor
