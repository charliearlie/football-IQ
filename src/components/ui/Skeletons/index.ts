/**
 * Skeleton Components - High-fidelity loading placeholders
 *
 * All skeletons use moti/skeleton with theme-consistent colors
 * to provide smooth shimmer animations during data loading.
 */

// Base components
export { SkeletonBox, SkeletonGroup, SKELETON_COLORS } from './SkeletonBase';

// Home screen skeleton
export { DailyStackCardSkeleton } from './DailyStackCardSkeleton';

// Archive screen skeletons
export {
  MonthHeaderSkeleton,
  ArchiveCardSkeleton,
  ArchiveSkeletonList,
} from './ArchiveSkeletons';

// Stats screen skeletons
export {
  ProfileHeaderSkeleton,
  IQScoreDisplaySkeleton,
  ProficiencyBarSkeleton,
  ProficiencySectionSkeleton,
  StatsGridSkeleton,
  FullStatsSkeleton,
} from './StatsSkeletons';
