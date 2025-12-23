# Football IQ - Product Requirements Document

**Version:** 1.0  
**Last Updated:** December 2024  
**Author:** Charlie  
**Status:** Draft

---

## 1. Executive Summary

Football IQ is a daily football trivia app. Each day, players get a fresh challenge across multiple game modes—Career Path, Tic Tac Toe, Transfer Guess, Goalscorer Recall, and Topical Quiz. Like Wordle, each game mode has one puzzle per day with a shareable score.

The last 7 days are free to play. The full archive is a paid unlock—and because AI agents generate new content every night based on real matches, that archive grows more valuable over time.

---

## 2. Core Concept

### The Daily Model

- **One puzzle per game mode per day** - everyone plays the same challenge
- **Shareable scores** - Wordle-style grid/emoji results for social sharing
- **7-day free window** - missed yesterday? Catch up for free
- **Paid archive** - unlock the full history, which grows daily

### Why This Works

| Benefit           | Detail                                              |
| ----------------- | --------------------------------------------------- |
| Habit formation   | Same time, same ritual, daily                       |
| Social virality   | Shareable scores drive organic growth               |
| Fair monetisation | Free users get full experience, payers get depth    |
| Increasing value  | Archive grows every day, justifying price increases |

---

## 3. Game Modes

Each mode has its own daily puzzle and its own Wordle-style scoring system (exact scoring mechanics to be refined during development).

### 3.1 Career Path

**Concept:** Guess the footballer from career clues revealed one at a time.

**Daily Format:** One mystery player per day

**Gameplay:**

- 6 clues revealed sequentially
- Fewer clues = better score
- Final clue is obvious (safety net)

**Example Clues (Virgil van Dijk):**

1. Started career at Willem II
2. Played for Celtic in Scotland
3. Signed for Southampton in 2015
4. Became world's most expensive defender
5. Dutch national team captain
6. Wears #4 at Liverpool

**Score Display (TBD):** Something like ⬛⬛🟨🟩 showing which clue you got it on

---

### 3.2 Tic Tac Toe

**Concept:** 3x3 grid where rows and columns are categories. Name a player who fits both.

**Daily Format:** One grid per day (vs AI or async vs friend)

**Gameplay:**

- Row example: Manchester United, Liverpool, Arsenal
- Column example: English, French, Brazilian
- Pick a cell, name a valid player
- Standard tic-tac-toe win conditions
- Timer per turn

**Score Display (TBD):** Grid showing your picks, maybe rarity of answers chosen

---

### 3.3 Guess the Transfer

**Concept:** Given clubs, year, and fee—guess the player.

**Daily Format:** One transfer per day

**Gameplay:**

- Show: "[Club A] → [Club B], [Year], [Fee]"
- Player guesses who moved
- Hints available (costs points)

**Example:**

> Middlesbrough → Aston Villa, 2024, £8m
> Answer: Morgan Rogers

**Score Display (TBD):** Hints used, time taken

---

### 3.4 Guess the Goalscorers

**Concept:** Given a match result, name all the goalscorers.

**Daily Format:** One historic or recent match per day

**Gameplay:**

- Show: "Arsenal 4-2 Leicester, Premier League, Sep 2024"
- 60 seconds to name as many scorers as possible
- Partial credit for getting some

**Score Display (TBD):** X/Y scorers found, maybe time remaining

---

### 3.5 Topical Quiz

**Concept:** 10 multiple-choice questions on recent footballing events.

**Daily Format:** One quiz per day, themed around recent events

**Gameplay:**

- 10 questions, 4 options each
- Mix of difficulties
- Speed bonus available

**Score Display (TBD):** X/10 correct, streak indicator

---

## 4. Monetisation

### Free Tier

- All 5 game modes, one puzzle each per day
- Last 7 days accessible (catch-up window)
- Full shareable score functionality
- Basic stats and streaks

### Premium: Archive Unlock

- **One-time purchase** (or annual subscription TBD)
- Access to entire puzzle archive from launch
- Archive grows daily at no extra cost
- Price can increase over time as content grows
- Early adopters get best value

**Pricing Strategy:**
| Archive Size | Suggested Price |
|--------------|-----------------|
| Launch (100 puzzles) | £2.99 |
| 6 months (1,000 puzzles) | £4.99 |
| 1 year (2,000+ puzzles) | £7.99 |
| 2 years | £9.99+ |

_Grandfather existing purchasers—they keep access forever._

