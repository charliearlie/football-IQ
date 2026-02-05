-- =============================================================================
-- Migration: 022_achievements
-- Description: Trophy Cabinet — achievement schema, stats cache, and updated
--              delta sync RPC to include pre-calculated achievement totals.
-- Date: 2026-01-30
-- =============================================================================

-- =============================================================================
-- STEP 1: Achievements table (curated Wikidata awards & competitions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,                    -- Wikidata QID (e.g., "Q166177" for Ballon d'Or)
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Individual', 'Club', 'International')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements" ON achievements
  FOR SELECT USING (true);

COMMENT ON TABLE achievements IS
  'Curated football achievements mapped from Wikidata P166/P1344 properties.';

-- =============================================================================
-- STEP 2: Player ↔ Achievement join table
-- =============================================================================

CREATE TABLE IF NOT EXISTS player_achievements (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  year INTEGER,
  club_id TEXT REFERENCES clubs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, achievement_id, year)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_player
  ON player_achievements(player_id);

CREATE INDEX IF NOT EXISTS idx_player_achievements_achievement
  ON player_achievements(achievement_id);

ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read player_achievements" ON player_achievements
  FOR SELECT USING (true);

COMMENT ON TABLE player_achievements IS
  'Player ↔ Achievement edges with optional year and club context.';

-- =============================================================================
-- STEP 3: Seed curated achievements
-- =============================================================================

INSERT INTO achievements (id, name, category) VALUES
  -- Individual Awards
  ('Q166177',  'Ballon d''Or',                   'Individual'),
  ('Q324867',  'FIFA World Cup Golden Boot',     'Individual'),
  ('Q201171',  'FIFA World Cup Golden Ball',     'Individual'),
  ('Q731002',  'European Golden Shoe',           'Individual'),
  ('Q739698',  'FIFA World Player of the Year',  'Individual'),
  ('Q55640043','The Best FIFA Men''s Player',    'Individual'),
  ('Q180966',  'UEFA Men''s Player of the Year', 'Individual'),
  ('Q753297',  'PFA Players'' Player of the Year','Individual'),
  ('Q729027',  'Premier League Golden Boot',     'Individual'),
  ('Q1056498', 'Pichichi Trophy',                'Individual'),
  ('Q282131',  'Capocannoniere',                 'Individual'),
  ('Q281498',  'Torjägerkanone',                 'Individual'),
  ('Q381926',  'UEFA Champions League Top Scorer','Individual'),

  -- Club Competitions
  ('Q18756',   'UEFA Champions League',          'Club'),
  ('Q19570',   'UEFA Europa League',             'Club'),
  ('Q9448',    'Premier League',                 'Club'),
  ('Q82595',   'La Liga',                        'Club'),
  ('Q35572',   'Serie A',                        'Club'),
  ('Q36362',   'Bundesliga',                     'Club'),
  ('Q13394',   'Ligue 1',                        'Club'),
  ('Q1532919', 'Eredivisie',                     'Club'),
  ('Q140112',  'Primeira Liga',                  'Club'),
  ('Q155223',  'FA Cup',                         'Club'),
  ('Q181944',  'Copa del Rey',                   'Club'),
  ('Q47258',   'DFB-Pokal',                      'Club'),
  ('Q186893',  'Coppa Italia',                   'Club'),
  ('Q192564',  'Coupe de France',                'Club'),
  ('Q272478',  'EFL Cup',                        'Club'),
  ('Q899515',  'FIFA Club World Cup',            'Club'),
  ('Q669471',  'UEFA Super Cup',                 'Club'),
  ('Q3455498', 'Community Shield',               'Club'),
  ('Q19894',   'Scottish Premiership',           'Club'),
  ('Q838333',  'Süper Lig',                      'Club'),
  ('Q630104',  'MLS Cup',                        'Club'),

  -- International Competitions
  ('Q19317',   'FIFA World Cup',                 'International'),
  ('Q18278',   'UEFA European Championship',     'International'),
  ('Q48413',   'Copa América',                   'International'),
  ('Q132387',  'Africa Cup of Nations',          'International'),
  ('Q170444',  'AFC Asian Cup',                  'International'),
  ('Q215946',  'CONCACAF Gold Cup',              'International'),
  ('Q870911',  'UEFA Nations League',            'International'),
  ('Q151460',  'FIFA Confederations Cup',        'International'),
  ('Q23810',   'Olympic Games Football',         'International'),
  ('Q218688',  'FIFA U-20 World Cup',            'International')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 4: Add stats_cache JSONB column to players table
-- =============================================================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS stats_cache JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN players.stats_cache IS
  'Pre-calculated achievement totals (e.g., {"ballon_dor_count": 8, "ucl_titles": 4}). '
  'Updated when player_achievements change. Used for instant Grid validation on mobile.';

-- =============================================================================
-- STEP 5: RPC to calculate and persist stats_cache for a player
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_player_stats(target_player_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_object_agg(stats_key, cnt),
    '{}'::jsonb
  )
  INTO result
  FROM (
    SELECT
      CASE a.id
        -- Individual Awards
        WHEN 'Q166177'   THEN 'ballon_dor_count'
        WHEN 'Q324867'   THEN 'wc_golden_boot_count'
        WHEN 'Q201171'   THEN 'wc_golden_ball_count'
        WHEN 'Q731002'   THEN 'european_golden_shoe_count'
        WHEN 'Q739698'   THEN 'fifa_world_player_count'
        WHEN 'Q55640043' THEN 'the_best_fifa_count'
        WHEN 'Q180966'   THEN 'uefa_poty_count'
        WHEN 'Q753297'   THEN 'pfa_poty_count'
        WHEN 'Q729027'   THEN 'pl_golden_boot_count'
        WHEN 'Q1056498'  THEN 'pichichi_count'
        WHEN 'Q282131'   THEN 'capocannoniere_count'
        WHEN 'Q281498'   THEN 'torjaegerkanone_count'
        WHEN 'Q381926'   THEN 'ucl_top_scorer_count'
        -- Club Competitions
        WHEN 'Q18756'    THEN 'ucl_titles'
        WHEN 'Q19570'    THEN 'europa_league_titles'
        WHEN 'Q9448'     THEN 'premier_league_titles'
        WHEN 'Q82595'    THEN 'la_liga_titles'
        WHEN 'Q35572'    THEN 'serie_a_titles'
        WHEN 'Q36362'    THEN 'bundesliga_titles'
        WHEN 'Q13394'    THEN 'ligue_1_titles'
        WHEN 'Q1532919'  THEN 'eredivisie_titles'
        WHEN 'Q140112'   THEN 'primeira_liga_titles'
        WHEN 'Q155223'   THEN 'fa_cup_titles'
        WHEN 'Q181944'   THEN 'copa_del_rey_titles'
        WHEN 'Q47258'    THEN 'dfb_pokal_titles'
        WHEN 'Q186893'   THEN 'coppa_italia_titles'
        WHEN 'Q192564'   THEN 'coupe_de_france_titles'
        WHEN 'Q272478'   THEN 'efl_cup_titles'
        WHEN 'Q899515'   THEN 'club_world_cup_titles'
        WHEN 'Q669471'   THEN 'uefa_super_cup_titles'
        WHEN 'Q3455498'  THEN 'community_shield_titles'
        WHEN 'Q19894'    THEN 'scottish_prem_titles'
        WHEN 'Q838333'   THEN 'super_lig_titles'
        WHEN 'Q630104'   THEN 'mls_cup_titles'
        -- International Competitions
        WHEN 'Q19317'    THEN 'world_cup_titles'
        WHEN 'Q18278'    THEN 'euros_titles'
        WHEN 'Q48413'    THEN 'copa_america_titles'
        WHEN 'Q132387'   THEN 'afcon_titles'
        WHEN 'Q170444'   THEN 'asian_cup_titles'
        WHEN 'Q215946'   THEN 'gold_cup_titles'
        WHEN 'Q870911'   THEN 'nations_league_titles'
        WHEN 'Q151460'   THEN 'confederations_cup_titles'
        WHEN 'Q23810'    THEN 'olympic_titles'
        WHEN 'Q218688'   THEN 'u20_world_cup_titles'
        ELSE 'unknown_' || a.id
      END AS stats_key,
      COUNT(*)::INTEGER AS cnt
    FROM player_achievements pa
    JOIN achievements a ON a.id = pa.achievement_id
    WHERE pa.player_id = target_player_id
    GROUP BY a.id, a.name
  ) sub;

  -- Persist to players table
  UPDATE players
  SET stats_cache = result,
      updated_at = NOW()
  WHERE id = target_player_id;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION calculate_player_stats IS
  'Aggregates player_achievements into a flat JSONB of counts, persists to players.stats_cache.';

-- =============================================================================
-- STEP 6: Trigger to auto-recalculate stats_cache on achievement changes
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_player_stats_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_player_stats(OLD.player_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_player_stats(NEW.player_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_stats ON player_achievements;
CREATE TRIGGER trg_recalculate_stats
  AFTER INSERT OR UPDATE OR DELETE ON player_achievements
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_player_stats_trigger();

-- =============================================================================
-- STEP 7: Update get_elite_index_delta to include stats_cache
-- =============================================================================

CREATE OR REPLACE FUNCTION get_elite_index_delta(
  client_version INTEGER DEFAULT 0
)
RETURNS TABLE (
  server_version INTEGER,
  has_updates BOOLEAN,
  updated_players JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_version INTEGER;
BEGIN
  -- Get current server version
  SELECT (value->>'version')::INTEGER
  INTO current_version
  FROM app_config
  WHERE key = 'elite_index_version';

  -- Default to 1 if not found
  IF current_version IS NULL THEN
    current_version := 1;
  END IF;

  -- If client is up to date, return early
  IF client_version >= current_version THEN
    RETURN QUERY SELECT
      current_version,
      false,
      '[]'::jsonb;
    RETURN;
  END IF;

  -- Return all players as delta (full refresh for now)
  -- Future: filter by updated_at > last_sync_timestamp
  RETURN QUERY SELECT
    current_version,
    true,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'search_name', p.search_name,
          'scout_rank', p.scout_rank,
          'birth_year', p.birth_year,
          'position_category', p.position_category,
          'nationality_code', p.nationality_code,
          'stats_cache', p.stats_cache
        )
      ),
      '[]'::jsonb
    )
  FROM players p;
END;
$$;

COMMENT ON FUNCTION get_elite_index_delta IS
  'Returns Elite Index version and delta players for mobile sync. '
  'Includes stats_cache for achievement-based Grid validation. '
  'Returns all players when client version < server version.';
