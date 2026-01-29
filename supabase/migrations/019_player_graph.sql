-- =============================================================================
-- Migration: 019_player_graph
-- Description: Wikidata-based player knowledge graph for autocomplete
-- Zero-spoiler design: Only nationality, birth_year, position_category visible
-- Clubs stored in junction table to prevent spoilers in autocomplete
-- Date: 2026-01-28
-- =============================================================================

-- STEP 1: Players table (Wikidata entities)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,                    -- Wikidata QID (e.g., "Q11571")
  name TEXT NOT NULL,                     -- Display name
  search_name TEXT NOT NULL,              -- Normalized for search (lowercase, no accents)
  scout_rank INTEGER NOT NULL DEFAULT 0,  -- Sitelinks count (popularity proxy)
  birth_year INTEGER,                     -- Year only (zero-spoiler)
  position_category TEXT,                 -- Forward/Midfielder/Defender/Goalkeeper
  nationality_code TEXT,                  -- ISO 3166-1 alpha-2
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_search_name ON players (search_name);
CREATE INDEX IF NOT EXISTS idx_players_scout_rank ON players (scout_rank DESC);

COMMENT ON TABLE players IS
  'Wikidata player entities with zero-spoiler metadata for autocomplete. '
  'Clubs intentionally omitted to avoid spoiling Career Path answers.';

-- STEP 2: Clubs table (Wikidata entities)
CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,                    -- Wikidata QID (e.g., "Q8682")
  name TEXT NOT NULL,
  search_name TEXT NOT NULL,
  country_code TEXT,                      -- ISO 3166-1 alpha-2
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubs_search_name ON clubs (search_name);

-- STEP 3: Player appearances (career graph edges)
CREATE TABLE IF NOT EXISTS player_appearances (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  start_year INTEGER,
  end_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appearances_player ON player_appearances (player_id);
CREATE INDEX IF NOT EXISTS idx_appearances_club ON player_appearances (club_id);
CREATE INDEX IF NOT EXISTS idx_appearances_years ON player_appearances (start_year, end_year);

COMMENT ON TABLE player_appearances IS
  'Junction table for player-club relationships. '
  'Used for Career Path scoring, NOT shown in autocomplete.';

-- STEP 4: RLS Policies (read-only reference data)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_appearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read clubs" ON clubs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read appearances" ON player_appearances
  FOR SELECT USING (true);

-- STEP 5: Search RPC function
CREATE OR REPLACE FUNCTION search_players_oracle(
  query_text TEXT,
  match_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  scout_rank INTEGER,
  birth_year INTEGER,
  position_category TEXT,
  nationality_code TEXT,
  relevance_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  query_text := LOWER(TRIM(query_text));

  IF LENGTH(query_text) < 3 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.scout_rank,
    p.birth_year,
    p.position_category,
    p.nationality_code,
    CASE
      WHEN p.search_name LIKE query_text || '%' THEN 1.0::REAL
      WHEN p.search_name LIKE '%' || query_text || '%' THEN 0.8::REAL
      ELSE 0.5::REAL
    END AS relevance_score
  FROM players p
  WHERE p.search_name LIKE '%' || query_text || '%'
  ORDER BY
    relevance_score DESC,
    p.scout_rank DESC,
    p.name ASC
  LIMIT match_limit;
END;
$$;

COMMENT ON FUNCTION search_players_oracle IS
  'Search players by name with relevance scoring. '
  'Used as fallback when local SQLite cache has insufficient results.';

-- STEP 6: Validate player-club relationship RPC
CREATE OR REPLACE FUNCTION validate_player_club(
  player_qid TEXT,
  club_qid TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM player_appearances
    WHERE player_id = player_qid
      AND club_id = club_qid
  );
$$;

COMMENT ON FUNCTION validate_player_club IS
  'Check if a player played for a specific club (by QID). '
  'Used for Career Path scoring.';
