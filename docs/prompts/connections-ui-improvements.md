# Connections UI Improvements

**Scope**: Modify 6 existing files. Do NOT create new screens, features, or game modes. All files already exist and work — you are making targeted UI/UX tweaks only.

## 4 Changes

### 1. Keep selections on "One away" incorrect guess

**File**: `src/features/connections/hooks/useConnectionsGame.ts`

In the `SUBMIT_GUESS` reducer case, when a guess is incorrect and `matchCount === 3` (triggers "One away!" feedback), the code currently clears `selectedPlayers: []`. Stop doing that — keep the 4 selected players so the user can swap just one.

**What to change** (around line 183-191): When returning state for an incorrect guess that is NOT a game-ending loss, conditionally keep selections:
- `matchCount === 3` → keep `selectedPlayers` as-is (user swaps 1)
- `matchCount < 3` → clear `selectedPlayers: []` (existing behaviour)
- Game loss (4th mistake) → always clear `selectedPlayers: []` regardless

### 2. Move Deselect All + Shuffle buttons inline

**Files**: `src/features/connections/screens/ConnectionsScreen.tsx`, `src/features/connections/components/ConnectionsActionBar.tsx`

Currently Deselect All and Shuffle are in the sticky bottom `ConnectionsActionBar` alongside Submit. Move them out.

**ConnectionsActionBar.tsx**: Remove the Deselect All and Shuffle buttons and their props. Keep only the Submit button.

**ConnectionsScreen.tsx**: Add a new inline row between the grid and the feedback text. Use simple `Pressable` + `Text` styled as small ghost buttons (outline border, `fontSize: 12`, uppercase, `borderRadius: 20`, `borderWidth: 1`, `borderColor: rgba(255,255,255,0.2)`, `paddingVertical: 6`, `paddingHorizontal: 16`). NOT `ElevatedButton`. Row should be centered with `flexDirection: 'row'`, `justifyContent: 'center'`, `gap: 12`, `marginTop: 12`.

New screen layout order:
1. Instructions text
2. Mistake indicator
3. ConnectionsGrid
4. **[Deselect All]  [Shuffle]** ← new inline row
5. Feedback text ("One away!" / "Not quite.")
6. Bottom sticky: Submit only

### 3. Fix cell sizing — rectangular, not square

**File**: `src/features/connections/components/ConnectionsCell.tsx`

Current cells use `aspectRatio: 1` making them square. Long names wrap terribly.

Changes to styles:
- `container`: Remove `aspectRatio: 1`. Add `height: 64`.
- `playerName`: Change `fontSize: 13` → `fontSize: 12`. Change `minimumFontScale` from `0.7` to `0.65`.

**File**: `src/features/connections/components/ConnectionsGrid.tsx`

- `container`: Add `alignItems: 'center'` to center the grid.
- `playersGrid`: Add `maxWidth: 360`, `alignSelf: 'center'`, `width: '100%'`.

### 4. Show surnames only in grid cells (full names in solved groups)

**File**: `src/features/connections/components/ConnectionsGrid.tsx`

Add a `buildDisplayNames` helper that takes all 16 player names and returns a `Record<string, string>` mapping full name → display name:
- Unique surname → surname only: `"Aleksandar Hleb"` → `"Hleb"`
- Duplicate surname → initial + surname: `"Gary Neville"` + `"Phil Neville"` → `"G. Neville"` / `"P. Neville"`
- Single-word name → keep as-is: `"Ronaldinho"` → `"Ronaldinho"`

```typescript
function buildDisplayNames(allPlayerNames: string[]): Record<string, string> {
  const surnameCount: Record<string, number> = {};
  const parsed = allPlayerNames.map((full) => {
    const parts = full.trim().split(/\s+/);
    const surname = parts.length > 1 ? parts[parts.length - 1] : full;
    const firstInitial = parts.length > 1 ? parts[0][0] : '';
    return { full, surname, firstInitial };
  });
  for (const p of parsed) {
    surnameCount[p.surname] = (surnameCount[p.surname] || 0) + 1;
  }
  const map: Record<string, string> = {};
  for (const p of parsed) {
    map[p.full] = surnameCount[p.surname] > 1 && p.firstInitial
      ? `${p.firstInitial}. ${p.surname}`
      : p.surname;
  }
  return map;
}
```

Build the map using ALL 16 original player names (from both `solvedGroups` and `remainingPlayers`). Pass to `ConnectionsCell` as a new `displayName` prop.

**File**: `src/features/connections/components/ConnectionsCell.tsx`

Add `displayName: string` prop. Render `displayName` in the `<Text>`. Keep using `playerName` for `onPress` callback and `accessibilityLabel`.

**File**: `src/features/connections/components/GroupReveal.tsx` — No changes. Already shows full names.

## Verification

```bash
npx tsc --noEmit          # 0 errors
npx jest --testPathPattern=connections  # all pass
```

Visual: cells are rectangular (wider than tall), show surnames, grid is centered. "One away" keeps selections. Deselect/Shuffle are small inline buttons above feedback text, Submit is alone at the bottom.
