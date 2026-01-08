// Home feature exports

// Components
export { StreakHeader } from './components/StreakHeader';
export { DailyStackCard } from './components/DailyStackCard';
export { CompletedGameModal } from './components/CompletedGameModal';

// Hooks
export { useUserStats, calculateStreak } from './hooks/useUserStats';
export type { UserStats, UseUserStatsResult } from './hooks/useUserStats';

export { useDailyPuzzles } from './hooks/useDailyPuzzles';
export type {
  CardStatus,
  DailyPuzzleCard,
  UseDailyPuzzlesResult,
} from './hooks/useDailyPuzzles';
