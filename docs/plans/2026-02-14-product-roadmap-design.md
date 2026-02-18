# Football IQ: Comprehensive Product Roadmap

## Context

Football IQ is a React Native (Expo) trivia app with 11 game modes, 10k+ Wikidata players, a 10-tier progression system, streaks, leaderboards, and a premium subscription. The app has solid engagement foundations (celebrations, haptics, share cards) but needs a viral breakout moment and a long-term growth strategy to become the #1 football trivia app. This roadmap covers new game modes, data infrastructure, marketing, and monetization across a 12-month horizon.

---

## Part 0: Data Foundation (PREREQUISITE)

Everything in this roadmap depends on reliable player data. Currently we have ~10k players sourced from Wikidata, but club deduplication remains an ongoing issue (e.g., "FC Barcelona" / "Barcelona" / "Futbol Club Barcelona" appearing as separate clubs, scattering player appearances). Migration 032 introduced `canonical_club_id` and the API-Football mapping pipeline exists, but the data still isn't clean enough to trust at scale.

**This must be solved before or alongside new game modes.** Connections, The Chain, The Grid, and Career Path all break when players are linked to the wrong club entity.

### 0.1 Clean Rebuild of Player Data

**Priority: P0 | Effort: Large**

Consider rebuilding the player database from scratch with a single authoritative source and strict validation:

1. **Define a canonical club registry first** - A curated list of ~500-1000 clubs that matter (top 5 leagues, major clubs worldwide). Each with ONE canonical ID, standardised name, country, and any known aliases. All Wikidata QIDs and API-Football IDs mapped.

2. **Rebuild player-club links against the canonical registry** - Every `player_appearances` record must reference a canonical club. Reject or flag any link to an unrecognised club.

3. **Validation layer on ingest** - Any new player/club data (from Wikidata, API-Football, or manual entry) must pass through normalisation that resolves to canonical clubs before insertion.

### 0.2 Club Admin Merge Tool

**Priority: P0 | Effort: Medium**

Admin dashboard tool to:

- View all clubs grouped by normalised name (showing duplicates)
- One-click merge: reassign all `player_appearances` from duplicate -> canonical, then soft-delete duplicate
- Bulk merge for obvious duplicates (same normalised name, same country)
- Manual override for edge cases (e.g., "Red Bull Salzburg" vs "FC Salzburg")

### 0.3 Data Quality Dashboard

**Priority: P1 | Effort: Medium**

Admin page showing:

- Players with no appearances (orphans)
- Clubs with 0 or 1 players (likely duplicates or junk)
- Players flagged by API-Football mapping (ambiguous/skipped)
- Year discrepancy report (our data vs API-Football)
- Missing data coverage: % of players with birth_year, nationality, position

### 0.4 Content Integrity Checks

**Priority: P1 | Effort: Small**

Automated checks that run before any puzzle goes live:

- Career Path: verify all career steps reference canonical clubs
- The Grid: verify all valid_answers reference real players with correct club links
- The Chain: verify start/end players have valid paths through canonical clubs
- Connections: verify all 16 players exist and category logic is correct

---

## Part 1: New Game Modes

### 1.1 Football Connections ✅ COMPLETE

**Priority: P0 | Effort: Medium | Virality: 5/5** — **Shipped Feb 2026**

NYT Connections applied to football. 16 player names in a 4x4 grid. Find 4 groups of 4 connected players. 4 mistakes max. Color-coded difficulty (yellow/green/blue/purple).

- **Implementation**: `src/features/connections/` — types, hooks, utils, components, screens
- **CMS**: `web/app/(dashboard)/admin/connections/` — list + create form
- **Routes**: `app/connections/index.tsx`, `app/connections/[puzzleId].tsx`

### 1.2 Timeline (THE RETENTION PLAY)

**Priority: P0 | Effort: Medium | Virality: 4/5**

Place 6-8 historical events from a player's career in chronological order. Drag-to-reorder with cascading reveal. Multiple attempts allowed but each costs points.

