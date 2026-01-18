# Button Hierarchy & Visual Feedback Design

## Date
2026-01-18

## Context
The Home Screen had buttons with unclear visual hierarchy - Play, Resume, Result, and Unlock all competed for attention equally. Additionally, the Career Path timeline was rendered with fragmented line segments per row.

## Decisions

### 1. Home Screen Button Visual Hierarchy

**Play Button (Primary Action)**
- Pitch Green color (unchanged)
- Added subtle pulse animation (scale 1.0 → 1.05) using `withRepeat(withSequence(withTiming))`
- Pulse runs continuously for unplayed games only
- Draws user attention to the primary call-to-action

**Result Button (Secondary/View Action)**
- Uses `variant='secondary'` for white text
- Muted navy background (#1E293B) - slightly lighter than stadium navy
- NO border (avoids "spilling" effect with Solid Layer architecture)
- Visually differentiates "viewing" from "playing"
- Subdued appearance signals completed state

**Unlock Button (Premium CTA)**
- Kept Card Yellow with Crown icon
- Added glint animation (white diagonal line sweeping across every 3 seconds)
- Premium feel without being intrusive
- Text kept as "Unlock" (not "GET PRO") because users can unlock via ad OR premium

**Resume Button**
- Card Yellow (unchanged)
- No animation - distinct from Play but clearly actionable

### 2. Haptic Feedback Hierarchy

| Button Type | Haptic | Rationale |
|-------------|--------|-----------|
| Play | `triggerLight()` | Light selection feedback, frequent action |
| Resume | `triggerLight()` | Same as Play |
| Result | None | Quiet viewing action, no confirmation needed |
| Unlock | `triggerMedium()` | Medium impact for premium CTA |

Implemented via new `hapticType` prop on ElevatedButton: `'light' | 'medium' | 'none'`

### 3. Continuous Timeline Axis

**Problem**: Each TimelineStepRow rendered its own `lineAbove` and `lineBelow` segments, creating visual gaps and animation complexity.

**Solution**:
- Created new `TimelineAxis` component - renders a single absolute-positioned vertical line behind all nodes
- Removed line segments from `TimelineStepRow` (kept nodes only)
- Base line: Stadium Navy, full height
- Progress line: Pitch Green, animated height grows with `withSpring` as steps reveal

**Benefits**:
- Single unbroken visual line
- Cleaner animation code
- Progress line smoothly shows revealed/unrevealed boundary

### 4. Keyboard Focus-Snap

**Problem**: When user taps input field, the latest revealed career step might scroll off-screen.

**Solution**:
- Added `KeyboardAvoidingView` wrapper with iOS offset 90px
- Added `onFocus` prop to ActionZone TextInput
- When input focuses, `flatListRef.scrollToIndex()` centers the latest revealed step
- Uses `viewPosition: 0.5` for centered positioning

## Files Changed

| File | Changes |
|------|---------|
| `src/components/ElevatedButton.tsx` | Added `hapticType` and `borderColorOverride` props |
| `src/components/UniversalGameCard.tsx` | Play pulse, Unlock glint, Result outline, haptic mapping |
| `src/features/career-path/components/TimelineStepRow.tsx` | Removed lineAbove/lineBelow |
| `src/features/career-path/components/TimelineAxis.tsx` | NEW: Continuous axis component |
| `src/features/career-path/screens/CareerPathScreen.tsx` | KeyboardAvoidingView, TimelineAxis, focus-snap |
| `src/features/career-path/components/ActionZone.tsx` | Added onFocus prop |

## Testing Notes

1. **Home Screen**: Verify Play buttons pulse, Result has gold outline, Unlock has glint
2. **Career Path**: Verify continuous navy line, green progress grows smoothly
3. **Keyboard**: Tap input → list scrolls to center latest step
4. **Haptics**: Play=light, Result=silent, Unlock=medium (test on physical device)
