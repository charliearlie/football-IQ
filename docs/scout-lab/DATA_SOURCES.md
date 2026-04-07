# Football Data Sources & MCP Reference

This document covers all data sources available for StatSchool and future sister apps (PitchLab, TacticsBoard Pro, etc.). It also documents the football-docs MCP server for AI-assisted development.

---

## football-docs MCP Server

The `football-docs` MCP server provides searchable documentation for 16 football data providers. It runs via `npx -y football-docs` and is configured in your Claude Code MCP settings.

### Available Tools

#### `search_docs`

Search across all provider documentation. Best for finding specific data formats, event types, or API patterns.

```
Parameters:
  query: string (required) - Search query
  provider: string (optional) - Filter to: opta, statsbomb, wyscout, sportmonks, fbref, understat, kloppy, mplsoccer, socceraction, databallpy, soccerdata, free-sources
  max_results: number (default 10)
```

**Tips for effective searches:**

- Use short, specific terms: `"SPADL"`, `"coordinate system"`, `"shot event"`
- Single-word or two-word queries work best
- Provider filter dramatically improves relevance
- If no results, try broader terms or remove the provider filter

**Example queries that work well:**

- `search_docs(query="coordinate system", provider="statsbomb")`
- `search_docs(query="visualizations", provider="mplsoccer")`
- `search_docs(query="overview", provider="free-sources")`
- `search_docs(query="FBref", provider="free-sources")`

**Queries that DON'T work (too specific/long):**

- `"free open source football data APIs available without payment"` -> no results
- `"heatmap visualization pitch coordinates player tracking"` -> no results

#### `compare_providers`

Compare how different providers handle the same concept.

```
Parameters:
  topic: string (required) - Concept to compare
  providers: string[] (optional) - Specific providers to compare
```

**Works well for:** `"coordinate systems"`, `"xG models"`
**Doesn't work for:** `"free vs paid data access"`, `"event types passes tackles shots"`

#### `list_providers`

Lists all 16 indexed providers with document chunk counts and categories.

#### `resolve_entity`

Maps player/team/coach across provider IDs (Transfermarkt, FBref, Sofascore, Opta, Wikidata, Soccerway).

```
Parameters:
  name: string - Entity name (fuzzy match), e.g. "Cole Palmer", "Arsenal"
  type: "player" | "team" | "coach" (optional filter)
  provider: string - Source provider for ID lookup
  id: string - Provider-specific ID
  qid: string - Wikidata QID for direct lookup
```

**Use case:** Bridging player IDs between Football IQ (Wikidata-based) and StatsBomb/FBref data.

---

## Indexed Providers (640 chunks)

| Provider         | Chunks | Categories                                                       | Best For                                   |
| ---------------- | ------ | ---------------------------------------------------------------- | ------------------------------------------ |
| **statsbomb**    | 143    | api-access, coordinate-system, data-model, event-types, xg-model | Event-level match data, xG                 |
| **kloppy**       | 100    | data-model, provider-mapping, usage                              | Universal data parser across providers     |
| **sportmonks**   | 71     | api-access, data-model, event-types                              | Live/historical match API                  |
| **databallpy**   | 63     | data-model, overview, usage                                      | Python data processing                     |
| **mplsoccer**    | 62     | overview, pitch-types, visualizations                            | Pitch visualizations (heatmaps, shot maps) |
| **wyscout**      | 61     | api-access, coordinate-system, data-model, event-types           | Video/event data                           |
| **free-sources** | 45     | fbref, overview, understat                                       | Free data overview                         |
| **soccerdata**   | 40     | data-sources, overview, usage                                    | Unified scraper for FBref/Understat        |
| **opta**         | 29     | api-access, coordinate-system, event-types, qualifiers           | Professional event data                    |
| **socceraction** | 26     | spadl, vaep-xt                                                   | SPADL format + action valuation            |

---

## Free Data Sources

### StatsBomb Open Data

- **What:** Full event-level data (passes, shots, carries, pressure, xG, freeze frames)
- **Coverage:** World Cups (2018, 2022), Euros (2020, 2024), La Liga 2004-2021, select PL seasons, women's football
- **Access:** `git clone https://github.com/statsbomb/open-data.git` or via kloppy/API
- **API URLs:**
  ```
  https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json
  https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/{comp_id}/{season_id}.json
  https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/{match_id}.json
  https://raw.githubusercontent.com/statsbomb/open-data/master/data/lineups/{match_id}.json
  ```
