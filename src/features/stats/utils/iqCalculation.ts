/**
 * IQ Calculation Utilities
 *
 * Pure functions for calculating Football IQ score from attempt metadata.
 * Uses weighted averaging across game modes.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { ParsedLocalAttempt } from '@/types/database';
import {
  asMetadataObject,
  getMetadataNumber,
  isGameResult,
} from '@/types/gameMetadata';
import {
  GameProficiency,
  Badge,
  GAME_MODE_DISPLAY,
  IQ_WEIGHTS,
  BADGE_DEFINITIONS,
} from '../types/stats.types';

/**
 * Normalize a score from any game mode to 0-100 scale.
 *
 * Uses the actual metadata fields saved by each game hook:
 * - career_path: won, totalSteps, revealedCount
 * - guess_the_transfer: won, hintsRevealed, guesses (array)
 * - guess_the_goalscorers: scorersFound, totalScorers
 * - tic_tac_toe: result ('win'|'draw'|'loss')
 * - topical_quiz: correctCount (0-5)
 *
 * @param gameMode - The game mode identifier
 * @param metadata - Parsed metadata from the attempt
 * @returns Normalized score (0-100)
 */
export function normalizeScore(gameMode: GameMode, metadata: unknown): number {
  const data = asMetadataObject(metadata);
  if (!data) {
    if (__DEV__) {
      console.log('[IQ] normalizeScore: invalid metadata', { gameMode, metadata });
    }
    return 0;
  }

  switch (gameMode) {
    case 'career_path': {
      // Games save: won, totalSteps, revealedCount
      // Score = totalSteps - (revealedCount - 1) if won, else 0
      const won = data.won === true;
      if (!won) return 0;
      const totalSteps = getMetadataNumber(data, 'totalSteps');
      const revealedCount = getMetadataNumber(data, 'revealedCount');
      if (totalSteps === 0) return 0;
      const points = totalSteps - (revealedCount - 1);
      return Math.round((points / totalSteps) * 100);
    }

    case 'guess_the_transfer': {
      // Games save: won, hintsRevealed, guesses (array of incorrect guesses)
      // Score = 10 - (hints × 2) - (wrong guesses × 1), min 1 if won
      const won = data.won === true;
      if (!won) return 0;
      const hintsRevealed = getMetadataNumber(data, 'hintsRevealed');
      const wrongGuesses = Array.isArray(data.guesses) ? data.guesses.length : 0;
      const points = Math.max(1, 10 - (hintsRevealed * 2) - wrongGuesses);
      return Math.round((points / 10) * 100);
    }

    case 'guess_the_goalscorers': {
      // Games save: scorersFound, totalScorers
      const scorersFound = getMetadataNumber(data, 'scorersFound');
      const totalScorers = getMetadataNumber(data, 'totalScorers');
      if (totalScorers === 0) return 0;
      return Math.round((scorersFound / totalScorers) * 100);
    }

    case 'tic_tac_toe': {
      // Games save: result ('win'|'draw'|'loss')
      // Win=100, Draw=50, Loss=0
      const result = data.result;
      if (isGameResult(result)) {
        if (result === 'win') return 100;
        if (result === 'draw') return 50;
      }
      return 0;
    }

    case 'topical_quiz': {
      // Games save: correctCount (0-5)
      // 5 correct = 100%, each correct = 20%
      const correctCount = getMetadataNumber(data, 'correctCount');
      return Math.round((correctCount / 5) * 100);
    }

    default:
      return 0;
  }
}

/**
 * Check if an attempt achieved a perfect score.
 *
 * Uses the actual metadata fields saved by each game hook:
 * - career_path: won=true AND revealedCount=1 (guessed on first clue)
 * - guess_the_transfer: won=true AND hintsRevealed=0 AND no wrong guesses
 * - guess_the_goalscorers: scorersFound === totalScorers
 * - tic_tac_toe: result === 'win'
 * - topical_quiz: correctCount === 5
 *
 * @param gameMode - The game mode identifier
 * @param metadata - Parsed metadata from the attempt
 * @returns True if the score was perfect
 */
export function isPerfectScore(gameMode: GameMode, metadata: unknown): boolean {
  const data = asMetadataObject(metadata);
  if (!data) return false;

  switch (gameMode) {
    case 'career_path': {
      // Perfect = won on first clue (revealedCount = 1)
      const won = data.won === true;
      const revealedCount = getMetadataNumber(data, 'revealedCount');
      return won && revealedCount === 1;
    }

    case 'guess_the_transfer': {
      // Perfect = won with no hints and no wrong guesses
      const won = data.won === true;
      const hintsRevealed = getMetadataNumber(data, 'hintsRevealed');
      const wrongGuesses = Array.isArray(data.guesses) ? data.guesses.length : 0;
      return won && hintsRevealed === 0 && wrongGuesses === 0;
    }

    case 'guess_the_goalscorers': {
      // Perfect = found all scorers
      const scorersFound = getMetadataNumber(data, 'scorersFound');
      const totalScorers = getMetadataNumber(data, 'totalScorers');
      return totalScorers > 0 && scorersFound === totalScorers;
    }

    case 'tic_tac_toe': {
      // Perfect = win
      return data.result === 'win';
    }

    case 'topical_quiz': {
      // Perfect = all 5 questions correct
      const correctCount = getMetadataNumber(data, 'correctCount');
      return correctCount === 5;
    }

    default:
      return false;
  }
}

