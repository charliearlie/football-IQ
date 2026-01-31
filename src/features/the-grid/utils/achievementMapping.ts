/**
 * Achievement Mapping for Grid Validation
 *
 * Maps human-readable Grid category values (e.g., "Champions League",
 * "5+ Ballon d'Ors") to stats_cache keys for instant numeric checks.
 *
 * This file bridges Grid puzzle content (category.value strings) with
 * the pre-calculated stats_cache JSONB on the players table.
 */

/**
 * Maps trophy category display names to stats_cache keys.
 * Used when category.type === 'trophy'.
 *
 * Example: A Grid cell with { type: 'trophy', value: 'Champions League' }
 * will check stats_cache.ucl_titles > 0 for the selected player.
 */
export const TROPHY_TO_STATS_KEY: Record<string, string> = {
  // Club Competitions
  'Champions League': 'ucl_titles',
  'UEFA Champions League': 'ucl_titles',
  'Europa League': 'europa_league_titles',
  'UEFA Europa League': 'europa_league_titles',
  'Premier League': 'premier_league_titles',
  'La Liga': 'la_liga_titles',
  'Serie A': 'serie_a_titles',
  Bundesliga: 'bundesliga_titles',
  'Ligue 1': 'ligue_1_titles',
  Eredivisie: 'eredivisie_titles',
  'Primeira Liga': 'primeira_liga_titles',
  'FA Cup': 'fa_cup_titles',
  'Copa del Rey': 'copa_del_rey_titles',
  'DFB-Pokal': 'dfb_pokal_titles',
  'Coppa Italia': 'coppa_italia_titles',
  'Coupe de France': 'coupe_de_france_titles',
  'EFL Cup': 'efl_cup_titles',
  'League Cup': 'efl_cup_titles',
  'Club World Cup': 'club_world_cup_titles',
  'FIFA Club World Cup': 'club_world_cup_titles',
  'UEFA Super Cup': 'uefa_super_cup_titles',
  'Community Shield': 'community_shield_titles',
  'Copa Libertadores': 'copa_libertadores_titles',
  'Libertadores': 'copa_libertadores_titles',
  'Brasileirão': 'brasileirao_titles',
  'Brasileirão Serie A': 'brasileirao_titles',
  'Brazilian Serie A': 'brasileirao_titles',
  'Argentine Primera División': 'argentina_primera_titles',
  'Argentine Primera': 'argentina_primera_titles',
  'Belgian Pro League': 'belgian_pro_league_titles',

  // International Competitions
  'World Cup': 'world_cup_titles',
  'FIFA World Cup': 'world_cup_titles',
  'World Cup Winner': 'world_cup_titles',
  Euros: 'euros_titles',
  'European Championship': 'euros_titles',
  'UEFA European Championship': 'euros_titles',
  'Copa América': 'copa_america_titles',
  'Copa America': 'copa_america_titles',
  'Africa Cup of Nations': 'afcon_titles',
  AFCON: 'afcon_titles',
  'AFC Asian Cup': 'asian_cup_titles',
  'Gold Cup': 'gold_cup_titles',
  'CONCACAF Gold Cup': 'gold_cup_titles',
  'Nations League': 'nations_league_titles',
  'UEFA Nations League': 'nations_league_titles',
  'Confederations Cup': 'confederations_cup_titles',
  'Olympic Games': 'olympic_titles',
  Olympics: 'olympic_titles',

  // Individual Awards (as trophies)
  "Ballon d'Or": 'ballon_dor_count',
  'Ballon d\'Or': 'ballon_dor_count',
  'Ballon dOr': 'ballon_dor_count',
  'European Golden Shoe': 'european_golden_shoe_count',
  'Golden Boot': 'wc_golden_boot_count',
  'World Cup Golden Boot': 'wc_golden_boot_count',
  'World Cup Golden Ball': 'wc_golden_ball_count',
  'Kopa Trophy': 'kopa_trophy_count',
  'Yashin Trophy': 'yashin_trophy_count',
  'Gerd Müller Trophy': 'gerd_muller_trophy_count',
  'Golden Boy': 'golden_boy_count',
};

