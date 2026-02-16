/**
 * Tier Progression System
 *
 * 10-tier non-linear IQ progression system using cumulative points.
 * Replaces the previous 5-tier weighted average (0-100 globalIQ) system.
 *
 * The exponential curve ensures:
 * - Early tiers (1-4) feel achievable within the first week
 * - Mid-tiers (5-7) represent months of dedicated play
 * - Top tiers (8-10) are aspirational, representing long-term engagement
 */

import { colors } from '@/theme';

/**
 * Represents a single tier in the progression system.
 */
export interface IQTier {
  /** Tier number (1-10) */
  tier: number;
  /** Display name for the tier */
  name: string;
  /** Minimum cumulative points to reach this tier */
  minPoints: number;
  /** Maximum points in this tier (null for The Gaffer - no ceiling) */
  maxPoints: number | null;
}

/**
 * All 10 tiers in the progression system.
 *
 * Point thresholds follow an exponential curve:
 * - Tier 1-4: Quick progression (0-499 pts)
 * - Tier 5-7: Moderate progression (500-3999 pts)
 * - Tier 8-10: Long-term goals (4000-20000+ pts)
 */
export const IQ_TIERS: IQTier[] = [
  { tier: 1, name: 'Intern', minPoints: 0, maxPoints: 24 },
  { tier: 2, name: 'Match Analyst', minPoints: 25, maxPoints: 99 },
  { tier: 3, name: 'Scout', minPoints: 100, maxPoints: 249 },
  { tier: 4, name: 'Tactical Analyst', minPoints: 250, maxPoints: 499 },
  { tier: 5, name: 'Chief Scout', minPoints: 500, maxPoints: 999 },
  { tier: 6, name: 'Head of Analysis', minPoints: 1000, maxPoints: 1999 },
  { tier: 7, name: 'Head of Recruitment', minPoints: 2000, maxPoints: 3999 },
  { tier: 8, name: 'Technical Director', minPoints: 4000, maxPoints: 7999 },
  { tier: 9, name: 'Director of Football', minPoints: 8000, maxPoints: 19999 },
  { tier: 10, name: 'The Gaffer', minPoints: 20000, maxPoints: null },
];

/**
 * Color mapping for each tier.
 * Lower tiers use muted colors, higher tiers use more vibrant/prestigious colors.
 */
const TIER_COLORS: Record<number, string> = {
  1: colors.textSecondary, // Intern - muted gray
  2: '#6B7280', // Match Analyst - gray
  3: '#3B82F6', // Scout - blue
  4: '#22C55E', // Tactical Analyst - green
  5: colors.pitchGreen, // Chief Scout - pitch green
  6: colors.pitchGreen, // Head of Analysis - pitch green
  7: colors.cardYellow, // Head of Recruitment - yellow
  8: colors.amber, // Technical Director - amber
  9: '#F97316', // Director of Football - orange
  10: '#FFD700', // The Gaffer - gold
};

/**
 * Gets the tier information for a given cumulative point total.
 *
 * @param totalIQ - The user's cumulative IQ points
 * @returns The tier the user belongs to
 *
 * @example
 * getTierForPoints(0)     // { tier: 1, name: 'Intern', ... }
 * getTierForPoints(250)   // { tier: 4, name: 'Tactical Analyst', ... }
 * getTierForPoints(20000) // { tier: 10, name: 'The Gaffer', ... }
 */
export function getTierForPoints(totalIQ: number): IQTier {
  // Handle negative points
  if (totalIQ < 0) {
    return IQ_TIERS[0];
  }

  // Iterate from highest tier to lowest to find the matching tier
  for (let i = IQ_TIERS.length - 1; i >= 0; i--) {
    if (totalIQ >= IQ_TIERS[i].minPoints) {
      return IQ_TIERS[i];
    }
  }

  // Fallback (should never happen)
  return IQ_TIERS[0];
}

