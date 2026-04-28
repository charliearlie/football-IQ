/**
 * Knowledge Profile Utilities
 *
 * Maps game modes to knowledge axes and computes per-axis accuracy
 * from DetailedModeStats. Returns an insight string summarising the
 * user's strongest and weakest domains.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { DetailedModeStats } from '../types/stats.types';

export interface KnowledgeAxis {
  label: string;
  value: number; // 0-100
  modes: GameMode[];
}

export interface KnowledgeProfileResult {
  axes: KnowledgeAxis[];
  insight: string; // e.g. "Transfer Market Encyclopedia"
}

const AXIS_DEFINITIONS: { label: string; modes: GameMode[] }[] = [
  {
    label: 'Transfer Market',
    modes: ['guess_the_transfer', 'higher_lower'],
  },
  {
    label: 'Tactics',
    modes: ['starting_xi', 'the_grid'],
  },
  {
    label: 'History',
    modes: ['career_path', 'career_path_pro', 'timeline'],
  },
  {
    label: 'Quick Recall',
    modes: ['topical_quiz', 'top_tens', 'guess_the_goalscorers'],
  },
  {
    label: 'Deduction',
    modes: ['connections', 'the_chain', 'the_thread'],
  },
  {
    label: 'Player Knowledge',
    modes: ['whos-that', 'who_am_i'],
  },
];

/**
 * Build a knowledge profile from pre-computed DetailedModeStats.
 *
 * Returns null when no mode has been played yet.
 */
export function buildKnowledgeProfile(
  detailedModeStats: DetailedModeStats[]
): KnowledgeProfileResult | null {
  const statsByMode = new Map<GameMode, DetailedModeStats>();
  for (const s of detailedModeStats) {
    statsByMode.set(s.gameMode, s);
  }

  const axes: KnowledgeAxis[] = AXIS_DEFINITIONS.map(({ label, modes }) => {
    const playedStats = modes
      .map(m => statsByMode.get(m))
      .filter((s): s is DetailedModeStats => s !== undefined && s.gamesPlayed > 0);

    const value =
      playedStats.length === 0
        ? 0
        : Math.round(
            playedStats.reduce((sum, s) => sum + s.accuracyPercent, 0) /
              playedStats.length
          );

    return { label, value, modes };
  });

  const hasAnyData = axes.some(a => a.value > 0);
  if (!hasAnyData) return null;

  // Strongest axis (highest value)
  const strongest = [...axes].sort((a, b) => b.value - a.value)[0];

  // Weakest axis: lowest value among axes that have data (value > 0)
  const axesWithData = axes.filter(a => a.value > 0);
  const weakest =
    axesWithData.length > 1
      ? [...axesWithData].sort((a, b) => a.value - b.value)[0]
      : null;

  const insight =
    weakest !== null && weakest.label !== strongest.label
      ? `${strongest.label} Expert — your ${weakest.label} could use some work`
      : `${strongest.label} Expert`;

  return { axes, insight };
}
