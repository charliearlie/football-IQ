/**
 * Who's That? Feature
 *
 * Wordle for footballers — guess the player in 6 tries with attribute feedback.
 */

// Types
export type {
  WhosThatContent,
  FeedbackColor,
  AttributeFeedback,
  GuessFeedback,
  WhosThatState,
  WhosThatRestorePayload,
  WhosThatAction,
  WhosThatAttemptMetadata,
} from './types/whosThat.types';

export {
  createInitialState,
  parseWhosThatContent,
} from './types/whosThat.types';

// Scoring
export type { WhosThatScore } from './utils/scoring';

export {
  calculateWhosThatScore,
  formatWhosThatScore,
  normalizeWhosThatScore,
} from './utils/scoring';

// Feedback
export { generateFeedback } from './utils/feedback';
export type { GuessInput } from './utils/feedback';

// Share
export {
  generateWhosThatEmojiGrid,
  generateWhosThatShareText,
  shareWhosThatResult,
} from './utils/share';

// Score Display
export {
  generateScoreDisplay,
  generateScoreDescription,
} from './utils/scoreDisplay';

// Hook
export { useWhosThat, whosThatReducer } from './hooks/useWhosThat';
export type { ShareResult } from './hooks/useWhosThat';

// Screen
export { WhosThatScreen } from './screens/WhosThatScreen';

// Components
export { WhosThatGuessRow } from './components/WhosThatGuessRow';
export { WhosThatGrid } from './components/WhosThatGrid';
export { WhosThatActionZone } from './components/WhosThatActionZone';
export { WhosThatResultModal } from './components/WhosThatResultModal';
