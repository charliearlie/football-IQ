-- =============================================================================
-- Migration: 021_ensure_puzzle_answer_players
-- Description: Auto-insert career path puzzle answer players into players table
-- Date: 2026-01-29
-- =============================================================================

-- Trigger function: When a career_path puzzle is saved, ensure the answer player
-- exists in the players table for autocomplete discoverability.
CREATE OR REPLACE FUNCTION ensure_puzzle_answer_player()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  answer_name TEXT;
  answer_qid TEXT;
  search TEXT;
BEGIN
  -- Only process career path game modes
  IF NEW.game_mode NOT IN ('career_path', 'career_path_pro') THEN
    RETURN NEW;
  END IF;

  -- Extract answer from content JSONB
  answer_name := NEW.content->>'answer';
  answer_qid := NEW.content->>'answer_qid';

  -- Skip if no answer or empty
  IF answer_name IS NULL OR answer_name = '' THEN
    RETURN NEW;
  END IF;

  -- Build search_name (lowercase)
  search := lower(answer_name);

  -- Upsert into players table
  -- Use answer_qid if available, otherwise generate a deterministic ID
  INSERT INTO players (id, name, search_name, scout_rank)
  VALUES (
    COALESCE(NULLIF(answer_qid, ''), 'puzzle_' || md5(lower(answer_name))),
    answer_name,
    search,
    1  -- Minimal scout_rank; will be overwritten by proper Wikidata resolution
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    search_name = EXCLUDED.search_name,
    updated_at = NOW();

  -- Bump elite index version so mobile syncs the new player
  PERFORM bump_elite_index_version();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION ensure_puzzle_answer_player IS
  'Auto-inserts career path answer players into the players table for autocomplete. '
  'Fires on puzzle insert/update. Uses answer_qid when available, otherwise a deterministic hash ID.';

-- Trigger on daily_puzzles insert or content update
CREATE TRIGGER trg_ensure_puzzle_answer_player
  AFTER INSERT OR UPDATE OF content ON daily_puzzles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_puzzle_answer_player();
