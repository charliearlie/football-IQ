/**
 * Stats Feature
 *
 * Scout Report dashboard (formerly My IQ) components and utilities
 * for calculating and displaying user performance across all game modes.
 *
 * The Scout Report features FIFA/EAFC-inspired visualizations including:
 * - Elite Player Card with dynamic grades and glow effects
 * - Tactical Radar Chart for 6-axis proficiency visualization
 * - Trophy Case with 3D shield badges
 * - Streak Calendar for season progress tracking
 */

// Types
export * from './types/stats.types';
export * from './types/calendar.types';

// Scout Report Components
export {
  ElitePlayerCard,
  PlayerGrade,
  TacticalRadarChart,
  ShieldBadge,
  TrophyCase,
} from './components/ScoutReport';
export type {
  ElitePlayerCardProps,
  PlayerGradeLevel,
  TacticalRadarChartProps,
  ShieldBadgeProps,
  TrophyCaseProps,
} from './components/ScoutReport';

// Hooks
export { usePerformanceStats } from './hooks/usePerformanceStats';
export { useStreakCalendar } from './hooks/useStreakCalendar';

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

// Streak Calendar
export { StreakCalendar } from './components/StreakCalendar';
export { MonthGrid } from './components/StreakCalendar';
export { DayCell } from './components/StreakCalendar';
export { DayDetailSheet } from './components/StreakCalendar';
export { MonthHeader } from './components/StreakCalendar';
export { LockedMonthOverlay } from './components/StreakCalendar';

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
