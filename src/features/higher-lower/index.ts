/**
 * Higher/Lower Feature
 *
 * Game mode where players guess if the next transfer fee is higher or lower.
 * 10 rounds total — one wrong answer ends the game.
 */

// Types
export type {
  StatType,
  HigherLowerEntry,
  TransferPairPlayer,
  TransferPair,
  HigherLowerContent,
  HigherLowerState,
  HigherLowerRestorePayload,
  HigherLowerAction,
  HigherLowerAttemptMetadata,
} from './types/higherLower.types';

export {
  createInitialState,
  parseHigherLowerContent,
} from './types/higherLower.types';

// Scoring
export type { HigherLowerScore } from './utils/scoring';

export {
  calculateHigherLowerScore,
  formatHigherLowerScore,
  normalizeHigherLowerScore,
} from './utils/scoring';

// Share
export {
  generateHigherLowerEmojiGrid,
  generateHigherLowerShareText,
  shareHigherLowerResult,
} from './utils/share';

// Score Display
export {
  generateScoreDisplay,
  generateScoreDescription,
} from './utils/scoreDisplay';

// Value formatting
export { formatStatValue } from './utils/formatStatValue';

// Hook
export { useHigherLower, higherLowerReducer } from './hooks/useHigherLower';
export type { ShareResult } from './hooks/useHigherLower';

// Screen
export { HigherLowerScreen } from './screens/HigherLowerScreen';

// Components
export { TransferCard } from './components/TransferCard';
export { HigherLowerActionZone } from './components/HigherLowerActionZone';
export { HigherLowerResultModal } from './components/HigherLowerResultModal';
export { HigherLowerReviewList } from './components/HigherLowerReviewList';
