/**
 * Streak Feature
 *
 * Provides streak protection mechanics and milestone rewards.
 */

// Freeze Types
export type {
  StreakFreezeState,
  FreezeSource,
  ConsumeFreezeResult,
  MilestoneAwardResult,
} from './types/streakFreeze.types';

// Milestone Types
export type {
  StreakMilestone,
  MilestoneReward,
  MilestoneCheckResult,
  StreakRecoveryState,
} from './types/streakMilestone.types';

// Freeze Services
export {
  getAvailableFreezes,
  getUsedFreezeDates,
  grantInitialFreeze,
  consumeFreeze,
  awardFreeze,
  checkAndAwardMilestoneFreeze,
} from './services/streakFreezeService';

// Milestone Services
export {
  STREAK_MILESTONES,
  checkStreakMilestone,
  getArchiveUnlocks,
  grantArchiveUnlocks,
  consumeArchiveUnlock,
  getStreakRecoveryState,
  startStreakRecovery,
  recordRecoveryGame,
  clearStreakRecovery,
} from './services/streakMilestoneService';
