/**
 * Share text generators for web playable games.
 *
 * Ported from mobile share utilities. These are pure functions
 * with no React Native dependencies.
 */

// ============================================================================
// SHARED HELPERS
// ============================================================================

/**
 * Format a YYYY-MM-DD date string for display in share text.
 * Returns "19 Feb" format.
 */
function formatShareDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// CAREER PATH
// ============================================================================

export interface CareerPathResult {
  won: boolean;
  cluesUsed: number;
  totalClues: number;
}

/**
 * Generate share text for Career Path result.
 *
 * Example:
 * Football IQ - Career Path
 * 19 Feb
 * Solved in 3/6 clues
 * 🔓🔓🔓🔒🔒🔒
 * https://football-iq.app/play/career-path
 */
export function generateCareerPathShareText(
  result: CareerPathResult,
  puzzleDate: string
): string {
  const dateStr = formatShareDate(puzzleDate);

  const emojiRow = Array.from({ length: result.totalClues }, (_, i) =>
    i < result.cluesUsed ? "🔓" : "🔒"
  ).join("");

  const resultLine = result.won
    ? `Solved in ${result.cluesUsed}/${result.totalClues} clues`
    : `${result.cluesUsed}/${result.totalClues} clues revealed`;

  return [
    "Football IQ - Career Path",
    dateStr,
    resultLine,
    emojiRow,
    "https://football-iq.app/play/career-path",
  ].join("\n");
}

// ============================================================================
// TRANSFER GUESS
// ============================================================================

export interface TransferGuessResult {
  won: boolean;
  hintsRevealed: number;
  guessCount: number;
}

/**
 * Generate share text for Transfer Guess result.
 *
 * Example:
 * Football IQ - Transfer Guess
 * 19 Feb
 * Guessed with 1 hint
 * 💰🔍⬜
 * https://football-iq.app/play/transfer-guess
 */
export function generateTransferGuessShareText(
  result: TransferGuessResult,
  puzzleDate: string
): string {
  const dateStr = formatShareDate(puzzleDate);

  // Emoji: 💰 for each revealed hint, ⬜ for unrevealed
  const hintEmoji = Array.from({ length: 3 }, (_, i) =>
    i < result.hintsRevealed ? "🔍" : "⬜"
  ).join("");

  const statusEmoji = result.won ? "✅" : "❌";

  const hintText =
    result.hintsRevealed === 1
      ? "Guessed with 1 hint"
      : `Guessed with ${result.hintsRevealed} hints`;

  const resultLine = result.won ? hintText : "Did not guess correctly";

  return [
    "Football IQ - Transfer Guess",
    dateStr,
    resultLine,
    `${statusEmoji} ${hintEmoji}`,
    "https://football-iq.app/play/transfer-guess",
  ].join("\n");
}

// ============================================================================
// CONNECTIONS
// ============================================================================

export type ConnectionsDifficulty = "yellow" | "green" | "blue" | "purple";

export interface ConnectionsGuessResult {
  players: string[];
  correct: boolean;
  matchedDifficulty?: ConnectionsDifficulty;
}

export interface ConnectionsGroupInfo {
  difficulty: ConnectionsDifficulty;
  players: string[];
}

const DIFFICULTY_EMOJI: Record<ConnectionsDifficulty, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

/**
 * Generate emoji grid for Connections result.
 * Each row represents a guess attempt, with emojis showing which group each player belongs to.
 */
export function generateConnectionsEmojiGrid(
  guesses: ConnectionsGuessResult[],
  allGroups: ConnectionsGroupInfo[]
): string {
  const rows: string[] = [];

  for (const guess of guesses) {
    const emojis = guess.players.map((playerName) => {
      const group = allGroups.find((g) => g.players.includes(playerName));
      return group ? DIFFICULTY_EMOJI[group.difficulty] : "⬜";
    });
    rows.push(emojis.join(""));
  }

  return rows.join("\n");
}

/**
 * Generate share text for Connections result.
 *
 * Example:
 * Football IQ - Connections
 * 19 Feb
 * 🟨🟨🟨🟨
 * 🟩🟦🟩🟩
 * 🟩🟩🟩🟩
 * 🟦🟦🟦🟦
 * 🟪🟪🟪🟪
 * 1 mistake
 * https://football-iq.app/play/connections
 */
export function generateConnectionsShareText(
  guesses: ConnectionsGuessResult[],
  allGroups: ConnectionsGroupInfo[],
  mistakes: number,
  puzzleDate: string
): string {
  const dateStr = formatShareDate(puzzleDate);
  const emojiGrid = generateConnectionsEmojiGrid(guesses, allGroups);
  const mistakeText = mistakes === 1 ? "1 mistake" : `${mistakes} mistakes`;

  return [
    "Football IQ - Connections",
    dateStr,
    emojiGrid,
    mistakeText,
    "https://football-iq.app/play/connections",
  ].join("\n");
}

// ============================================================================
// TOPICAL QUIZ
// ============================================================================

export interface QuizAnswerResult {
  isCorrect: boolean;
}

/**
 * Generate emoji grid for Topical Quiz result.
 *
 * Example: "✅✅❌✅✅"
 */
export function generateQuizEmojiGrid(answers: QuizAnswerResult[]): string {
  return answers.map((a) => (a.isCorrect ? "✅" : "❌")).join("");
}

/**
 * Generate share text for Topical Quiz result.
 *
 * Example:
 * Football IQ - Quiz
 * 19 Feb
 * 4/5 correct
 * ✅✅❌✅✅
 * https://football-iq.app/play/topical-quiz
 */
export function generateTopicalQuizShareText(
  answers: QuizAnswerResult[],
  puzzleDate: string
): string {
  const dateStr = formatShareDate(puzzleDate);
  const correct = answers.filter((a) => a.isCorrect).length;
  const total = answers.length;
  const emojiGrid = generateQuizEmojiGrid(answers);

  return [
    "Football IQ - Quiz",
    dateStr,
    `${correct}/${total} correct`,
    emojiGrid,
    "https://football-iq.app/play/topical-quiz",
  ].join("\n");
}

// ============================================================================
// TIMELINE
// ============================================================================

/**
 * Generate emoji row for Timeline result.
 * Shows correct/incorrect for each position on first attempt.
 *
 * Example: "✅❌✅✅❌✅"
 */
export function generateTimelineEmojiRow(
  firstAttemptResults: boolean[]
): string {
  return firstAttemptResults.map((correct) => (correct ? "✅" : "❌")).join("");
}

/**
 * Generate share text for Timeline result.
 *
 * Example:
 * Football IQ - Timeline
 * 19 Feb
 * ⏱️ Thierry Henry
 * ✅❌✅✅❌✅
 * 3/5 guesses - 3 IQ
 * https://football-iq.app/play/timeline
 */
export function generateTimelineShareText(
  firstAttemptResults: boolean[],
  totalAttempts: number,
  points: number,
  puzzleDate: string,
  title?: string,
  subject?: string
): string {
  const dateStr = formatShareDate(puzzleDate);
  const emojiRow = generateTimelineEmojiRow(firstAttemptResults);
  const label = title || subject || "Timeline";

  return [
    "Football IQ - Timeline",
    dateStr,
    `⏱️ ${label}`,
    emojiRow,
    `${totalAttempts}/5 guesses - ${points} IQ`,
    "https://football-iq.app/play/timeline",
  ].join("\n");
}
