# Scoring Systems

This document defines the official scoring logic for each game mode in Football IQ. All game implementations must follow these specifications exactly.

Source of truth: [rules.ts](../src/features/puzzles/constants/rules.ts)

---

## Career Path / Career Path Pro

**Type:** Dynamic
**Game Mode IDs:** `career_path`, `career_path_pro`

### Rules
- Clubs are revealed one at a time (starting from most recent)
- Incorrect guesses reveal the next club as a penalty
- Goal: Identify the mystery player with as few clues as possible

### Scoring Formula
Points awarded based on **clubs remaining** when the player guesses correctly:

```
score = clubsRemaining
```

| Clubs Remaining | Points |
|-----------------|--------|
| 5+ remaining    | 5+     |
| 4 remaining     | 4      |
| 3 remaining     | 3      |
| 2 remaining     | 2      |
| 1 remaining     | 1      |
| 0 remaining (last club) | 0 |

**Note:** If player gives up or fails, score = 0.

---

## Guess the Transfer

**Type:** Tiered
**Game Mode ID:** `guess_the_transfer`
**Max Points:** 5

### Rules
- Player sees: from club, to club, and fee
- Can reveal 3 hints: Year, Position, Nationality (each costs IQ)
- Goal: Name the player with fewest hints revealed

### Scoring Table

| Hints Revealed | Points | Intelligence Tier |
|----------------|--------|-------------------|
| 0 hints        | 5      | Legendary         |
| 1 hint         | 3      | Director of Football |
| 2 hints        | 2      | Chief Scout       |
| 3 hints        | 1      | Scout             |
| Failed         | 0      | -                 |

---

## Goalscorer Recall

**Type:** Fixed
**Game Mode ID:** `guess_the_goalscorers`

### Rules
- 60 second time limit
- Name all goalscorers from a classic match
- Find all scorers for a bonus

### Scoring Formula

```
score = scorersFound + (foundAll ? 3 : 0)
```

| Component | Points |
|-----------|--------|
| Per scorer found | 1 |
| All scorers bonus | +3 |

**Example:** Match has 6 scorers
- Found 4/6: **4 points**
- Found 6/6: **6 + 3 = 9 points**

---

## Starting XI

**Type:** Fixed
**Game Mode ID:** `starting_xi`
**Max Points:** 8

### Rules
- Up to 5 players in the lineup are hidden
- Tap a position to guess the player
- Find all hidden players for a Perfect XI bonus

### Scoring Formula

```
score = playersFound + (foundAll ? 3 : 0)
```

| Component | Points |
|-----------|--------|
| Per player found | 1 |
| Perfect XI bonus (all hidden found) | +3 |

**Example:** (5 hidden players)
- Found 3/5: **3 points**
- Found 5/5: **5 + 3 = 8 points**

---

## Top Tens

**Type:** Tiered (Flat)
**Game Mode ID:** `top_tens`
**Max Points:** 8

### Rules
- A ranking category is revealed (e.g., "Top 10 Premier League scorers")
- Correct guesses slot into their rank position
- Find all 10 for maximum IQ (Hall of Famer status)

### Scoring Table

Score is based on **total found** (flat tier system, not cumulative):

| Total Found | Points | Intelligence Tier |
|-------------|--------|-------------------|
| 1-2         | 1      | Scout             |
| 3-4         | 2      | Chief Scout       |
| 5-6         | 3      | Head of Scouting  |
| 7-8         | 4      | Director of Football |
| 9           | 5      | World Class       |
| 10 (Jackpot!) | 8    | Hall of Famer     |

---

## The Chain

**Type:** Inverse Par
**Game Mode ID:** `the_chain`
**Max Points:** par + 2 (Eagle)

### Rules
- Connect two players through shared club history
- Players are "linked" if they shared a club during overlapping years
- Complete the chain in fewer steps for more points

### Scoring Formula (Inverse Par)

```
points = max(0, par - (steps - par))
       = max(0, 2*par - steps)
```

| Performance | Steps (Par 5) | Points | Label |
|-------------|---------------|--------|-------|
| Eagle (-2)  | 3             | 7      | 🦅 Eagle |
| Birdie (-1) | 4             | 6      | 🐦 Birdie |
| Par (0)     | 5             | 5      | ⛳ Par |
| Bogey (+1)  | 6             | 4      | Bogey |
| Double Bogey (+2) | 7       | 3      | Double Bogey |
| Triple Bogey+ (+3+) | 8+    | 2-0    | Triple Bogey+ |
| Floor       | 10+           | 0      | - |
| DNF         | -             | 0      | Did Not Finish |

