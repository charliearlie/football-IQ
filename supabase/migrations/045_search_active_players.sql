-- Add active_only parameter to search_players_oracle
-- When TRUE, only returns players with a current club (end_year IS NULL in player_appearances)

-- Drop the old 2-param version to avoid ambiguity
DROP FUNCTION IF EXISTS search_players_oracle(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION search_players_oracle(
  query_text TEXT,
  match_limit INTEGER DEFAULT 10,
  active_only BOOLEAN DEFAULT FALSE
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
    AND (
      NOT active_only
      OR EXISTS (
        SELECT 1 FROM player_appearances pa
        WHERE pa.player_id = p.id AND pa.end_year IS NULL
      )
    )
  ORDER BY
    relevance_score DESC,
    p.scout_rank DESC,
    p.name ASC
  LIMIT match_limit;
END;
$$;

COMMENT ON FUNCTION search_players_oracle IS
  'Search players by name with relevance scoring. '
  'When active_only=true, only returns players with a current club.';