---

## 5. Technical Architecture

### 5.1 Stack Overview

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Mobile App    | React Native + Expo                      |
| Local Storage | Expo SQLite                              |
| Backend/DB    | Supabase (Postgres, Auth, Realtime)      |
| CMS           | Next.js                                  |
| AI Agents     | TBD (likely n8n or custom Node.js jobs)  |
| Hosting       | Vercel (CMS), Supabase (everything else) |

### 5.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                │
├──────────────────────────────┬──────────────────────────────────┤
│      React Native + Expo     │           Next.js CMS            │
│        (iOS & Android)       │        (Admin Dashboard)         │
│                              │                                  │
│   ┌────────────────────┐     │   - Review AI content            │
│   │   Expo SQLite      │     │   - Manual puzzle creation       │
│   │   (offline play)   │     │   - Schedule daily puzzles       │
│   └─────────┬──────────┘     │   - Analytics                    │
│             │ sync           │                                  │
└─────────────┼────────────────┴──────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          SUPABASE                                │
│                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│   │  Postgres  │  │    Auth    │  │  Realtime  │                │
│   │            │  │            │  │    Sync    │                │
│   └────────────┘  └────────────┘  └────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              ▲
              │ nightly batch
              │
┌─────────────────────────────────────────────────────────────────┐
│                      AI AGENT PIPELINE                           │
│                      (Runs Overnight)                            │
│                                                                  │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌────────┐ │
│   │ Aggregator│ ─▶ │  Curator  │ ─▶ │  Verifier │ ─▶ │Creator │ │
│   │   Agent   │    │   Agent   │    │   Agent   │    │ Agent  │ │
│   └───────────┘    └───────────┘    └───────────┘    └────────┘ │
│         │                                                  │     │
│         ▼                                                  ▼     │
│   External APIs                               Supabase Questions │
│   (results, stats)                                 (pending)     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Supabase Schema

```sql
-- Daily puzzles (one per game mode per day)
CREATE TABLE daily_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_mode TEXT NOT NULL,
  puzzle_date DATE NOT NULL,
  content JSONB NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'live', 'archived')),
  triggered_by TEXT, -- match_id or event reference
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(game_mode, puzzle_date)
);

-- Index for efficient date-based queries
CREATE INDEX idx_puzzles_date ON daily_puzzles(puzzle_date DESC);
CREATE INDEX idx_puzzles_mode_date ON daily_puzzles(game_mode, puzzle_date DESC);

-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  premium_purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User puzzle attempts (one attempt per user per puzzle)
CREATE TABLE puzzle_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES daily_puzzles(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  score_display TEXT, -- the shareable emoji/grid string
  metadata JSONB, -- clues_used, time_taken, answers given, etc.
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, puzzle_id)
);

-- User streaks per game mode
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_played_date DATE,

  UNIQUE(user_id, game_mode)
);

-- AI agent run logs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL,
  agent_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  puzzles_created INTEGER DEFAULT 0,
  logs JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Match data (populated by aggregator agent)
CREATE TABLE match_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE, -- from football API
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  competition TEXT,
  match_date DATE,
  goalscorers JSONB,
  notable_events JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Puzzles: anyone can read live puzzles within 7-day window OR if premium
CREATE POLICY "Read puzzles" ON daily_puzzles FOR SELECT USING (
  status = 'live' AND (
    puzzle_date >= CURRENT_DATE - INTERVAL '7 days'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_premium = true
    )
  )
);

-- Profiles: users can read all, update own
CREATE POLICY "Read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Attempts: users can read/write own
CREATE POLICY "Own attempts" ON puzzle_attempts
  FOR ALL USING (user_id = auth.uid());

-- Streaks: users can read/write own
CREATE POLICY "Own streaks" ON user_streaks
  FOR ALL USING (user_id = auth.uid());
```

### 5.4 Expo App - Local Database

For offline play, puzzles sync to local SQLite:

