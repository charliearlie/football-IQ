/**
 * Speed Profile Utilities
 *
 * Computes how long users take to complete puzzles by diffing started_at
 * and completed_at. Returns overall and per-mode averages plus an archetype
 * label based on the overall average.
 */

import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

export interface SpeedProfileResult {
  /** Overall average completion time in seconds. */
  avgSeconds: number;
  /** Archetype label derived from the overall average. */
  archetype: string;
  /** Per-mode averages, sorted ascending by avgSeconds. */
  perMode: { gameMode: GameMode; avgSeconds: number }[];
}

function getArchetype(avgSeconds: number): string {
  if (avgSeconds < 30) return 'Speed Demon';
  if (avgSeconds < 60) return 'Snap Decision Maker';
  if (avgSeconds < 120) return 'Balanced Thinker';
  if (avgSeconds < 180) return 'The Analyst';
  return 'Methodical';
}

/**
 * Compute the speed profile from the user's attempt history.
 *
 * Only attempts that have both started_at and completed_at are considered.
 * Returns null when no timed attempts exist.
 */
export function computeSpeedProfile(
  attempts: AttemptWithGameMode[]
): SpeedProfileResult | null {
  const timedAttempts = attempts.filter(
    (a): a is AttemptWithGameMode & { started_at: string; completed_at: string } =>
      a.started_at !== null && a.completed_at !== null
  );

  if (timedAttempts.length === 0) return null;

  // Accumulate durations per mode
  const durationsByMode = new Map<GameMode, number[]>();
  let totalSeconds = 0;

  for (const attempt of timedAttempts) {
    const gameMode = attempt.game_mode as GameMode;
    const durationMs =
      new Date(attempt.completed_at).getTime() -
      new Date(attempt.started_at).getTime();

    // Ignore negative or implausibly large durations (> 2 hours)
    if (durationMs <= 0 || durationMs > 7_200_000) continue;

    const seconds = durationMs / 1000;
    totalSeconds += seconds;

    const existing = durationsByMode.get(gameMode);
    if (existing) {
      existing.push(seconds);
    } else {
      durationsByMode.set(gameMode, [seconds]);
    }
  }

  const validCount = [...durationsByMode.values()].reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  if (validCount === 0) return null;

  const avgSeconds = Math.round(totalSeconds / validCount);

  const perMode: { gameMode: GameMode; avgSeconds: number }[] = [];
  for (const [gameMode, durations] of durationsByMode.entries()) {
    if (durations.length === 0) continue;
    const modeAvg = Math.round(
      durations.reduce((s, v) => s + v, 0) / durations.length
    );
    perMode.push({ gameMode, avgSeconds: modeAvg });
  }

  perMode.sort((a, b) => a.avgSeconds - b.avgSeconds);

  return {
    avgSeconds,
    archetype: getArchetype(avgSeconds),
    perMode,
  };
}
