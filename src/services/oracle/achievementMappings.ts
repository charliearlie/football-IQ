/**
 * Curated Wikidata achievement mappings for the Trophy Cabinet.
 *
 * Maps Wikidata QIDs to standardized achievement names and categories.
 * Used to filter P166 (award received) and P1344 (participant in) results
 * from Wikidata SPARQL queries into the `achievements` and
 * `player_achievements` tables.
 *
 * Only whitelisted QIDs are accepted — this prevents junk data from
 * obscure awards flooding the player graph.
 */

export type AchievementCategory = 'Individual' | 'Club' | 'International';

export interface AchievementDefinition {
  name: string;
  category: AchievementCategory;
  /** Key used in the stats_cache JSONB column on the players table */
  statsCacheKey: string;
  /** Optional aliases for reverse lookup (e.g., "Champions League" for "UEFA Champions League") */
  aliases?: string[];
}

/**
 * Curated whitelist of football achievements.
 * Keys are Wikidata QIDs; values define display name, category, and stats_cache key.
 */
export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = {
  // ── Individual Awards ──────────────────────────────────────────────
  Q166177: {
    name: "Ballon d'Or",
    category: 'Individual',
    statsCacheKey: 'ballon_dor_count',
  },
  Q324867: {
    name: 'FIFA World Cup Golden Boot',
    category: 'Individual',
    statsCacheKey: 'wc_golden_boot_count',
  },
  Q201171: {
    name: 'FIFA World Cup Golden Ball',
    category: 'Individual',
    statsCacheKey: 'wc_golden_ball_count',
  },
  Q731002: {
    name: 'European Golden Shoe',
    category: 'Individual',
    statsCacheKey: 'european_golden_shoe_count',
  },
  Q739698: {
    name: 'FIFA World Player of the Year',
    category: 'Individual',
    statsCacheKey: 'fifa_world_player_count',
  },
  Q55640043: {
    name: "The Best FIFA Men's Player",
    category: 'Individual',
    statsCacheKey: 'the_best_fifa_count',
  },
  Q180966: {
    name: "UEFA Men's Player of the Year",
    category: 'Individual',
    statsCacheKey: 'uefa_poty_count',
  },
  Q753297: {
    name: "PFA Players' Player of the Year",
    category: 'Individual',
    statsCacheKey: 'pfa_poty_count',
  },
  Q729027: {
    name: 'Premier League Golden Boot',
    category: 'Individual',
    statsCacheKey: 'pl_golden_boot_count',
  },
  Q1056498: {
    name: 'Pichichi Trophy',
    category: 'Individual',
    statsCacheKey: 'pichichi_count',
  },
  Q282131: {
    name: 'Capocannoniere',
    category: 'Individual',
    statsCacheKey: 'capocannoniere_count',
  },
  Q281498: {
    name: 'Torjägerkanone',
    category: 'Individual',
    statsCacheKey: 'torjaegerkanone_count',
  },
  Q381926: {
    name: 'UEFA Champions League Top Scorer',
    category: 'Individual',
    statsCacheKey: 'ucl_top_scorer_count',
  },
  Q57082987: {
    name: 'Kopa Trophy',
    category: 'Individual',
    statsCacheKey: 'kopa_trophy_count',
  },
  Q71081525: {
    name: 'Yashin Trophy',
    category: 'Individual',
    statsCacheKey: 'yashin_trophy_count',
  },
  Q113543997: {
    name: 'Gerd Müller Trophy',
    category: 'Individual',
    statsCacheKey: 'gerd_muller_trophy_count',
  },
  Q1534839: {
    name: 'Golden Boy',
    category: 'Individual',
    statsCacheKey: 'golden_boy_count',
  },

  // ── Club Competitions ──────────────────────────────────────────────
  Q18756: {
    name: 'UEFA Champions League',
    category: 'Club',
    statsCacheKey: 'ucl_titles',
    aliases: ['Champions League', 'UCL'],
  },
  Q19570: {
    name: 'UEFA Europa League',
    category: 'Club',
    statsCacheKey: 'europa_league_titles',
    aliases: ['Europa League', 'UEL'],
  },
  Q9448: {
    name: 'Premier League',
    category: 'Club',
    statsCacheKey: 'premier_league_titles',
  },
  Q82595: {
    name: 'La Liga',
    category: 'Club',
    statsCacheKey: 'la_liga_titles',
  },
  Q35572: {
    name: 'Serie A',
    category: 'Club',
    statsCacheKey: 'serie_a_titles',
  },
  Q36362: {
    name: 'Bundesliga',
    category: 'Club',
    statsCacheKey: 'bundesliga_titles',
  },
  Q13394: {
    name: 'Ligue 1',
    category: 'Club',
    statsCacheKey: 'ligue_1_titles',
  },
  Q1532919: {
    name: 'Eredivisie',
    category: 'Club',
    statsCacheKey: 'eredivisie_titles',
  },
  Q140112: {
    name: 'Primeira Liga',
    category: 'Club',
    statsCacheKey: 'primeira_liga_titles',
  },
  Q155223: {
    name: 'FA Cup',
    category: 'Club',
    statsCacheKey: 'fa_cup_titles',
  },
  Q181944: {
    name: 'Copa del Rey',
    category: 'Club',
    statsCacheKey: 'copa_del_rey_titles',
  },
  Q47258: {
    name: 'DFB-Pokal',
    category: 'Club',
    statsCacheKey: 'dfb_pokal_titles',
  },
  Q186893: {
    name: 'Coppa Italia',
    category: 'Club',
    statsCacheKey: 'coppa_italia_titles',
  },
  Q192564: {
    name: 'Coupe de France',
    category: 'Club',
    statsCacheKey: 'coupe_de_france_titles',
  },
  Q272478: {
    name: 'EFL Cup',
    category: 'Club',
    statsCacheKey: 'efl_cup_titles',
    aliases: ['League Cup', 'Carabao Cup', 'Capital One Cup'],
  },
  Q899515: {
    name: 'FIFA Club World Cup',
    category: 'Club',
    statsCacheKey: 'club_world_cup_titles',
  },
  Q669471: {
    name: 'UEFA Super Cup',
    category: 'Club',
    statsCacheKey: 'uefa_super_cup_titles',
  },
  Q3455498: {
    name: 'Community Shield',
    category: 'Club',
    statsCacheKey: 'community_shield_titles',
  },
  Q19894: {
    name: 'Scottish Premiership',
    category: 'Club',
    statsCacheKey: 'scottish_prem_titles',
  },
  Q838333: {
    name: 'Süper Lig',
    category: 'Club',
    statsCacheKey: 'super_lig_titles',
  },
  Q630104: {
    name: 'MLS Cup',
    category: 'Club',
    statsCacheKey: 'mls_cup_titles',
  },
  Q187453: {
    name: 'Copa Libertadores',
    category: 'Club',
    statsCacheKey: 'copa_libertadores_titles',
  },
  Q212629: {
    name: 'Brasileirão Serie A',
    category: 'Club',
    statsCacheKey: 'brasileirao_titles',
  },
  Q223170: {
    name: 'Argentine Primera División',
    category: 'Club',
    statsCacheKey: 'argentina_primera_titles',
  },
  Q215160: {
    name: 'Belgian Pro League',
    category: 'Club',
    statsCacheKey: 'belgian_pro_league_titles',
  },

  // ── International Competitions ─────────────────────────────────────
  Q19317: {
    name: 'FIFA World Cup',
    category: 'International',
    statsCacheKey: 'world_cup_titles',
    aliases: ['World Cup'],
  },
  Q18278: {
    name: 'UEFA European Championship',
    category: 'International',
    statsCacheKey: 'euros_titles',
    aliases: ['European Championship', 'Euros', 'Euro'],
  },
  Q48413: {
    name: 'Copa América',
    category: 'International',
    statsCacheKey: 'copa_america_titles',
  },
  Q132387: {
    name: 'Africa Cup of Nations',
    category: 'International',
    statsCacheKey: 'afcon_titles',
  },
  Q170444: {
    name: 'AFC Asian Cup',
    category: 'International',
    statsCacheKey: 'asian_cup_titles',
  },
  Q215946: {
    name: 'CONCACAF Gold Cup',
    category: 'International',
    statsCacheKey: 'gold_cup_titles',
  },
  Q870911: {
    name: 'UEFA Nations League',
    category: 'International',
    statsCacheKey: 'nations_league_titles',
    aliases: ['Nations League'],
  },
  Q151460: {
    name: 'FIFA Confederations Cup',
    category: 'International',
    statsCacheKey: 'confederations_cup_titles',
  },
  Q23810: {
    name: 'Olympic Games Football',
    category: 'International',
    statsCacheKey: 'olympic_titles',
  },
  Q218688: {
    name: 'FIFA U-20 World Cup',
    category: 'International',
    statsCacheKey: 'u20_world_cup_titles',
  },
};