```sql
-- Synced puzzles (last 7 days minimum, full archive if premium)
CREATE TABLE puzzles (
  id TEXT PRIMARY KEY,
  game_mode TEXT NOT NULL,
  puzzle_date TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON string
  difficulty TEXT,
  synced_at TEXT
);

-- Local attempts (syncs back to Supabase when online)
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  puzzle_id TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  score INTEGER,
  score_display TEXT,
  metadata TEXT, -- JSON string
  started_at TEXT,
  completed_at TEXT,
  synced INTEGER DEFAULT 0
);

-- Sync queue for offline changes
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'insert', 'update'
  payload TEXT NOT NULL, -- JSON
  created_at TEXT,
  attempts INTEGER DEFAULT 0
);

-- App metadata
CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## 6. AI Agent System

### 6.1 Pipeline Overview

Four agents run sequentially each night:

| Agent          | Responsibility                                | Input            | Output                           |
| -------------- | --------------------------------------------- | ---------------- | -------------------------------- |
| **Aggregator** | Fetch yesterday's results, scorers, events    | Football APIs    | `match_data` table               |
| **Curator**    | Identify interesting content opportunities    | `match_data`     | Prioritised list of puzzle ideas |
| **Verifier**   | Fact-check and validate content               | Puzzle ideas     | Verified puzzle content          |
| **Creator**    | Generate final puzzle JSON for each game mode | Verified content | `daily_puzzles` (status: draft)  |

### 6.2 Agent Details

**Aggregator Agent**

- Runs: 03:00 UTC daily
- Sources: Football-Data API, ESPN, BBC Sport
- Collects: Match results, scorers, assists, cards, notable events
- Stores: Raw data in `match_data` table

**Curator Agent**

- Runs: After Aggregator completes
- Logic: Identifies standout performances, surprising results, milestone events
- Example triggers:
  - Hat-trick → Career Path puzzle for that player
  - Upset result → Goalscorer recall puzzle
  - Big transfer performing well → Transfer puzzle
- Output: Prioritised puzzle suggestions

**Verifier Agent**

- Runs: After Curator completes
- Checks: Player names, transfer facts, historical accuracy
- Sources: Wikipedia, Transfermarkt, official club sites
- Flags: Uncertain facts for human review

**Creator Agent**

- Runs: After Verifier completes
- Generates: Full puzzle JSON for each game mode
- Writes: To `daily_puzzles` with status 'draft'
- CMS: Human reviews and schedules for specific dates

### 6.3 Content Pipeline Flow

```
Yesterday's Matches
        │
        ▼
┌───────────────┐
│  Aggregator   │──▶ match_data table
└───────────────┘
        │
        ▼
┌───────────────┐
│   Curator     │──▶ "Morgan Rogers scored twice,
└───────────────┘     create Career Path for him"
        │
        ▼
┌───────────────┐
│   Verifier    │──▶ "Confirmed: Rogers from Man City
└───────────────┘     academy, via Boro, now Villa"
        │
        ▼
┌───────────────┐
│   Creator     │──▶ daily_puzzles (draft)
└───────────────┘
        │
        ▼
   CMS Review ──▶ daily_puzzles (scheduled)
        │
        ▼
   Goes live at midnight
