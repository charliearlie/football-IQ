# Football IQ: Comprehensive Product Roadmap

## Context

Football IQ is a React Native (Expo) trivia app with 11 game modes, 190k+ Wikidata players, a 10-tier progression system, streaks, leaderboards, and a premium subscription. The app has solid engagement foundations (celebrations, haptics, share cards) but needs a viral breakout moment and a long-term growth strategy to become the #1 football trivia app. This roadmap covers new game modes, data infrastructure, marketing, and monetization across a 12-month horizon.

---

## Part 1: New Game Modes

### 1.1 Football Connections (THE VIRAL BET)
**Priority: P0 | Effort: Medium | Virality: 5/5**

NYT Connections applied to football. 16 player names in a 4x4 grid. Find 4 groups of 4 connected players. 4 mistakes max. Color-coded difficulty (yellow/green/blue/purple).

- **Why viral**: Connections is the fastest-growing puzzle game. Nobody has done it for football. Emoji grid share format is proven. One attempt/day = FOMO.
- **Share format**: Emoji grid (colored squares for solve order + mistakes) + `footballiq.app` link
- **Data**: Builds on existing player graph. Categories auto-generated from `player_appearances`, `player_achievements`, `nationality_code`, `birth_year`. Purple categories need manual curation.
- **Key files**: Follow `src/features/the-grid/` pattern. New `src/features/connections/` directory.
- **Content pipeline**: Algorithm generates 3 candidates/day from knowledge graph -> editor picks best -> adds 1 manual "tricky" category

### 1.2 Mystery Manager
**Priority: P1 | Effort: Low | Virality: 2/5**

Identify a manager from progressive career clues. Reuses Career Path UI and mechanics entirely.

- **Data**: New `managers` table (name, career steps, trophies). Can launch with 50-100 manually curated managers and expand.
- **Why**: Manager debates are huge in football culture. Very low build cost.

### 1.3 Transfer Window (Batch Mode)
**Priority: P1 | Effort: Low | Virality: 2/5**

5-10 transfers from a specific window shown with fees/clubs but player names blanked. Fill in as many as you can in 90 seconds.

- **Data**: Extends existing Transfer Guess content. Bundle transfers by window period.
- **Why**: Transfer windows are the most discussed football periods. Reuses existing validation logic.

### 1.4 Who Am I? (20 Questions)
**Priority: P2 | Effort: Low | Virality: 3/5**

5 yes/no clues about a mystery player, revealed one at a time. Guess after each clue. Score: 5pts for clue 1, down to 1pt for clue 5.

- **Data**: Auto-generated from existing player graph (nationality, clubs, achievements, position).
- **Why**: Lowest barrier to entry. Creates "I knew it from clue 1!" bragging moments.

### 1.5 Shirt Number
**Priority: P2 | Effort: Medium | Virality: 3/5**

See a famous shirt number + club. Name as many players as possible who wore it (60s timer).

- **Data**: NEW `player_shirt_numbers` table needed. Source from Transfermarkt/Wikipedia initially for ~50 iconic number/club combos.
- **Why**: Shirt numbers are iconic football culture. "#7 at Manchester United" is a conversation fans already have.

### 1.6 The Wall (Club Connections)
**Priority: P2 | Effort: Medium | Virality: 3/5**

4 club badges shown. Find the connection. 3 rounds, each harder.

- **Data**: Club data exists. Connections derived from shared managers, kit colors, league, country.
- **Why**: Club-centric = engages casual fans (everyone knows badges).

### 1.7 Geography Ball
**Priority: P3 | Effort: High | Virality: 4/5**

Trace a player's career path on a map by tapping cities in order. Distance-based scoring.

- **Data**: NEW club coordinates (lat/long). Career order from `player_appearances`.
- **Why**: Globle proved map games are addictive. Career line across a map is extremely shareable as an image.
- **Tech**: Needs map rendering (react-native-maps or SVG). Significant new infrastructure.

### 1.8 Match of the Day (Score Predictor)
**Priority: P3 | Effort: Low | Virality: 2/5**