/**
 * Calculates the progress percentage towards the next tier.
 *
 * @param totalIQ - The user's cumulative IQ points
 * @returns Percentage (0-100) of progress to next tier. Returns 100 for GOAT tier.
 *
 * @example
 * getProgressToNextTier(0)     // 0 (start of Intern)
 * getProgressToNextTier(12)    // 48 (midpoint of Intern)
 * getProgressToNextTier(20000) // 100 (The Gaffer tier - max level)
 */
export function getProgressToNextTier(totalIQ: number): number {
  // Handle negative points
  if (totalIQ < 0) {
    return 0;
  }

  const currentTier = getTierForPoints(totalIQ);

  // GOAT tier has no next tier - always 100%
  if (currentTier.tier === 10) {
    return 100;
  }

  // Get the next tier
  const nextTier = IQ_TIERS[currentTier.tier]; // tier is 1-indexed, array is 0-indexed

  // Calculate progress within current tier
  const pointsInCurrentTier = totalIQ - currentTier.minPoints;
  const tierSpan = nextTier.minPoints - currentTier.minPoints;

  return Math.round((pointsInCurrentTier / tierSpan) * 100);
}

/**
 * Calculates the points needed to reach the next tier.
 *
 * @param totalIQ - The user's cumulative IQ points
 * @returns Points needed to reach next tier. Returns 0 for GOAT tier.
 *
 * @example
 * getPointsToNextTier(0)     // 25 (need 25 to reach Match Analyst)
 * getPointsToNextTier(12)    // 13 (need 13 more to reach Match Analyst)
 * getPointsToNextTier(20000) // 0 (The Gaffer tier - no next tier)
 */
export function getPointsToNextTier(totalIQ: number): number {
  // Handle negative points - treat as 0
  const effectivePoints = Math.max(0, totalIQ);

  const currentTier = getTierForPoints(effectivePoints);

  // GOAT tier has no next tier
  if (currentTier.tier === 10) {
    return 0;
  }

  // Get the next tier
  const nextTier = IQ_TIERS[currentTier.tier]; // tier is 1-indexed, array is 0-indexed

  return nextTier.minPoints - effectivePoints;
}

/**
 * Gets the display color for a tier.
 *
 * @param tier - The tier number (1-10)
 * @returns Hex color string for the tier
 *
 * @example
 * getTierColor(1)  // Gray (Intern)
 * getTierColor(5)  // Pitch Green (Chief Scout)
 * getTierColor(10) // Gold (The Gaffer)
 */
export function getTierColor(tier: number): string {
  // Handle out-of-range tier numbers
  if (tier < 1) {
    return TIER_COLORS[1];
  }
  if (tier > 10) {
    return TIER_COLORS[10];
  }

  return TIER_COLORS[tier];
}

/**
 * Gets the next tier after the current one.
 * Returns null if already at GOAT tier.
 *
 * @param currentTier - The current tier
 * @returns The next tier, or null if at max
 */
export function getNextTier(currentTier: IQTier): IQTier | null {
  if (currentTier.tier >= 10) {
    return null;
  }
  return IQ_TIERS[currentTier.tier]; // tier is 1-indexed
}

/**
 * Formats a point total for display with comma separators.
 *
 * @param points - The point total
 * @returns Formatted string (e.g., "1,234 IQ")
 */
export function formatTotalIQ(points: number): string {
  return `${points.toLocaleString()} IQ`;
}

/**
 * Detects if a user has crossed a tier threshold.
 *
 * @param oldIQ - Previous cumulative IQ
 * @param newIQ - New cumulative IQ
 * @returns Object with changed flag and newTier (if tier changed)
 *
 * @example
 * didTierChange(24, 25)   // { changed: true, newTier: { tier: 2, name: 'Match Analyst', ... } }
 * didTierChange(50, 75)   // { changed: false, newTier: null }
 * didTierChange(99, 100)  // { changed: true, newTier: { tier: 3, name: 'Scout', ... } }
 */
export function didTierChange(
  oldIQ: number,
  newIQ: number
): { changed: boolean; newTier: IQTier | null } {
  const oldTier = getTierForPoints(oldIQ);
  const newTier = getTierForPoints(newIQ);

  if (oldTier.tier !== newTier.tier) {
    return { changed: true, newTier };
  }

  return { changed: false, newTier: null };
}
