/**
 * Connections Feature
 *
 * A 4x4 grid puzzle where players identify 4 groups of 4 related footballers.
 *
 * @example
 * // Screen usage
 * import { ConnectionsScreen } from '@/features/connections';
 * <ConnectionsScreen puzzleId={puzzleId} />
 *
 * // Hook usage
 * import { useConnectionsGame } from '@/features/connections';
 * const { state, content, togglePlayer, submitGuess } = useConnectionsGame(puzzle);
 */

// Screen
export { ConnectionsScreen } from './screens/ConnectionsScreen';

// Hook
export { useConnectionsGame } from './hooks/useConnectionsGame';

// Components
export { ConnectionsGrid } from './components/ConnectionsGrid';
export { ConnectionsCell } from './components/ConnectionsCell';
export { GroupReveal } from './components/GroupReveal';
export { MistakeIndicator } from './components/MistakeIndicator';
export { ConnectionsActionBar } from './components/ConnectionsActionBar';
export { ConnectionsResultModal } from './components/ConnectionsResultModal';

// Utils
export {
  calculateConnectionsScore,
  getConnectionsScoreLabel,
  normalizeConnectionsScore,
} from './utils/scoring';

export {
  generateConnectionsEmojiGrid,
  generateConnectionsShareText,
  shareConnectionsResult,
} from './utils/share';
export type { ShareResult } from './utils/share';

// Types
export type {
  ConnectionsDifficulty,
  ConnectionsGroup,
  ConnectionsContent,
  ConnectionsGuess,
  ConnectionsScore,
  ConnectionsState,
  ConnectionsAction,
  ConnectionsAttemptMetadata,
  RestoreProgressPayload,
} from './types/connections.types';

export {
  createInitialState,
  parseConnectionsContent,
} from './types/connections.types';