Given a historic match (teams, competition, date), predict the score then name the scorers.

- **Data**: Uses existing match data. Just needs curation of iconic matches.
- **Why**: Nostalgia-driven. "Remember THAT night?" moments.

---

## Part 2: Data Infrastructure

### 2.1 New Data Tables

| Table | Purpose | Source | Priority |
|-------|---------|--------|----------|
| `managers` | Manager career history, trophies | Manual + Wikipedia | P1 |
| `player_shirt_numbers` | Player-club-number-years mapping | Transfermarkt/Wikipedia | P2 |
| `club_coordinates` | Lat/long for Geography Ball | Manual/geocoding API | P3 |
| `match_events` | Comprehensive goal/assist/card data | Football-Data.org API | P2 |
| `transfer_history` | Bulk transfer data with fees/dates | Transfermarkt API | P2 |
| `content_submissions` | User-submitted puzzle ideas | User input | P2 |
| `referral_codes` | User referral tracking | Internal | P1 |
| `friendships` + `friend_requests` | Social graph | Internal | P1 |

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

| Period | Opportunity | Action |
|--------|-------------|--------|
| Aug | Season start | Influencer campaign, "Season Preview" special quiz |
| Jan/Aug | Transfer windows | Launch Transfer Window mode, PR push |
| Mar-Apr | CL knockout | CL-themed puzzles, social campaigns |
| May | CL Final | "Ultimate Football IQ Test" event |
| Jun-Jul | International tournaments | Tournament mode, massive PR opportunity |
| Oct | Ballon d'Or | "Predict the Ballon d'Or" event |
| Dec | Boxing Day | "Boxing Day Marathon" - play all modes challenge |

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

| Tier | Price | Differentiation |
|------|-------|----------------|
| Free | $0 | 5 games/day, ads, earned streak freezes, basic stats |
| Pro Monthly | $4.99/mo | Unlimited everything, no ads, customization |
| Pro Annual | $29.99/yr | Monthly benefits + "Founder" badge + priority content suggestions |

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

| # | Item | Virality | Effort | Revenue | Retention |
|---|------|----------|--------|---------|-----------|
| 1 | **Football Connections game mode** | 5 | M | 2 | 5 |
| 2 | **Free daily limit (5 games/day)** | 1 | S | 5 | 2 |
| 3 | **Referral system + deep links** | 4 | M | 2 | 3 |
| 4 | **Enhanced share cards with "X% of players" percentile** | 3 | S | 0 | 3 |
| 5 | **Twitter/X daily puzzle bot** | 3 | S | 0 | 1 |

### NEXT (Months 1-2)

| # | Item | Virality | Effort | Revenue | Retention |
|---|------|----------|--------|---------|-----------|
| 6 | **Friends system + friend leaderboard** | 4 | L | 2 | 5 |
| 7 | **Async friend challenges** | 5 | L | 1 | 5 |
| 8 | **Mystery Manager game mode** | 2 | S | 1 | 3 |
| 9 | **Transfer Window batch game mode** | 2 | S | 1 | 3 |
| 10 | **7-day free trial trigger (after 10 games)** | 1 | S | 5 | 2 |
| 11 | **Premium tier expansion** | 1 | M | 4 | 3 |
| 12 | **Football-Data.org API integration** | 1 | M | 1 | 3 |
| 13 | **Programmatic puzzle generation pipeline** | 1 | L | 1 | 4 |
| 14 | **Weekly collection challenges** | 2 | M | 1 | 4 |
| 15 | **Discord community launch** | 2 | S | 0 | 3 |

### LATER (Months 3-6)

