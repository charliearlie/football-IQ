# Football IQ Data Enrichment Plan

## Context

Football IQ has 15 game modes and ~10k players but relies on manual curation and a single API (API-Football, 100 req/day). A new `football-docs` MCP server provides documentation for 16 football data providers. The goal: use these data sources to **enrich existing games**, **create new game modes**, and **build a passive learning layer** ("Football Academy") so the app isn't purely game-execution.

**Key free data sources identified:**
- **StatsBomb Open Data** — Free event-level data (shots with xG, passes, lineups) for ~25 competitions (La Liga 2004-2020, select World Cups, FA WSL, select Champions League seasons)
- **FBRef** (via `soccerdata` scraper) — Season-level stats for all major leagues (goals, assists, per-90 metrics, advanced stats)
- **Understat** (via `soccerdata`) — xG data for top 5 European leagues
- **Transfermarkt** (via `soccerdata`) — Transfer history, market values, historical results
- **API-Football** — Already in use (fixtures, events, goalscorers)

---

## A. Enrich Existing Game Modes

### A1. "Did You Know?" Post-Game Cards (All 15 modes)
- Add optional `did_you_know` field to puzzle content JSON
- Render a fact card in `BaseResultModal.tsx` after game completion
- Examples: "Thierry Henry's xG for that season was 22.3 — he scored 24, outperforming by 1.7" or "This transfer made Neymar the most expensive player for 1,847 days"
- **Data source:** Pre-generated during puzzle creation using FBRef/StatsBomb stats
- **Effort:** Low | **Data:** Free | **Impact:** High (adds learning to every game)

### A2. Stat-Powered Higher/Lower Variants
- Currently compares transfer fees only. New comparison types:
  - **Goals in a season** (FBRef)
  - **xG in a match** (StatsBomb open data / Understat)
  - **Career appearances** (FBRef)
  - **Market value** (Transfermarkt)
- Reuses existing `HigherLowerContent` chain format — just swap `fee` for a generic `value` + `label`
- **Effort:** Medium | **Data:** Free | **Impact:** High (multiplies one mode into 5)

### A3. Richer Top Tens Categories
- Auto-generate from FBRef season stats: "Top 10 assisters in the PL 2024/25", "Most clean sheets this season"
- Currently manually curated — this removes the bottleneck
- **Effort:** Low (pipeline only, schema unchanged) | **Data:** Free | **Impact:** Medium

### A4. Stat-Based Grid Categories
- New column/row types: "Scored 20+ league goals in a season", "Won the Golden Boot", "xG > 0.5 per 90"
- Validated against FBRef/StatsBomb data instead of manual lists
- **Effort:** Medium | **Data:** Free | **Impact:** Medium

---

## B. New Game Modes

### B1. "xG Roulette" — Guess the Outcome from Shot Position
- Show a pitch with a shot location + xG value (from StatsBomb open data)
- Player guesses: Goal or Miss?
- 10 rounds, scoring based on correct guesses weighted by difficulty (low xG goals = bonus points)
- Teaches users what xG means through play
- **Data:** StatsBomb open data (free, ~25 competitions)
- **Effort:** Medium | **Impact:** High (unique, no competitor has this)

### B2. "Stat Snap" — Quick-Fire Stat Comparisons
- Show two players, one stat category. Who had more?
- Categories: goals, assists, appearances, xG, clean sheets, tackles per 90
- Speed-based: 60 seconds, how many can you get right?
- Reuses Higher/Lower scaffold (`useHigherLower` reducer pattern)
- **Data:** FBRef via soccerdata (free)
- **Effort:** Low-Medium | **Impact:** Medium

### B3. "Guess the Match" — Identify a Match from Anonymous Stats
- Show: possession %, shots, xG, cards, scoreline shape (e.g., "2-1") — but no team names
- Progressive clues reveal more (competition, stadium, date)
- Player guesses the two teams
- **Data:** StatsBomb open data + API-Football
- **Effort:** Medium-High | **Impact:** High (highly differentiated)

### B4. "Lineup Builder" — Predict the Starting XI
- Given a match context (teams, competition, date), predict the 11 starters
- Scoring: points per correct player, bonus for correct formation
- **Data:** StatsBomb open data (has lineup data) + API-Football
- **Effort:** High | **Impact:** Medium

---

## C. Football Academy — Passive Learning Layer

A new section of the app for non-game content. New feature directory: `src/features/academy/`

### C1. Stat Explainer Cards
- "What is xG?", "What is VAEP?", "How are player ratings calculated?"
- Static content cards with real examples from StatsBomb data
- Linked from post-game modals when relevant (e.g., after xG Roulette)
- **Effort:** Low | **Impact:** Medium

