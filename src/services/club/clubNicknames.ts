/**
 * Club nickname mappings for fuzzy search.
 *
 * Maps Wikidata QIDs to common nicknames/aliases used by fans.
 * Used by ClubSearchEngine to match queries like "Spurs" → Tottenham.
 */

/**
 * Club ID → Nicknames mapping.
 * Key: Wikidata QID
 * Value: Array of common nicknames (lowercase for matching)
 */
export const CLUB_NICKNAME_MAP: Record<string, string[]> = {
  // England - Premier League
  'Q9617': ['gunners'],                                      // Arsenal F.C.
  'Q18602': ['united', 'red devils', 'man utd', 'man united'], // Manchester United
  'Q50602': ['city', 'citizens', 'sky blues', 'man city'],   // Manchester City
  'Q1130849': ['pool', 'reds'],                              // Liverpool F.C.
  'Q9616': ['blues'],                                        // Chelsea F.C.
  'Q18671': ['spurs', 'lilywhites'],                         // Tottenham Hotspur
  'Q18735': ['toon', 'magpies'],                             // Newcastle United
  'Q19209': ['villans', 'villa'],                            // Aston Villa
  'Q19633': ['hammers', 'irons'],                            // West Ham United
  'Q52702': ['toffees'],                                     // Everton F.C.

  // Spain - La Liga
  'Q7156': ['barca', 'blaugrana'],                           // FC Barcelona
  'Q8682': ['real', 'los blancos', 'los merengues'],         // Real Madrid
  'Q8701': ['atleti', 'colchoneros'],                        // Atletico Madrid
  'Q8806': ['txuri-urdin', 'la real'],                       // Real Sociedad
  'Q8851': ['submarino amarillo', 'villarreal'],             // Villarreal CF

  // Germany - Bundesliga
  'Q15789': ['bayern', 'fcb', 'die roten'],                  // FC Bayern Munich
  'Q11974': ['bvb', 'dortmund', 'die borussen'],             // Borussia Dortmund
  'Q1860': ['rb', 'die roten bullen'],                       // RB Leipzig
  'Q18515': ['gladbach', 'fohlen'],                          // Borussia Monchengladbach
  'Q23905': ['werkself'],                                    // Bayer Leverkusen

  // Italy - Serie A
  'Q3400': ['juve', 'old lady', 'bianconeri'],               // Juventus
  'Q631': ['inter', 'nerazzurri'],                           // Inter Milan
  'Q1543': ['milan', 'rossoneri', 'diavolo'],                // AC Milan
  'Q12309': ['giallorossi', 'lupi'],                         // AS Roma
  'Q3477': ['partenopei', 'azzurri'],                        // SSC Napoli

  // France - Ligue 1
  'Q583': ['psg', 'paris'],                                  // Paris Saint-Germain
  'Q256185': ['om', 'olympique'],                            // Olympique Marseille
  'Q30907': ['ol', 'gones'],                                 // Olympique Lyon
  'Q42932': ['asm', 'monaco'],                               // AS Monaco

  // Portugal
  'Q3432': ['porto', 'dragoes'],                             // FC Porto
  'Q3439': ['benfica', 'aguias', 'encarnados'],              // SL Benfica
  'Q18565': ['sporting', 'leoes'],                           // Sporting CP

  // Netherlands
  'Q5765': ['ajax', 'godenzonen'],                           // AFC Ajax
  'Q41088': ['psv'],                                         // PSV Eindhoven
  'Q208560': ['feyenoord'],                                  // Feyenoord

  // Scotland
  'Q18860': ['hoops', 'bhoys'],                              // Celtic F.C.
  'Q18703': ['gers', 'teddy bears'],                         // Rangers F.C.
};

/**
 * Reverse lookup: normalized nickname → club QID.
 * Used for efficient O(1) nickname matching during search.
 */
export const NICKNAME_TO_CLUB_ID: Map<string, string> = new Map(
  Object.entries(CLUB_NICKNAME_MAP).flatMap(([qid, nicknames]) =>
    nicknames.map((nick) => [nick.toLowerCase(), qid])
  )
);

/**
 * Get all nicknames for a club.
 * @param clubId - Wikidata QID
 * @returns Array of nicknames or empty array
 */
export function getClubNicknames(clubId: string): string[] {
  return CLUB_NICKNAME_MAP[clubId] ?? [];
}

/**
 * Find club ID by nickname.
 * @param nickname - Nickname to search (case-insensitive)
 * @returns Wikidata QID or undefined
 */
export function findClubByNickname(nickname: string): string | undefined {
  return NICKNAME_TO_CLUB_ID.get(nickname.toLowerCase());
}
