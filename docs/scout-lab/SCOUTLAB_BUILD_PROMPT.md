# ScoutLab -- Build Prompt for Coding Agent

## Integration into Football IQ Web App

You are adding **ScoutLab** as a new section within the existing **Football IQ** web app at `/Users/charlie/workspace/football-trivia/web`. This is NOT a new project -- you are building inside an existing Next.js 15 app with React 19, shadcn/ui, Tailwind CSS, and Supabase.

ScoutLab gives fans, aspiring analysts, and grassroots coaches access to the same data visualizations that professional clubs use: pizza/radar charts, shot maps, heatmaps, xG trends, and player comparison tools.

---

## Existing App Architecture (READ THESE FILES)

**You MUST read and understand the existing codebase before writing any code.**

| What | File Path |
|------|-----------|
| Root layout (fonts, providers, metadata) | `app/layout.tsx` |
| Dashboard layout (protected routes shell) | `app/(dashboard)/layout.tsx` |
| Dashboard shell (sidebar + header) | `components/layout/dashboard-shell.tsx` |
| Sidebar navigation | `components/layout/sidebar.tsx` |
| Header component | `components/layout/header.tsx` |
| Auth middleware | `middleware.ts` |
| Supabase browser client | `lib/supabase/client.ts` |
| Supabase server client + auth guards | `lib/supabase/server.ts` |
| Database types (auto-generated) | `types/supabase.ts` |
| Admin page wrapper | `components/admin/admin-page-shell.tsx` |
| Admin status hook | `hooks/use-admin-status.ts` |
| Tailwind config (custom colors) | `tailwind.config.ts` |
| UI components (shadcn/ui) | `components/ui/*.tsx` |
| Existing player-scout page | `app/(dashboard)/player-scout/page.tsx` |
| Player-scout server actions | `app/(dashboard)/player-scout/actions.ts` |
| Package.json | `package.json` |

**All paths are relative to `/Users/charlie/workspace/football-trivia/web/`**

### Existing Tech Stack (DO NOT change these -- build with them)
- **Next.js 15.1** (App Router, Server Components, Turbopack)
- **React 19**
- **TypeScript 5.7**
- **Tailwind CSS 3.4** with custom Football IQ theme colors
- **shadcn/ui** (Radix primitives) -- all UI components in `components/ui/`
- **Supabase** (Postgres + Auth + RLS) -- client in `lib/supabase/`
- **SWR** for client-side data fetching
- **Zod** for validation
- **Lucide React** for icons
- **Sonner** for toasts
- **date-fns** for dates

### Existing Theme Colors (from `tailwind.config.ts`)
```
stadium-navy: #05050A     (primary background)
pitch-green: #2EFC5D      (primary accent)
grass-shadow: #1A9E38     (secondary green)
floodlight: #FFFFFF        (text)
card-yellow: #FACC15       (warning/highlight)
accent-blue: #00E5FF       (info)
red-card: #EF4444          (error/danger)
```

### Existing Fonts
- **Bebas Neue** -- headings (dramatic, sporty)
- **Outfit** -- body text (modern, clean)
- **Space Grotesk** -- monospace/data

### Existing Patterns You MUST Follow
- Pages go in `app/(dashboard)/` for protected routes or `app/` for public
- Use `AdminPageShell` wrapper for admin pages (breadcrumb, title, subtitle)
- Use `"use client"` only when needed (prefer Server Components)
- Use `createClient()` from `lib/supabase/client.ts` (browser) or `lib/supabase/server.ts` (server)
- Use SWR for client-side fetching: `useSWR(key, fetcher)`
- Use shadcn/ui components: `Button`, `Card`, `Input`, `Tabs`, `Badge`, `Table`, `Dialog`, `Sheet`, `ScrollArea`, etc.
- Toast notifications via Sonner
- Icons from `lucide-react`
- Style with Tailwind using existing color tokens (`text-floodlight`, `bg-stadium-navy`, `text-pitch-green`, `border-white/10`, `bg-white/5`)

