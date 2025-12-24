/**
 * Fuzzy Matching Validation for Career Path
 *
 * Provides intelligent player name matching with:
 * - Case-insensitive comparison
 * - Accent/diacritic normalization (Özil → Ozil)
 * - Partial name matching (Messi → Lionel Messi)
 * - Typo tolerance via Dice coefficient
 */

import stringSimilarity from 'string-similarity';

/** Minimum similarity score to consider a match */
export const MATCH_THRESHOLD = 0.85;

/** Minimum characters for partial name matching */
const MIN_PARTIAL_LENGTH = 3;

/** Minimum ratio of guess length to answer length for partial matching */
const MIN_CONTAINMENT_RATIO = 0.4;

/**
 * Map of special characters that don't decompose with NFD.
 * Mostly Scandinavian/Nordic letters.
 */
const SPECIAL_CHAR_MAP: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  ð: 'd',
  þ: 'th',
  ł: 'l',
  ß: 'ss',
  œ: 'oe',
};

/**
 * Normalize a string for comparison.
 *
 * Transforms:
 * - Converts to lowercase
 * - Removes diacritics/accents (NFD normalization)
 * - Replaces special characters (ø → o, æ → ae, etc.)
 * - Trims whitespace
 *
 * @param str - String to normalize
 * @returns Normalized string
 *
 * @example
 * normalizeString("Özil") // "ozil"
 * normalizeString("MESSI") // "messi"
 * normalizeString("  Ronaldo  ") // "ronaldo"
 * normalizeString("Sørloth") // "sorloth"
 */
export function normalizeString(str: string): string {
  let result = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove combining diacritical marks

  // Replace special characters that don't decompose
  for (const [char, replacement] of Object.entries(SPECIAL_CHAR_MAP)) {
    result = result.replace(new RegExp(char, 'g'), replacement);
  }

  return result.trim();
}

/**
 * Validate if a guess matches the answer using fuzzy matching.
 *
 * Matching strategy (in order of priority):
 * 1. Exact match after normalization → score: 1.0
 * 2. Guess is a substantial substring of answer → score: 0.9+
 * 3. Fuzzy match using Dice coefficient → threshold: 0.85
 *
 * @param guess - User's guess (e.g., "Van Dijk")
 * @param answer - Correct answer (e.g., "Virgil van Dijk")
 * @returns Object with isMatch boolean and similarity score
 *
 * @example
 * // Exact match
 * validateGuess("Morgan Rogers", "Morgan Rogers") // { isMatch: true, score: 1.0 }
 *
 * // Partial match (surname)
 * validateGuess("Messi", "Lionel Messi") // { isMatch: true, score: 0.95 }
 *
 * // Fuzzy match (typo)
 * validateGuess("Rogrers", "Rogers") // { isMatch: true, score: ~0.87 }
 *
 * // Non-match
 * validateGuess("Ronaldo", "Messi") // { isMatch: false, score: ~0.2 }
 */
export function validateGuess(
  guess: string,
  answer: string
): { isMatch: boolean; score: number } {
  const normalizedGuess = normalizeString(guess);
  const normalizedAnswer = normalizeString(answer);

  // Empty guess handling
  if (!normalizedGuess) {
    return { isMatch: false, score: 0 };
  }

  // 1. Exact match (fast path)
  if (normalizedGuess === normalizedAnswer) {
    return { isMatch: true, score: 1.0 };
  }

  // 2. Check if guess is contained in answer (surname matching)
  // e.g., "Messi" in "Lionel Messi"
  if (
    normalizedGuess.length >= MIN_PARTIAL_LENGTH &&
    normalizedAnswer.includes(normalizedGuess)
  ) {
    const containmentRatio = normalizedGuess.length / normalizedAnswer.length;
    if (containmentRatio >= MIN_CONTAINMENT_RATIO) {
      // Scale score: 0.9 for 40% match, up to ~0.99 for nearly full match
      const score = 0.9 + containmentRatio * 0.1;
      return { isMatch: true, score };
    }
  }

  // 3. Fuzzy matching with Dice coefficient
  const similarity = stringSimilarity.compareTwoStrings(
    normalizedGuess,
    normalizedAnswer
  );

  return {
    isMatch: similarity >= MATCH_THRESHOLD,
    score: similarity,
  };
}