### C2. Player Deep Dives
- After completing a puzzle featuring a player, offer a "Learn More" card
- Shows: career stats timeline, notable achievements, interesting stat comparisons
- Data: FBRef career stats + Wikidata biographical data (already have QIDs)
- **Effort:** Medium | **Impact:** High

### C3. Match Breakdowns
- For Goalscorer Recall / Starting XI puzzles: post-game "Match Story" card
- Shows the full match context: scoreline progression, key events, tactical narrative
- Data: StatsBomb open data event streams for covered matches
- **Effort:** Medium | **Impact:** Medium

---

## D. Daily/Live Content

### D1. "On This Day" — Complete the Empty Feature
- Directory exists at `src/features/on-this-day/` but has no files
- Populate from: historical transfers (Transfermarkt), match results (FBRef), player birthdays (Wikidata)
- One-time batch job generates 365 days of content, stored in a `on_this_day` Supabase table
- Display on home screen as a daily card
- **Effort:** Medium | **Data:** Free | **Impact:** High (daily fresh content without puzzle creation)

### D2. "Stat of the Day"
- Daily auto-generated stat highlight: "On this day in 2018, Mo Salah's xG was..."
- Pulled from the data pipeline, rendered as a home screen card
- **Effort:** Low | **Impact:** Medium

### D3. Match Day Content Cards
- Pre-match: head-to-head stats, form guide, key player stats
- Post-match: actual vs xG, standout performers
- Uses API-Football (already integrated) + FBRef for enrichment
- **Effort:** Medium | **Impact:** High (ties app to the real football calendar)

---

## E. Data Pipeline Architecture

### How It Works
```
Nightly Python script (Supabase Edge Function or $5/mo VPS)
    ├── soccerdata → scrapes FBRef, Understat, Transfermarkt
    ├── statsbombpy → fetches StatsBomb open data
    ├── Transforms into app-ready JSON
    └── Writes to Supabase tables:
         ├── player_enrichment (career stats, per-90 metrics)
         ├── match_enrichment (xG, events, lineups)  
         ├── shot_data (for xG Roulette)
         ├── on_this_day (historical events by month/day)
         └── daily_content (stat of the day, match day cards)
```

### Mobile App Integration
- No new external API calls from mobile — everything syncs through the existing `SyncScheduler.ts` pattern
- New tables sync to local SQLite alongside puzzles
- Academy/On This Day content is lightweight JSON, minimal storage impact

### Using football-docs MCP in Development
When implementing integrations, use the MCP to look up exact API shapes:
- **Query tips:** Use 1-2 word queries with provider filter (e.g., `search_docs("overview", provider="free-sources")`)
- `list_providers` for overview, `resolve_entity` for specific lookups
- `compare_providers` for broad topics like "coordinate systems" or "xG models"

---

## Recommended Priority Order

| Phase | Items | Why First |
|-------|-------|-----------|
| **1** | A1 (Did You Know cards) + D1 (On This Day) | Highest ROI — touches all modes, fills empty feature, all free data |
| **2** | B1 (xG Roulette) + A2 (Higher/Lower variants) | New flagship mode + multiplies existing mode |
| **3** | C1-C2 (Academy explainers + player deep dives) | Builds the passive learning layer |
| **4** | B2-B3 (Stat Snap + Guess the Match) | More new modes once pipeline is proven |
| **5** | D3 (Match Day cards) + A3-A4 (auto Top Tens/Grid) | Live content + automated puzzle generation |

---

## Key Files to Modify

- `src/components/GameResultModal/BaseResultModal.tsx` — Add Did You Know card rendering
- `src/features/on-this-day/` — Complete the empty feature (components, hooks, services, types)
- `src/features/puzzles/types/puzzle.types.ts` — Add new GameMode entries
- `src/features/higher-lower/types/higherLower.types.ts` — Generalize for stat variants
- `web/lib/schemas/puzzle-schemas.ts` — Add schemas for new content types
- `web/lib/blog/api-football.ts` — Reference pattern for new data pipeline integrations
- `app/(tabs)/index.tsx` — Add On This Day + Stat of the Day cards to home screen
- New: `src/features/academy/` — New feature directory
- New: `src/features/xg-roulette/` — New game mode
- New: `supabase/migrations/` — Tables for enrichment data, shot data, on_this_day, daily_content

## Verification

- After implementing Phase 1, verify Did You Know cards render in BaseResultModal for all game modes
- On This Day should display historical content for today's date on the home screen
- Data pipeline should successfully populate Supabase tables from free sources
- Run existing test suite (`npx jest`) to ensure no regressions
- Manual test: complete a puzzle and confirm the fact card appears
