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
- Player sees: year, from club, to club, and fee
- Can reveal hints for more information (costs points)
- Goal: Name the player with fewest hints possible

### Scoring Table

| Hints Used | Points |
|------------|--------|
| 0 hints    | 5      |
| 1 hint     | 3      |
| 2 hints    | 2      |
| 3 hints    | 1      |
| Failed     | 0      |

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

**Type:** Tiered (Progressive)
**Game Mode ID:** `top_tens`
**Max Points:** 30

### Rules
- A ranking category is revealed (e.g., "Top 10 Premier League scorers")
- Correct guesses slot into their rank position
- Higher ranks are worth more points

### Scoring Table

Points are awarded **per correct answer** based on cumulative count:

| Correct Answers | Points Each |
|-----------------|-------------|
| 1st-2nd correct | 1 point each |
| 3rd-4th correct | 2 points each |
| 5th-6th correct | 3 points each |
| 7th-8th correct | 4 points each |
| 9th correct     | 5 points |
| 10th correct (Jackpot!) | 8 points |

### Score Breakdown

| Total Found | Total Score |
|-------------|-------------|
| 1           | 1           |
| 2           | 2           |
| 3           | 4           |
| 4           | 6           |
| 5           | 9           |
| 6           | 12          |
| 7           | 16          |
| 8           | 20          |
| 9           | 25          |
| 10          | 30          |

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
- [ ] **Guess the Transfer**: 5/3/2/1 points based on hints used
- [ ] **Goalscorer Recall**: 1pt per scorer + 3pt bonus for all
- [ ] **Starting XI**: 1pt per player + 3pt Perfect XI bonus
- [ ] **Top Tens**: Progressive tier scoring (1,1,2,2,3,3,4,4,5,8)
- [ ] **The Grid**: Rarity-based, ~11 pts/cell avg, max 100
- [ ] **Topical Quiz**: 2pts per correct answer
