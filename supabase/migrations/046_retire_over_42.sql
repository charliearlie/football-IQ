-- Retire all players born 1984 or earlier (age 42+ in 2026)
-- No player in top 5 leagues is over 42, so this is safe.

-- 1. Close open appearances
UPDATE player_appearances
SET end_year = 2025
WHERE end_year IS NULL
  AND player_id IN (
    SELECT id FROM players WHERE birth_year <= 1984
  );

-- 2. Mark players as verified-retired
UPDATE players
SET verified_at = NOW(),
    verified_club = 'Retired',
    verified_league = 'Retired'
WHERE birth_year <= 1984
  AND verified_at IS NULL;
