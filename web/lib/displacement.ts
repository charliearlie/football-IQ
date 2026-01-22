/**
 * Smart Displacement Engine
 *
 * Handles conflict resolution when scheduling puzzles:
 * - Find next available slot for a game mode
 * - Displace puzzles with optional ripple effect
 * - Calculate displacement chains for preview
 */

import { format, addDays, parseISO } from "date-fns";
import type { GameMode } from "./constants";
import { isRequiredOnDate } from "./scheduler";

// ============================================================================
// TYPES
// ============================================================================

export interface DisplacementMove {
  puzzleId: string;
  fromDate: string;
  toDate: string;
}

export interface DisplacementResult {
  success: boolean;
  moves: DisplacementMove[];
  error?: string;
}

export interface ConflictInfo {
  existingPuzzleId: string;
  existingPuzzleTitle: string;
  gameMode: GameMode;
  date: string;
}

export interface AvailableSlot {
  date: string;
  isScheduledDay: boolean;
}

export interface ExistingPuzzleInfo {
  id: string;
  date: string;
  title?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum days to search forward for available slots */
export const MAX_DISPLACEMENT_DAYS = 90;

/** Maximum depth for ripple displacement (prevent infinite loops) */
export const MAX_RIPPLE_DEPTH = 5;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Find the next available slot for a game mode starting from a date.
 *
 * @param gameMode - The game mode to find a slot for
 * @param startDate - Start searching from this date (exclusive)
 * @param occupiedDates - Set of dates that already have this mode scheduled
 * @param preferScheduledDays - If true, prefer days when mode is scheduled (default: true)
 * @returns The first available slot, or null if none found within limit
 */
export function findNextAvailableSlot(
  gameMode: GameMode,
  startDate: string,
  occupiedDates: Set<string>,
  preferScheduledDays: boolean = true
): AvailableSlot | null {
  const start = parseISO(startDate);

  // First pass: look for scheduled days (when the mode is required)
  if (preferScheduledDays) {
    for (let i = 1; i <= MAX_DISPLACEMENT_DAYS; i++) {
      const candidate = addDays(start, i);
      const candidateStr = format(candidate, "yyyy-MM-dd");

      if (
        !occupiedDates.has(candidateStr) &&
        isRequiredOnDate(gameMode, candidate)
      ) {
        return { date: candidateStr, isScheduledDay: true };
      }
    }
  }

  // Second pass: any day without this mode
  for (let i = 1; i <= MAX_DISPLACEMENT_DAYS; i++) {
    const candidate = addDays(start, i);
    const candidateStr = format(candidate, "yyyy-MM-dd");

    if (!occupiedDates.has(candidateStr)) {
      return {
        date: candidateStr,
        isScheduledDay: isRequiredOnDate(gameMode, candidate),
      };
    }
  }

  return null;
}

/**
 * Calculate the displacement chain for moving a puzzle to a target date.
 * Returns the sequence of moves needed, handling ripple effects when
 * the target date is already occupied.
 *
 * @param targetDate - Where we want to put the new puzzle
 * @param gameMode - The game mode
 * @param existingPuzzles - Map of date -> puzzle info for this mode
 * @param depth - Current recursion depth (for safety)
 * @returns Array of moves to execute (deepest first) or error
 */
export function calculateDisplacementChain(
  targetDate: string,
  gameMode: GameMode,
  existingPuzzles: Map<string, ExistingPuzzleInfo>,
  depth: number = 0
): DisplacementResult {
  if (depth >= MAX_RIPPLE_DEPTH) {
    return {
      success: false,
      moves: [],
      error: `Maximum displacement depth (${MAX_RIPPLE_DEPTH}) reached. Consider marking as bonus instead.`,
    };
  }

  const moves: DisplacementMove[] = [];

  // Check if target is occupied
  const occupant = existingPuzzles.get(targetDate);

  if (occupant) {
    // Target is occupied - need to displace the occupant first
    const occupiedDates = new Set(existingPuzzles.keys());
    // The target will be occupied by our incoming puzzle
    occupiedDates.add(targetDate);

    const nextSlot = findNextAvailableSlot(gameMode, targetDate, occupiedDates);

    if (!nextSlot) {
      return {
        success: false,
        moves: [],
        error: `No available slot found within ${MAX_DISPLACEMENT_DAYS} days for displaced puzzle.`,
      };
    }

    // Recursively calculate chain for the occupant
    const childChain = calculateDisplacementChain(
      nextSlot.date,
      gameMode,
      existingPuzzles,
      depth + 1
    );

    if (!childChain.success) {
      return childChain;
    }

    // Add child moves first (they need to execute before this move)
    moves.push(...childChain.moves);

    // Add this move
    moves.push({
      puzzleId: occupant.id,
      fromDate: occupant.date,
      toDate: nextSlot.date,
    });
  }

  return { success: true, moves };
}

/**
 * Build a map of existing puzzles for a game mode from a list.
 * Filters to only scheduled puzzles (puzzle_date is not null).
 */
export function buildPuzzleMap(
  puzzles: Array<{
    id: string;
    puzzle_date: string | null;
    game_mode: string;
    content?: unknown;
  }>,
  gameMode: GameMode,
  getTitleFn?: (puzzle: { content?: unknown; game_mode: string }) => string
): Map<string, ExistingPuzzleInfo> {
  const map = new Map<string, ExistingPuzzleInfo>();

  for (const puzzle of puzzles) {
    if (puzzle.game_mode === gameMode && puzzle.puzzle_date) {
      map.set(puzzle.puzzle_date, {
        id: puzzle.id,
        date: puzzle.puzzle_date,
        title: getTitleFn ? getTitleFn(puzzle) : undefined,
      });
    }
  }

  return map;
}

/**
 * Get a set of occupied dates for a game mode.
 */
export function getOccupiedDates(
  puzzles: Array<{ puzzle_date: string | null; game_mode: string }>,
  gameMode: GameMode
): Set<string> {
  const dates = new Set<string>();

  for (const puzzle of puzzles) {
    if (puzzle.game_mode === gameMode && puzzle.puzzle_date) {
      dates.add(puzzle.puzzle_date);
    }
  }

  return dates;
}

/**
 * Check if a specific date/mode combination has a conflict.
 */
export function hasConflict(
  date: string,
  gameMode: GameMode,
  existingPuzzles: Array<{
    id: string;
    puzzle_date: string | null;
    game_mode: string;
  }>,
  excludePuzzleId?: string
): ExistingPuzzleInfo | null {
  for (const puzzle of existingPuzzles) {
    if (
      puzzle.game_mode === gameMode &&
      puzzle.puzzle_date === date &&
      puzzle.id !== excludePuzzleId
    ) {
      return {
        id: puzzle.id,
        date: puzzle.puzzle_date,
      };
    }
  }

  return null;
}
