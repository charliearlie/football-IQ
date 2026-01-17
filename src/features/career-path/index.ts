/**
 * Career Path Feature Module
 *
 * The flagship game mode where players guess a footballer
 * based on their career history revealed step by step.
 */

// Screen
export { CareerPathScreen } from './screens/CareerPathScreen';

// Components
export { TimelineStepRow } from './components/TimelineStepRow';
export { CareerStepCard } from './components/CareerStepCard'; // Legacy - kept for reference
export { LockedCard } from './components/LockedCard'; // Legacy - kept for reference
export { ActionZone } from './components/ActionZone';
export { GameOverActionZone } from './components/GameOverActionZone';
export { GameResultModal } from './components/GameResultModal';
export { Confetti } from './components/Confetti';

// Constants
export { getTimelineConfig, getDeviceSize, TIMELINE_ANIMATIONS, LAYOUT } from './constants/timeline';
export type { TimelineConfig, DeviceSize } from './constants/timeline';

// Hooks
export { useCareerPathGame } from './hooks/useCareerPathGame';

// Utilities
export { validateGuess, normalizeString, MATCH_THRESHOLD } from './utils/validation';
export { calculateScore } from './utils/scoring';
export type { GameScore } from './utils/scoring';
export { generateScoreDisplay, generateEmojiGrid } from './utils/scoreDisplay';
export { shareGameResult, copyToClipboard } from './utils/share';
export type { ShareResult, ShareOptions } from './utils/share';

// Types
export type {
  CareerStep,
  CareerPathContent,
  CareerPathState,
  CareerPathAction,
  GameStatus,
} from './types/careerPath.types';