/**
 * Regex to parse stat expressions like "5+ Ballon d'Ors" or "100+ Goals".
 * Group 1: threshold number
 * Group 2: stat name (rest of string after number and optional +)
 */
export const STAT_PATTERN = /^(\d+)\+?\s+(.+)$/;

/**
 * Maps stat name fragments to stats_cache keys.
 * Used to resolve the stat name from a parsed stat expression.
 *
 * Example: "5+ Ballon d'Ors" → threshold=5, name="Ballon d'Ors"
 * → normalized to "ballon d'ors" → matches to 'ballon_dor_count'
 */
const STAT_NAME_TO_KEY: Record<string, string> = {
  // Individual awards (plural forms)
  "ballon d'ors": 'ballon_dor_count',
  "ballon d'or": 'ballon_dor_count',
  'ballon dors': 'ballon_dor_count',
  'ballon dor': 'ballon_dor_count',

  // Club titles
  'champions league titles': 'ucl_titles',
  'ucl titles': 'ucl_titles',
  'premier league titles': 'premier_league_titles',
  'la liga titles': 'la_liga_titles',
  'serie a titles': 'serie_a_titles',
  'bundesliga titles': 'bundesliga_titles',
  'ligue 1 titles': 'ligue_1_titles',

  // International titles
  'world cup titles': 'world_cup_titles',
  'world cups': 'world_cup_titles',
  'european championships': 'euros_titles',
  'euros': 'euros_titles',

  // Generic
  'european golden shoes': 'european_golden_shoe_count',
  'golden boots': 'wc_golden_boot_count',
  'kopa trophies': 'kopa_trophy_count',
  'kopa trophy': 'kopa_trophy_count',
  'yashin trophies': 'yashin_trophy_count',
  'yashin trophy': 'yashin_trophy_count',
  'gerd müller trophies': 'gerd_muller_trophy_count',
  'gerd muller trophies': 'gerd_muller_trophy_count',
  'golden boys': 'golden_boy_count',
  'golden boy': 'golden_boy_count',
  'copa libertadores titles': 'copa_libertadores_titles',
};

/**
 * Check if a player's stats_cache satisfies a trophy category.
 * Returns true if the player has at least 1 of the specified trophy.
 *
 * @param categoryValue - Human-readable trophy name (e.g., "Champions League")
 * @param statsCache - Player's pre-calculated stats cache
 * @returns true if the player has won this trophy at least once
 */
export function checkTrophyMatch(
  categoryValue: string,
  statsCache: Record<string, number>
): boolean {
  const key = TROPHY_TO_STATS_KEY[categoryValue];
  if (!key) {
    console.warn(`[Grid] Unknown trophy category: "${categoryValue}"`);
    return false;
  }
  return (statsCache[key] ?? 0) > 0;
}

/**
 * Check if a player's stats_cache satisfies a stat category.
 * Parses expressions like "5+ Ballon d'Ors" and validates the threshold.
 *
 * @param categoryValue - Stat expression (e.g., "5+ Ballon d'Ors", "100+ Goals")
 * @param statsCache - Player's pre-calculated stats cache
 * @returns true if the player meets or exceeds the stat threshold
 */
export function checkStatMatch(
  categoryValue: string,
  statsCache: Record<string, number>
): boolean {
  const match = STAT_PATTERN.exec(categoryValue);
  if (!match) {
    console.warn(`[Grid] Could not parse stat expression: "${categoryValue}"`);
    return false;
  }

  const threshold = parseInt(match[1], 10);
  const statName = match[2].toLowerCase().trim();

  const key = STAT_NAME_TO_KEY[statName];
  if (!key) {
    console.warn(
      `[Grid] Unknown stat name: "${statName}" from expression "${categoryValue}"`
    );
    return false;
  }

  return (statsCache[key] ?? 0) >= threshold;
}
