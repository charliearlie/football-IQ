/**
 * Type definitions for The Grid game mode.
 *
 * The Grid is a 3x3 matrix puzzle where players fill all 9 cells by naming
 * footballers who satisfy both row (Y-axis) and column (X-axis) criteria.
 */

/**
 * Category types for icons and future validation.
 */
export type CategoryType = 'club' | 'nation' | 'stat' | 'trophy';

/**
 * A category used in grid headers (rows and columns).
 */
export interface GridCategory {
  type: CategoryType;
  value: string; // e.g., "Real Madrid", "France", "100+ Goals", "Champions League"
  /** Club primary color (HEX) — enriched at runtime for club categories */
  primaryColor?: string;
  /** Club secondary color (HEX) — enriched at runtime for club categories */
  secondaryColor?: string;
}

/**
 * The Grid puzzle content structure.
 * Stored in daily_puzzles.content JSON field.
 */
export interface TheGridContent {
  /** Column headers (X-axis) - displayed at top */
  xAxis: [GridCategory, GridCategory, GridCategory];
  /** Row headers (Y-axis) - displayed on left */
  yAxis: [GridCategory, GridCategory, GridCategory];
  /** Valid player answers for each cell (0-8) */
  valid_answers: {
    [cellIndex: string]: string[];
  };
}

/**
 * Cell index type (0-8 for 3x3 grid).
 */
export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * A filled cell with player data and optional rarity info.
 */
export interface FilledCell {
  /** Player display name */
  player: string;
  /** Wikidata QID for rarity lookup */
  playerId?: string;
  /** ISO 3166-1 alpha-2 code for flag display */
  nationalityCode?: string;
  /** Rarity percentage (0-100), undefined until fetched */
  rarityPct?: number;
  /** True while fetching rarity from server */
  rarityLoading?: boolean;
}

/**
 * Rarity data for a single cell returned from server.
 */
export interface CellRarityData {
  cellIndex: number;
  playerId: string;
  playerName: string;
  nationalityCode: string | null;
  rarityPct: number;
  selectionCount: number;
  cellTotal: number;
}

/**
 * Grid IQ score calculation result.
 * Lower rarity = higher IQ (obscure picks rewarded).
 */
export interface GridIQScore {
  /** Sum of (100 - rarityPct) for each filled cell */
  totalRarityScore: number;
  /** Maximum possible (9 * 100 = 900) */
  maxScore: number;
  /** Normalized 0-100 IQ score */
  gridIQ: number;
  /** Per-cell breakdown */
  cellScores: {
    cellIndex: number;
    player: string;
    rarityPct: number;
    iqContribution: number;
  }[];
}

/**
 * Score structure for The Grid.
 */
export interface TheGridScore {
  /** Points earned (0-100) */
  points: number;
  /** Maximum possible points */
  maxPoints: 100;
  /** Number of cells filled (0-9) */
  cellsFilled: number;
}

/**
 * The Grid game state.
 */
export interface TheGridState {
  /** Array of 9 cells, null = empty */
  cells: (FilledCell | null)[];
  /** Currently selected cell for input */
  selectedCell: CellIndex | null;
  /** Current guess text in input */
  currentGuess: string;
  /** Game status */
  gameStatus: 'playing' | 'complete' | 'gave_up';
  /** Score when game completes */
  score: TheGridScore | null;
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved */
  attemptSaved: boolean;
  /** Triggers shake animation on incorrect guess */
  lastGuessIncorrect: boolean;
}

/**
 * Payload for restoring progress from saved attempt.
 */
export interface RestoreProgressPayload {
  cells: (FilledCell | null)[];
  attemptId: string;
}

/**
 * Actions for The Grid game reducer.
 */
export type TheGridAction =
  | { type: 'SELECT_CELL'; payload: CellIndex }
  | { type: 'DESELECT_CELL' }
  | { type: 'SET_CURRENT_GUESS'; payload: string }
  | {
      type: 'CORRECT_GUESS';
      payload: {
        cellIndex: CellIndex;
        player: string;
        playerId?: string;
        nationalityCode?: string;
      };
    }
  | { type: 'INCORRECT_GUESS' }
  | { type: 'CLEAR_INCORRECT' }
  | { type: 'SET_CELL_RARITY'; payload: { cellIndex: CellIndex; rarityPct: number } }
  | { type: 'SET_RARITY_LOADING'; payload: { cellIndex: CellIndex; loading: boolean } }
  | { type: 'GAME_COMPLETE'; payload: TheGridScore }
  | { type: 'GIVE_UP'; payload: TheGridScore }
  | { type: 'SET_ATTEMPT_ID'; payload: string }
  | { type: 'RESTORE_PROGRESS'; payload: RestoreProgressPayload }
  | { type: 'MARK_ATTEMPT_SAVED' }
  | { type: 'RESET_GAME' };

/**
 * Initial state for The Grid game.
 */
export function createInitialState(): TheGridState {
  return {
    cells: [null, null, null, null, null, null, null, null, null],
    selectedCell: null,
    currentGuess: '',
    gameStatus: 'playing',
    score: null,
    attemptId: null,
    attemptSaved: false,
    lastGuessIncorrect: false,
  };
}

/**
 * Parse and validate The Grid content from puzzle JSON.
 * Returns null if content is not valid TheGridContent.
 *
 * @param content - Raw content from puzzle
 * @returns Parsed TheGridContent or null
 */
export function parseTheGridContent(content: unknown): TheGridContent | null {
  if (!content || typeof content !== 'object') {
    return null;
  }

  const obj = content as Record<string, unknown>;

  // Check for required xAxis and yAxis arrays
  if (!Array.isArray(obj.xAxis) || obj.xAxis.length !== 3) {
    return null;
  }
  if (!Array.isArray(obj.yAxis) || obj.yAxis.length !== 3) {
    return null;
  }

  // Validate xAxis categories
  for (const cat of obj.xAxis) {
    if (!isValidGridCategory(cat)) {
      return null;
    }
  }

  // Validate yAxis categories
  for (const cat of obj.yAxis) {
    if (!isValidGridCategory(cat)) {
      return null;
    }
  }

  // Parse valid_answers (optional, default to empty object)
  const validAnswers: { [key: string]: string[] } = {};
  if (obj.valid_answers && typeof obj.valid_answers === 'object') {
    const answers = obj.valid_answers as Record<string, unknown>;
    for (const key of Object.keys(answers)) {
      if (Array.isArray(answers[key])) {
        validAnswers[key] = (answers[key] as unknown[]).filter(
          (item): item is string => typeof item === 'string'
        );
      }
    }
  }

  return {
    xAxis: obj.xAxis as [GridCategory, GridCategory, GridCategory],
    yAxis: obj.yAxis as [GridCategory, GridCategory, GridCategory],
    valid_answers: validAnswers,
  };
}

/**
 * Check if a value is a valid GridCategory.
 */
function isValidGridCategory(value: unknown): value is GridCategory {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Must have type as valid CategoryType
  const validTypes: CategoryType[] = ['club', 'nation', 'stat', 'trophy'];
  if (typeof obj.type !== 'string' || !validTypes.includes(obj.type as CategoryType)) {
    return false;
  }

  // Must have value as string
  if (typeof obj.value !== 'string') {
    return false;
  }

  return true;
}

/**
 * Metadata structure saved with The Grid attempts.
 * Used for IQ calculation and review mode.
 */
export interface TheGridAttemptMetadata {
  cellsFilled: number;
  cells?: (FilledCell | null)[];
  gaveUp?: boolean;
}
