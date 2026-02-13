# Task 5: Comprehensive Haptics Integration

## Context
The app has a rich haptic library in `src/lib/haptics.ts` with patterns for success, error, completion, perfect day, and rare find. However, haptics are only used in 2 places (onboarding submit + premium purchase). Game modes don't trigger any haptic feedback on correct/wrong answers. This is a massive underutilisation of a proven engagement mechanic.

## Requirements

### Haptic Integration Points
Add haptic feedback to these game events:

| Game Mode | Correct Answer | Wrong Answer | Game Complete |
|-----------|---------------|--------------|---------------|
| Career Path | `triggerSuccess()` on correct guess | `triggerError()` on wrong guess | `triggerCompletion()` on game end |
| Career Path Pro | Same as Career Path | Same | Same |
| Transfer Guess | `triggerSuccess()` on correct | `triggerError()` on wrong | `triggerCompletion()` |
| Goalscorer Recall | `triggerSuccess()` per scorer found | N/A (timed) | `triggerCompletion()` |
| Topical Quiz | `triggerSuccess()` per correct | `triggerError()` per wrong | `triggerCompletion()` |
| The Grid | `triggerSuccess()` per cell filled | `triggerError()` on rejected | `triggerCompletion()` |
| Starting XI | `triggerSuccess()` per player found | `triggerError()` on wrong | `triggerCompletion()` |
| Top Tens | `triggerSuccess()` per answer found | N/A | `triggerCompletion()` |
| The Chain | `triggerSuccess()` on valid link | `triggerError()` on invalid | `triggerCompletion()` |
| The Thread | `triggerSuccess()` on correct | `triggerError()` on wrong | `triggerCompletion()` |

### Settings Toggle
- Add "Haptic Feedback" toggle in Settings screen
- Default: ON (enabled)
- Stored in AsyncStorage key `@haptics_enabled`
- When OFF, all haptic functions become no-ops

### useFeedback Modification
The `useFeedback` hook in `src/hooks/useFeedback.ts` provides `triggerSuccess`, `triggerError` etc. Modify to check the setting:

```typescript
// At hook initialization:
const [hapticsEnabled, setHapticsEnabled] = useState(true);

useEffect(() => {
  AsyncStorage.getItem('@haptics_enabled').then(value => {
    if (value !== null) setHapticsEnabled(value === 'true');
  });
}, []);

// Wrap each haptic call:
const triggerSuccess = useCallback(() => {
  if (!hapticsEnabled) return;
  haptics.triggerSuccess();
}, [hapticsEnabled]);
```

## Files to Modify

### Core haptics gate
- `src/hooks/useFeedback.ts` — Add AsyncStorage check for `@haptics_enabled`, gate all haptic calls

### Game mode integrations
For each game mode, find the answer validation/submission handler and add haptic calls. The exact files will vary but look for:
- Answer submission callbacks (onGuess, onSubmit, onAnswer)
- Game completion detection (gameStatus transitions to 'won'/'lost')

Likely files (explore to confirm exact locations):
- `src/features/career-path/hooks/useCareerPathGame.ts` or screen component
- `src/features/transfer-guess/` — game hook or screen
- `src/features/goalscorer-recall/` — game hook or screen
- `src/features/topical-quiz/` — game hook or screen
- `src/features/the-grid/` — game hook or screen
- `src/features/starting-xi/` — game hook or screen
- `src/features/top-tens/` — game hook or screen
- `src/features/the-chain/` — game hook or screen
- `src/features/the-thread/` — game hook or screen

### Settings
- `src/features/settings/screens/SettingsScreen.tsx` — Add toggle row for haptic feedback

## Key Implementation Notes

### Where to add haptics
The cleanest approach is adding haptic calls at the **screen/component level** where answer results are known, not deep in hooks. Look for:
- State changes from `playing` to `won`/`lost` → `triggerCompletion()`
- Correct answer detection (often a state variable like `isCorrect`) → `triggerSuccess()`
- Wrong answer detection → `triggerError()`

### Import pattern
```typescript
import { triggerSuccess, triggerError, triggerCompletion } from '@/lib/haptics';
```

Or use the hook:
```typescript
const { triggerSuccess, triggerError } = useFeedback();
```

### Don't add to every tiny interaction
Focus on the key moments: answer correctness and game completion. Don't add haptics to scrolling, navigation, or other mundane interactions.

## Acceptance Criteria
- [ ] Correct answer triggers success haptic in all game modes
- [ ] Wrong answer triggers error haptic in applicable game modes
- [ ] Game completion triggers completion haptic
- [ ] Settings screen has a "Haptic Feedback" toggle
- [ ] Toggle persists across sessions (AsyncStorage)
- [ ] When toggle is OFF, no haptics fire
- [ ] When toggle is ON (default), haptics work as expected
- [ ] No TypeScript errors
- [ ] No duplicate haptics (e.g., don't fire both success and completion simultaneously)

## Agent Assignment
- **Primary**: rn-developer
