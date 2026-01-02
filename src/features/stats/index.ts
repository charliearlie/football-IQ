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