- **Coordinate system:** 120 x 80 yards. Origin top-left: (0,0) to (120,80)
- **License:** Free for non-commercial use with attribution
- **Our pipeline:** `scripts/data_pipeline/fetch_statsbomb.py`

### FBref

- **What:** Aggregated season stats (shooting, passing, defense, GCA/SCA, possession)
- **Coverage:** Top 5 European leagues from 2017/18, basic stats go further back
- **Access:** Web scraping via `soccerdata` Python library
- **Rate limit:** Max 10 req/min. Use `time.sleep(6)` between requests. Cache locally.
- **Key stat categories:** standard, shooting, passing, pass_types, gca, defense, possession, playing_time, misc, keepers, keepers_adv
- **Python:**
  ```python
  import soccerdata as sd
  fbref = sd.FBref('ENG-Premier League', '2024')
  team_stats = fbref.read_team_season_stats(stat_type='standard')
  player_stats = fbref.read_player_season_stats(stat_type='shooting')
  ```

### Understat

- **What:** Shot-level xG data with coordinates, plus player/team aggregates
- **Coverage:** Top 5 European leagues + Russian PL from 2014/15
- **Access:** Web scraping or `soccerdata`
- **xG model:** Neural network on ~100,000 shots (distance, angle, body part, situation, last action)
- **Caveats:** No official API, no event data beyond shots, 1-2 day lag

### ClubElo

- **What:** Historical Elo ratings for European clubs, updated daily
- **Coverage:** Most European leagues from 1946 to present
- **Access:** Simple HTTP API returning CSV
- **Endpoints:**
  ```
  http://api.clubelo.com/{club_name}          # Single club history
  http://api.clubelo.com/{YYYY-MM-DD}          # All clubs on a date
  http://api.clubelo.com/{YYYY-MM-DD}/{CC}     # Country-filtered
  ```
- **Response:** CSV with Rank, Club, Country, Level, Elo, From, To

### football-data.co.uk

- **What:** Match results + betting odds
- **Coverage:** 25+ leagues, 20+ seasons
- **Access:** CSV download

---

## Paid APIs

### SportMonks Football API

- **Free:** 2 leagues
- **Entry:** EUR 29/mo (5 leagues)
- **Mid:** EUR 99/mo (30 leagues)
- **All features included at every tier** - scales by league count only

### API-Football

- **Free:** 100 req/day
- **Basic:** $19/mo (7,500 req/day)
- **Pro:** $29/mo (75,000 req/day)
- **All endpoints at every tier** - scales by volume

### football-data.org

- **Free:** 12 major competitions, 10 req/min
- **Best free tier for major leagues**

---

## Coordinate Systems

Different providers use different coordinate systems. This is critical for rendering pitch visualizations.

| Provider      | Dimensions     | Origin            | Notes                   |
| ------------- | -------------- | ----------------- | ----------------------- |
| **StatsBomb** | 120 x 80 yards | Top-left (0,0)    | Our primary system      |
| **Opta**      | 100 x 100      | Bottom-left (0,0) | Percentage-based        |
| **Wyscout**   | 100 x 100      | Top-left (0,0)    | Y-axis inverted vs Opta |
| **Understat** | 0-1 x 0-1      | Top-left          | Normalized              |

### Conversion formulas:

```
Opta -> StatsBomb: x * 1.2, y * 0.8
Opta -> Wyscout:   x, 100 - y (invert Y)
```

**kloppy** handles all coordinate transformations automatically with `.transform()`.

---

## Python Libraries

### kloppy (Universal Parser)

```python
from kloppy import statsbomb
dataset = statsbomb.load_open_data(match_id=3788741, coordinates="statsbomb")
```

### mplsoccer (Visualizations)

Heatmaps, shot maps, pass networks, Voronoi diagrams, Delaunay tessellation.

```python
from mplsoccer import Pitch, Sbopen
pitch = Pitch(pitch_type='statsbomb')
fig, ax = pitch.draw()
pitch.scatter(x, y, ax=ax, s=xg*500)  # shot map
```

### socceraction (SPADL + Valuation)

Standardized action format for cross-provider analysis.

```python
import socceraction.spadl as spadl
from socceraction.data.statsbomb import StatsBombLoader
```

