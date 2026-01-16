# Decision: Starting XI Feedback Loop Architecture

**Date:** 2026-01-15
**Status:** Implemented
**Components:** PlayerMarker, GuessInputOverlay, LineupPitch, StartingXIScreen

## Context

The Starting XI game mode needed rich, multi-sensory feedback to make correct guesses feel rewarding ("Golden Reveal"), incorrect guesses feel informative ("Referee's Whistle"), and duplicate guesses clearly communicated. The existing implementation had basic state updates but lacked visual feedback beyond simple color changes.

## Decision

Implement a comprehensive feedback system with:

1. **Golden Reveal** (correct guess): 3D flip animation + particle burst + haptic
2. **Referee's Whistle** (incorrect guess): High-frequency shake + red flash + haptic
3. **Already Found** (duplicate guess): Bounce animation on existing marker + haptic
4. **Progress Glow**: Pitch border glow that intensifies as players are found

## Architecture

### State Management

Added to `StartingXIState`:
```typescript
lastGuessResult: 'correct' | 'incorrect' | 'duplicate' | null;
lastGuessedId: SlotIndex | null;
```

New reducer actions:
- `GUESS_RESULT` - Sets result + slot ID for targeted animations
- `CLEAR_GUESS_RESULT` - Resets after animation completes (600ms timeout)

### Duplicate Detection

The `submitGuess()` function checks if the guessed player name matches ANY already-found slot before validating against the selected slot:

```typescript
const duplicateSlotIndex = state.slots.findIndex(
  (s, index) =>
    s.isFound &&
    index !== selectedSlotIndex &&
    validateGuess(guess, s.fullName).isMatch
);
```

### Animation Flow

1. User submits guess
2. Hook determines result (correct/incorrect/duplicate)
3. Dispatches `GUESS_RESULT` with result type and target slot ID
4. Components receive props and trigger appropriate animations
5. After 600ms, `CLEAR_GUESS_RESULT` resets the feedback state

## Spring Configurations

| Animation | Damping | Stiffness | Mass | Feel |
|-----------|---------|-----------|------|------|
| **Flip (trading card)** | 18 | 180 | 1.2 | Heavy, weighty card flip |
| **Name pop** | 12 | 200 | 0.8 | Bouncy surname reveal |
| **Error shake recovery** | 6 | 500 | 0.3 | Sharp, punchy snap-back |
| **Bounce (duplicate)** | 10 | 400 | 0.5 | Attention-grabbing |
| **Progress glow** | 20 | 100 | 1.0 | Smooth, gradual |

**Tuning tip:** If the flip feels "floaty," increase mass and stiffness.

## Key Implementation Details

### 3D Flip Animation (PlayerMarker)

Uses `perspective` and `rotateY` with `backfaceVisibility: 'hidden'`:

```typescript
const animatedFrontStyle = useAnimatedStyle(() => {
  const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
  const opacity = interpolate(flipProgress.value, [0, 0.5], [1, 0]);
  return {
    transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
    opacity,
    backfaceVisibility: 'hidden' as const,
  };
});
```

Two absolute-positioned faces:
- **Front face**: Question mark, glass background (visible at flipProgress=0)
- **Back face**: Surname, pitch green background (visible at flipProgress=1)

### Color Interpolation

Smooth transition from glass to green during flip:

```typescript
interpolateColor(flipProgress.value, [0, 0.5, 1], [
  'rgba(255, 255, 255, 0.08)', // Glass (hidden)
  'rgba(88, 204, 2, 0.5)',     // Mid-transition
  colors.pitchGreen,           // Green (found)
])
```

### Particle Burst Positioning

Uses `measure()` to get screen coordinates from PlayerMarker:

```typescript
containerRef.current.measure((x, y, width, height, pageX, pageY) => {
  onRevealComplete({
    x: pageX + width / 2,
    y: pageY + height / 2,
  });
});
```

**Critical:** `SuccessParticleBurst` must be placed at root level (inside `KeyboardAvoidingView`) since `measure()` returns absolute screen coordinates.

### Progress Glow (LineupPitch)

Platform-specific implementation:
- **iOS**: Uses `shadowColor`, `shadowOpacity`, `shadowRadius`
- **Android**: Uses animated `borderWidth` and `borderColor` as fallback

```typescript
const animatedGlowStyle = useAnimatedStyle(() => {
  return Platform.select({
    ios: {
      shadowColor: colors.pitchGreen,
      shadowOpacity: interpolate(glowIntensity.value, [0, 0.5, 1], [0, 0.3, 0.6]),
      shadowRadius: interpolate(glowIntensity.value, [0, 1], [0, 20]),
    },
    android: {
      borderWidth: interpolate(glowIntensity.value, [0, 1], [0, 3]),
      borderColor: `rgba(88, 204, 2, ${borderOpacity})`,
    },
  });
});
```

### Error Shake Pattern

High-frequency shake (6 oscillations, 40ms each) with spring recovery:

```typescript
shakeX.value = withSequence(
  withTiming(-8, { duration: 40 }),
  withTiming(8, { duration: 40 }),
  withTiming(-8, { duration: 40 }),
  withTiming(8, { duration: 40 }),
  withTiming(-6, { duration: 40 }),
  withTiming(6, { duration: 40 }),
  withSpring(0, SHAKE_SPRING)
);
```

## Files Modified

| File | Changes |
|------|---------|
| `startingXI.types.ts` | Added `GuessResult` type, new state fields, new action types |
| `useStartingXIGame.ts` | Duplicate detection, `GUESS_RESULT` actions, auto-clear timeout |
| `PlayerMarker.tsx` | 3D flip, shake, bounce, local flash animations |
| `GuessInputOverlay.tsx` | Border flash animation on incorrect guess |
| `LineupPitch.tsx` | Progress glow, `onMarkerReveal` callback, feedback prop passing |
| `StartingXIScreen.tsx` | Particle burst integration, wiring of all feedback props |

## Critical Requirements

1. **`collapsable={false}`** on measured views for Android `measure()` to work
2. **`overflow: 'visible'`** on containers for animations that extend bounds
3. **Perspective value** of 800 provides good 3D depth for card flip
4. **Timeout alignment** - 600ms clear timeout matches flip animation duration
5. **No `Platform.select()` in worklets** - Check platform at module level with `const IS_IOS = Platform.OS === 'ios'` and use conditional logic inside `useAnimatedStyle`

## Consequences

### Positive
- Rich, satisfying feedback for correct guesses ("trading card reveal")
- Clear visual feedback for incorrect/duplicate scenarios
- Progress visualization motivates completion
- Haptics reinforce all feedback types

### Negative
- More complex state management (new action types, timeout cleanup)
- `measure()` dependency for particle positioning (can fail on rapid re-renders)
- Android glow uses border fallback (less visually dramatic than iOS shadows)

## Testing Checklist

1. **Correct Guess**: Flip animation + color transition + surname pop + particle burst + haptic
2. **Incorrect Guess**: Marker shake + red flash + input border flash + input shake + haptic
3. **Duplicate Guess**: Found marker bounces + incomplete haptic
4. **Progress Glow**: Intensifies smoothly as players are found
5. **Cross-Platform**: Test both iOS and Android for flip transform support
