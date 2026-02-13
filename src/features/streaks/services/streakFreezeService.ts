/**
 * Streak Freeze Service
 *
 * Manages the streak freeze economy using AsyncStorage.
 * Handles freeze inventory, consumption, and milestone awards.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConsumeFreezeResult, MilestoneAwardResult, FreezeSource } from '../types/streakFreeze.types';

/**
 * AsyncStorage keys for freeze data persistence.
 */
const FREEZE_KEYS = {
  AVAILABLE_COUNT: '@streak_freeze_count',
  USED_DATES: '@streak_freeze_used_dates',
  LAST_MILESTONE: '@streak_freeze_last_milestone',
  INITIAL_GRANTED: '@streak_freeze_initial_granted',
} as const;

/**
 * Maximum freezes a free user can hold in inventory.
 */
const MAX_FREEZES = 3;

/**
 * Get the number of freezes available in inventory.
 * Defaults to 0 if not set.
 */
export async function getAvailableFreezes(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(FREEZE_KEYS.AVAILABLE_COUNT);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('[StreakFreeze] Failed to get available freezes:', error);
    return 0;
  }
}

/**
 * Get all dates where freezes have been used (YYYY-MM-DD format).
 * Used by calculateStreak to treat these dates as consecutive.
 */
export async function getUsedFreezeDates(): Promise<string[]> {
  try {
    const value = await AsyncStorage.getItem(FREEZE_KEYS.USED_DATES);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('[StreakFreeze] Failed to get used freeze dates:', error);
    return [];
  }
}

/**
 * Get the last milestone where a freeze was awarded.
 * Used to prevent duplicate awards at the same milestone.
 */
async function getLastMilestone(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(FREEZE_KEYS.LAST_MILESTONE);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('[StreakFreeze] Failed to get last milestone:', error);
    return 0;
  }
}

/**
 * Set the number of available freezes.
 */
async function setAvailableFreezes(count: number): Promise<void> {
  try {
    await AsyncStorage.setItem(FREEZE_KEYS.AVAILABLE_COUNT, count.toString());
  } catch (error) {
    console.error('[StreakFreeze] Failed to set available freezes:', error);
  }
}

/**
 * Set the used freeze dates array.
 */
async function setUsedFreezeDates(dates: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FREEZE_KEYS.USED_DATES, JSON.stringify(dates));
  } catch (error) {
    console.error('[StreakFreeze] Failed to set used freeze dates:', error);
  }
}

/**
 * Set the last milestone where a freeze was awarded.
 */
async function setLastMilestone(milestone: number): Promise<void> {
  try {
    await AsyncStorage.setItem(FREEZE_KEYS.LAST_MILESTONE, milestone.toString());
  } catch (error) {
    console.error('[StreakFreeze] Failed to set last milestone:', error);
  }
}

/**
 * Grant the initial freeze to a new user (called once on first app launch).
 * Checks if already granted to prevent duplicates.
 *
 * @returns Whether the initial freeze was granted (false if already granted).
 */
export async function grantInitialFreeze(): Promise<boolean> {
  try {
    const alreadyGranted = await AsyncStorage.getItem(FREEZE_KEYS.INITIAL_GRANTED);
    if (alreadyGranted) {
      return false;
    }

    // Grant 1 freeze and mark as granted
    await setAvailableFreezes(1);
    await AsyncStorage.setItem(FREEZE_KEYS.INITIAL_GRANTED, 'true');
    return true;
  } catch (error) {
    console.error('[StreakFreeze] Failed to grant initial freeze:', error);
    return false;
  }
}

/**
 * Consume a freeze for a specific date (auto-apply when streak would break).
 *
 * @param date - The date (YYYY-MM-DD) to apply the freeze to.
 * @param isPremium - Whether the user has premium subscription.
 * @returns Result with success status, remaining freezes, and source.
 */
export async function consumeFreeze(
  date: string,
  isPremium: boolean
): Promise<ConsumeFreezeResult> {
  try {
    // Premium users have unlimited freezes
    if (isPremium) {
      const usedDates = await getUsedFreezeDates();
      // Add date if not already used
      if (!usedDates.includes(date)) {
        await setUsedFreezeDates([...usedDates, date]);
      }
      return {
        success: true,
        remainingFreezes: Infinity,
        source: 'premium',
      };
    }

    // Free users: check if freeze available
    const available = await getAvailableFreezes();
    if (available <= 0) {
      return {
        success: false,
        remainingFreezes: 0,
        source: 'earned',
      };
    }

    // Consume freeze
    const newCount = available - 1;
    await setAvailableFreezes(newCount);

    // Add date to used dates
    const usedDates = await getUsedFreezeDates();
    if (!usedDates.includes(date)) {
      await setUsedFreezeDates([...usedDates, date]);
    }

    // Determine source (earned vs initial)
    const source: FreezeSource = available === 1 && newCount === 0 ? 'initial' : 'earned';

    return {
      success: true,
      remainingFreezes: newCount,
      source,
    };
  } catch (error) {
    console.error('[StreakFreeze] Failed to consume freeze:', error);
    return {
      success: false,
      remainingFreezes: 0,
      source: 'earned',
    };
  }
}

/**
 * Award a freeze for reaching a 7-day milestone.
 * Caps at MAX_FREEZES for free users.
 *
 * @param milestone - The milestone reached (7, 14, 21...).
 */
export async function awardFreeze(milestone: number): Promise<void> {
  try {
    const available = await getAvailableFreezes();
    if (available < MAX_FREEZES) {
      await setAvailableFreezes(available + 1);
    }
    await setLastMilestone(milestone);
  } catch (error) {
    console.error('[StreakFreeze] Failed to award freeze:', error);
  }
}

/**
 * Check if the current streak has reached a new 7-day milestone and award a freeze.
 * Premium users don't earn freezes (they have unlimited).
 *
 * @param currentStreak - The current streak count.
 * @param isPremium - Whether the user has premium subscription.
 * @returns Result with awarded status, milestone, and total freezes.
 */
export async function checkAndAwardMilestoneFreeze(
  currentStreak: number,
  isPremium: boolean
): Promise<MilestoneAwardResult> {
  try {
    // Premium users don't earn freezes
    if (isPremium) {
      return {
        awarded: false,
        totalFreezes: Infinity,
      };
    }

    // Check if current streak is a 7-day multiple
    if (currentStreak === 0 || currentStreak % 7 !== 0) {
      const totalFreezes = await getAvailableFreezes();
      return {
        awarded: false,
        totalFreezes,
      };
    }

    // Check if we've already awarded for this milestone
    const lastMilestone = await getLastMilestone();
    if (currentStreak <= lastMilestone) {
      const totalFreezes = await getAvailableFreezes();
      return {
        awarded: false,
        totalFreezes,
      };
    }

    // Award the freeze
    await awardFreeze(currentStreak);
    const totalFreezes = await getAvailableFreezes();

    return {
      awarded: true,
      milestone: currentStreak,
      totalFreezes,
    };
  } catch (error) {
    console.error('[StreakFreeze] Failed to check and award milestone freeze:', error);
    return {
      awarded: false,
      totalFreezes: 0,
    };
  }
}
