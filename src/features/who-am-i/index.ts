/**
 * Who Am I? Feature
 *
 * Game mode where players guess a footballer from 5 progressive clues.
 * Fewer clues needed = higher score.
 */

// Types
export type {
  WhoAmIClue,
  WhoAmIContent,
  WhoAmIGameStatus,
  WhoAmIState,
  WhoAmIRestorePayload,
  WhoAmIAction,
  WhoAmIAttemptMetadata,
} from './types/whoAmI.types';

export {
  createInitialState,
  parseWhoAmIContent,
} from './types/whoAmI.types';

// Scoring
export type { WhoAmIScore } from './utils/scoring';

export {
  calculateWhoAmIScore,
  formatWhoAmIScore,
  normalizeWhoAmIScore,
} from './utils/scoring';

// Share
export {
  generateWhoAmIEmojiGrid,
  generateWhoAmIShareText,
  shareWhoAmIResult,
} from './utils/share';

// Score Display
export {
  generateScoreDisplay,
  generateScoreDescription,
} from './utils/scoreDisplay';

// Hook
export { useWhoAmIGame, whoAmIReducer } from './hooks/useWhoAmIGame';
export type { ShareResult } from './hooks/useWhoAmIGame';

// Screen
export { WhoAmIScreen } from './screens/WhoAmIScreen';

// Components
export { ClueCard } from './components/ClueCard';
export { WhoAmIActionZone } from './components/WhoAmIActionZone';
export { WhoAmIResultModal } from './components/WhoAmIResultModal';
