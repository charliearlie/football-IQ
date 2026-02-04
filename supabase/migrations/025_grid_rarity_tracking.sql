-- Migration: 025_grid_rarity_tracking
-- Description: Track player selections for The Grid to enable rarity scoring
--
-- Tables: grid_cell_selections - stores every player selection per puzzle cell
-- RPCs:
--   - record_grid_selection: Fire-and-forget upsert (increments count)
--   - get_grid_cell_rarity: Returns rarity % for single cell+player
--   - get_grid_summary_rarity: Batch fetch for all 9 cells on completion
--   - get_grid_cell_stats: CMS function for rarity heatmap

-- =============================================================================
-- Table: grid_cell_selections
-- =============================================================================
-- Tracks every player selection per puzzle per cell for rarity calculations.
-- Uses upsert pattern: first selection creates row, subsequent increment count.

CREATE TABLE IF NOT EXISTS grid_cell_selections (
  id BIGSERIAL PRIMARY KEY,
  puzzle_id UUID NOT NULL REFERENCES daily_puzzles(id) ON DELETE CASCADE,
  cell_index SMALLINT NOT NULL CHECK (cell_index >= 0 AND cell_index <= 8),
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  nationality_code TEXT,
  selection_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite unique constraint for upsert pattern
  UNIQUE(puzzle_id, cell_index, player_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Fast lookup by puzzle + cell (for rarity calculation)
CREATE INDEX IF NOT EXISTS idx_grid_selections_puzzle_cell
  ON grid_cell_selections (puzzle_id, cell_index);

-- Fast lookup by puzzle (for CMS stats)
CREATE INDEX IF NOT EXISTS idx_grid_selections_puzzle
  ON grid_cell_selections (puzzle_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE grid_cell_selections ENABLE ROW LEVEL SECURITY;

-- Anyone can read selections (needed for rarity display)
CREATE POLICY "grid_selections_select_all"
  ON grid_cell_selections
  FOR SELECT
  USING (true);

-- Insert/update only via RPC (SECURITY DEFINER functions)
-- No direct insert policy - controlled by record_grid_selection RPC

-- =============================================================================
-- Function: record_grid_selection
-- =============================================================================
-- Fire-and-forget: Records a player selection for a grid cell.
-- Upserts: creates new row or increments selection_count.
-- Called after local validation succeeds, doesn't block UI.

CREATE OR REPLACE FUNCTION record_grid_selection(
  p_puzzle_id UUID,
  p_cell_index SMALLINT,
  p_player_id TEXT,
  p_player_name TEXT,
  p_nationality_code TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO grid_cell_selections (
    puzzle_id,
    cell_index,
    player_id,
    player_name,
    nationality_code,
    selection_count
  )
  VALUES (
    p_puzzle_id,
    p_cell_index,
    p_player_id,
    p_player_name,
    p_nationality_code,
    1
  )
  ON CONFLICT (puzzle_id, cell_index, player_id)
  DO UPDATE SET
    selection_count = grid_cell_selections.selection_count + 1,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION record_grid_selection(UUID, SMALLINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_grid_selection(UUID, SMALLINT, TEXT, TEXT, TEXT) TO anon;

-- =============================================================================
-- Function: get_grid_cell_rarity
-- =============================================================================
-- Returns rarity percentage for a specific player in a specific cell.
-- Called after correct guess to show rarity on Player Card.
-- Returns NULL if player not yet in stats (first selection = 100% unique).

CREATE OR REPLACE FUNCTION get_grid_cell_rarity(
  p_puzzle_id UUID,
  p_cell_index SMALLINT,
  p_player_id TEXT
)
RETURNS TABLE (
  rarity_pct NUMERIC,
  selection_count INTEGER,
  cell_total BIGINT,
  rank_in_cell INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cell_total BIGINT;
  v_player_count INTEGER;
  v_rank INTEGER;
BEGIN
  -- Get total selections for this cell
  SELECT COALESCE(SUM(gcs.selection_count), 0)
  INTO v_cell_total
  FROM grid_cell_selections gcs
  WHERE gcs.puzzle_id = p_puzzle_id
    AND gcs.cell_index = p_cell_index;

  -- If no selections yet, this is the first player (100% unique initially)
  IF v_cell_total = 0 THEN
    RETURN QUERY SELECT
      100.0::NUMERIC AS rarity_pct,
      1::INTEGER AS selection_count,
      1::BIGINT AS cell_total,
      1::INTEGER AS rank_in_cell;
    RETURN;
  END IF;

  -- Get this player's selection count
  SELECT gcs.selection_count
  INTO v_player_count
  FROM grid_cell_selections gcs
  WHERE gcs.puzzle_id = p_puzzle_id
    AND gcs.cell_index = p_cell_index
    AND gcs.player_id = p_player_id;

  -- If player not found, they're a new selection (will be 1 after record)
  IF v_player_count IS NULL THEN
    -- After their selection is recorded, they'll be 1/(total+1)
    RETURN QUERY SELECT
      ROUND((1.0 / (v_cell_total + 1)) * 100, 1)::NUMERIC AS rarity_pct,
      1::INTEGER AS selection_count,
      (v_cell_total + 1)::BIGINT AS cell_total,
      1::INTEGER AS rank_in_cell;
    RETURN;
  END IF;

  -- Calculate rank (how many players have more selections)
  SELECT COUNT(*)::INTEGER + 1
  INTO v_rank
  FROM grid_cell_selections gcs
  WHERE gcs.puzzle_id = p_puzzle_id
    AND gcs.cell_index = p_cell_index
    AND gcs.selection_count > v_player_count;

  -- Return the rarity data
  RETURN QUERY SELECT
    ROUND((v_player_count::NUMERIC / v_cell_total) * 100, 1) AS rarity_pct,
    v_player_count AS selection_count,
    v_cell_total AS cell_total,
    v_rank AS rank_in_cell;
END;
$$;

GRANT EXECUTE ON FUNCTION get_grid_cell_rarity(UUID, SMALLINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grid_cell_rarity(UUID, SMALLINT, TEXT) TO anon;

-- =============================================================================
-- Function: get_grid_summary_rarity
-- =============================================================================
-- Batch fetch rarity data for all filled cells in a completed grid.
-- Used by result modal to calculate Grid IQ score.
-- Accepts JSONB array of {cellIndex, playerId, playerName} objects.

CREATE OR REPLACE FUNCTION get_grid_summary_rarity(
  p_puzzle_id UUID,
  p_selections JSONB
)
RETURNS TABLE (
  cell_index SMALLINT,
  player_id TEXT,
  player_name TEXT,
  nationality_code TEXT,
  rarity_pct NUMERIC,
  selection_count INTEGER,
  cell_total BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_selections AS (
    SELECT
      (s->>'cellIndex')::SMALLINT AS cell_idx,
      s->>'playerId' AS player_qid,
      s->>'playerName' AS player_nm
    FROM jsonb_array_elements(p_selections) AS s
  ),
  cell_totals AS (
    SELECT
      gcs.cell_index AS cell_idx,
      SUM(gcs.selection_count) AS total
    FROM grid_cell_selections gcs
    WHERE gcs.puzzle_id = p_puzzle_id
    GROUP BY gcs.cell_index
  )
  SELECT
    us.cell_idx AS cell_index,
    us.player_qid AS player_id,
    us.player_nm AS player_name,
    gcs.nationality_code,
    CASE
      WHEN ct.total IS NULL OR ct.total = 0 THEN 100.0
      WHEN gcs.selection_count IS NULL THEN ROUND((1.0 / (ct.total + 1)) * 100, 1)
      ELSE ROUND((gcs.selection_count::NUMERIC / ct.total) * 100, 1)
    END AS rarity_pct,
    COALESCE(gcs.selection_count, 1)::INTEGER AS selection_count,
    COALESCE(ct.total, 1)::BIGINT AS cell_total
  FROM user_selections us
  LEFT JOIN grid_cell_selections gcs
    ON gcs.puzzle_id = p_puzzle_id
    AND gcs.cell_index = us.cell_idx
    AND gcs.player_id = us.player_qid
  LEFT JOIN cell_totals ct
    ON ct.cell_idx = us.cell_idx
  ORDER BY us.cell_idx;
END;
$$;

GRANT EXECUTE ON FUNCTION get_grid_summary_rarity(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grid_summary_rarity(UUID, JSONB) TO anon;

-- =============================================================================
-- Function: get_grid_cell_stats (CMS)
-- =============================================================================
-- Returns full rarity stats for all cells in a grid puzzle.
-- Used by CMS "Rap Sheet" to show which cells are too easy/hard.
-- Only callable by service role (no GRANT to authenticated/anon).

CREATE OR REPLACE FUNCTION get_grid_cell_stats(
  p_puzzle_id UUID
)
RETURNS TABLE (
  cell_index SMALLINT,
  total_selections BIGINT,
  unique_players BIGINT,
  top_player_id TEXT,
  top_player_name TEXT,
  top_player_count INTEGER,
  top_player_pct NUMERIC,
  avg_rarity NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cell_stats AS (
    SELECT
      gcs.cell_index,
      SUM(gcs.selection_count) AS total_selections,
      COUNT(*) AS unique_players
    FROM grid_cell_selections gcs
    WHERE gcs.puzzle_id = p_puzzle_id
    GROUP BY gcs.cell_index
  ),
  top_players AS (
    SELECT DISTINCT ON (gcs.cell_index)
      gcs.cell_index,
      gcs.player_id,
      gcs.player_name,
      gcs.selection_count
    FROM grid_cell_selections gcs
    WHERE gcs.puzzle_id = p_puzzle_id
    ORDER BY gcs.cell_index, gcs.selection_count DESC
  )
  SELECT
    cs.cell_index,
    cs.total_selections,
    cs.unique_players,
    tp.player_id AS top_player_id,
    tp.player_name AS top_player_name,
    tp.selection_count AS top_player_count,
    ROUND((tp.selection_count::NUMERIC / cs.total_selections) * 100, 1) AS top_player_pct,
    ROUND((100.0 / NULLIF(cs.unique_players, 0)), 1) AS avg_rarity
  FROM cell_stats cs
  LEFT JOIN top_players tp ON tp.cell_index = cs.cell_index
  ORDER BY cs.cell_index;
END;
$$;

-- Only service role can call this (CMS admin function)
-- No GRANT to authenticated/anon - this is intentional
