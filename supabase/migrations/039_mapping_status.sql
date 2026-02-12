-- Migration: 039_mapping_status
-- Description: Track API-Football mapping pipeline status so flagged/skipped
-- players aren't re-processed on every run.
-- Values: NULL = not yet processed, 'flagged', 'skipped', 'not_found'

ALTER TABLE players ADD COLUMN mapping_status TEXT;

CREATE INDEX idx_players_mapping_status
  ON players (mapping_status) WHERE mapping_status IS NOT NULL;

COMMENT ON COLUMN players.mapping_status IS
  'API-Football mapping pipeline status. NULL = unprocessed, flagged/skipped/not_found = processed but no match saved.';
