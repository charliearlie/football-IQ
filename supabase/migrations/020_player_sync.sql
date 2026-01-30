-- =============================================================================
-- Migration: 020_player_sync
-- Description: Enable delta sync for Elite Index (bundled player database)
-- Date: 2026-01-29
-- =============================================================================

-- STEP 1: App configuration table for versioning
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (public read, no public write)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_config" ON app_config
  FOR SELECT USING (true);

COMMENT ON TABLE app_config IS
  'Application-level configuration: Elite Index version, feature flags, etc.';

-- Seed initial Elite Index version
INSERT INTO app_config (key, value) VALUES
  ('elite_index_version', '{"version": 1, "last_updated": "2026-01-29T00:00:00Z"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- STEP 2: RPC to get Elite Index version and delta players
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
          'nationality_code', p.nationality_code
        )
      ),
      '[]'::jsonb
    )
  FROM players p;
END;
$$;

COMMENT ON FUNCTION get_elite_index_delta IS
  'Returns Elite Index version and delta players for mobile sync. '
  'Returns all players when client version < server version.';

-- STEP 3: Admin helper to bump Elite Index version
CREATE OR REPLACE FUNCTION bump_elite_index_version()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_version INTEGER;
BEGIN
  SELECT (value->>'version')::INTEGER + 1
  INTO new_version
  FROM app_config
  WHERE key = 'elite_index_version';

  UPDATE app_config
  SET value = jsonb_build_object(
    'version', new_version,
    'last_updated', NOW()
  ),
  updated_at = NOW()
  WHERE key = 'elite_index_version';

  RETURN new_version;
END;
$$;

COMMENT ON FUNCTION bump_elite_index_version IS
  'Increment Elite Index version after bulk player updates. Admin use only.';