- **Why viral**: Proven mechanic (Sortdle, Chronophoto). "Put these in order" is simpler to explain than Connections. Deductive reasoning makes it accessible to casual fans. Everyone finishes — score varies.
- **Share format**: `⏱️⏱️⏱️⏱️⏱️⏱️` + `✅✅❌✅✅✅` — shows which events you placed correctly
- **Data**: Auto-generated from existing `player_appearances` (transfers) + `player_achievements` (trophies). V2 adds `timeline_events` table for richer content (debut goals, records, milestones).
- **Schedule**: 3x per week (Tue/Thu/Sat), free tier
- **Key files**: Follow `src/features/connections/` pattern. New `src/features/timeline/` directory.
- **Content pipeline**: Career Path data repurposed — each player's career steps become timeline events. Manual curation adds achievement events.
- **Full design**: See `docs/plans/2026-02-17-timeline-design.md`

### 1.3 Mystery Manager

**Priority: P3 | Effort: Low | Virality: 2/5**

Identify a manager from progressive career clues. Reuses Career Path UI and mechanics entirely.

- **Data**: New `managers` table (name, career steps, trophies). Can launch with 50-100 manually curated managers and expand.
- **Why**: Manager debates are huge in football culture. Very low build cost.

### 1.4 Who Am I? (20 Questions)

**Priority: P3 | Effort: Low | Virality: 3/5**

5 yes/no clues about a mystery player, revealed one at a time. Guess after each clue. Score: 5pts for clue 1, down to 1pt for clue 5.

- **Data**: Auto-generated from existing player graph (nationality, clubs, achievements, position).
- **Why**: Lowest barrier to entry. Creates "I knew it from clue 1!" bragging moments.

### 1.5 Shirt Number

**Priority: P3 | Effort: Medium | Virality: 3/5**

See a famous shirt number + club. Name as many players as possible who wore it (60s timer).

- **Data**: NEW `player_shirt_numbers` table needed. Source from Transfermarkt/Wikipedia initially for ~50 iconic number/club combos.
- **Why**: Shirt numbers are iconic football culture. "#7 at Manchester United" is a conversation fans already have.

### 1.6 The Wall (Club Connections)

**Priority: P3 | Effort: Medium | Virality: 3/5**

4 club badges shown. Find the connection. 3 rounds, each harder.

- **Data**: Club data exists. Connections derived from shared managers, kit colors, league, country.
- **Why**: Club-centric = engages casual fans (everyone knows badges).

### 1.7 Score Predictor (Weekend Fixtures)

**Priority: P3 | Effort: Medium | Virality: 4/5**

Predict the scores for upcoming Premier League (and eventually other league) weekend fixtures. Points awarded after matches finish based on prediction accuracy.

- **Mechanic**: Each gameweek, users see the upcoming fixtures and submit score predictions before kickoff. After matches complete, points are awarded:
  - Exact score (e.g., predicted 2-1, result 2-1): 3 points
  - Correct result + goal difference (e.g., predicted 3-1, result 2-0): 2 points
  - Correct result only (e.g., predicted 2-1, result 1-0): 1 point
  - Wrong result: 0 points
- **Weekly leaderboard**: Separate predictor leaderboard ranked by weekly points. Resets each gameweek.
- **Season-long table**: Cumulative points across all gameweeks for a season-long competition.
- **Share format**:

  ```
  Football IQ - Score Predictor
  GW25 Results

  ✅ Arsenal 2-1 Chelsea (exact!)
  🟡 Liverpool 3-0 Wolves (result)
  ❌ Man Utd 1-1 Spurs
  ...

  18/30 points
  footballiq.app
  ```

- **Why viral**: Score prediction is the most universal football activity - literally every fan does it. Weekly deadline creates FOMO. Season-long table creates long-term investment. Group chat sharing is natural ("I got 5 exact scores this week").
- **Data**: Requires Football-Data.org API integration for fixture lists and live results. Scheduled Edge Function to fetch fixtures weekly and results after matches.
- **New tables**: `score_predictions` (user_id, fixture_id, home_score, away_score, gameweek), `fixtures` (home_team, away_team, kickoff, competition, gameweek, result)
- **Future expansion**: Start with Premier League, expand to Champions League, La Liga, Bundesliga etc. Add "bonus questions" per gameweek (first goalscorer, number of cards, etc.).