| # | Item | Virality | Effort | Revenue | Retention |
|---|------|----------|--------|---------|-----------|
| 16 | **Who Am I? game mode** | 3 | M | 1 | 3 |
| 17 | **Shirt Number game mode** | 3 | M | 1 | 3 |
| 18 | **The Wall game mode** | 3 | M | 1 | 3 |
| 19 | **Seasonal leagues (monthly resets)** | 3 | L | 2 | 5 |
| 20 | **Fan Club Teams (club-based competition)** | 4 | L | 1 | 4 |
| 21 | **Transfermarkt data integration** | 1 | L | 1 | 3 |
| 22 | **SEO blog + player pages** | 2 | M | 1 | 1 |
| 23 | **Influencer partnership program** | 4 | M | 2 | 1 |
| 24 | **In-app purchases** | 0 | M | 4 | 1 |
| 25 | **AI content generation (LLM pipeline)** | 1 | L | 1 | 4 |

### FUTURE (Months 6-12)

| # | Item | Virality | Effort | Revenue | Retention |
|---|------|----------|--------|---------|-----------|
| 26 | **Geography Ball game mode** | 4 | XL | 1 | 3 |
| 27 | **Live multiplayer (real-time head-to-head)** | 5 | XL | 3 | 5 |
| 28 | **Localization (ES, DE, FR, PT, BR)** | 3 | XL | 4 | 2 |
| 29 | **Full web app (feature parity)** | 3 | XL | 3 | 2 |
| 30 | **Brand sponsorship deals** | 0 | M | 5 | 0 |
| 31 | **User-generated puzzle marketplace** | 2 | XL | 2 | 4 |
| 32 | **Match of the Day game mode** | 2 | L | 1 | 3 |

---

## Part 6: The Viral Game in Detail - Football Connections

### Why This Is The One

NYT Connections has 3x the growth rate Wordle had at the same stage. The format is proven. **Nobody has done it for football.** The football domain is perfect because:
- Football is full of hidden connections (shared clubs, agents, nationalities, transfer chains)
- 4-mistake limit creates the perfect tension curve
- Football fans love "I knew something obscure" bragging
- The emoji grid share format is already proven viral

### Exact Mechanics

1. 16 shuffled player names in a 4x4 grid
2. Tap 4 players -> Submit -> if correct, group locks with category label + color
3. Wrong guess: "2 of 4 belong to this group" feedback (doesn't reveal which)
4. 4 mistakes = game over (all groups revealed)
5. Colors: Yellow (easy) / Green (medium) / Blue (hard) / Purple (tricky)

### Scoring
| Mistakes | IQ Points | Label |
|----------|-----------|-------|
| 0 | 10 | Hall of Famer |
| 1 | 8 | World Class |
| 2 | 6 | Director of Football |
| 3 | 4 | Chief Scout |
| 4 (game over) | 2 | Scout |
| Perfect order bonus | +2 | - |

### Share Format
```
Football IQ - Connections
14 Feb 2026

🟨🟨🟨🟨
🟩🟦🟩🟩
🟩🟩🟩🟩
🟦🟦🟦🟦
🟪🟪🟪🟪

1 mistake - 8 IQ
footballiq.app
```

### Example Category Types

**Auto-generated from existing data:**
- "Played for [Club A] and [Club B]" (via `player_appearances` JOIN)
- "Born in [Year]" (via `birth_year`)
- "From [Country]" (via `nationality_code`)
- "[Position] in [League]" (via `position_category` + club)
- "Won [Achievement]" (via `player_achievements`)

**Manually curated (for Purple difficulty):**
- "Surname is also a color" (Brown, White, Green, Gray)
- "Appeared in a FIFA cover"
- "Scored on their debut for their country"
- Wordplay / lateral thinking categories

### Implementation Pattern

New feature at `src/features/connections/` following `src/features/the-grid/` structure:
- `types/connections.types.ts` - ConnectionsGroup, ConnectionsPuzzle, ConnectionsAttempt
- `hooks/useConnectionsGame.ts` - Selection state, mistake count, solved groups, animation triggers
- `utils/scoring.ts` - IQ calculation from mistakes
- `utils/share.ts` - Emoji grid generation
- `components/` - ConnectionsGrid, ConnectionsCell, GroupReveal, MistakeIndicator
- App route: `app/connections/index.tsx`

Content stored in `daily_puzzles.content` as JSON with 4 groups of 4 players + category labels + difficulty colors.
