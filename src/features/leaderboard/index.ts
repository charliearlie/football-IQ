/**
 * Leaderboard Feature
 *
 * Real-time leaderboard ranking users by daily score, yearly score, and all-time IQ.
 */

// Types
export * from './types/leaderboard.types';

// Hooks
export { useLeaderboard } from './hooks/useLeaderboard';
export { useStickyMe } from './hooks/useStickyMe';

// Services
export {
  getDailyLeaderboard,
  getYearlyLeaderboard,
  getGlobalIQLeaderboard,
  getUserRank,
  getLeaderboardWithUserRank,
} from './services/leaderboardService';

// Utils
export {
  normalizeModeScore,
  calculateDailyScore,
  sortByScoreAndTime,
  applyDenseRanking,
  shouldShowStickyBar,
} from './utils/rankingUtils';

// Components
export { LeaderboardToggle } from './components/LeaderboardToggle';
export { LeaderboardEntry } from './components/LeaderboardEntry';
export { LeaderboardList } from './components/LeaderboardList';
export { StickyMeBar } from './components/StickyMeBar';
export { LeaderboardEmptyState } from './components/LeaderboardEmptyState';
