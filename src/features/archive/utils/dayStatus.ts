
import { ArchivePuzzle } from '../types/archive.types';

export const calculateDayStats = (puzzles: ArchivePuzzle[]) => {
  const total = puzzles.length;
  const completed = puzzles.filter(p => p.status === 'done').length;
  return { total, completed };
};

export const getDayStatus = (puzzles: ArchivePuzzle[]): 'perfect' | 'active' | 'available' | 'locked' => {
  const { total, completed } = calculateDayStats(puzzles);
  if (total === 0) return 'available';
  if (completed === total) return 'perfect';
  if (completed > 0) return 'active';
  return 'available';
};

/**
 * Checks if a day is locked based on potential date rules.
 * Currently: > 7 days old is locked for non-premium.
 * (This logic might conflict with per-puzzle locking, checking exact requirement)
 * Requirement: "Locked: Opacity 0.6 + Lock Icon... dates > 7 days old (non-pro)"
 */
export const isDayLocked = (dateString: string, isPremium: boolean): boolean => {
  if (isPremium) return false;

  const today = new Date(); // Use current date
  const puzzleDate = new Date(dateString);
  
  // Calculate difference in days
  const diffTime = Math.abs(today.getTime() - puzzleDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // If > 7 days, locked for free users (unless unlocked via ad - handled per puzzle?)
  // The 'day card' might show lock if *all* puzzles are locked? 
  // The requirement says "dates > 7 days old". So check specifically the date diff.
  return diffDays > 7;
};
