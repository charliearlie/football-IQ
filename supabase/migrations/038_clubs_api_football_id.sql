-- Migration: 038_clubs_api_football_id
-- Description: Add API-Football v3 external club ID mapping column
-- Backwards compatible: nullable column, no default, no table rewrite
-- Populated by career validation pipeline (bootstrapped from player career data)

ALTER TABLE clubs ADD COLUMN api_football_id INTEGER;

CREATE UNIQUE INDEX idx_clubs_api_football_id
  ON clubs (api_football_id) WHERE api_football_id IS NOT NULL;

COMMENT ON COLUMN clubs.api_football_id IS
  'API-Football v3 team ID (https://v3.football.api-sports.io). Nullable; populated via career validation pipeline bootstrapping from player career data.';