---

## Part 2: Data Infrastructure

### 2.1 New Data Tables

| Table                             | Purpose                                   | Source                  | Priority |
| --------------------------------- | ----------------------------------------- | ----------------------- | -------- |
| `managers`                        | Manager career history, trophies          | Manual + Wikipedia      | P1       |
| `player_shirt_numbers`            | Player-club-number-years mapping          | Transfermarkt/Wikipedia | P2       |
| `club_coordinates`                | Lat/long for Geography Ball               | Manual/geocoding API    | P3       |
| `fixtures`                        | Upcoming/past match fixtures with results | Football-Data.org API   | P1       |
| `score_predictions`               | User predictions per fixture per gameweek | Internal                | P1       |
| `match_events`                    | Comprehensive goal/assist/card data       | Football-Data.org API   | P2       |
| `transfer_history`                | Bulk transfer data with fees/dates        | Transfermarkt API       | P2       |
| `content_submissions`             | User-submitted puzzle ideas               | User input              | P2       |
| `referral_codes`                  | User referral tracking                    | Internal                | P1       |
| `friendships` + `friend_requests` | Social graph                              | Internal                | P1       |

### 2.2 External API Integrations

**Football-Data.org API** (P1):

- Match results, scorers, standings for top 5 leagues
- Feeds: Topical Quiz auto-generation, Goalscorer Recall (recent matches), Transfer Window mode
- Scheduled Edge Function syncs nightly

**Transfermarkt** (P2):

- Transfer data, market values, squad data
- Feeds: Transfer Window mode, Shirt Number data, player valuations
- One-time bulk import + periodic delta sync

### 2.3 AI-Powered Content Pipeline

**Programmatic puzzle generation** using the existing knowledge graph:

- **Connections**: Query shared attributes across 4 players (shared clubs, nationalities, achievements, birth years)
- **Career Path**: Select by `scout_rank`, order clues from `player_appearances`
- **The Chain**: Use `find_shortest_player_path` BFS to find interesting pairs
- **Top Tens**: Query `player_achievements` for ranked lists
- **The Grid**: Use `validate_player_club` to generate valid row/column combos

**LLM-assisted curation**: Use Claude/GPT-4 to:

- Generate quiz questions from structured data + fact-check against knowledge graph
- Create "tricky" Connections categories (wordplay, cultural references)
- Write engaging clue text from raw data
- Target: Auto-generate 70% of daily content, human-review 100%

### 2.4 Data Quality Improvements

- **Club deduplication**: Continue `canonical_club_id` cleanup (migration 032 pattern)
- **Player retirement detection**: Flag players who haven't appeared in 2+ years
- **Achievement coverage**: Expand beyond 40 curated achievements to include league titles, domestic cups per player
- **Position data enrichment**: Add detailed position roles beyond `position_category`

---

## Part 3: Marketing & Growth

### 3.1 Social Media Strategy

**Twitter/X (Priority 1)**:

- Official @FootballIQ account posts daily puzzle results (no spoilers) at 08:00 UTC
- "Can you beat this?" format with emoji share grid
- Quote-tweet users who share results
- Live-react during big matches with related puzzles
- "On This Day" puzzles tied to football history

**TikTok (Priority 1)**:

- Screen recordings of gameplay reactions ("No way, I got it in 1!")
- "Football fan vs. casual" format: two people play the same puzzle
- "I bet you can't name all 10" for Top Tens
- UGC reposts

**Instagram (Priority 2)**: Static share cards + Reels (repurposed TikTok)

**Reddit (Priority 2)**: Daily puzzles in r/soccer, r/PremierLeague

### 3.2 Referral System

