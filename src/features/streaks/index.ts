/**
 * Streak Freeze Feature
 *
 * Provides streak protection mechanics to retain users through occasional missed days.
 */

// Types
export type {
  StreakFreezeState,
  FreezeSource,
  ConsumeFreezeResult,
  MilestoneAwardResult,
} from './types/streakFreeze.types';

// Services
export {
  getAvailableFreezes,
  getUsedFreezeDates,
  grantInitialFreeze,
  consumeFreeze,
  awardFreeze,
  checkAndAwardMilestoneFreeze,
} from './services/streakFreezeService';
