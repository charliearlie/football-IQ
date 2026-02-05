-- =============================================================================
-- Migration: 023_achievements_expansion
-- Description: Add 8 new achievements (Kopa Trophy, Yashin Trophy,
--              Gerd Müller Trophy, Golden Boy, Copa Libertadores,
--              Brasileirão Serie A, Argentine Primera, Belgian Pro League)
--              and update calculate_player_stats to include their stats keys.
-- Date: 2026-01-31
-- =============================================================================

-- =============================================================================
-- STEP 1: Seed new achievements
-- =============================================================================

INSERT INTO achievements (id, name, category) VALUES
  -- Individual Awards
  ('Q57082987',  'Kopa Trophy',                    'Individual'),
  ('Q71081525',  'Yashin Trophy',                   'Individual'),
  ('Q113543997', 'Gerd Müller Trophy',              'Individual'),
  ('Q1534839',   'Golden Boy',                      'Individual'),

  -- Club Competitions
  ('Q187453',    'Copa Libertadores',               'Club'),
  ('Q212629',    'Brasileirão Serie A',             'Club'),
  ('Q223170',    'Argentine Primera División',      'Club'),
  ('Q215160',    'Belgian Pro League',              'Club')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 2: Recreate calculate_player_stats with new WHEN clauses
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
        WHEN 'Q57082987' THEN 'kopa_trophy_count'
        WHEN 'Q71081525' THEN 'yashin_trophy_count'
        WHEN 'Q113543997' THEN 'gerd_muller_trophy_count'
        WHEN 'Q1534839'  THEN 'golden_boy_count'
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
        WHEN 'Q187453'   THEN 'copa_libertadores_titles'
        WHEN 'Q212629'   THEN 'brasileirao_titles'
        WHEN 'Q223170'   THEN 'argentina_primera_titles'
        WHEN 'Q215160'   THEN 'belgian_pro_league_titles'
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