- "Invite a Friend" generates unique link: `footballiq.app/invite/USERNAME`
- Referrer: 1 streak freeze + 50 bonus IQ per accepted invite
- Referee: 1 streak freeze + 7-day premium trial
- 5 referrals = "Ambassador" badge on profile
- Deep links open the specific puzzle for challenge mode

### 3.3 SEO & Web Growth

- **Web-playable daily page** (`footballiq.app/daily`): SSR daily puzzle, play on web, prompt app download for full stats
- **Blog** (`footballiq.app/blog`): "How to Win at Football Trivia," "Best Football Quiz Apps 2026" - target long-tail keywords
- **Player pages** (`footballiq.app/players/[id]`): SEO-friendly player trivia pages ranking for "[Player] career history"
- **JSON-LD structured data**: Game, MobileApplication schema markup
- **ASO**: A/B test screenshots showing share cards, optimize subtitle to "Daily Football Puzzles & Challenges"

### 3.4 PR Calendar

| Period  | Opportunity               | Action                                             |
| ------- | ------------------------- | -------------------------------------------------- |
| Aug     | Season start              | Influencer campaign, "Season Preview" special quiz |
| Jan/Aug | Transfer windows          | Launch Transfer Window mode, PR push               |
| Mar-Apr | CL knockout               | CL-themed puzzles, social campaigns                |
| May     | CL Final                  | "Ultimate Football IQ Test" event                  |
| Jun-Jul | International tournaments | Tournament mode, massive PR opportunity            |
| Oct     | Ballon d'Or               | "Predict the Ballon d'Or" event                    |
| Dec     | Boxing Day                | "Boxing Day Marathon" - play all modes challenge   |

### 3.5 Influencer Partnerships

- **Tier 1**: Football YouTube (Tifo, HITC Sevens, Football Daily) - "Creator Challenge" format
- **Tier 2**: FPL content creators, football podcasters - early access to new modes
- **Community**: Discord server with channels per game mode, daily discussion, feature requests

---

## Part 4: Monetization Evolution

### 4.1 Premium Tier Expansion

Current: 2 modes gated (Career Path Pro, Top Tens). Weak value prop.

**Enhanced "Football IQ Pro":**

- Unlimited daily games (free: 5/day per Phase 2.1)
- All premium modes (current + Connections when launched)
- Unlimited streak freezes
- Ad-free experience
- Profile customization (avatar borders, badge showcase, themes)
- Early access to new modes (1-week exclusive)
- Detailed per-mode analytics ("Top 5% for Career Path")
- Weekly premium-only challenge with exclusive badge

### 4.2 Pricing

| Tier        | Price     | Differentiation                                                   |
| ----------- | --------- | ----------------------------------------------------------------- |
| Free        | $0        | 5 games/day, ads, earned streak freezes, basic stats              |
| Pro Monthly | $4.99/mo  | Unlimited everything, no ads, customization                       |
| Pro Annual  | $29.99/yr | Monthly benefits + "Founder" badge + priority content suggestions |

### 4.3 In-App Purchases

- **Streak Freeze Pack**: 3 for $0.99 (free users wanting freezes without subscribing)
- **Profile Theme Pack**: $1.99 (CL Gold, Retro 90s, etc.)
- **Hint Pack**: 5 for $0.99 (extra hints in Career Path/Connections)

### 4.4 Ad Strategy

- Interstitial after every 3rd completed game (max 1/day, premium removes)
- Banner on archive screen
- Rewarded ad for "Extra Life" (extra guess in Connections/Career Path)
- Sponsored puzzles: "Today's Career Path presented by [Brand]"

---

## Part 5: Prioritized Roadmap

### NOW (Weeks 1-4)

