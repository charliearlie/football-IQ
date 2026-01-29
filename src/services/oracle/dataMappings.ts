/**
 * Data mapping utilities for the Oracle search system.
 *
 * Handles:
 * - Position category normalization (players.json codes + Wikidata labels)
 * - Nation name → ISO 3166-1 alpha-2 mapping
 * - Birth year extraction
 * - SPARQL response parsing
 */

import {
  PositionCategory,
  SPARQLResponse,
  WikidataPlayerData,
  WikidataCareerEntry,
} from './types';

// =============================================================================
// Position mapping
// =============================================================================

/** Maps players.json position codes and names to PositionCategory. */
const POSITION_MAP: Record<string, PositionCategory> = {
  att: 'Forward',
  attack: 'Forward',
  forward: 'Forward',
  fwd: 'Forward',
  striker: 'Forward',
  winger: 'Forward',
  def: 'Defender',
  defender: 'Defender',
  sweeper: 'Defender',
  'centre-back': 'Defender',
  'center-back': 'Defender',
  'full-back': 'Defender',
  'wing-back': 'Defender',
  mid: 'Midfielder',
  midfielder: 'Midfielder',
  midfield: 'Midfielder',
  gk: 'Goalkeeper',
  goalkeeper: 'Goalkeeper',
  keeper: 'Goalkeeper',
};

/**
 * Map a position code/name to a standard PositionCategory.
 * Handles players.json abbreviations (ATT, DEF, MID, GK) and full names.
 *
 * @param position - Position code or name (case-insensitive)
 * @returns PositionCategory or null if unrecognized
 */
export function mapPositionCategory(position: string): PositionCategory | null {
  if (!position) return null;
  return POSITION_MAP[position.toLowerCase()] ?? null;
}

/**
 * Categorize a Wikidata position label into a PositionCategory.
 * Wikidata labels are descriptive (e.g., "association football midfielder").
 *
 * @param label - Wikidata position label
 * @returns PositionCategory or null if unrecognized
 */
export function categorizeWikidataPosition(
  label: string
): PositionCategory | null {
  if (!label) return null;

  const lower = label.toLowerCase();

  if (lower.includes('goalkeeper') || lower.includes('keeper')) {
    return 'Goalkeeper';
  }
  if (
    lower.includes('defender') ||
    lower.includes('back') ||
    lower.includes('sweeper')
  ) {
    return 'Defender';
  }
  if (lower.includes('midfielder') || lower.includes('midfield')) {
    return 'Midfielder';
  }
  if (
    lower.includes('forward') ||
    lower.includes('striker') ||
    lower.includes('winger')
  ) {
    return 'Forward';
  }

  return null;
}

// =============================================================================
// Nation name → ISO code mapping
// =============================================================================

/**
 * Maps full nation names (as found in players.json) to ISO 3166-1 alpha-2 codes.
 * Includes UK home nations with sub-codes (GB-ENG, GB-SCT, GB-WLS, GB-NIR).
 */
