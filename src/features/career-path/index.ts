/**
 * Career Path Feature Module
 *
 * The flagship game mode where players guess a footballer
 * based on their career history revealed step by step.
 */

// Screen
export { CareerPathScreen } from './screens/CareerPathScreen';

// Components
export { CareerStepCard } from './components/CareerStepCard';
export { LockedCard } from './components/LockedCard';
export { ActionZone } from './components/ActionZone';
export { GameResultBanner } from './components/GameResultBanner';
export { GameResultModal } from './components/GameResultModal';
export { Confetti } from './components/Confetti';

// Hooks
export { useCareerPathGame } from './hooks/useCareerPathGame';

// Utilities
export { validateGuess, normalizeString, MATCH_THRESHOLD } from './utils/validation';
export { calculateScore, formatScore } from './utils/scoring';
export type { GameScore } from './utils/scoring';
export { generateScoreDisplay, generateEmojiGrid } from './utils/scoreDisplay';
export { shareGameResult, copyToClipboard } from './utils/share';
export type { ShareResult } from './utils/share';

// Types
export type {
  CareerStep,
  CareerPathContent,
  CareerPathState,
  CareerPathAction,
  GameStatus,
} from './types/careerPath.types';