/**
 * Normalize a string for consistent lookups: trim, collapse whitespace, lowercase.
 */
function normalizeString(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Pre-computed reverse lookup map from normalized names/aliases to statsCacheKey.
 * Built once at module init for O(1) lookups.
 */
const NAME_TO_STATS_KEY: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const def of Object.values(ACHIEVEMENT_MAP)) {
    // Add canonical name
    map.set(normalizeString(def.name), def.statsCacheKey);
    // Add all aliases
    if (def.aliases) {
      for (const alias of def.aliases) {
        map.set(normalizeString(alias), def.statsCacheKey);
      }
    }
  }
  return map;
})();

/**
 * Get an achievement definition by QID, or null if not in the whitelist.
 */
export function getAchievement(qid: string): AchievementDefinition | null {
  return ACHIEVEMENT_MAP[qid] ?? null;
}

/**
 * Check if a Wikidata QID is in our curated achievement whitelist.
 */
export function isKnownAchievement(qid: string): boolean {
  return qid in ACHIEVEMENT_MAP;
}

/**
 * Get all achievement QIDs for a given category.
 */
export function getAchievementsByCategory(
  category: AchievementCategory
): Array<{ qid: string } & AchievementDefinition> {
  return Object.entries(ACHIEVEMENT_MAP)
    .filter(([, def]) => def.category === category)
    .map(([qid, def]) => ({ qid, ...def }));
}

/**
 * Reverse lookup: find the stats_cache key for a given human-readable name.
 * Used by Grid validation to map category values like "Champions League"
 * to stats_cache keys like "ucl_titles".
 *
 * Normalizes input (trim, collapse whitespace, lowercase) and checks against
 * both canonical names and aliases for fuzzy matching.
 */
export function getStatsCacheKeyByName(
  achievementName: string
): string | null {
  const normalized = normalizeString(achievementName);
  return NAME_TO_STATS_KEY.get(normalized) ?? null;
}