### soccerdata (Unified Scraper)

```python
import soccerdata as sd
fbref = sd.FBref('ENG-Premier League', '2024')
understat = sd.Understat('ENG-Premier League', '2024')
```

---

## Data Architecture for StatSchool

```
data/
├── modules.ts           # Module definitions (xG, Shot Maps, Pass Networks)
├── glossary.ts          # Football analytics glossary
├── lessons/
│   ├── index.ts         # Lesson registry
│   └── xg.ts            # Module 1 lesson content
└── match_data/
    └── match_*.json     # Pre-processed StatsBomb data (generated by Python pipeline)

scripts/data_pipeline/
├── requirements.txt     # Python dependencies
└── fetch_statsbomb.py   # StatsBomb open data fetcher + processor
```

### Pipeline workflow:

1. `python fetch_statsbomb.py --list-competitions` - Browse available data
2. `python fetch_statsbomb.py --list-matches COMP_ID SEASON_ID` - Find matches
3. `python fetch_statsbomb.py --match-id MATCH_ID` - Process and save match data
4. Reference the JSON in lesson files or load dynamically in the app

## How to Use the football-docs MCP Server

You have access to an MCP server called `football-docs` that indexes documentation for 16 football data providers. **Use it as your reference manual** whenever you need to understand data formats, event types, coordinate systems, or API structures.

### Available Tools

#### `search_docs(query, provider?, max_results?)`

Search provider documentation.

**CRITICAL: The search is keyword-based, NOT semantic. Rules:**

- Use **1-2 word queries ONLY**. Long natural language queries return NOTHING.
- **Always** add a `provider` filter when you know which provider you need.
- If a search returns no results, make the query **shorter**, not longer.

| Works                                                    | Doesn't Work                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `search_docs(query="event types", provider="statsbomb")` | `search_docs(query="what event types does statsbomb provide for shot data")` |
| `search_docs(query="heatmap", provider="mplsoccer")`     | `search_docs(query="how to create heatmaps from player touch data")`         |
| `search_docs(query="overview", provider="free-sources")` | `search_docs(query="free open source football APIs")`                        |
| `search_docs(query="FBref", provider="free-sources")`    | `search_docs(query="FBref aggregated statistics categories")`                |
| `search_docs(query="data model", provider="sportmonks")` | `search_docs(query="SportMonks API player endpoint structure")`              |

**Best queries by provider:**

- **statsbomb:** `"event types"`, `"data model"`, `"xg model"`, `"api access"`, `"shot"`, `"pass"`, `"carry"`, `"pressure"`, `"duel"`, `"lineup"`, `"coordinate system"`
- **mplsoccer:** `"visualizations"`, `"pitch types"`, `"radar"`, `"heatmap"`
- **free-sources:** `"overview"`, `"FBref"`, `"understat"`, `"stat categories"`
- **sportmonks:** `"data model"`, `"api access"`, `"event types"`
- **kloppy:** `"usage"`, `"data model"`, `"provider mapping"`
- **socceraction:** `"SPADL"`, `"VAEP"`
- **soccerdata:** `"usage"`, `"data sources"`
- **opta:** `"coordinate system"`, `"qualifiers"`, `"event types"`

#### `compare_providers(topic, providers?)`

Compare how different providers handle a concept.

**Works for:** `"coordinate systems"`, `"xG models"`, `"pass types"`, `"shot events"`, `"defensive actions"`
**Doesn't work for:** `"free vs paid"`, `"pricing"`, `"player statistics"` (too vague)

#### `list_providers()`

Lists all 16 indexed providers with document counts and categories. Call this first to orient yourself.

#### `resolve_entity(name?, type?, provider?, id?, qid?)`

Maps player/team/coach IDs across providers (Transfermarkt, FBref, Sofascore, Opta, Wikidata, Soccerway).
**Note:** May require authentication. If it returns 401, fall back to name-based matching.

### When to Use the MCP

- **Building a pitch component?** Search for `"coordinate system"` to get the exact dimensions.
- **Processing StatsBomb data?** Search for the specific event type (`"shot"`, `"pass"`, `"carry"`).
- **Unsure about a data format?** Search the provider docs before guessing.
- **Converting between providers?** Use `compare_providers(topic="coordinate systems")`.
- **Need to know what mplsoccer can do?** Search `"visualizations"`, `"radar"`, `"heatmap"`.
