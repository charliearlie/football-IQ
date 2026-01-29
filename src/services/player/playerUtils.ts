/**
 * Player search utility functions.
 * Contains string normalization, fuzzy matching, and country code utilities.
 */

/**
 * Special character mapping for name normalization.
 * Handles Nordic and other special characters not covered by NFD normalization.
 */
const SPECIAL_CHAR_MAP: Record<string, string> = {
  'ø': 'o',
  'Ø': 'O',
  'æ': 'ae',
  'Æ': 'AE',
  'ð': 'd',
  'Ð': 'D',
  'þ': 'th',
  'Þ': 'TH',
  'ł': 'l',
  'Ł': 'L',
  'ß': 'ss',
  'œ': 'oe',
  'Œ': 'OE',
};

/**
 * Normalize a name for search indexing and querying.
 * Used both when storing players and when searching.
 *
 * Transformations:
 * 1. Convert to lowercase
 * 2. Apply NFD normalization to decompose accented characters
 * 3. Remove diacritical marks (combining characters)
 * 4. Replace special characters not handled by NFD
 * 5. Trim whitespace
 *
 * @param name - Full name (e.g., "Zlatan Ibrahimović")
 * @returns Normalized search string (e.g., "zlatan ibrahimovic")
 *
 * @example
 * normalizeSearchName("Özil") // "ozil"
 * normalizeSearchName("Sørloth") // "sorloth"
 * normalizeSearchName("Ibrahimović") // "ibrahimovic"
 */
export function normalizeSearchName(name: string): string {
  // First, handle special characters that NFD doesn't cover
  let result = name;
  for (const [char, replacement] of Object.entries(SPECIAL_CHAR_MAP)) {
    result = result.replace(new RegExp(char, 'g'), replacement);
  }

  // Apply NFD normalization and remove diacritical marks
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove combining diacritical marks

  // Convert to lowercase and trim
  return result.toLowerCase().trim();
}

/**
 * Calculate Levenshtein distance between two strings.
 * Used for ranking search results by closeness to query
 * and for fuzzy matching club names.
 *
 * Time complexity: O(m*n) where m and n are string lengths
 * Space complexity: O(min(m,n)) using optimized row-based approach
 *
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance (number of insertions, deletions, or substitutions)
 *
 * @example
 * levenshteinDistance("messi", "messi") // 0
 * levenshteinDistance("messi", "mesi") // 1 (deletion)
 * levenshteinDistance("kitten", "sitting") // 3
 */
export function levenshteinDistance(a: string, b: string): number {
  // Handle empty strings
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  // Use two rows instead of full matrix for space efficiency
  let previousRow = Array.from({ length: a.length + 1 }, (_, i) => i);
  let currentRow = new Array<number>(a.length + 1);

  for (let i = 1; i <= b.length; i++) {
    currentRow[0] = i;

    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        previousRow[j] + 1, // deletion
        currentRow[j - 1] + 1, // insertion
        previousRow[j - 1] + cost // substitution
      );
    }

    // Swap rows
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[a.length];
}

/**
 * GB subdivision codes → tag sequences for home nation flags.
 * These use the black flag emoji + tag characters (U+E0067 etc.)
 * to render 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿.
 */
const GB_SUBDIVISION_FLAGS: Record<string, string> = {
  'GB-ENG': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F', // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  'GB-SCT': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F', // 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  'GB-WLS': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F', // 🏴󠁧󠁢󠁷󠁬󠁳󠁿
  'GB-NIR': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC6E\uDB40\uDC69\uDB40\uDC72\uDB40\uDC7F', // placeholder — no official emoji, uses custom tag sequence
};

/**
 * Convert country code to emoji flag.
 *
 * Supports:
 * - ISO 3166-1 alpha-2 codes (e.g., "BR" → 🇧🇷)
 * - GB subdivision codes (e.g., "GB-ENG" → 🏴󠁧󠁢󠁥󠁮󠁧󠁿)
 *
 * @param code - Country code (alpha-2 or GB-ENG/GB-SCT/GB-WLS/GB-NIR)
 * @returns Emoji flag string, or empty string if invalid
 */
export function countryCodeToEmoji(code: string): string {
  if (!code) return '';

  // Check GB subdivision codes first
  const upperCode = code.toUpperCase();
  const subdivisionFlag = GB_SUBDIVISION_FLAGS[upperCode];
  if (subdivisionFlag) return subdivisionFlag;

  // Never show Union Jack — only home nation flags are acceptable
  if (upperCode === 'GB') return '';

  // Standard 2-letter ISO code
  if (code.length !== 2) return '';

  // Regional Indicator Symbol Letter A is U+1F1E6
  // ASCII 'A' is 65, so offset is 0x1F1E6 - 65 = 127397
  const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 65;

  const firstChar = upperCode.charCodeAt(0);
  const secondChar = upperCode.charCodeAt(1);

  // Validate that both characters are A-Z
  if (
    firstChar < 65 ||
    firstChar > 90 ||
    secondChar < 65 ||
    secondChar > 90
  ) {
    return '';
  }

  const first = String.fromCodePoint(firstChar + REGIONAL_INDICATOR_OFFSET);
  const second = String.fromCodePoint(secondChar + REGIONAL_INDICATOR_OFFSET);

  return first + second;
}

/**
 * Calculate relevance score for a search result.
 * Higher score means better match to the query.
 *
 * Scoring factors:
 * 1. Exact prefix match gets highest score (1.0)
 * 2. Contains query gets medium-high score (0.8)
 * 3. Normalized Levenshtein distance for fuzzy matches
 *
 * @param query - Normalized search query
 * @param searchName - Normalized player search_name from database
 * @returns Relevance score between 0 and 1
 */
export function calculateRelevance(query: string, searchName: string): number {
  // Exact match at start = highest score
  if (searchName.startsWith(query)) {
    return 1.0;
  }

  // Contains query somewhere = high score
  if (searchName.includes(query)) {
    // Score based on position (earlier = better)
    const position = searchName.indexOf(query);
    const positionPenalty = position / searchName.length;
    return 0.9 - positionPenalty * 0.2;
  }

  // Fuzzy match based on Levenshtein distance
  const distance = levenshteinDistance(query, searchName);
  const maxLen = Math.max(query.length, searchName.length);

  // Convert distance to similarity (0-1)
  // Cap at 0.6 for fuzzy matches that don't contain the query
  return Math.max(0, Math.min(0.6, 1 - distance / maxLen));
}

/**
 * Check if a club name matches a target club with fuzzy tolerance.
 * Used for validating player-club relationships.
 *
 * @param playerClub - Club name from player's clubs array
 * @param targetClub - Club name to match against
 * @param tolerance - Maximum Levenshtein distance allowed (default: 3)
 * @returns true if clubs match within tolerance
 */
export function clubsMatch(
  playerClub: string,
  targetClub: string,
  tolerance: number = 3
): boolean {
  const normalizedPlayerClub = normalizeSearchName(playerClub);
  const normalizedTarget = normalizeSearchName(targetClub);

  // Exact match after normalization
  if (normalizedPlayerClub === normalizedTarget) {
    return true;
  }

  // One contains the other (e.g., "Real Madrid CF" contains "Real Madrid")
  if (
    normalizedPlayerClub.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedPlayerClub)
  ) {
    return true;
  }

  // Fuzzy match with tolerance
  const distance = levenshteinDistance(normalizedPlayerClub, normalizedTarget);
  return distance <= tolerance;
}
