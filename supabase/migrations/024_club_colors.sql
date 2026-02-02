-- Migration 024: Club Colors
-- Adds primary_color and secondary_color to clubs table for Vector Shield rendering.
-- Seeds colors for ~20 major European clubs used in Grid categories.

-- Add color columns
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS secondary_color TEXT;

-- Seed major club colors (using search_name for reliable matching)
-- English clubs
UPDATE clubs SET primary_color = '#EF0107', secondary_color = '#FFFFFF' WHERE search_name LIKE '%arsenal%' AND search_name LIKE '%football%';
UPDATE clubs SET primary_color = '#034694', secondary_color = '#DBA111' WHERE search_name LIKE '%chelsea%' AND search_name LIKE '%football%';
UPDATE clubs SET primary_color = '#C8102E', secondary_color = '#FFFFFF' WHERE search_name LIKE '%liverpool%' AND search_name LIKE '%football%';
UPDATE clubs SET primary_color = '#6CABDD', secondary_color = '#FFFFFF' WHERE search_name LIKE '%manchester city%';
UPDATE clubs SET primary_color = '#DA291C', secondary_color = '#FBE122' WHERE search_name LIKE '%manchester united%';
UPDATE clubs SET primary_color = '#132257', secondary_color = '#FFFFFF' WHERE search_name LIKE '%tottenham%';
UPDATE clubs SET primary_color = '#241F20', secondary_color = '#99D6EA' WHERE search_name LIKE '%newcastle united%';

-- Spanish clubs
UPDATE clubs SET primary_color = '#A50044', secondary_color = '#004D98' WHERE search_name LIKE '%barcelona%' AND search_name NOT LIKE '%espanyol%';
UPDATE clubs SET primary_color = '#FEBE10', secondary_color = '#FFFFFF' WHERE search_name LIKE '%real madrid%';
UPDATE clubs SET primary_color = '#CB3524', secondary_color = '#FFFFFF' WHERE search_name LIKE '%atletico%madrid%';

-- German clubs
UPDATE clubs SET primary_color = '#DC052D', secondary_color = '#FFFFFF' WHERE search_name LIKE '%bayern%munich%';
UPDATE clubs SET primary_color = '#FDE100', secondary_color = '#000000' WHERE search_name LIKE '%borussia dortmund%';

-- Italian clubs
UPDATE clubs SET primary_color = '#000000', secondary_color = '#FFFFFF' WHERE search_name LIKE '%juventus%';
UPDATE clubs SET primary_color = '#009ADD', secondary_color = '#000000' WHERE search_name LIKE '%internazionale%';
UPDATE clubs SET primary_color = '#FB090B', secondary_color = '#000000' WHERE search_name LIKE '%milan%' AND search_name NOT LIKE '%inter%';

-- French clubs
UPDATE clubs SET primary_color = '#004170', secondary_color = '#DA291C' WHERE search_name LIKE '%paris saint%germain%';

-- Portuguese clubs
UPDATE clubs SET primary_color = '#003899', secondary_color = '#FFFFFF' WHERE search_name LIKE '%porto%' AND search_name NOT LIKE '%sporting%';
UPDATE clubs SET primary_color = '#FF0000', secondary_color = '#FFFFFF' WHERE search_name LIKE '%benfica%';

-- Dutch clubs
UPDATE clubs SET primary_color = '#D2122E', secondary_color = '#FFFFFF' WHERE search_name LIKE '%ajax%';

-- Italian (Roma)
UPDATE clubs SET primary_color = '#8E1F2F', secondary_color = '#F0BC42' WHERE search_name LIKE '%roma%' AND search_name NOT LIKE '%romania%';

-- ============================================================
-- RPC: Get club colors for mobile sync
-- ============================================================
CREATE OR REPLACE FUNCTION get_club_colors()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  primary_color TEXT,
  secondary_color TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.primary_color, c.secondary_color
  FROM clubs c
  WHERE c.primary_color IS NOT NULL
    AND c.secondary_color IS NOT NULL;
$$;

-- Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION get_club_colors() TO authenticated;
GRANT EXECUTE ON FUNCTION get_club_colors() TO anon;
