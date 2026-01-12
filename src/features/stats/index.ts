/**
 * Stats Feature
 *
 * My IQ profile screen components and utilities for calculating
 * and displaying user performance across all game modes.
 */

// Types
export * from './types/stats.types';

// Hooks
export { usePerformanceStats } from './hooks/usePerformanceStats';

// Utilities
export {
  normalizeScore,
  isPerfectScore,
  calculateProficiency,
  calculateGlobalIQ,
  calculateBadges,
} from './utils/iqCalculation';

// Components
export { ProfileHeader } from './components/ProfileHeader';
export { IQScoreDisplay } from './components/IQScoreDisplay';
export { ProficiencyBar } from './components/ProficiencyBar';
export { ProficiencySection } from './components/ProficiencySection';
export { TrophyRoom } from './components/TrophyRoom';
export { StatsGrid } from './components/StatsGrid';
export { IQCardOverlay } from './components/IQCardOverlay';

// Share utilities
export type { IQCardData, ShareIQResult } from './utils/shareIQ';
export { captureIQCard, shareIQCard, captureAndShareIQCard } from './utils/shareIQ';

// Score Distribution
export { ScoreDistributionContainer } from './components/ScoreDistributionContainer';
export { ScoreDistributionGraph } from './components/ScoreDistributionGraph';
export { ScoreDistributionSkeleton } from './components/ScoreDistributionSkeleton';
export { useScoreDistribution } from './hooks/useScoreDistribution';
export {
  getPuzzleScoreDistribution,
  type DistributionEntry,
  type DistributionResult,
} from './services/distributionService';
export {
  calculateDistributionBuckets,
  normalizeDistribution,
  getPercentileRank,
  type ScoreCount,
  type DistributionBucket,
} from './utils/distributionLogic';
export {
  getMaxScoreForMode,
  getBucketSizeForMode,
  getBarCountForMode,
  getScoreLabelsForMode,
  normalizeScoreForMode,
} from './utils/distributionConfig';