### What Already Exists for Players
The app already has a **player-scout admin page** (`app/(dashboard)/player-scout/`) that:
- Resolves players via Wikidata SPARQL
- Saves players to Supabase (with QID, name, career data)
- Searches existing players in the database
- Syncs career history
- Has batch import and Wikipedia URL import

The sidebar already has a "Player Scout" nav item under the main section. ScoutLab features should extend this or add new nav items in a new "ScoutLab" section.

---

## How to Use the football-docs MCP Server

You have access to an MCP server called `football-docs` that indexes documentation for 16 football data providers. **Use it as your reference manual** whenever you need to understand data formats, event types, coordinate systems, or API structures.

### Available Tools

#### `search_docs(query, provider?, max_results?)`
Search provider documentation.

**CRITICAL: The search is keyword-based, NOT semantic. Rules:**
- Use **1-2 word queries ONLY**. Long natural language queries return NOTHING.
- **Always** add a `provider` filter when you know which provider you need.
- If a search returns no results, make the query **shorter**, not longer.

| Works | Doesn't Work |
|-------|-------------|
| `search_docs(query="event types", provider="statsbomb")` | `search_docs(query="what event types does statsbomb provide for shot data")` |
| `search_docs(query="heatmap", provider="mplsoccer")` | `search_docs(query="how to create heatmaps from player touch data")` |
| `search_docs(query="overview", provider="free-sources")` | `search_docs(query="free open source football APIs")` |
| `search_docs(query="FBref", provider="free-sources")` | `search_docs(query="FBref aggregated statistics categories")` |
| `search_docs(query="data model", provider="sportmonks")` | `search_docs(query="SportMonks API player endpoint structure")` |

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

---

## Data Sources

### 1. FBref via soccerdata (Free -- Primary for Percentile Charts)
The main source for aggregated player stats. Powers radar/pizza charts, stat tables, player search, and comparison.

```python
import soccerdata as sd
fbref = sd.FBref('ENG-Premier League', '2024')
player_stats = fbref.read_player_season_stats(stat_type='shooting')
```

**Stat categories:** standard, shooting, passing, passing_types, goal_shot_creation, defense, possession, misc, keeper, keeper_adv, playing_time

**Rate limit:** 6 seconds between requests. Cache everything locally.

**Percentile computation:** For each stat, compute percentile rank within the same position group in the same league. This powers the pizza chart.

### 2. StatsBomb Open Data (Free -- Event-Level for Visualizations)
Full event-level data for historical matches. Powers shot maps, heatmaps, pass maps, carry maps.

```
https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/{match_id}.json
```

**Key event types:** Shot (with statsbomb_xg, freeze_frame), Pass (with recipient, length, angle, through_ball, cross, goal_assist), Carry (start/end location), Pressure, Duel, Dribble, Ball Receipt, Clearance, Interception, Tackle

**Coordinate system:** 120 x 80 yards. Origin top-left (0,0). Goal at (120, 36-44).

**Coverage:** World Cups, Euros, La Liga 2004-2021, select PL, Champions League, women's football.

### 3. Understat (Free -- Shot-Level xG)
Shot-level xG for top 5 European leagues from 2014/15. Shot coordinates (normalized 0-1, multiply by 120/80 for StatsBomb), xG, result, situation, body part, player.

### 4. SportMonks API (EUR 29-99/mo -- Bio Data & Live)
Player bios, photos, team squads, transfers, injuries, standings, formations.

### 5. ClubElo (Free -- Team Ratings)
Historical Elo ratings: `http://api.clubelo.com/{club_name}` returns CSV.

### 6. Existing Data Pipeline
A working StatsBomb data fetcher exists at `/Users/charlie/workspace/stat-school/scripts/data_pipeline/fetch_statsbomb.py`. It processes match events into JSON with shots, passes, xG timelines. Copy and extend it for this project.

### Coordinate System Reference

