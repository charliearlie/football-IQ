/**
 * The Grid Feature
 *
 * A 3x3 matrix puzzle where players fill all 9 cells by naming
 * footballers who satisfy both row (Y-axis) and column (X-axis) criteria.
 *
 * @example
 * // Screen usage
 * import { TheGridScreen } from '@/features/the-grid';
 * <TheGridScreen puzzleId={puzzleId} />
 *
 * // Hook usage
 * import { useTheGridGame } from '@/features/the-grid';
 * const { state, gridContent, selectCell, submitGuess } = useTheGridGame(puzzle);
 *
 * // Validation
 * import { validateCellGuess, getCellCategories } from '@/features/the-grid';
 * const result = validateCellGuess('Messi', 4, content);
 */

// Screen
export { TheGridScreen } from './screens/TheGridScreen';

// Hook
export { useTheGridGame } from './hooks/useTheGridGame';

// Components
export { TheGridBoard } from './components/TheGridBoard';
export { GridCell } from './components/GridCell';
export { CategoryHeader } from './components/CategoryHeader';
export { TheGridActionZone } from './components/TheGridActionZone';
export { TheGridResultModal } from './components/TheGridResultModal';

// Utils
export {
  validateCellGuess,
  getCellCategories,
  isValidCellIndex,
  getEmptyCells,
  countFilledCells,
} from './utils/validation';

export {
  calculateGridScore,
  calculateScoreFromCells,
  isGridComplete,
  normalizeGridScore,
  isPerfectGridScore,
} from './utils/scoring';

export {
  generateGridEmojiDisplay,
  getResultEmoji,
  getResultMessage,
  generateTheGridScoreDisplay,
} from './utils/scoreDisplay';

export { shareTheGridResult } from './utils/share';
export type { ShareResult } from './utils/share';

// Types
export type {
  CategoryType,
  GridCategory,
  TheGridContent,
  CellIndex,
  FilledCell,
  TheGridScore,
  TheGridState,
  TheGridAction,
  RestoreProgressPayload,
  TheGridAttemptMetadata,
} from './types/theGrid.types';

export {
  createInitialState,
  parseTheGridContent,
} from './types/theGrid.types';
