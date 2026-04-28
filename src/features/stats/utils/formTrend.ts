/**
 * Form Trend Utilities
 *
 * Groups attempts by puzzle_date and produces a 30-day accuracy sparkline.
 * Days with no games are excluded from the dataPoints array.
 * Computes currentWeekAccuracy vs lifetimeAccuracy to generate a label.
 */

import { AttemptWithGameMode } from '@/lib/database';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { normalizeScore } from './iqCalculation';

export interface FormTrendResult {
  /** Accuracy per day for the last 30 days. Days with no games are omitted. */
  dataPoints: { date: string; accuracy: number }[];
  /** Average normalised score across the last 7 days of attempts (0-100). */
  currentWeekAccuracy: number;
  /** Average normalised score across all-time attempts (0-100). */
  lifetimeAccuracy: number;
  /** Human-readable form label. */
  label: string;
}

const DAYS_IN_TREND = 30;
const DAYS_IN_WEEK = 7;

function getFormLabel(current: number, lifetime: number): string {
  const delta = current - lifetime;
  if (delta >= 15) return 'ON FIRE';
  if (delta >= 5) return 'WARMING UP';
  if (delta >= -5) return 'STEADY';
  if (delta >= -15) return 'COLD SPELL';
  return 'ICE AGE';
}

/**
 * Offset a date string by N days (negative = past).
 */
function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute form trend from the user's full attempt history.
 *
 * Returns null when there are no completed attempts at all.
 */
export function computeFormTrend(
  attempts: AttemptWithGameMode[]
): FormTrendResult | null {
  if (attempts.length === 0) return null;

  // Group attempts by puzzle_date, accumulating normalised scores
  const scoresByDate = new Map<string, number[]>();

  for (const attempt of attempts) {
    const date = attempt.puzzle_date.slice(0, 10); // normalise to YYYY-MM-DD
    const gameMode = attempt.game_mode as GameMode;
    const score = normalizeScore(gameMode, attempt.metadata);

    const existing = scoresByDate.get(date);
    if (existing) {
      existing.push(score);
    } else {
      scoresByDate.set(date, [score]);
    }
  }

  // Determine today (use the most recent puzzle_date to stay timezone-safe)
  const today = new Date().toISOString().slice(0, 10);

  // Build 30-day window
  const dataPoints: { date: string; accuracy: number }[] = [];

  for (let i = DAYS_IN_TREND - 1; i >= 0; i--) {
    const date = offsetDate(today, -i);
    const scores = scoresByDate.get(date);
    if (scores && scores.length > 0) {
      const accuracy = Math.round(
        scores.reduce((s, v) => s + v, 0) / scores.length
      );
      dataPoints.push({ date, accuracy });
    }
    // Days with no games are excluded from the sparkline
  }

  // currentWeekAccuracy: avg of all attempts in last 7 days
  const weekThreshold = offsetDate(today, -(DAYS_IN_WEEK - 1));
  const weekScores: number[] = [];

  for (const [date, scores] of scoresByDate.entries()) {
    if (date >= weekThreshold && date <= today) {
      weekScores.push(...scores);
    }
  }

  const currentWeekAccuracy =
    weekScores.length > 0
      ? Math.round(weekScores.reduce((s, v) => s + v, 0) / weekScores.length)
      : 0;

  // lifetimeAccuracy: avg of every attempt
  const allScores: number[] = [];
  for (const scores of scoresByDate.values()) {
    allScores.push(...scores);
  }

  const lifetimeAccuracy =
    allScores.length > 0
      ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
      : 0;

  return {
    dataPoints,
    currentWeekAccuracy,
    lifetimeAccuracy,
    label: getFormLabel(currentWeekAccuracy, lifetimeAccuracy),
  };
}