| Provider | Dimensions | Origin | Convert to StatsBomb |
|----------|-----------|--------|---------------------|
| StatsBomb | 120 x 80 | Top-left | Native |
| Opta | 100 x 100 | Bottom-left | x*1.2, (100-y)*0.8 |
| Wyscout | 100 x 100 | Top-left | x*1.2, y*0.8 |
| Understat | 0-1 x 0-1 | Top-left | x*120, y*80 |

---

## New Pages to Add

All ScoutLab pages go inside the existing `app/(dashboard)/` directory to inherit the dashboard shell, sidebar, and auth protection.

```
app/(dashboard)/
├── scoutlab/                          # ScoutLab hub / dashboard
│   ├── page.tsx                       # Search, recent, trending, stat leaders
│   ├── leagues/
│   │   ├── page.tsx                   # League browser
│   │   └── [leagueId]/
│   │       ├── page.tsx               # League standings + stat leaders
│   │       └── [teamId]/
│   │           └── page.tsx           # Team squad + team stats
│   ├── player/
│   │   └── [playerId]/
│   │       └── page.tsx               # Player profile (radar, shot map, heatmap, stats)
│   ├── compare/
│   │   └── page.tsx                   # Player comparison tool
│   ├── search/
│   │   └── page.tsx                   # Advanced player search with stat filters
│   └── shortlists/
│       ├── page.tsx                   # All shortlists
│       └── [listId]/
│           └── page.tsx               # Individual shortlist
```

### Sidebar Navigation Update

Add a new "ScoutLab" section to the sidebar in `components/layout/sidebar.tsx`:

```typescript
// Add to the navigation array (visible to ALL users, not just admin):
{
  label: "ScoutLab",
  items: [
    { name: "Dashboard", href: "/scoutlab", icon: Radar },
    { name: "Leagues", href: "/scoutlab/leagues", icon: Trophy },
    { name: "Compare", href: "/scoutlab/compare", icon: GitCompareArrows },
    { name: "Search", href: "/scoutlab/search", icon: Search },
    { name: "Shortlists", href: "/scoutlab/shortlists", icon: Star },
  ],
}
```

---

## Key Components to Build

Place all ScoutLab components in `components/scoutlab/`.

### 1. RadarChart (MOST IMPORTANT -- See Reference Image)

The reference image shows a comparison of Declan Rice (Arsenal) vs Moises Caicedo (Chelsea) with:
- A **percentile table** at the top showing color-coded values for each axis
- A **radar/spider chart** below with two overlaid shapes (blue for Rice, pink for Caicedo)
- 8 axes: Duel%, Poss won, Prog carries, Fwd passes, Fwd pass%, Key passes, Prog passes, Carrying

**Implementation:**
- Custom SVG component (NOT a library -- we want full control)
- Takes array of `{ playerName, team, age, season, color, values: { [axisLabel]: percentileValue } }`
- Renders concentric circles at 20/40/60/80/100 percentile
- Each player is a filled polygon connecting their values on each axis
- Semi-transparent fill with solid border
- Dots at each data point
- Axis labels rotated around the outside
- Responsive (scales to container)
- Support for 1-3 players overlaid
- Use existing Football IQ theme colors

**Position presets:**
```typescript
const POSITION_PRESETS = {
  CM: ['Duel%', 'Poss won', 'Prog carries', 'Fwd passes', 'Fwd pass%', 'Key passes', 'Prog passes', 'Carrying'],
  CB: ['Aerial%', 'Tackles', 'Interceptions', 'Blocks', 'Prog passes', 'Long pass%', 'Clearances', 'Poss won'],
  ST: ['Goals', 'npxG', 'Shots/90', 'Conversion%', 'Aerial%', 'xA', 'Touches in box', 'Pressures'],
  Winger: ['Dribbles', 'Key passes', 'xA', 'Crosses', 'Prog carries', 'SCA', 'Take-on%', 'Goal involvement'],
  FB: ['Tackles', 'Interceptions', 'Crosses', 'Prog passes', 'Prog carries', 'Key passes', 'Aerial%', 'Dribbled past'],
  GK: ['Save%', 'PSxG-GA', 'CS%', 'Launch%', 'Avg distance', 'Cross stop%', 'Sweeper actions', 'Pass completion%'],
};
```

