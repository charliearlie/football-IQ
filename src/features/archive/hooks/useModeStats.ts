/**
 * useModeStats Hook
 *
 * Aggregates per-mode statistics from a flat ArchivePuzzle[] array.
 * Pure client-side computation — no data fetching.
 */

import { useMemo } from 'react';
import { ArchivePuzzle } from '../types/archive.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { getGameModeConfig } from '@/features/puzzles/utils/gameModeConfig';

/** Canonical display order — cards never reorder as the user plays games. */
const MODE_ORDER: GameMode[] = [
  'career_path',
  'career_path_pro',
  'the_chain',
  'the_thread',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'topical_quiz',
  'top_tens',
  'starting_xi',
  'connections',
  'timeline',
];

export interface ModeStats {
  /** The game mode this stat block represents */
  gameMode: GameMode;
  /** Display title from gameModeConfig */
  title: string;
  /** Display subtitle from gameModeConfig */
  subtitle: string;
  /** Total number of puzzles for this mode */
  totalCount: number;
  /** Number of completed (status === 'done') puzzles */
  playedCount: number;
  /** Number of locked puzzles */
  lockedCount: number;
  /** Average score across completed puzzles, or null if none played */
  avgScore: number | null;
  /** Best score across completed puzzles, or null if none played */
  bestScore: number | null;
  /** True when at least one puzzle is unlocked and not done */
  hasUnplayed: boolean;
  /** True when at least one puzzle has status === 'resume' */
  hasResume: boolean;
  /** Newest accessible unplayed puzzle (!isLocked && status !== 'done'), or null */
  recentUnplayed: ArchivePuzzle | null;
  /** Most recent puzzle with status === 'resume', or null */
  resumePuzzle: ArchivePuzzle | null;
  /** All puzzles for this mode, sorted newest first */
  puzzles: ArchivePuzzle[];
}

/**
 * Aggregates a flat puzzle list into per-mode statistics.
 *
 * Sorting guarantees:
 * - Within each mode: puzzles are sorted by puzzleDate descending (newest first).
 * - Output modes: fixed canonical order matching the GameMode union type
 *   (cards never reorder as the user plays games).
 *
 * @param puzzles - All archive puzzles, any order.
 * @returns One ModeStats entry per game mode present in the input.
 */
export function useModeStats(puzzles: ArchivePuzzle[]): ModeStats[] {
  return useMemo(() => {
    // --- 1. Group puzzles by gameMode ---
    const grouped = new Map<GameMode, ArchivePuzzle[]>();

    for (const puzzle of puzzles) {
      const existing = grouped.get(puzzle.gameMode);
      if (existing) {
        existing.push(puzzle);
      } else {
        grouped.set(puzzle.gameMode, [puzzle]);
      }
    }

    // --- 2. Compute stats per mode ---
    const stats: ModeStats[] = [];

    for (const [gameMode, modePuzzles] of grouped) {
      // Sort newest first (descending date string comparison is safe for YYYY-MM-DD)
      const sorted = [...modePuzzles].sort((a, b) =>
        b.puzzleDate.localeCompare(a.puzzleDate)
      );

      // Counts
      const totalCount = sorted.length;
      const playedCount = sorted.filter((p) => p.status === 'done').length;
      const lockedCount = sorted.filter((p) => p.isLocked).length;

      // Score aggregation over completed puzzles that have a numeric score
      const completedScores = sorted
        .filter((p) => p.status === 'done' && p.score !== undefined)
        .map((p) => p.score as number);

      const avgScore =
        completedScores.length > 0
          ? Math.round(completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length)
          : null;

      const bestScore =
        completedScores.length > 0
          ? Math.max(...completedScores)
          : null;

      // Accessibility helpers
      const hasUnplayed = sorted.some((p) => !p.isLocked && p.status !== 'done');
      const hasResume = sorted.some((p) => p.status === 'resume');

      // First (newest) puzzle that is unlocked and not done
      const recentUnplayed =
        sorted.find((p) => !p.isLocked && p.status !== 'done') ?? null;

      // First (newest) puzzle in resume state
      const resumePuzzle = sorted.find((p) => p.status === 'resume') ?? null;

      // Title / subtitle from config (no isArchive flag — use default)
      const config = getGameModeConfig(gameMode);

      stats.push({
        gameMode,
        title: config.title,
        subtitle: config.subtitle,
        totalCount,
        playedCount,
        lockedCount,
        avgScore,
        bestScore,
        hasUnplayed,
        hasResume,
        recentUnplayed,
        resumePuzzle,
        puzzles: sorted,
      });
    }

    // --- 3. Filter to only modes in MODE_ORDER, then sort by canonical order ---
    return stats
      .filter((s) => MODE_ORDER.includes(s.gameMode))
      .sort((a, b) => MODE_ORDER.indexOf(a.gameMode) - MODE_ORDER.indexOf(b.gameMode));
  }, [puzzles]);
}