| #   | Item                                                       | Virality | Effort | Revenue | Retention |
| --- | ---------------------------------------------------------- | -------- | ------ | ------- | --------- |
| 0a  | **Clean rebuild of player data + canonical club registry** | 0        | L      | 0       | 5         |
| 0b  | **Club admin merge tool**                                  | 0        | M      | 0       | 3         |
| ~~1~~ | ~~**Football Connections game mode**~~ ✅ COMPLETE        | 5        | M      | 2       | 5         |
| 1b  | **Timeline game mode** (3x/week, drag-to-order career events) | 4    | M      | 2       | 5         |
| 2   | **Free daily limit (5 games/day)**                         | 1        | S      | 5       | 2         |
| 3   | **Referral system + deep links**                           | 4        | M      | 2       | 3         |
| 4   | **Enhanced share cards with "X% of players" percentile**   | 3        | S      | 0       | 3         |
| 5   | **Twitter/X daily puzzle bot**                             | 3        | S      | 0       | 1         |

### NEXT (Months 1-2)

| #   | Item                                          | Virality | Effort | Revenue | Retention |
| --- | --------------------------------------------- | -------- | ------ | ------- | --------- |
| 0c  | **Data quality dashboard**                    | 0        | M      | 0       | 3         |
| 0d  | **Scale to 50k+ players**                     | 0        | L      | 0       | 4         |
| 0e  | **Content integrity checks (automated)**      | 0        | S      | 0       | 3         |
| 6   | **Friends system + friend leaderboard**       | 4        | L      | 2       | 5         |
| 7   | **Async friend challenges**                   | 5        | L      | 1       | 5         |
| 9   | **Transfer Window batch game mode**           | 2        | S      | 1       | 3         |
| 10  | **7-day free trial trigger (after 10 games)** | 1        | S      | 5       | 2         |
| 11  | **Premium tier expansion**                    | 1        | M      | 4       | 3         |
| 12  | **Football-Data.org API integration**         | 1        | M      | 1       | 3         |
| 13  | **Programmatic puzzle generation pipeline**   | 1        | L      | 1       | 4         |
| 14  | **Weekly collection challenges**              | 2        | M      | 1       | 4         |
| 15  | **Discord community launch**                  | 2        | S      | 0       | 3         |

### LATER (Months 3-6)

| #   | Item                                        | Virality | Effort | Revenue | Retention |
| --- | ------------------------------------------- | -------- | ------ | ------- | --------- |
| 8   | **Mystery Manager game mode**               | 2        | S      | 1       | 3         |
| 12b | **Score Predictor (weekend fixtures)**      | 4        | M      | 2       | 5         |
| 16  | **Who Am I? game mode**                     | 3        | M      | 1       | 3         |
| 17  | **Shirt Number game mode**                  | 3        | M      | 1       | 3         |
| 18  | **The Wall game mode**                      | 3        | M      | 1       | 3         |
| 19  | **Seasonal leagues (monthly resets)**       | 3        | L      | 2       | 5         |
| 20  | **Fan Club Teams (club-based competition)** | 4        | L      | 1       | 4         |
| 21  | **Transfermarkt data integration**          | 1        | L      | 1       | 3         |
| 22  | **SEO blog + player pages**                 | 2        | M      | 1       | 1         |
| 23  | **Influencer partnership program**          | 4        | M      | 2       | 1         |
| 24  | **In-app purchases**                        | 0        | M      | 4       | 1         |
| 25  | **AI content generation (LLM pipeline)**    | 1        | L      | 1       | 4         |

### FUTURE (Months 6-12)

| #   | Item                                          | Virality | Effort | Revenue | Retention |
| --- | --------------------------------------------- | -------- | ------ | ------- | --------- |
| 26  | **Geography Ball game mode**                  | 4        | XL     | 1       | 3         |
| 27  | **Live multiplayer (real-time head-to-head)** | 5        | XL     | 3       | 5         |
| 28  | **Localization (ES, DE, FR, PT, BR)**         | 3        | XL     | 4       | 2         |
| 29  | **Full web app (feature parity)**             | 3        | XL     | 3       | 2         |
| 30  | **Brand sponsorship deals**                   | 0        | M      | 5       | 0         |
| 31  | **User-generated puzzle marketplace**         | 2        | XL     | 2       | 4         |

---

## Part 6: Shipped Game Modes

### Football Connections ✅ (Shipped Feb 2026)

