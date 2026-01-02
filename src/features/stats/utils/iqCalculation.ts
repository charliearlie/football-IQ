/**
 * IQ Calculation Utilities
 *
 * Pure functions for calculating Football IQ score from attempt metadata.
 * Uses weighted averaging across game modes.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { ParsedLocalAttempt } from '@/types/database';
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
 * @param gameMode - The game mode identifier
 * @param metadata - Parsed metadata from the attempt
 * @returns Normalized score (0-100)
 */
export function normalizeScore(gameMode: GameMode, metadata: unknown): number {
  if (!metadata || typeof metadata !== 'object') {
    return 0;
  }

  const data = metadata as Record<string, unknown>;

  switch (gameMode) {
    case 'career_path': {
      const points = typeof data.points === 'number' ? data.points : 0;
      const maxPoints = typeof data.maxPoints === 'number' ? data.maxPoints : 0;
      if (maxPoints === 0) return 0;
      return Math.round((points / maxPoints) * 100);
    }

    case 'guess_the_transfer': {
      const points = typeof data.points === 'number' ? data.points : 0;
      // Transfer always has maxPoints of 10
      return Math.round((points / 10) * 100);
    }

    case 'guess_the_goalscorers': {
      // Goalscorer recall stores percentage directly
      const percentage = typeof data.percentage === 'number' ? data.percentage : 0;
      return Math.round(percentage);
    }

    case 'tic_tac_toe': {
      // Tic Tac Toe: Win=100, Draw=50, Loss=0
      const result = data.result as string | undefined;
      if (result === 'win') return 100;
      if (result === 'draw') return 50;
      return 0;
    }

    case 'topical_quiz': {
      const points = typeof data.points === 'number' ? data.points : 0;
      // Quiz always has maxPoints of 10
      return Math.round((points / 10) * 100);
    }

    default:
      return 0;
  }
}

/**
 * Check if an attempt achieved a perfect score.
 *
 * @param gameMode - The game mode identifier
 * @param metadata - Parsed metadata from the attempt
 * @returns True if the score was perfect
 */
export function isPerfectScore(gameMode: GameMode, metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  const data = metadata as Record<string, unknown>;

  switch (gameMode) {
    case 'career_path': {
      const points = typeof data.points === 'number' ? data.points : 0;
      const maxPoints = typeof data.maxPoints === 'number' ? data.maxPoints : 0;
      return points === maxPoints && maxPoints > 0;
    }

    case 'guess_the_transfer': {
      const points = typeof data.points === 'number' ? data.points : 0;
      return points === 10;
    }

    case 'guess_the_goalscorers': {
      const percentage = typeof data.percentage === 'number' ? data.percentage : 0;
      return percentage === 100;
    }

    case 'tic_tac_toe': {
      const result = data.result as string | undefined;
      return result === 'win';
    }

    case 'topical_quiz': {
      const points = typeof data.points === 'number' ? data.points : 0;
      return points === 10;
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
