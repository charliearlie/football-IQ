# Task 1: Tier Level-Up Celebration

## Context
The app has a 10-tier progression system (Trialist -> GOAT) but no celebration when users level up. The only full-screen celebration is PerfectDayCelebration (completing all daily puzzles). Adding a tier-up celebration creates a high emotional impact moment that reinforces the progression system and creates shareable content.

## Requirements

### Detection Logic
- Track `prevTotalIQ` in NotificationContext via a ref
- After each game completion (when `totalGamesPlayed` or `completedPuzzlesToday` changes), compare `getTierForPoints(prevIQ)` vs `getTierForPoints(newIQ)`
- If tier changed, trigger the celebration modal
- Store shown tier-ups in AsyncStorage to prevent duplicate shows on re-render

### Celebration Modal
- Full-screen modal (same overlay pattern as PerfectDayCelebration)
- Tier badge icon with tier-specific colour (from `getTierColor()`)
- Title: "LEVEL UP!" in tier colour
- Subtitle: "You've reached {tierName}!"
- Tier badge animation: scale 0 -> 1.2 -> 1.0 with spring
- Confetti burst (reuse existing Confetti component)
- Stats row: Total IQ + tier name
- Share button: captures card as image via ViewShot
- "Continue" dismiss link
- Share message: "Just reached {tierName} on Football IQ! {totalIQ} IQ and climbing!"

### Haptic Pattern
- New `triggerLevelUp()` in haptics.ts
- Pattern: Heavy -> pause -> Success -> pause -> Success -> pause -> Heavy (fanfare-like, more intense than triggerPerfectDay)

### Analytics
- New `TIER_LEVEL_UP` event with properties: `{ new_tier: string, new_tier_number: number, total_iq: number }`

## Files to Create
- `src/features/stats/components/TierLevelUpCelebration.tsx` — Full-screen modal component

## Files to Modify
- `src/lib/haptics.ts` — Add `triggerLevelUp()` function
- `src/features/stats/utils/tierProgression.ts` — Add `didTierChange(oldIQ: number, newIQ: number): { changed: boolean; newTier: IQTier | null }`
- `src/features/notifications/context/NotificationContext.tsx` — Add tier-up detection using prevTotalIQRef pattern, add `isTierUpCelebrating`, `tierUpData`, `dismissTierUpCelebration` to context
- `src/features/notifications/components/NotificationWrapper.tsx` — Render TierLevelUpCelebration modal alongside PerfectDayCelebration
- `src/hooks/useAnalytics.ts` — Add `TIER_LEVEL_UP` event constant and `trackTierLevelUp` function

## Pattern to Follow
Copy the pattern from `src/features/notifications/components/PerfectDayCelebration.tsx`:
- Same Modal + overlay structure
- Same Confetti integration
- Same ViewShot + Share flow
- Same Animated.View with spring scale
- Same ElevatedButton for share CTA
- Same FadeIn.delay staggering for buttons

Key imports to reuse:
```typescript
import { Confetti } from "@/components/Confetti";
import { ElevatedButton } from "@/components/ElevatedButton";
import { getTierForPoints, getTierColor, formatTotalIQ } from "@/features/stats/utils/tierProgression";
```

## NotificationContext Integration Pattern
In NotificationContext.tsx, follow the Perfect Day detection pattern:
```typescript
// Add to provider props interface:
// totalIQ: number (passed from NotificationWrapper via useProfile)

// Add refs:
const prevTotalIQRef = useRef<number>(totalIQ);

// Add state:
const [isTierUpCelebrating, setIsTierUpCelebrating] = useState(false);
const [tierUpData, setTierUpData] = useState<{ tier: IQTier; totalIQ: number } | null>(null);

// Add effect (same pattern as Perfect Day detection):
useEffect(() => {
  const prevIQ = prevTotalIQRef.current;
  prevTotalIQRef.current = totalIQ;

  if (prevIQ === totalIQ) return;

  const result = didTierChange(prevIQ, totalIQ);
  if (result.changed && result.newTier) {
    // Check AsyncStorage to avoid duplicate shows
    setTierUpData({ tier: result.newTier, totalIQ });
    setIsTierUpCelebrating(true);
  }
}, [totalIQ]);
```

## Acceptance Criteria
- [ ] Modal appears when user crosses a tier threshold after game completion
- [ ] Modal shows correct tier name, colour, and total IQ
- [ ] Confetti animates on modal open
- [ ] Haptic pattern fires on modal open
- [ ] Share button captures card image and opens native share sheet
- [ ] Modal dismisses on "Continue" tap and X button
- [ ] Modal does not show twice for same tier-up (AsyncStorage guard)
- [ ] `TIER_LEVEL_UP` event fires in PostHog with correct properties
- [ ] Existing PerfectDayCelebration still works unchanged
- [ ] No TypeScript errors

## Agent Assignment
- **Primary**: rn-developer (implementation)
- **Secondary**: ui-designer (celebration design + animations)
