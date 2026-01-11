/**
 * Top Tens Validation
 *
 * Validates guesses against the answer list using fuzzy matching.
 * Reuses shared validation from @/lib/validation.ts.
 *
 * DESIGN NOTE: Matching is abstracted behind an interface to allow
 * swapping to database-based ID matching in v2 without changing
 * the game logic or components.
 */

import { validateGuess } from '@/lib/validation';
import type { TopTensContent, TopTensAnswer, RankIndex } from '../types/topTens.types';

/**
 * Result of validating a guess against the answer list.
 */
export interface TopTensValidationResult {
  /** Whether a match was found */
  isMatch: boolean;
  /** Index of matched answer (0-9), or null if no match */
  matchedIndex: RankIndex | null;
  /** Display name of matched answer, or null if no match */
  displayName: string | null;
  /** Similarity score (0-1) */
  score: number;
}

/**
 * Matching strategy interface for future-proofing.
 * v1: String-based fuzzy matching
 * v2: Could use player_id from database lookup
 */
export interface AnswerMatcher {
  findMatch(
    guess: string,
    answers: TopTensAnswer[],
    alreadyFound: Set<RankIndex>
  ): TopTensValidationResult;
}

/**
 * v1 Implementation: String-based fuzzy matching
 * Uses shared validation from @/lib/validation.ts
 */
export class StringMatcher implements AnswerMatcher {
  findMatch(
    guess: string,
    answers: TopTensAnswer[],
    alreadyFound: Set<RankIndex>
  ): TopTensValidationResult {
    const trimmedGuess = guess.trim();

    // Handle empty guess
    if (!trimmedGuess) {
      return { isMatch: false, matchedIndex: null, displayName: null, score: 0 };
    }

    // Check each answer (skip already found)
    for (let i = 0; i < answers.length; i++) {
      // Skip if already found
      if (alreadyFound.has(i as RankIndex)) {
        continue;
      }

      const answer = answers[i];
      const namesToCheck = [answer.name, ...(answer.aliases || [])];

      // Check primary name and all aliases
      for (const name of namesToCheck) {
        const result = validateGuess(trimmedGuess, name);
        if (result.isMatch) {
          return {
            isMatch: true,
            matchedIndex: i as RankIndex,
            displayName: answer.name, // Always return primary display name
            score: result.score,
          };
        }
      }
    }

    // No match found
    return { isMatch: false, matchedIndex: null, displayName: null, score: 0 };
  }
}

// Default matcher for v1
const defaultMatcher = new StringMatcher();

/**
 * Find a matching answer from the list.
 *
 * Searches through all answers and their aliases using fuzzy matching.
 * Returns the first match found, skipping already-found indices.
 *
 * @param guess - User's guess
 * @param answers - Array of possible answers
 * @param alreadyFound - Set of indices already found
 * @param matcher - Optional custom matcher (for testing/v2)
 */
export function findMatchingAnswer(
  guess: string,
  answers: TopTensAnswer[],
  alreadyFound: Set<RankIndex>,
  matcher: AnswerMatcher = defaultMatcher
): TopTensValidationResult {
  return matcher.findMatch(guess, answers, alreadyFound);
}

/**
 * Validate a guess against the puzzle answers.
 *
 * Convenience wrapper that extracts answers from puzzle content.
 *
 * @param guess - User's guess
 * @param puzzleContent - The puzzle data
 * @param foundIndices - Set of already-found rank indices
 * @param matcher - Optional custom matcher (for testing/v2)
 */
export function validateTopTensGuess(
  guess: string,
  puzzleContent: TopTensContent,
  foundIndices: Set<RankIndex>,
  matcher: AnswerMatcher = defaultMatcher
): TopTensValidationResult {
  return findMatchingAnswer(guess, puzzleContent.answers, foundIndices, matcher);
}