### 2. InteractivePitch
SVG football pitch for shot maps, heatmaps, pass maps.
- StatsBomb 120x80 coordinate system
- Full pitch and attacking-half modes
- Shot overlay: circles sized by xG, colored by outcome (gold=goal, red=high xG, gray=low)
- Heatmap overlay: binned density grid with color gradient (cool blue -> hot red)
- Pass overlay: lines with arrows, thickness by frequency
- Hover tooltips with details
- Reference: `/Users/charlie/workspace/stat-school/src/components/InteractivePitch.tsx` (port to web SVG, no react-native-svg)

### 3. XGTrendChart
Season-long xG performance line chart.
- Cumulative xG line vs cumulative actual goals line
- Green shading when outperforming, red when underperforming
- Matchweek labels on x-axis
- Use Recharts (add as dependency) or custom SVG

### 4. StatTable
Use shadcn/ui `Table` component with:
- Per-90 stat values
- Percentile rank color coding (pitch-green gradient for high, red-card for low)
- Sort by any column
- Filter by position
- Stat category tabs using shadcn `Tabs`

### 5. PlayerCard
Compact card using shadcn `Card`:
- Player photo, name, team, position, age, nationality flag (use existing `flag-icon.tsx`)
- Mini radar chart (4-6 axes)
- 3 key stats for the position
- "Add to shortlist" and "Compare" actions via shadcn `Button`

### 6. ComparisonView
Full comparison layout:
- Overlaid RadarChart with percentile table above (exactly like the reference image)
- Stat-by-stat table with color-coded advantages
- Split-screen shot maps

---

## Database Schema Additions

Add these tables to the existing Supabase database. The app already has `profiles`, `daily_puzzles`, etc. -- these are NEW tables for ScoutLab.

```sql
-- Player season stats (FBref data -- one row per player per season per stat category)
create table player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_qid text not null,          -- Links to existing player graph via Wikidata QID
  player_name text not null,
  team_name text,
  season text not null,
  league text not null,
  position text,                      -- GK, CB, FB, CM, CDM, AM, W, ST
  position_group text,                -- Goalkeeper, Defender, Midfielder, Forward
  stat_category text not null,        -- standard, shooting, passing, defense, etc.
  stats jsonb not null,               -- Raw stats as key-value pairs
  per_90_stats jsonb,                 -- Per-90 normalized
  percentile_stats jsonb,             -- Percentile ranks vs same position in same league
  minutes_played int,
  matches_played int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(player_qid, season, league, stat_category)
);

-- Shot-level data (StatsBomb/Understat)
create table player_shots (
  id uuid primary key default gen_random_uuid(),
  player_qid text not null,
  player_name text not null,
  match_id text,
  match_date date,
  opponent text,
  minute int,
  x float,                            -- StatsBomb coords (0-120)
  y float,                            -- StatsBomb coords (0-80)
  xg float,
  result text,                        -- goal, saved, blocked, off_target, post
  body_part text,
  situation text,
  season text,
  league text,
  created_at timestamptz default now()
);

-- Scouting shortlists
create table scouting_shortlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table scouting_shortlist_players (
  shortlist_id uuid references scouting_shortlists(id) on delete cascade,
  player_qid text not null,
  player_name text not null,
  notes text,
  added_at timestamptz default now(),
  primary key (shortlist_id, player_qid)
);

-- Indexes
create index idx_player_season_stats_qid on player_season_stats(player_qid);
create index idx_player_season_stats_league on player_season_stats(league, season);
create index idx_player_shots_qid on player_shots(player_qid);
create index idx_scouting_shortlists_user on scouting_shortlists(user_id);
```

**Important:** The existing player graph uses Wikidata QIDs as the primary identifier. ScoutLab should use `player_qid` to link stats back to existing players. Use the `football-docs` MCP `resolve_entity` tool to cross-reference FBref/Understat IDs with Wikidata QIDs.

---

## Data Pipeline

Create scripts in `lib/data-pipeline/scoutlab/` (within the web app):

