/**
 * Streak Milestone Types
 *
 * Defines milestone thresholds and reward types for streak achievements.
 */

/**
 * Specific milestone thresholds with their rewards.
 */
export interface StreakMilestone {
  /** The streak day count that triggers this milestone (7, 30, 100). */
  days: number;
  /** Human-readable label. */
  label: string;
  /** The reward granted at this milestone. */
  reward: MilestoneReward;
  /** Celebration message shown in the modal. */
  message: string;
  /** Share text for social sharing. */
  shareText: string;
}

/**
 * Reward types granted at streak milestones.
 */
export type MilestoneReward =
  | { type: 'archive_unlock'; days: number }
  | { type: 'pro_trial'; days: number }
  | { type: 'badge'; badgeId: string; badgeName: string };

/**
 * Result of checking whether a streak milestone was reached.
 */
export interface MilestoneCheckResult {
  /** Whether a new milestone was reached. */
  reached: boolean;
  /** The milestone that was reached, if any. */
  milestone?: StreakMilestone;
  /** Whether the reward was successfully granted. */
  rewardGranted?: boolean;
}

/**
 * Streak recovery state.
 */
export interface StreakRecoveryState {
  /** Whether recovery is available (streak broke within 24h). */
  available: boolean;
  /** The streak count before it broke. */
  previousStreak: number;
  /** When the streak broke (ISO timestamp). */
  brokenAt: string;
  /** Games completed in recovery window. */
  recoveryGamesCompleted: number;
  /** Games required to recover (always 2). */
  recoveryGamesRequired: number;
}
