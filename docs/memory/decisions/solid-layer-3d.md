# Decision: Solid Layer 3D Architecture

**Date:** 2026-01-14
**Status:** Implemented
**Components:** ElevatedButton, GridCell (The Grid), UniversalGameCard

## Context

The app needed a consistent 3D "tactile" depth effect for interactive elements that works identically on iOS and Android. Previous approaches using `borderBottomWidth` animation or platform shadow APIs resulted in inconsistent appearance across platforms and animation jitter.

## Decision

Adopt the **"Solid Layer" architecture** - a View-based layered approach where:

1. **Container** reserves space for depth via `paddingBottom: DEPTH`
2. **Shadow layer** (View) - Fixed at `bottom: 0`, solid darker color
3. **Top layer** (Animated.View) - At `top: 0`, animates `translateY` on press

This creates a true "squash" effect where the top face physically presses down into the shadow layer.

## Architecture

```tsx
<Container style={{ paddingBottom: DEPTH }}>
  {/* Shadow Layer - Fixed */}
  <View style={{
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: contentHeight,
    backgroundColor: shadowColor,
  }} />

  {/* Top Layer - Animates */}
  <Animated.View style={[{
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: contentHeight,
    backgroundColor: topColor,
  }, animatedStyle]}>
    {children}
  </Animated.View>
</Container>
```

## Key Implementation Details

### Animation (react-native-reanimated)
```tsx
const animatedTopStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: pressed.value * DEPTH }],
}));
```

### Depth Constants (src/theme/spacing.ts)
```tsx
export const depthOffset = {
  none: 0,
  sunk: 1,        // Empty grid cells
  card: 2,        // UniversalGameCard
  cell: 3,        // Filled grid cells
  tictacCell: 4,  // Tic-tac-toe cells
  buttonSmall: 5, // ElevatedButton small
  button: 8,      // ElevatedButton medium
  buttonLarge: 10,// ElevatedButton large
};
```

### Depth Color Helper (src/theme/colors.ts)
```tsx
getDepthColor(hex: string, amount = 20): string
// HSL-based darkening for consistent shadow colors
```

## Critical Requirements

1. **Overflow visible** - Container must have `overflow: 'visible'` for Android
2. **Matching border radius** - Both layers must have identical `borderRadius`
3. **Fixed content height** - Use predetermined heights, not dynamic padding
4. **Haptic on press start** - Fire haptic in `handlePressIn`, not `handlePress`

## Components Updated

| Component | Depth | Notes |
|-----------|-------|-------|
| ElevatedButton | 5/8/10px | Size-based depth |
| GridCell (The Grid) | 1px empty, 3px filled | Sunk vs pop-up effect |
| UniversalGameCard | 2px | + scale animation (1 → 0.98) |

## Reference Implementation

The Tic Tac Toe GridCell at `src/features/tic-tac-toe/components/GridCell.tsx` was the original implementation of this pattern and served as the template for the others.

## Alternatives Considered

1. **`borderBottomWidth` animation** - Caused layout jitter and corner radius issues
2. **Platform shadows** (`elevation`, `shadowOffset`) - Inconsistent across iOS/Android
3. **External library (react-native-shadow-2)** - Added dependency, still not fully consistent

## Consequences

### Positive
- Identical appearance on iOS and Android
- Zero animation jitter (pure transform-based)
- Clear architectural pattern for future components
- Theme-integrated via `depthOffset` and `getDepthColor()`

### Negative
- Requires fixed content heights (no dynamic sizing without `onLayout`)
- Two layers per component (slightly more complex DOM)
- Container must account for depth in layout calculations

## Usage Guidelines

1. Use `depthOffset` constants for consistency
2. Use `depthColors` map or `getDepthColor()` for shadow colors
3. Always set `overflow: 'visible'` on containers
4. Test on both iOS simulator and Android emulator