const NATION_TO_ISO: Record<string, string> = {
  afghanistan: 'AF',
  albania: 'AL',
  algeria: 'DZ',
  'american samoa': 'AS',
  andorra: 'AD',
  angola: 'AO',
  'antigua and barbuda': 'AG',
  argentina: 'AR',
  armenia: 'AM',
  australia: 'AU',
  austria: 'AT',
  azerbaijan: 'AZ',
  bahamas: 'BS',
  bahrain: 'BH',
  bangladesh: 'BD',
  barbados: 'BB',
  belarus: 'BY',
  belgium: 'BE',
  belize: 'BZ',
  benin: 'BJ',
  bermuda: 'BM',
  bolivia: 'BO',
  'bosnia and herzegovina': 'BA',
  'bosnia-herzegovina': 'BA',
  botswana: 'BW',
  brazil: 'BR',
  brunei: 'BN',
  bulgaria: 'BG',
  'burkina faso': 'BF',
  burundi: 'BI',
  cambodia: 'KH',
  cameroon: 'CM',
  canada: 'CA',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'central african republic': 'CF',
  chad: 'TD',
  chile: 'CL',
  china: 'CN',
  colombia: 'CO',
  comoros: 'KM',
  congo: 'CG',
  'republic of the congo': 'CG',
  'dr congo': 'CD',
  'democratic republic of the congo': 'CD',
  'costa rica': 'CR',
  croatia: 'HR',
  cuba: 'CU',
  curacao: 'CW',
  'curaçao': 'CW',
  cyprus: 'CY',
  'czech republic': 'CZ',
  czechia: 'CZ',
  denmark: 'DK',
  djibouti: 'DJ',
  dominica: 'DM',
  'dominican republic': 'DO',
  ecuador: 'EC',
  egypt: 'EG',
  'el salvador': 'SV',
  england: 'GB-ENG',
  'equatorial guinea': 'GQ',
  eritrea: 'ER',
  estonia: 'EE',
  eswatini: 'SZ',
  ethiopia: 'ET',
  'faroe islands': 'FO',
  fiji: 'FJ',
  finland: 'FI',
  france: 'FR',
  gabon: 'GA',
  gambia: 'GM',
  georgia: 'GE',
  germany: 'DE',
  ghana: 'GH',
  gibraltar: 'GI',
  greece: 'GR',
  grenada: 'GD',
  guadeloupe: 'GP',
  guam: 'GU',
  guatemala: 'GT',
  guinea: 'GN',
  'guinea-bissau': 'GW',
  guyana: 'GY',
  haiti: 'HT',
  honduras: 'HN',
  'hong kong': 'HK',
  hungary: 'HU',
  iceland: 'IS',
  india: 'IN',
  indonesia: 'ID',
  iran: 'IR',
  iraq: 'IQ',
  ireland: 'IE',
  'republic of ireland': 'IE',
  israel: 'IL',
  italy: 'IT',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  'côte d\'ivoire': 'CI',
  jamaica: 'JM',
  japan: 'JP',
  jordan: 'JO',
  kazakhstan: 'KZ',
  kenya: 'KE',
  kosovo: 'XK',
  kuwait: 'KW',
  kyrgyzstan: 'KG',
  laos: 'LA',
  latvia: 'LV',
  lebanon: 'LB',
  lesotho: 'LS',
  liberia: 'LR',
  libya: 'LY',
  liechtenstein: 'LI',
  lithuania: 'LT',
  luxembourg: 'LU',
  'north macedonia': 'MK',
  macedonia: 'MK',
  madagascar: 'MG',
  malawi: 'MW',
  malaysia: 'MY',
  maldives: 'MV',
  mali: 'ML',
  malta: 'MT',
  martinique: 'MQ',
  mauritania: 'MR',
  mauritius: 'MU',
  mexico: 'MX',
  moldova: 'MD',
  monaco: 'MC',
  mongolia: 'MN',
  montenegro: 'ME',
  montserrat: 'MS',
  morocco: 'MA',
  mozambique: 'MZ',
  myanmar: 'MM',
  namibia: 'NA',
  nepal: 'NP',
  netherlands: 'NL',
  'new caledonia': 'NC',
  'new zealand': 'NZ',
  nicaragua: 'NI',
  niger: 'NE',
  nigeria: 'NG',
  'northern ireland': 'GB-NIR',
  norway: 'NO',
  oman: 'OM',
  pakistan: 'PK',
  palestine: 'PS',
  panama: 'PA',
  'papua new guinea': 'PG',
  paraguay: 'PY',
  peru: 'PE',
  philippines: 'PH',
  poland: 'PL',
  portugal: 'PT',
  'puerto rico': 'PR',
  qatar: 'QA',
  romania: 'RO',
  russia: 'RU',
  rwanda: 'RW',
  'saint kitts and nevis': 'KN',
  'st kitts and nevis': 'KN',
  'saint lucia': 'LC',
  'st lucia': 'LC',
  'saint vincent and the grenadines': 'VC',
  samoa: 'WS',
  'san marino': 'SM',
  'saudi arabia': 'SA',
  scotland: 'GB-SCT',
  senegal: 'SN',
  serbia: 'RS',
  'serbia and montenegro': 'RS',
  seychelles: 'SC',
  'sierra leone': 'SL',
  singapore: 'SG',
  slovakia: 'SK',
  slovenia: 'SI',
  'solomon islands': 'SB',
  somalia: 'SO',
  'south africa': 'SA',
  'south korea': 'KR',
  'korea republic': 'KR',
  'south sudan': 'SS',
  spain: 'ES',
  'sri lanka': 'LK',
  sudan: 'SD',
  suriname: 'SR',
  sweden: 'SE',
  switzerland: 'CH',
  syria: 'SY',
  taiwan: 'TW',
  tajikistan: 'TJ',
  tanzania: 'TZ',
  thailand: 'TH',
  'timor-leste': 'TL',
  togo: 'TG',
  tonga: 'TO',
  'trinidad and tobago': 'TT',
  tunisia: 'TN',
  turkey: 'TR',
  turkmenistan: 'TM',
  'turks and caicos islands': 'TC',
  uganda: 'UG',
  ukraine: 'UA',
  'united arab emirates': 'AE',
  'united states': 'US',
  usa: 'US',
  uruguay: 'UY',
  uzbekistan: 'UZ',
  vanuatu: 'VU',
  venezuela: 'VE',
  vietnam: 'VN',
  wales: 'GB-WLS',
  yemen: 'YE',
  zambia: 'ZM',
  zimbabwe: 'ZW',
};

