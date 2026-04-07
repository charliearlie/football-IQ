# Player Data Enrichment — Handoff Prompt

Copy everything below this line and paste it as the prompt for a new Claude Code session.

---

## Context

Football IQ is a football trivia app. The player database has ~10K players sourced from Wikidata, but it has serious gaps:

1. **Missing players**: Many well-known current players aren't in the DB at all (e.g. Ruben Dias, Hugo Ekitike, Estevao, Bastoni, Barella, Calhanoglu). The top 5 European leagues should have ~500 players each but we're missing roughly half outside the Premier League.

2. **Wrong current clubs**: Wikidata is stale — many players show wrong clubs. We've been manually validating via `/admin/validate` (a Tinder-style swipe UI) but it's slow. About 492 of 2,302 eligible players have been verified so far.

3. **Coverage by league** (active players with open-ended appearances):
   - Premier League: 582 (good)
   - La Liga: 249 (should be ~500)
   - Serie A: 239 (should be ~500)
   - Bundesliga: 203 (should be ~500)
   - Ligue 1: 152 (should be ~500)

## What needs doing

### Priority 1: Discover and import missing players from the top 5 leagues

We built a `discoverMissingPlayers(leagueName)` server action in `web/app/(dashboard)/admin/actions.ts` that uses Wikidata SPARQL to find all active players in a league and import ones we're missing. It queries `fetchLeagueSquadPlayers(leagueQid)` from `web/lib/wikidata.ts`.

**Run this for each league**: "La Liga", "Serie A", "Bundesliga", "Ligue 1" (Premier League is already decent).

The league QIDs are in `web/lib/wikidata.ts` under `TOP_LEAGUE_QIDS`.

However — Wikidata is unreliable and may not return complete squads. If the SPARQL queries don't return enough players, an alternative approach is needed:
- Use web search to find current squad lists for top clubs
- Manually add missing players via the existing `resolvePlayerBatch` + `fetchPlayerCareer` + `saveCareerToSupabase` functions in `web/app/(dashboard)/player-scout/actions.ts`
- Or insert directly via `mcp__supabase__execute_sql`

Key missing players reported by the user (check if they exist, add if not, fix club if wrong):
- Ruben Dias (Man City)
- Hugo Ekitike (Frankfurt)
- Estevao (Palmeiras / joining Chelsea)
- Bastoni (Inter Milan)
- Barella (Inter Milan)
- Calhanoglu (Inter Milan)
- Rayan Cherki (currently shows Man City in our DB — this is correct, transferred from Lyon)
- Antoine Semenyo (shows Bournemouth — wrong, now at Manchester City)
- Many more Serie A, Bundesliga, Ligue 1 players

### Priority 2: Fix wrong clubs for existing players

The validator at `/admin/validate` serves players sorted by scout_rank DESC, but many important players have lower scout_ranks (30-40) and never get served. Consider:
- Running the API-Football verification for mapped players (3,009 have `api_football_id`)
- Or batch-fixing via SQL for the most obvious errors
- The Wikipedia extract on each validator card helps — it fetches the Wikipedia summary which usually says "plays for X"

### Key files

| File | Purpose |
|------|---------|
| `web/lib/wikidata.ts` | Shared SPARQL module: `fetchLeagueSquadPlayers`, `fetchPlayerCareer`, `savePlayersToSupabase`, `saveCareerToSupabase` |
| `web/app/(dashboard)/admin/actions.ts` | `discoverMissingPlayers(league)`, `refreshEliteCareers()`, `backfillClubLeagues()` |
| `web/app/(dashboard)/player-scout/actions.ts` | `resolvePlayerBatch`, `resolvePlayerFuzzy`, `fetchPlayerCareer`, `saveCareerToSupabase` |
| `web/app/(dashboard)/admin/validate/actions.ts` | Validator actions: `confirmPlayer`, `fixPlayerClub`, `markNoClub`, `deletePlayer` |
| `web/app/api/cron/player-refresh/route.ts` | Biweekly cron: API-Football verification + Wikidata career refresh |
| `web/lib/data-pipeline/map-external-ids.ts` | API-Football integration (3,009 players mapped) |

### Database schema

- `players`: id (Wikidata QID), name, scout_rank, birth_year, nationality_code, position_category, verified_at, verified_club, verified_league, api_football_id
- `clubs`: id (Wikidata QID), name, league, country_code
- `player_appearances`: player_id, club_id, start_year, end_year (NULL = current)
- `club_mismatches`: player_id, our_club_name, api_club_name (for detected discrepancies)

### Supabase MCP

You have access to `mcp__supabase__execute_sql` for direct database queries. Use it freely. For migrations use `mcp__supabase__apply_migration`.

### Approach for adding missing players via SQL

For players not in Wikidata or when SPARQL is too slow, you can add directly:

```sql
-- 1. Add the player
INSERT INTO players (id, name, search_name, scout_rank, birth_year, position_category, nationality_code)
VALUES ('Q_WIKIDATA_ID', 'Player Name', 'player name', 30, 1998, 'Defender', 'PT')
ON CONFLICT (id) DO NOTHING;

-- 2. Add the club if missing
INSERT INTO clubs (id, name, search_name, league, country_code)
VALUES ('Q_CLUB_ID', 'Club Name', 'club name', 'Premier League', 'GB')
ON CONFLICT (id) DO NOTHING;

-- 3. Add the current appearance
INSERT INTO player_appearances (player_id, club_id, start_year, end_year)
VALUES ('Q_PLAYER_ID', 'Q_CLUB_ID', 2023, NULL);
```

You can look up Wikidata QIDs by searching `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=PLAYER_NAME&language=en&type=item&limit=5&format=json`

### What NOT to do

- Don't rely solely on Wikidata for current club data — it's often months behind on transfers
- Don't delete or modify the validator UI code — the user is actively using it
- Don't touch mobile app code (src/, app/) — only web/ directory
