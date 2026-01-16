/**
 * Starting XI Feature Module
 *
 * Exports all public components, hooks, types, and utilities
 * for the Starting XI game mode.
 */

// Screen
export { StartingXIScreen } from './screens/StartingXIScreen';

// Components
export { LineupPitch } from './components/LineupPitch';
export { PlayerMarker } from './components/PlayerMarker';
export { PitchBackground } from './components/PitchBackground';
export { StartingXIResultModal } from './components/StartingXIResultModal';

// Hook
export { useStartingXIGame } from './hooks/useStartingXIGame';

// Types
export type {
  PositionKey,
  PositionCoords,
  FormationName,
  LineupPlayer,
  LineupContent,
  PlayerSlotState,
  SlotIndex,
  StartingXIState,
  StartingXIScore,
  StartingXIAction,
  StartingXIMeta,
} from './types/startingXI.types';

// Constants
export {
  POSITION_MAP,
  FORMATIONS,
  extractSurname,
  getPositionCoords,
  isValidFormation,
  getFormationNames,
} from './constants/formations';

// Utilities
export {
  calculateStartingXIScore,
  calculateScoreFromSlots,
  isPerfectScore,
  normalizeScore,
} from './utils/scoring';

export {
  generateStartingXIEmojiGrid,
  generateLinearEmojiDisplay,
  formatScoreDisplay,
  generateScoreDisplayString,
} from './utils/scoreDisplay';

export {
  generateShareText,
  shareStartingXIResult,
} from './utils/share';
