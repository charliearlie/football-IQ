# Trophy Cabinet: Achievement Schema & Stats Cache

## Status
Accepted (2026-01-30)

## Context
The Grid game mode needs to validate player selections against achievement-based categories like "Champions League" (trophy) and "5+ Ballon d'Ors" (stat). Previously, these category types returned `false` — no validation was possible.

We needed:
1. A relational achievement system to store which players won which awards
2. A fast validation path that doesn't require graph queries on mobile
3. A way to populate achievement data from Wikidata

## Decision

### Curated Whitelist Approach
We use a curated whitelist of ~43 Wikidata QIDs mapped to standardized achievement names and `stats_cache` keys. Only whitelisted achievements are accepted from SPARQL queries (P166 award received, P1344 participant in). This prevents junk data from obscure awards.

### Pre-Calculated Stats Cache
Rather than querying `player_achievements` at validation time, we pre-calculate a flat JSONB object on `players.stats_cache`:
```json
{"ballon_dor_count": 8, "ucl_titles": 4, "world_cup_titles": 1}
```

This cache is:
- Recalculated automatically via a PostgreSQL trigger on `player_achievements` changes
- Synced to mobile via the existing `get_elite_index_delta` RPC
- Stored locally in SQLite `player_search_cache.stats_cache`
- Queried at validation time via `getPlayerStatsCache(playerId)`

### Seasonal Sync Scheduler
Replaced the hardcoded 7-day sync throttle with calendar-aware logic:
- **Weekly**: January (winter window), May-June (awards season), August (summer window)
- **Monthly**: All other months

### Zero-Spoiler Guarantee
Achievement data never appears in `UnifiedPlayer` or search autocomplete. The `stats_cache` is only accessed during Grid validation (after player selection), preserving the zero-spoiler design.

## Schema

### Supabase Tables
```
achievements (id TEXT PK, name, category, created_at)
player_achievements (id BIGSERIAL PK, player_id FK, achievement_id FK, year, club_id FK)
  UNIQUE(player_id, achievement_id, year)
players.stats_cache JSONB DEFAULT '{}'
```

### SQLite
```
player_search_cache.stats_cache TEXT DEFAULT '{}'
```

## Key Files
| File | Purpose |
|------|---------|
| `supabase/migrations/022_achievements.sql` | Tables, RLS, seed data, RPCs, trigger |
| `src/services/oracle/achievementMappings.ts` | Wikidata QID → achievement definition mapping |
| `src/features/the-grid/utils/achievementMapping.ts` | Grid category value → stats_cache key mapping |
| `src/features/the-grid/utils/validation.ts` | checkCategoryMatch() for trophy/stat types |
| `src/services/sync/SyncScheduler.ts` | Calendar-aware sync frequency |
| `src/services/player/SyncService.ts` | Delta sync including stats_cache |
| `src/lib/database.ts` | SQLite v10 migration, getPlayerStatsCache() |
| `web/app/(dashboard)/player-scout/actions.ts` | CMS achievement sync actions |
| `web/components/puzzle/forms/career-path-form.tsx` | "Sync Achievements" CMS button |

## Alternatives Considered

1. **Accept all Wikidata achievements**: Rejected — too much noise from obscure awards
2. **Query player_achievements at validation time**: Rejected — requires network call on mobile, defeats offline-first design
3. **Hardcoded sync interval**: Replaced — football calendar has natural high/low activity periods
