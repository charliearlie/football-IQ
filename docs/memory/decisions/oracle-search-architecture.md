# Oracle Search Architecture (Wikidata Player Graph)

**Date:** 2026-01-28
**Status:** Implemented
**Feature:** Wikidata-based player graph + hybrid autocomplete for Career Path

## Overview

The Oracle Search system adds a Wikidata-backed knowledge graph to Football IQ, enabling:

1. **Structured player identity** via Wikidata QIDs (e.g., Q11571 = Cristiano Ronaldo)
2. **Zero-spoiler autocomplete** for Career Path (shows flag, position, birth year — never clubs)
3. **Hybrid search** combining instant local SQLite results with debounced Supabase Oracle fallback
4. **Admin scouting tool** in the Next.js web app to batch-resolve players via SPARQL

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Admin (Next.js Web App: /player-scout)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SPARQL → Wikidata Query Service                      │  │
│  │  Batch: 50 names per query, 1.5s delay (rate limit)   │  │
│  │  Phase 1: Resolve players (QID, birth, position, etc) │  │
│  │  Phase 2: Fetch career clubs (P54 property)           │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Supabase (Admin Client, bypasses RLS)                │  │
│  │  Upsert → players, clubs, player_appearances tables   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL                                        │
│  ┌───────────────┐ ┌──────────┐ ┌──────────────────────┐   │
│  │ players       │ │ clubs    │ │ player_appearances   │   │
│  │ (QID PK)      │ │ (QID PK) │ │ (player→club FK)     │   │
│  └───────┬───────┘ └──────────┘ └──────────────────────┘   │
│          │ RPC: search_players_oracle(query, limit)         │
│          │ RPC: validate_player_club(player_qid, club_qid)  │
└──────────┼──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Mobile App (React Native)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  HybridSearchEngine (waterfall)                       │  │
│  │  1. SQLite player_search_cache (instant)              │  │
│  │  2. If <5 results: debounced (300ms) Oracle RPC       │  │
│  │  3. Cache Oracle results to SQLite                    │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      ▼                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PlayerAutocomplete → ActionZone → CareerPathScreen   │  │
│  │  Display: [Flag] Name (Position, b. Year)             │  │
│  │  Zero-spoiler: no club data shown                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Decisions

### Wikidata QIDs as Primary Keys
- Every player and club is identified by their Wikidata QID (e.g., Q11571)
- Provides a universal, stable identity across data sources
- Enables exact-match scoring when user selects from autocomplete

### SPARQL Runs in Admin Tool Only
- Follows the CMS pattern (like `content-creator.html`)
- Mobile client never calls Wikidata directly
- Admin tool batch-resolves via Next.js server actions
- Aligns with existing Content Oracle architecture

### Zero-Spoiler Design
- Autocomplete shows: flag emoji, name, position category, birth year
- Never shows clubs (would spoil Career Path answers)
- Position categories: Forward, Midfielder, Defender, Goalkeeper

### Backward-Compatible Scoring
- If puzzle has `answer_qid`: QID exact match for dropdown selections
- Otherwise: fuzzy name matching via existing `validateGuess()` utility
- Text-only submissions always use fuzzy matching

### Scout Rank (Sitelinks Count)
- Wikidata sitelinks count used as popularity proxy
- Higher sitelinks = more well-known player
- Used for search result ranking

## Database

### Supabase Tables (Migration 019)
| Table | PK | Purpose |
|-------|-------|---------|
| `players` | QID (text) | Player identity + metadata |
| `clubs` | QID (text) | Club identity |
| `player_appearances` | bigserial | Player ↔ Club junction with years |

### SQLite Table (Migration v7)
| Table | Purpose |
|-------|---------|
| `player_search_cache` | Local cache of Oracle search results |

### RPC Functions
- `search_players_oracle(query_text, match_limit)` — prefix/contains search with relevance scoring
- `validate_player_club(player_qid, club_qid)` — boolean check on player_appearances

## Files

| Path | Purpose |
|------|---------|
| `src/services/oracle/types.ts` | OraclePlayer, UnifiedPlayer types |
| `src/services/oracle/dataMappings.ts` | Position/nation mapping, SPARQL parsing |
| `src/services/oracle/sparqlQueries.ts` | SPARQL query builders |
| `src/services/oracle/WikidataService.ts` | Supabase RPC wrapper |
| `src/services/player/HybridSearchEngine.ts` | Local-first waterfall search |
| `src/features/career-path/components/PlayerAutocomplete.tsx` | Autocomplete UI |
| `src/features/career-path/components/ActionZone.tsx` | Updated to use PlayerAutocomplete |
| `src/features/career-path/hooks/useCareerPathGame.ts` | QID scoring + text fallback |
| `supabase/migrations/019_player_graph.sql` | Supabase schema |
| `web/app/(dashboard)/player-scout/` | Admin scouting tool (Next.js) |

## Testing

All TDD tests written before implementation:
- `src/services/oracle/__tests__/dataMappings.test.ts` — 55 tests
- `src/services/oracle/__tests__/sparqlQueries.test.ts` — 7 tests
- `src/services/oracle/__tests__/WikidataService.test.ts` — 9 tests
- `src/services/player/__tests__/HybridSearchEngine.test.ts` — 9 tests
- `src/features/career-path/__tests__/PlayerAutocomplete.test.tsx` — 9 tests