```

---

## 7. Sync Strategy

### 7.1 Puzzle Sync (Supabase → Device)

**On App Open:**

1. Check last sync timestamp
2. Fetch puzzles updated since then (within access window)
3. Upsert to local SQLite
4. Update sync timestamp

**Access Window:**

- Free users: Last 7 days only
- Premium users: Full archive

### 7.2 Attempt Sync (Device → Supabase)

**On Puzzle Complete:**

1. Save to local SQLite immediately
2. Add to sync queue
3. If online, sync immediately
4. If offline, sync when connection restored

**Conflict Resolution:**

- Server wins for puzzle content
- Latest timestamp wins for attempts (shouldn't conflict as one attempt per user per puzzle)

---

## 8. Development Phases

### Phase 1: Foundation

- [ ] Expo app scaffold with navigation
- [ ] Supabase project setup (auth, database)
- [ ] Local SQLite schema
- [ ] Basic sync infrastructure
- [ ] One game mode fully working (Career Path recommended)

### Phase 2: All Game Modes

- [ ] Tic Tac Toe
- [ ] Guess the Transfer
- [ ] Guess the Goalscorers
- [ ] Topical Quiz
- [ ] Daily reset logic
- [ ] 7-day free window enforcement

### Phase 3: Scoring & Sharing

- [ ] Wordle-style score displays per mode
- [ ] Share to social/clipboard
- [ ] Streak tracking
- [ ] Basic stats screen

### Phase 4: Monetisation

- [ ] Premium flag in profiles
- [ ] In-app purchase integration
- [ ] Archive access gating
- [ ] Purchase restoration

### Phase 5: AI Agents

- [ ] Aggregator agent (match data collection)
- [ ] Curator agent (opportunity identification)
- [ ] Verifier agent (fact checking)
- [ ] Creator agent (puzzle generation)
- [ ] CMS review workflow

### Phase 6: CMS & Polish

- [ ] Next.js admin dashboard
- [ ] Manual puzzle creation
- [ ] AI content review/approval
- [ ] Analytics dashboard
- [ ] Push notifications for daily puzzle

---

## 9. Open Questions

To be decided during development:

1. **Scoring systems** - Exact Wordle-style format for each game mode
2. **Daily reset time** - Midnight UTC? Local time?
3. **Streak rules** - Does playing archive puzzles count? Grace period?
4. **Monetisation model** - One-time purchase vs subscription?
5. **Social features** - Friends, leaderboards, head-to-head?
6. **Agent hosting** - n8n, custom cron jobs, Supabase Edge Functions?
7. **Content moderation** - Auto-approve AI content or always human review?

---

## 10. Success Metrics

| Metric                 | Target (6 months)        |
| ---------------------- | ------------------------ |
| Daily Active Users     | 10,000                   |
| Day 7 Retention        | 25%                      |
| Premium Conversion     | 5% of DAU                |
| Average Session Length | 5+ minutes               |
| Puzzles Shared         | 20% of completions       |
| AI Content Accuracy    | 98%+ (post-verification) |

---

## Appendix A: Example Puzzle Content JSON

### Career Path

```json
{
  "answer": "Morgan Rogers",
  "clues": [
    { "order": 1, "text": "Came through Manchester City academy" },
    { "order": 2, "text": "Loan spells at Lincoln and Bournemouth" },
    { "order": 3, "text": "Signed permanently by Middlesbrough" },
    { "order": 4, "text": "English attacking midfielder" },
    { "order": 5, "text": "Joined Aston Villa in January 2024" },
    {
      "order": 6,
      "text": "Scored twice against Manchester United, December 2024"
    }
  ]
}
```

### Tic Tac Toe

```json
{
  "rows": ["Manchester United", "Liverpool", "Chelsea"],
  "columns": ["English", "French", "Spanish"],
  "valid_answers": {
    "0-0": ["Wayne Rooney", "Marcus Rashford", "David Beckham"],
    "0-1": ["Eric Cantona", "Paul Pogba", "Anthony Martial"],
    "0-2": ["Juan Mata", "Gerard Piqué"],
    "1-0": ["Steven Gerrard", "Michael Owen", "Robbie Fowler"],
    "1-1": ["N'Golo Kanté"],
    "1-2": ["Fernando Torres", "Xabi Alonso"],
    "2-0": ["Frank Lampard", "John Terry", "Ashley Cole"],
    "2-1": ["Olivier Giroud", "Florent Malouda"],
    "2-2": ["Diego Costa", "Cesc Fàbregas", "Fernando Torres"]
  }
}
```

### Guess the Transfer

```json
{
  "player": "Morgan Rogers",
  "from_club": "Middlesbrough",
  "to_club": "Aston Villa",
  "year": 2024,
  "fee": "£8m",
  "hints": [
    "English midfielder",
    "Came through Manchester City academy",
    "Was 21 at time of transfer"
  ]
}
```

### Guess the Goalscorers

```json
{
  "match": {
    "home_team": "Aston Villa",
    "away_team": "Manchester United",
    "home_score": 3,
    "away_score": 0,
    "competition": "Premier League",
    "date": "2024-12-22"
  },
  "goalscorers": [
    { "player": "Morgan Rogers", "team": "home", "minute": 23 },
    { "player": "Morgan Rogers", "team": "home", "minute": 67 },
    { "player": "Jhon Durán", "team": "home", "minute": 89 }
  ]
}
```

### Topical Quiz

```json
{
  "theme": "Weekend Roundup - Dec 22",
  "questions": [
    {
      "question": "Which manager saw his side lose 3-0 at Villa Park?",
      "options": ["Erik ten Hag", "Ruben Amorim", "Arne Slot", "Pep Guardiola"],
      "answer": "Ruben Amorim"
    },
    {
      "question": "Who scored twice for Aston Villa vs Manchester United?",
      "options": [
        "Ollie Watkins",
        "Morgan Rogers",
        "Leon Bailey",
        "Jhon Durán"
      ],
      "answer": "Morgan Rogers"
    }
  ]
}
```

---

_This is a living document. Update as decisions are made during development._
