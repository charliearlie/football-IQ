import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { DetailedModeStats, GAME_MODE_DISPLAY } from '../types/stats.types';
import { WeakSpotInfo } from '../types/scoutReport.types';

const MIN_GAMES_FOR_WEAK_SPOT = 5;

/**
 * Find the user's weakest game mode for the "improve your report" CTA.
 * Only considers modes with enough games played.
 * Returns null if fewer than 2 qualifying modes.
 */
export function findWeakSpot(
  detailedModeStats: DetailedModeStats[]
): WeakSpotInfo | null {
  const qualifying = detailedModeStats.filter(
    s => s.gamesPlayed >= MIN_GAMES_FOR_WEAK_SPOT
  );

  if (qualifying.length < 2) return null;

  // Find mode with lowest accuracy
  const weakest = qualifying.reduce((min, s) =>
    s.accuracyPercent < min.accuracyPercent ? s : min
  );

  return {
    mode: weakest.gameMode,
    displayName: GAME_MODE_DISPLAY[weakest.gameMode].displayName,
    accuracy: weakest.accuracyPercent,
  };
}