**Example (Par 5):**
- 3 steps: `max(0, 10-3) = 7` (Eagle)
- 5 steps: `max(0, 10-5) = 5` (Par)
- 8 steps: `max(0, 10-8) = 2` (Triple Bogey+)
- 12 steps: `max(0, 10-12) = 0` (Floor)

---

## The Thread

**Type:** Tiered (Decreasing)
**Game Mode ID:** `the_thread`
**Max Points:** 10

### Rules
- Players see a chronological list of kit sponsors or suppliers
- All brands shown upfront — no progressive reveal
- Goal: Guess the football club from the brand pattern

### Scoring Formula

```
points = max(0, 10 - ((guessCount - 1) * 2))
```

| Guess # | Points | Label |
|---------|--------|-------|
| 1       | 10     | Perfect! |
| 2       | 8      | Great! |
| 3       | 6      | Good! |
| 4       | 4      | Nice! |
| 5       | 2      | Close! |
| 6+      | 0      | Completed |
| Give up | 0      | DNF |

### Share Grid Format

Uses 5-slot visual grid: `🧵 🟥🟥🟩⬜⬜ Good!`
- 🧵 = The Thread header
- 🟩 = Correct guess
- 🟥 = Incorrect guess
- ⬜ = Unused attempt

---

## The Grid

**Type:** Dynamic (Rarity-based)
**Game Mode ID:** `the_grid`
**Max Points:** 100

### Rules
- 3x3 grid with row and column criteria
- Each cell requires a player matching BOTH criteria
- Rarer answers score higher points

### Scoring Formula

```
cellScore = floor(100 - rarityPercentage)
totalScore = sum(cellScores) / 9 * 100 / 100
```

Approximately **~11 points per cell** based on answer rarity:
- Common answer (many players guessed): Lower score
- Rare answer (few players guessed): Higher score

**Note:** Exact formula depends on backend rarity calculation.

---

## Topical Quiz

**Type:** Fixed
**Game Mode ID:** `topical_quiz`
**Max Points:** 10

### Rules
- 5 multiple choice questions on current football topics
- Each question has 4 answer options
- No time limit per question

### Scoring Formula

```
score = correctAnswers * 2
```

| Correct Answers | Points |
|-----------------|--------|
| 0               | 0      |
| 1               | 2      |
| 2               | 4      |
| 3               | 6      |
| 4               | 8      |
| 5               | 10     |

---

## Implementation Checklist

When implementing or auditing scoring:

- [ ] **Career Path**: Score = clubs remaining when correct
- [ ] **Career Path Pro**: Same as Career Path
- [ ] **Guess the Transfer**: 5/3/2/1 points based on hints revealed (Year, Position, Nation)
- [ ] **Goalscorer Recall**: 1pt per scorer + 3pt bonus for all
- [ ] **Starting XI**: 1pt per player + 3pt Perfect XI bonus
- [ ] **Top Tens**: Flat tier scoring, max 8 (1→1, 3→2, 5→3, 7→4, 9→5, 10→8)
- [ ] **The Grid**: Rarity-based, ~11 pts/cell avg, max 100
- [ ] **The Chain**: Inverse Par, points = max(0, 2*par - steps), max = par+2
- [ ] **The Thread**: Decreasing tier, points = max(0, 10 - (guessCount-1)*2), max = 10
- [ ] **Topical Quiz**: 2pts per correct answer

## Intelligence Tiers

15-tier hierarchy used for IQ Growth display across all game modes:

| Tier | Name |
|------|------|
| 1 | Trainee |
| 2 | Scout |
| 3 | Senior Scout |
| 4 | Lead Scout |
| 5 | Chief Scout |
| 6 | Regional Director |
| 7 | Head of Scouting |
| 8 | Technical Analyst |
| 9 | Technical Director |
| 10 | Director of Football |
| 11 | Sporting Director |
| 12 | Football Genius |
| 13 | World Class |
| 14 | Legendary |
| 15 | Hall of Famer |

Each game mode maps to appropriate tiers based on performance level.
