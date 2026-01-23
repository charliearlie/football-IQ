/**
 * Simplified fuzzy matching for landing page demo.
 * Lighter version without string-similarity dependency.
 */

const MATCH_THRESHOLD = 0.85;

/**
 * Normalize string for comparison: lowercase, remove accents, trim
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[øæðþłßœ]/g, (char) => {
      const map: Record<string, string> = {
        ø: "o",
        æ: "ae",
        ð: "d",
        þ: "th",
        ł: "l",
        ß: "ss",
        œ: "oe",
      };
      return map[char] || char;
    })
    .trim();
}

/**
 * Calculate Dice coefficient similarity between two strings
 */
function diceCoefficient(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length < 2 || str2.length < 2) return 0;

  const bigrams1 = new Set<string>();
  for (let i = 0; i < str1.length - 1; i++) {
    bigrams1.add(str1.slice(i, i + 2));
  }

  let intersection = 0;
  for (let i = 0; i < str2.length - 1; i++) {
    if (bigrams1.has(str2.slice(i, i + 2))) {
      intersection++;
    }
  }

  return (2 * intersection) / (str1.length - 1 + str2.length - 1);
}

/**
 * Validate if guess matches answer
 */
export function validateGuess(
  guess: string,
  answer: string
): { isMatch: boolean; score: number } {
  const normalizedGuess = normalizeString(guess);
  const normalizedAnswer = normalizeString(answer);

  if (!normalizedGuess) {
    return { isMatch: false, score: 0 };
  }

  // Exact match
  if (normalizedGuess === normalizedAnswer) {
    return { isMatch: true, score: 1.0 };
  }

  // Substring match (surname matching)
  if (
    normalizedGuess.length >= 3 &&
    normalizedAnswer.includes(normalizedGuess)
  ) {
    const ratio = normalizedGuess.length / normalizedAnswer.length;
    if (ratio >= 0.25) {
      return { isMatch: true, score: 0.9 + ratio * 0.1 };
    }
  }

  // Fuzzy match
  const score = diceCoefficient(normalizedGuess, normalizedAnswer);
  return { isMatch: score >= MATCH_THRESHOLD, score };
}