/**
 * Calculate proficiency metrics for a single game mode.
 *
 * @param gameMode - The game mode identifier
 * @param attempts - Array of completed attempts for this mode
 * @returns Proficiency object with percentage, games played, and perfect scores
 */
export function calculateProficiency(
  gameMode: GameMode,
  attempts: ParsedLocalAttempt[]
): GameProficiency {
  const display = GAME_MODE_DISPLAY[gameMode];

  if (attempts.length === 0) {
    return {
      gameMode,
      displayName: display.skillName,
      percentage: 0,
      gamesPlayed: 0,
      perfectScores: 0,
    };
  }

  // Calculate average normalized score
  let totalScore = 0;
  let perfectCount = 0;

  for (const attempt of attempts) {
    const score = normalizeScore(gameMode, attempt.metadata);
    totalScore += score;

    if (isPerfectScore(gameMode, attempt.metadata)) {
      perfectCount++;
    }
  }

  const averagePercentage = Math.round(totalScore / attempts.length);

  if (__DEV__) {
    console.log('[IQ] calculateProficiency:', {
      gameMode,
      gamesPlayed: attempts.length,
      averagePercentage,
      perfectCount,
    });
  }

  return {
    gameMode,
    displayName: display.skillName,
    percentage: averagePercentage,
    gamesPlayed: attempts.length,
    perfectScores: perfectCount,
  };
}

/**
 * Calculate the Global Football IQ from all proficiencies.
 *
 * Uses weighted averaging with weight redistribution when some modes
 * haven't been played yet. Only modes with gamesPlayed > 0 contribute.
 *
 * Weights:
 * - Career Path: 25%
 * - Transfer Guess: 25%
 * - Goalscorer Recall: 20%
 * - Tic Tac Toe: 15%
 * - Topical Quiz: 15%
 *
 * @param proficiencies - Proficiency data for all game modes
 * @returns Global IQ score (0-100)
 */
export function calculateGlobalIQ(proficiencies: GameProficiency[]): number {
  // Filter to only modes that have been played
  const playedModes = proficiencies.filter((p) => p.gamesPlayed > 0);

  if (playedModes.length === 0) {
    return 0;
  }

  // Calculate total weight of played modes for redistribution
  const totalPlayedWeight = playedModes.reduce(
    (sum, p) => sum + IQ_WEIGHTS[p.gameMode],
    0
  );

  // Calculate weighted average with normalized weights
  let weightedSum = 0;
  for (const proficiency of playedModes) {
    const normalizedWeight = IQ_WEIGHTS[proficiency.gameMode] / totalPlayedWeight;
    weightedSum += proficiency.percentage * normalizedWeight;
  }

  return Math.round(weightedSum);
}

/**
 * Calculate which badges have been earned.
 *
 * @param proficiencies - Proficiency data for all game modes
 * @param currentStreak - Current consecutive day streak
 * @param totalPuzzles - Total puzzles solved
 * @returns Array of all badges with earned status
 */
export function calculateBadges(
  proficiencies: GameProficiency[],
  currentStreak: number,
  totalPuzzles: number
): Badge[] {
  const now = new Date().toISOString();

  // Create lookup map for proficiencies
  const proficiencyMap = new Map<GameMode, GameProficiency>();
  for (const p of proficiencies) {
    proficiencyMap.set(p.gameMode, p);
  }

  return BADGE_DEFINITIONS.map((definition) => {
    let earnedAt: string | null = null;

    switch (definition.id) {
      case 'streak_7':
        if (currentStreak >= 7) earnedAt = now;
        break;

      case 'perfect_career': {
        const p = proficiencyMap.get('career_path');
        if (p && p.perfectScores > 0) earnedAt = now;
        break;
      }

      case 'perfect_transfer': {
        const p = proficiencyMap.get('guess_the_transfer');
        if (p && p.perfectScores > 0) earnedAt = now;
        break;
      }

      case 'perfect_goalscorer': {
        const p = proficiencyMap.get('guess_the_goalscorers');
        if (p && p.perfectScores > 0) earnedAt = now;
        break;
      }

      case 'perfect_tictactoe': {
        const p = proficiencyMap.get('tic_tac_toe');
        if (p && p.perfectScores > 0) earnedAt = now;
        break;
      }

      case 'perfect_quiz': {
        const p = proficiencyMap.get('topical_quiz');
        if (p && p.perfectScores > 0) earnedAt = now;
        break;
      }

      case 'games_10':
        if (totalPuzzles >= 10) earnedAt = now;
        break;

      case 'games_50':
        if (totalPuzzles >= 50) earnedAt = now;
        break;
    }

    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      earnedAt,
    };
  });
}
