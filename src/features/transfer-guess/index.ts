/**
 * Transfer Guess Feature
 *
 * Game mode where players guess a footballer based on transfer details.
 * Players see clubs, year, and fee - with optional hints for point penalties.
 */

// Screen
export { TransferGuessScreen } from './screens/TransferGuessScreen';

// Components
export { MarketMovementHeader } from './components/MarketMovementHeader';
export { DossierSlot } from './components/DossierSlot';
export { DossierGrid } from './components/DossierGrid';
export { TransferGameOverZone } from './components/TransferGameOverZone';
export { TransferActionZone } from './components/TransferActionZone';
export { TransferResultModal } from './components/TransferResultModal';

// Hook
export { useTransferGuessGame } from './hooks/useTransferGuessGame';

// Utils
export {
  calculateTransferScore,
  formatTransferScore,
  MAX_POINTS,
  MAX_GUESSES as SCORING_MAX_GUESSES,
  MAX_HINTS as SCORING_MAX_HINTS,
  type TransferGuessScore,
} from './utils/transferScoring';
export {
  generateTransferScoreDisplay,
  generateTransferEmojiGrid,
} from './utils/transferScoreDisplay';
export { shareTransferResult, copyToClipboard } from './utils/transferShare';

// Types
export type {
  TransferGuessContent,
  TransferGuessState,
  TransferGuessAction,
  GameStatus,
  HintLabel,
} from './types/transferGuess.types';
export { HINT_LABELS, MAX_GUESSES, MAX_HINTS } from './types/transferGuess.types';