### FBref Scraper (`lib/data-pipeline/scoutlab/scrape-fbref.ts`)
- Use `soccerdata` Python lib or direct fetch to scrape FBref player stats
- Process all 11 stat categories for top 5 European leagues
- Compute per-90 stats
- Compute percentile ranks per position group per league
- Upsert into `player_season_stats` table

### Understat Scraper (`lib/data-pipeline/scoutlab/scrape-understat.ts`)
- Fetch shot-level xG data
- Transform coordinates from 0-1 to StatsBomb 120x80
- Insert into `player_shots` table

### StatsBomb Loader
Copy and extend the existing pipeline at `/Users/charlie/workspace/stat-school/scripts/data_pipeline/fetch_statsbomb.py`

### Cron Integration
Add new cron jobs to the existing cron system in `app/api/cron/`:
- `app/api/cron/scoutlab-sync/route.ts` -- Weekly FBref/Understat refresh

---

## Cross-Pollination with Football IQ Games

ScoutLab data can enrich existing Football IQ game modes:

1. **Higher/Lower game** -- "Which player has the higher xG per 90?" using `player_season_stats`
2. **Career Path** -- Enriched player cards showing key stats alongside career data
3. **The Grid** -- New grid categories based on stats ("Players with 5+ progressive passes per 90")
4. **Starting XI** -- Show formation heatmaps for correct answers
5. **New game mode: Shot Map Detective** -- "Guess the player from their shot map" using `player_shots`
6. **New game mode: Radar Reveal** -- Reveal radar axes one by one, guess the player

These are future enhancements -- focus on core ScoutLab features first.

---

## Implementation Phases

### Phase 1: Foundation + Player Profiles (Weeks 1-4)
1. Add ScoutLab nav section to sidebar (`components/layout/sidebar.tsx`)
2. Create database migrations for new tables (use Supabase dashboard or migration files)
3. Build `RadarChart` component in `components/scoutlab/radar-chart.tsx`
4. Build `InteractivePitch` component in `components/scoutlab/interactive-pitch.tsx` (port from StatSchool)
5. Set up Python data pipeline: FBref scraper -> percentile computation -> Supabase upsert
6. Build ScoutLab dashboard page (`app/(dashboard)/scoutlab/page.tsx`)
7. Build player profile page (`app/(dashboard)/scoutlab/player/[playerId]/page.tsx`) with radar, shot map, stat tables

### Phase 2: Teams + Comparison (Weeks 5-8)
1. League browser and standings pages
2. Team squad pages with PlayerCards
3. Player comparison page with overlaid radars (like the Rice vs Caicedo reference)
4. Advanced player search with stat threshold filters
5. Similar players algorithm (cosine similarity on normalized stat vectors)

### Phase 3: Scouting Workflow (Weeks 9-12)
1. Shortlists CRUD (create, add players with notes, share)
2. Auto-generated scout report page (strengths, weaknesses, radar, stats, similar players)
3. Export as image/PDF
4. xG trend charts for season performance tracking
5. Heatmap component for defensive/possession analysis

### Phase 4: Game Mode Enrichment (Weeks 13+)
1. New game modes powered by ScoutLab data (Shot Map Detective, Radar Reveal)
2. Enrich existing game modes with stat data
3. Public-facing ScoutLab pages (SEO)
4. Mobile app integration

---

## Reference Files from StatSchool

These existing components can be ported to web (remove react-native-svg, use browser SVG):
- `/Users/charlie/workspace/stat-school/src/components/InteractivePitch.tsx` -- Pitch with shot map overlay
- `/Users/charlie/workspace/stat-school/src/components/XGTimeline.tsx` -- xG accumulation chart
- `/Users/charlie/workspace/stat-school/src/types/lesson.ts` -- ShotData, PassData, PositionData types
- `/Users/charlie/workspace/stat-school/scripts/data_pipeline/fetch_statsbomb.py` -- StatsBomb data fetcher
- `/Users/charlie/workspace/stat-school/docs/DATA_SOURCES.md` -- Full data source documentation
