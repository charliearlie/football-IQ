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
export * from './types/fieldExperience.types';

// Scout Report Components
export {
  ElitePlayerCard,
  PlayerGrade,
  TacticalRadarChart,
  ShieldBadge,
  TrophyCase,
  RankBadge,
  ArchetypeLabel,
} from './components/ScoutReport';
export type {
  ElitePlayerCardProps,
  PlayerGradeLevel,
  TacticalRadarChartProps,
  ShieldBadgeProps,
  TrophyCaseProps,
  RankBadgeProps,
  ArchetypeLabelProps,
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

// Tier Progression System
export {
  IQ_TIERS,
  getTierForPoints,
  getProgressToNextTier,
  getPointsToNextTier,
  getTierColor,
  getNextTier,
  formatTotalIQ,
} from './utils/tierProgression';
export type { IQTier } from './utils/tierProgression';

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

// Field Experience
export {
  calculateFieldExperience,
  getDominantMode,
  ALL_GAME_MODES,
} from './utils/fieldExperience';

// Deep Dive components
export { BestDayCard } from './components/BestDayCard';
export type { BestDayCardProps } from './components/BestDayCard';
export { WeakSpotCTA } from './components/WeakSpotCTA';
export type { WeakSpotCTAProps } from './components/WeakSpotCTA';
export { PercentileTag } from './components/PercentileTag';
export type { PercentileTagProps } from './components/PercentileTag';

// Scouting Report
export { FieldExperienceSection } from './components/FieldExperienceSection';
export type { FieldExperienceSectionProps } from './components/FieldExperienceSection';
export { DetailedModeStatsSection } from './components/DetailedModeStatsSection';
export type { DetailedModeStatsSectionProps } from './components/DetailedModeStatsSection';
export { ScoutingReportCard, generateDeepLink } from './components/ScoutingReportCard';
export type { ScoutingReportData, ScoutingReportCardProps } from './components/ScoutingReportCard';
export { ScoutingReportOverlay } from './components/ScoutingReportOverlay';
export type { ScoutingReportOverlayProps } from './components/ScoutingReportOverlay';
export {
  captureScoutingReport,
  shareScoutingReport,
  captureAndShareScoutingReport,
  generateShareText,
} from './utils/shareScoutingReport';
export type { ShareResult } from './utils/shareScoutingReport';

// Scout Report Upgrade Components
export { FormGuideStrip } from './components/FormGuideStrip';
export type { FormGuideStripProps } from './components/FormGuideStrip';
export { ScoutingVerdictCard } from './components/ScoutingVerdictCard';
export type { ScoutingVerdictCardProps } from './components/ScoutingVerdictCard';
export { SignatureStrengthCard } from './components/SignatureStrengthCard';
export type { SignatureStrengthCardProps } from './components/SignatureStrengthCard';
export { MonthReportCard } from './components/MonthReportCard';
export type { MonthReportCardProps } from './components/MonthReportCard';
export { FormationLabel } from './components/FormationLabel';
export type { FormationLabelProps } from './components/FormationLabel';
export { NextMilestoneTicker } from './components/NextMilestoneTicker';
export type { NextMilestoneTickerProps } from './components/NextMilestoneTicker';

// Pro-tier stat visualizations (My IQ screen redesign)
export { KnowledgeProfile } from './components/KnowledgeProfile';
export type { KnowledgeProfileProps } from './components/KnowledgeProfile';
export { ClutchRating } from './components/ClutchRating';
export type { ClutchRatingProps } from './components/ClutchRating';
export { FormTrend } from './components/FormTrend';
export type { FormTrendProps } from './components/FormTrend';
export { SpeedProfile } from './components/SpeedProfile';
export type { SpeedProfileProps } from './components/SpeedProfile';
export { ModeMastery } from './components/ModeMastery';
export type { ModeMasteryProps } from './components/ModeMastery';
export { ProBlurOverlay } from './components/ProBlurOverlay';
export type { ProBlurOverlayProps } from './components/ProBlurOverlay';

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
