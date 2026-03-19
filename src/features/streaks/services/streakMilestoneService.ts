/**
 * Streak Milestone Service
 *
 * Detects streak milestones (7, 30, 100 days) and grants rewards.
 * Uses AsyncStorage for persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  StreakMilestone,
  MilestoneCheckResult,
  StreakRecoveryState,
} from '../types/streakMilestone.types';

const STORAGE_KEYS = {
  CLAIMED_MILESTONES: '@streak_milestones_claimed',
  RECOVERY_STATE: '@streak_recovery_state',
  ARCHIVE_UNLOCKS: '@streak_archive_unlocks',
} as const;

/**
 * Defined streak milestones with rewards.
 */
export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    label: '7-Day Streak',
    reward: { type: 'archive_unlock', days: 1 },
    message: "A week of dedication! Here's a free archive day on us.",
    shareText: "7 days straight on Football IQ. The streak is real.",
  },
  {
    days: 30,
    label: '30-Day Streak',
    reward: { type: 'pro_trial', days: 7 },
    message: "A month of football knowledge! Enjoy 7 days of Pro, free.",
    shareText: "30-day streak on Football IQ. A full month without missing a day.",
  },
  {
    days: 100,
    label: '100-Day Streak',
    reward: { type: 'badge', badgeId: 'century_streak', badgeName: 'Century' },
    message: "100 days. Legendary commitment. The Century badge is yours forever.",
    shareText: "100-day streak on Football IQ. Century club, baby.",
  },
];

const RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const RECOVERY_GAMES_REQUIRED = 2;

/**
 * Get the set of milestone day counts that have been claimed.
 */
async function getClaimedMilestones(): Promise<Set<number>> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CLAIMED_MILESTONES);
    return new Set(value ? JSON.parse(value) : []);
  } catch {
    return new Set();
  }
}

/**
 * Mark a milestone as claimed.
 */
async function claimMilestone(days: number): Promise<void> {
  try {
    const claimed = await getClaimedMilestones();
    claimed.add(days);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CLAIMED_MILESTONES,
      JSON.stringify([...claimed])
    );
  } catch (error) {
    console.error('[StreakMilestone] Failed to claim milestone:', error);
  }
}

/**
 * Get the number of bonus archive day unlocks available.
 */
export async function getArchiveUnlocks(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ARCHIVE_UNLOCKS);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Grant bonus archive day unlocks.
 */
export async function grantArchiveUnlocks(days: number): Promise<void> {
  try {
    const current = await getArchiveUnlocks();
    await AsyncStorage.setItem(
      STORAGE_KEYS.ARCHIVE_UNLOCKS,
      (current + days).toString()
    );
  } catch (error) {
    console.error('[StreakMilestone] Failed to grant archive unlocks:', error);
  }
}

/**
 * Consume one archive day unlock. Returns true if successful.
 */
export async function consumeArchiveUnlock(): Promise<boolean> {
  try {
    const current = await getArchiveUnlocks();
    if (current <= 0) return false;
    await AsyncStorage.setItem(
      STORAGE_KEYS.ARCHIVE_UNLOCKS,
      (current - 1).toString()
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current streak has reached a new milestone and grant rewards.
 *
 * @param currentStreak - The user's current streak count.
 * @returns Result indicating if a milestone was reached and reward granted.
 */
export async function checkStreakMilestone(
  currentStreak: number
): Promise<MilestoneCheckResult> {
  // Find the highest unclaimed milestone the user has reached
  const claimed = await getClaimedMilestones();

  // Check milestones from highest to lowest so we celebrate the biggest one
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    const milestone = STREAK_MILESTONES[i];
    if (currentStreak >= milestone.days && !claimed.has(milestone.days)) {
      // Grant the reward
      let rewardGranted = false;
      try {
        switch (milestone.reward.type) {
          case 'archive_unlock':
            await grantArchiveUnlocks(milestone.reward.days);
            rewardGranted = true;
            break;
          case 'pro_trial':
            // Pro trial is granted via a flag that the premium system reads
            await AsyncStorage.setItem(
              '@streak_pro_trial_granted',
              JSON.stringify({
                days: milestone.reward.days,
                grantedAt: new Date().toISOString(),
                expiresAt: new Date(
                  Date.now() + milestone.reward.days * 24 * 60 * 60 * 1000
                ).toISOString(),
              })
            );
            rewardGranted = true;
            break;
          case 'badge':
            // Badge is granted by storing in achievements
            await AsyncStorage.setItem(
              `@badge_${milestone.reward.badgeId}`,
              JSON.stringify({
                badgeId: milestone.reward.badgeId,
                badgeName: milestone.reward.badgeName,
                earnedAt: new Date().toISOString(),
              })
            );
            rewardGranted = true;
            break;
        }
      } catch (error) {
        console.error('[StreakMilestone] Failed to grant reward:', error);
      }

      // Mark milestone as claimed
      await claimMilestone(milestone.days);

      return {
        reached: true,
        milestone,
        rewardGranted,
      };
    }
  }

  return { reached: false };
}

// ============================================================================
// Streak Recovery
// ============================================================================

/**
 * Get the current streak recovery state.
 */
export async function getStreakRecoveryState(): Promise<StreakRecoveryState | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_STATE);
    if (!value) return null;

    const state: StreakRecoveryState = JSON.parse(value);

    // Check if recovery window has expired
    const brokenTime = new Date(state.brokenAt).getTime();
    if (Date.now() - brokenTime > RECOVERY_WINDOW_MS) {
      // Window expired, clear recovery state
      await AsyncStorage.removeItem(STORAGE_KEYS.RECOVERY_STATE);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Start a recovery window when a streak breaks.
 * Called when the system detects the streak dropped to 0.
 *
 * @param previousStreak - The streak count before it broke.
 */
export async function startStreakRecovery(previousStreak: number): Promise<void> {
  // Only offer recovery for streaks of 3+ days (not worth it for tiny streaks)
  if (previousStreak < 3) return;

  try {
    const state: StreakRecoveryState = {
      available: true,
      previousStreak,
      brokenAt: new Date().toISOString(),
      recoveryGamesCompleted: 0,
      recoveryGamesRequired: RECOVERY_GAMES_REQUIRED,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('[StreakRecovery] Failed to start recovery:', error);
  }
}

/**
 * Record a game completion during the recovery window.
 * Returns true if recovery is now complete (2 games played).
 */
export async function recordRecoveryGame(): Promise<{
  recovered: boolean;
  gamesRemaining: number;
}> {
  try {
    const state = await getStreakRecoveryState();
    if (!state || !state.available) {
      return { recovered: false, gamesRemaining: 0 };
    }

    state.recoveryGamesCompleted++;

    if (state.recoveryGamesCompleted >= RECOVERY_GAMES_REQUIRED) {
      // Recovery complete! Clear recovery state
      await AsyncStorage.removeItem(STORAGE_KEYS.RECOVERY_STATE);
      return { recovered: true, gamesRemaining: 0 };
    }

    // Update state
    await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_STATE, JSON.stringify(state));
    return {
      recovered: false,
      gamesRemaining: RECOVERY_GAMES_REQUIRED - state.recoveryGamesCompleted,
    };
  } catch {
    return { recovered: false, gamesRemaining: 0 };
  }
}

/**
 * Clear the recovery state (called when recovery expires or user dismisses).
 */
export async function clearStreakRecovery(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.RECOVERY_STATE);
  } catch {
    // Ignore
  }
}
