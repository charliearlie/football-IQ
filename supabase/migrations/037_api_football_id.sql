-- Migration: 037_api_football_id
-- Description: Add API-Football v3 external player ID mapping column
-- Backwards compatible: nullable column, no default, no table rewrite

ALTER TABLE players ADD COLUMN api_football_id INTEGER;

CREATE UNIQUE INDEX idx_players_api_football_id
  ON players (api_football_id) WHERE api_football_id IS NOT NULL;

COMMENT ON COLUMN players.api_football_id IS
  'API-Football v3 player ID (https://v3.football.api-sports.io). Nullable; populated via batch mapping pipeline.';
