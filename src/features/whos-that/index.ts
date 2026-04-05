/**
 * Balldle Feature
 *
 * Wordle for footballers — guess the player in 6 tries with attribute feedback.
 */

// Types
export type {
  BalldeContent,
  FeedbackColor,
  AttributeFeedback,
  GuessFeedback,
  BalldeState,
  BalldeRestorePayload,
  BalldeAction,
  BalldeAttemptMetadata,
} from './types/balldle.types';

export {
  createInitialState,
  parseBalldeContent,
} from './types/balldle.types';

// Scoring
export type { BalldeScore } from './utils/scoring';

export {
  calculateBalldeScore,
  formatBalldeScore,
  normalizeBalldeScore,
} from './utils/scoring';

// Feedback
export { generateFeedback } from './utils/feedback';
export type { GuessInput } from './utils/feedback';

// Share
export {
  generateBalldeEmojiGrid,
  generateBalldeShareText,
  shareBalldeResult,
} from './utils/share';

// Score Display
export {
  generateScoreDisplay,
  generateScoreDescription,
} from './utils/scoreDisplay';

// Hook
export { useBalldle, balldeReducer } from './hooks/useBalldle';
export type { ShareResult } from './hooks/useBalldle';

// Screen
export { BalldeScreen } from './screens/BalldeScreen';

// Components
export { BalldeGuessRow } from './components/BalldeGuessRow';
export { BalldeGrid } from './components/BalldeGrid';
export { BalldeActionZone } from './components/BalldeActionZone';
export { BalldeResultModal } from './components/BalldeResultModal';
