import { validateGuess } from "@/lib/validation";
import type { TopTenAnswer } from "@/lib/schemas/puzzle-schemas";
import type { RankIndex } from "./types";

/** Result of validating a guess against the answer list. */
export interface TopTensValidationResult {
  /** Whether a match was found. */
  isMatch: boolean;
  /** Index of matched answer (0-9), or null if no match. */
  matchedIndex: RankIndex | null;
  /** Display name of matched answer, or null if no match. */
  displayName: string | null;
  /** Similarity score (0-1). */
  score: number;
}

/**
 * Matching strategy interface. v1: string-based fuzzy matching. Future v2 could
 * use database player IDs for exact matches.
 */
export interface AnswerMatcher {
  findMatch(
    guess: string,
    answers: TopTenAnswer[],
    alreadyFound: Set<RankIndex>
  ): TopTensValidationResult;
}

/**
 * v1: string-based fuzzy matching. Uses shared `validateGuess` from
 * `@/lib/validation` and also tries each answer's aliases. For rank 10
 * (index 9), each `alternates` entry's name + aliases are matched as well.
 */
export class StringMatcher implements AnswerMatcher {
  findMatch(
    guess: string,
    answers: TopTenAnswer[],
    alreadyFound: Set<RankIndex>
  ): TopTensValidationResult {
    const trimmedGuess = guess.trim();
    if (!trimmedGuess) {
      return { isMatch: false, matchedIndex: null, displayName: null, score: 0 };
    }

    for (let i = 0; i < answers.length; i++) {
      if (alreadyFound.has(i as RankIndex)) continue;

      const answer = answers[i];
      const candidates: { displayName: string; names: string[] }[] = [
        { displayName: answer.name, names: [answer.name, ...(answer.aliases ?? [])] },
      ];
      // Only rank 10 (index 9) supports alternates
      if (i === 9 && answer.alternates) {
        for (const alt of answer.alternates) {
          candidates.push({
            displayName: alt.name,
            names: [alt.name, ...(alt.aliases ?? [])],
          });
        }
      }

      for (const candidate of candidates) {
        for (const name of candidate.names) {
          const result = validateGuess(trimmedGuess, name);
          if (result.isMatch) {
            return {
              isMatch: true,
              matchedIndex: i as RankIndex,
              displayName: candidate.displayName,
              score: result.score,
            };
          }
        }
      }
    }

    return { isMatch: false, matchedIndex: null, displayName: null, score: 0 };
  }
}

const defaultMatcher = new StringMatcher();

/**
 * Find a matching answer from the list. Skips already-found indices.
 * Optional `matcher` parameter is for testing / future v2 strategies.
 */
export function findMatchingAnswer(
  guess: string,
  answers: TopTenAnswer[],
  alreadyFound: Set<RankIndex>,
  matcher: AnswerMatcher = defaultMatcher
): TopTensValidationResult {
  return matcher.findMatch(guess, answers, alreadyFound);
}
