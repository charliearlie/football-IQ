/**
 * Clutch Rating Utilities
 *
 * A "pressure moment" is any attempt where the normalised score sits in
 * the 1-30 range — the player barely scraped through (or failed from that
 * position when score is 0).  clutchPercent = wins from pressure / total
 * pressure moments × 100.
 *
 * Requires at least 5 pressure moments before returning a result.
 */

import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { normalizeScore } from './iqCalculation';

export interface ClutchRatingResult {
  clutchPercent: number; // 0-100
  clutchWins: number;
  pressureMoments: number;
  label: string;
}

const MIN_PRESSURE_MOMENTS = 5;

function getClutchLabel(clutchPercent: number): string {
  if (clutchPercent >= 80) return 'ICE COLD';
  if (clutchPercent >= 60) return 'NERVES OF STEEL';
  if (clutchPercent >= 40) return 'PRESSURE PLAYER';
  if (clutchPercent >= 20) return 'NEEDS COMPOSURE';
  return 'BOTTLE JOB';
}

/**
 * Compute the user's clutch rating from their attempt history.
 *
 * Returns null when there are fewer than 5 pressure moments recorded.
 */
export function computeClutchRating(
  attempts: AttemptWithGameMode[]
): ClutchRatingResult | null {
  let pressureMoments = 0;
  let clutchWins = 0;

  for (const attempt of attempts) {
    const gameMode = attempt.game_mode as GameMode;
    const score = normalizeScore(gameMode, attempt.metadata);

    // Pressure moment: score in the 1-30 range (barely won) or score 0 after
    // being in a position that could have been a close win.
    // We treat score 1-30 as a clutch-win and score 0 as a choke (both are
    // "pressure moments" because these games tend to be marginal).
    if (score >= 1 && score <= 30) {
      pressureMoments++;
      clutchWins++;
    } else if (score === 0) {
      pressureMoments++;
      // clutchWins unchanged — this was a choke
    }
  }

  if (pressureMoments < MIN_PRESSURE_MOMENTS) return null;

  const clutchPercent = Math.round((clutchWins / pressureMoments) * 100);

  return {
    clutchPercent,
    clutchWins,
    pressureMoments,
    label: getClutchLabel(clutchPercent),
  };
}