NYT Connections applied to football. 16 player names in a 4x4 grid. Find 4 groups of 4 connected players. 4 mistakes max. Color-coded difficulty (yellow/green/blue/purple).

**Implementation:** `src/features/connections/` | **CMS:** `web/app/(dashboard)/admin/connections/` | **Routes:** `app/connections/`

---

## Part 7: The Next Viral Game — Timeline

### Why Timeline

Both the trivia-engagement expert and UI designer agents independently converged on Timeline as the strongest candidate. The format is proven (Sortdle, Chronophoto) and maps perfectly to football's deep history. Key advantages over Connections:

- **Simpler to explain**: "Put these in order" vs "Find 4 groups of 4"
- **More forgiving**: No knockout mechanic — everyone finishes, score varies
- **Better skill differentiation**: Granular scoring vs binary win/loss
- **Deductive accessibility**: Logical reasoning works even without exact dates
- **Educational post-solve**: Completed timeline becomes a career reference

### Exact Mechanics

1. 6 career events from a player shown in random order as draggable cards
2. Long-press to lift card (haptic bump), drag to reorder, drop to place
3. Submit to check — cards reveal one by one (200ms cascade) showing ✓/✗ + correct year
4. Correct cards lock in place. Incorrect cards shake red.
5. Multiple attempts allowed: 1st = full points, 2nd = 75% max, 3rd = 50% max
6. Each submission: "X of Y are correct" feedback (not which ones, unless locked)

### Scoring

| Accuracy (1st try) | IQ Points | Label            |
| ------------------- | --------- | ---------------- |
| 6/6 (perfect)       | 10        | Perfect Timeline |
| 5/6                 | 8         | World Class      |
| 4/6                 | 6         | Expert           |
| 3/6                 | 4         | Promising        |
| 1-2/6               | 2         | Rookie           |

### Share Format

```
Football IQ - Timeline
Cristiano Ronaldo
17 Feb 2026

⏱️⏱️⏱️⏱️⏱️⏱️
✅✅❌✅✅✅

5/6 correct - 8 IQ
footballiq.app
```

### Content Structure

```json
{
  "subject": "Cristiano Ronaldo",
  "subject_id": "Q11571",
  "events": [
    { "text": "Signed for Sporting CP", "year": 2002, "type": "transfer" },
    { "text": "Joined Manchester United", "year": 2003, "type": "transfer" },
    { "text": "Won first Ballon d'Or", "year": 2008, "type": "achievement" },
    { "text": "Signed for Real Madrid", "year": 2009, "type": "transfer" },
    { "text": "Won Euro 2016 with Portugal", "year": 2016, "type": "achievement" },
    { "text": "Moved to Juventus", "year": 2018, "type": "transfer" }
  ]
}
```

### Data Sources

- **V1**: Auto-generated from `player_appearances` (transfers) + `player_achievements` (trophies). Career Path content directly repurposable.
- **V2**: New `timeline_events` table for richer content (debut goals, records, international milestones).

### Schedule

- 3x per week: Tuesday, Thursday, Saturday
- Free tier (not premium-gated)

### UX Interaction Design

- **Lift**: Long-press card → shadow grows + haptic bump
- **Drag**: Card follows thumb, other cards spring aside smoothly
- **Drop**: Spring animation + satisfying thunk haptic
- **Submit**: Cascading domino reveal (200ms per card)
- **Correct**: Card glows green, locks in place
- **Incorrect**: Card shakes red, shows correct year underneath
- **Perfect**: Confetti burst + "Perfect Timeline!" overlay

### Why This Works for Retention

- **Daily ritual**: New timeline 3x/week, different player each time
- **Everyone finishes**: Score varies but nobody gets knocked out
- **Deductive reasoning**: "He must have won Ballon d'Or AFTER joining Real Madrid"
- **Progressive mastery**: Players learn football history through play
- **"Almost!" frustration**: 5/6 creates the "next time" impulse

### Implementation Pattern

Feature directory: `src/features/timeline/` following Connections pattern.

Full design doc: `docs/plans/2026-02-17-timeline-design.md`
