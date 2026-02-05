-- =============================================================================
-- Migration: 026_atomic_player_achievements
-- Description: Atomic replace function for player achievements to prevent
--              data loss if insert fails after delete.
-- Date: 2026-02-05
-- =============================================================================

-- =============================================================================
-- replace_player_achievements: Atomic delete + insert in a single transaction
-- =============================================================================

CREATE OR REPLACE FUNCTION replace_player_achievements(
  p_player_id TEXT,
  p_achievements JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement JSONB;
  inserted_count INTEGER := 0;
BEGIN
  -- Validate player_id format
  IF p_player_id !~ '^Q\d+$' THEN
    RAISE EXCEPTION 'Invalid player_id format: %', p_player_id;
  END IF;

  -- Delete existing achievements for this player
  DELETE FROM player_achievements
  WHERE player_id = p_player_id;

  -- Insert new achievements if any provided
  IF p_achievements IS NOT NULL AND jsonb_array_length(p_achievements) > 0 THEN
    FOR achievement IN SELECT * FROM jsonb_array_elements(p_achievements)
    LOOP
      INSERT INTO player_achievements (
        player_id,
        achievement_id,
        year,
        club_id
      ) VALUES (
        p_player_id,
        achievement->>'achievement_id',
        (achievement->>'year')::INTEGER,
        achievement->>'club_id'
      )
      ON CONFLICT (player_id, achievement_id, year) DO NOTHING;

      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'player_id', p_player_id,
    'count', inserted_count
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    RAISE;
END;
$$;

COMMENT ON FUNCTION replace_player_achievements IS
  'Atomically replaces all achievements for a player. Deletes existing and inserts new '
  'within a single transaction to prevent data loss if insert fails.';

-- Grant execute permission to authenticated and service role
GRANT EXECUTE ON FUNCTION replace_player_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION replace_player_achievements TO service_role;
