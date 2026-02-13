/**
 * Streak Freeze System Types
 *
 * Defines the types for the streak freeze economy that allows users
 * to protect their streaks from missed days.
 */

/**
 * Complete state of the streak freeze system for a user.
 */
export interface StreakFreezeState {
  /**
   * Number of freezes available in inventory (free users only, max 3).
   */
  availableFreezes: number;

  /**
   * Array of dates (YYYY-MM-DD) where freezes were used to protect the streak.
   */
  usedDates: string[];

  /**
   * Last milestone (7-day multiple) where a freeze was awarded.
   * Used to prevent duplicate awards at same milestone.
   */
  lastMilestone: number;

  /**
   * Whether the user has premium subscription (unlimited freezes).
   */
  isPremium: boolean;
}

/**
 * Source of a freeze consumption (for analytics).
 */
export type FreezeSource = 'earned' | 'initial' | 'premium';

/**
 * Result of attempting to consume a freeze.
 */
export interface ConsumeFreezeResult {
  /**
   * Whether the freeze was successfully consumed.
   */
  success: boolean;

  /**
   * Updated freeze count after consumption.
   */
  remainingFreezes: number;

  /**
   * Source of the freeze that was used.
   */
  source: FreezeSource;
}

/**
 * Result of checking and awarding a milestone freeze.
 */
export interface MilestoneAwardResult {
  /**
   * Whether a new freeze was awarded.
   */
  awarded: boolean;

  /**
   * The milestone (7, 14, 21...) that triggered the award, if any.
   */
  milestone?: number;

  /**
   * Total freezes after the award.
   */
  totalFreezes: number;
}
