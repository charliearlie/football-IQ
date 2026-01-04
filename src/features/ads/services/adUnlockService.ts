/**
 * Ad Unlock Service
 *
 * Service layer for managing ad-unlocked puzzles.
 * Wraps database operations and provides business logic for
 * the ad-to-unlock feature. Unlocks are permanent.
 */

import {
  saveAdUnlock,
  isAdUnlocked,
  getValidAdUnlocks,
  removeAdUnlock,
  clearAllAdUnlocks,
} from '@/lib/database';
import { UnlockedPuzzle } from '@/types/database';

/**
 * Grant a permanent unlock for a puzzle after user watched an ad.
 * One ad = one puzzle forever.
 *
 * @param puzzleId - The ID of the puzzle to unlock
 */
export async function grantPuzzleUnlock(puzzleId: string): Promise<void> {
  await saveAdUnlock(puzzleId);
}

/**
 * Check if a puzzle has been unlocked via ad.
 * Unlocks are permanent - once unlocked, always unlocked.
 *
 * @param puzzleId - The ID of the puzzle to check
 * @returns true if the puzzle is unlocked via ad
 */
export async function checkPuzzleUnlock(puzzleId: string): Promise<boolean> {
  return isAdUnlocked(puzzleId);
}

/**
 * Get all ad unlocks.
 * Unlocks are permanent so all entries are valid.
 *
 * @returns Array of all unlocked puzzles
 */
export async function getAllValidUnlocks(): Promise<UnlockedPuzzle[]> {
  return getValidAdUnlocks();
}

/**
 * Check if a puzzle ID is in a list of unlocks.
 * Used for quick in-memory checks without hitting the database.
 *
 * @param puzzleId - The ID of the puzzle to check
 * @param unlocks - Array of unlocked puzzles to check against
 * @returns true if the puzzle is in the unlocks list
 */
export function isPuzzleInUnlocks(
  puzzleId: string,
  unlocks: UnlockedPuzzle[]
): boolean {
  return unlocks.some((unlock) => unlock.puzzle_id === puzzleId);
}

/**
 * Remove an ad unlock for a puzzle.
 *
 * @param puzzleId - The ID of the puzzle to revoke unlock for
 */
export async function revokePuzzleUnlock(puzzleId: string): Promise<void> {
  await removeAdUnlock(puzzleId);
}

/**
 * Clear all ad unlocks.
 * Primarily used for testing.
 */
export async function clearAllUnlocks(): Promise<void> {
  await clearAllAdUnlocks();
}