/**
 * Map a full nation name to ISO 3166-1 alpha-2 code.
 * Uses the nation names found in players.json (e.g., "Bosnia-Herzegovina").
 *
 * UK home nations get sub-codes: GB-ENG, GB-SCT, GB-WLS, GB-NIR.
 *
 * @param nationName - Full nation name (case-insensitive)
 * @returns ISO code or null if unknown
 */
export function mapNationToISO(nationName: string): string | null {
  if (!nationName) return null;
  return NATION_TO_ISO[nationName.toLowerCase()] ?? null;
}

// =============================================================================
// Birth year extraction
// =============================================================================

/**
 * Extract birth year from a date string.
 * Supports YYYY-MM-DD, YYYY, and ISO 8601 datetime formats.
 *
 * @param dateStr - Date string (e.g., "1985-02-05", "1985", "1985-02-05T00:00:00Z")
 * @returns Year as number, or null if invalid/empty
 */
export function extractBirthYear(dateStr: string): number | null {
  if (!dateStr) return null;

  // Try to extract 4-digit year from the start
  const yearMatch = dateStr.match(/^(\d{4})/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1], 10);
  if (isNaN(year) || year < 1800 || year > 2100) return null;

  return year;
}

// =============================================================================
// SPARQL response parsing
// =============================================================================

/**
 * Extract a Wikidata QID from an entity URI.
 * @example extractQID("http://www.wikidata.org/entity/Q11571") → "Q11571"
 */
function extractQID(uri: string): string {
  const match = uri.match(/Q\d+$/);
  return match ? match[0] : '';
}

/**
 * Parse SPARQL player lookup response into WikidataPlayerData array.
 *
 * Expected bindings: player, playerLabel, birthDate?, nationalityCode?,
 * positionLabel?, sitelinks
 */
export function parseSPARQLPlayerResults(
  response: SPARQLResponse
): WikidataPlayerData[] {
  return response.results.bindings
    .map((binding): WikidataPlayerData | null => {
      const qid = extractQID(binding.player?.value ?? '');
      if (!qid) return null;

      return {
        qid,
        name: binding.playerLabel?.value ?? '',
        birth_year: binding.birthDate
          ? extractBirthYear(binding.birthDate.value)
          : null,
        nationality_code: binding.nationalityCode?.value ?? null,
        position_category: binding.positionLabel
          ? categorizeWikidataPosition(binding.positionLabel.value)
          : null,
        sitelinks: parseInt(binding.sitelinks?.value ?? '0', 10),
      };
    })
    .filter((p): p is WikidataPlayerData => p !== null);
}

/**
 * Parse SPARQL career query response into WikidataCareerEntry array.
 *
 * Expected bindings: club, clubLabel, startYear?, endYear?, clubCountryCode?
 */
export function parseSPARQLCareerResults(
  response: SPARQLResponse
): WikidataCareerEntry[] {
  return response.results.bindings.map((binding) => ({
    club_qid: extractQID(binding.club?.value ?? ''),
    club_name: binding.clubLabel?.value ?? '',
    club_country_code: binding.clubCountryCode?.value ?? null,
    start_year: binding.startYear
      ? parseInt(binding.startYear.value, 10)
      : null,
    end_year: binding.endYear ? parseInt(binding.endYear.value, 10) : null,
  }));
}
