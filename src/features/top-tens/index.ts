/**
 * Top Tens Feature Module
 *
 * Top Tens is a ranking puzzle where players guess all 10 items in a top 10 list.
 * Correct guesses reveal at their rank position (like the TV show "Tenable").
 *
 * This is a premium-only game mode.
 */

// Screen
export { TopTensScreen } from './screens/TopTensScreen';

// Hook
export { useTopTensGame, topTensReducer } from './hooks/useTopTensGame';

// Components
export {
  RankCard,
  RankGrid,
  TopTensActionZone,
  TopTensResultModal,
  PremiumOnlyGate,
} from './components';

// Types
export type {
  TopTensContent,
  TopTensAnswer,
  TopTensState,
  TopTensAction,
  TopTensScore,
  TopTensGameStatus,
  RankSlotState,
  RankIndex,
  TopTensAttemptMetadata,
  RestoreProgressPayload,
  ClimbingState,
  StartClimbPayload,
} from './types/topTens.types';
export {
  parseTopTensContent,
  createInitialState,
  createInitialClimbingState,
} from './types/topTens.types';

// Utilities
export {
  validateTopTensGuess,
  findMatchingAnswer,
  StringMatcher,
} from './utils/validation';
export type {
  TopTensValidationResult,
  AnswerMatcher,
} from './utils/validation';

export {
  calculateTopTensScore,
  formatTopTensScore,
} from './utils/scoring';

export {
  generateTopTensEmojiGrid,
  generateTopTensScoreDisplay,
  generateTopTensTwoRowGrid,
} from './utils/scoreDisplay';
export type { ScoreDisplayOptions } from './utils/scoreDisplay';

export {
  shareTopTensResult,
  copyToClipboard,
} from './utils/share';
export type { ShareResult } from './utils/share';
