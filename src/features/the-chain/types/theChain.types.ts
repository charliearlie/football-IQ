/**
 * Type definitions for The Chain game mode.
 */

// Re-export scoring types
export {
  ChainScore,
  ChainScoreLabel,
  calculateChainScore,
  formatChainScore,
  getChainScoreEmoji,
  generateChainEmojiGrid,
} from "../utils/scoring";

/**
 * Player in the chain (start, end, or intermediate link).
 */
export interface ChainPlayer {
  /** Wikidata QID */
  qid: string;
  /** Display name */
  name: string;
  /** ISO 3166-1 alpha-2 nationality code */
  nationality_code?: string;
}

/**
 * Connection info between two linked players.
 */
export interface ChainLink {
  /** The player being linked to */
  player: ChainPlayer;
  /** Club where both players overlapped */
  shared_club_name: string;
  /** Club ID for potential styling */
  shared_club_id?: string;
  /** Start of overlap period */
  overlap_start: number;
  /** End of overlap period */
  overlap_end: number;
}

/**
 * The Chain puzzle content structure.
 * Stored in daily_puzzles.content JSON field.
 */
export interface TheChainContent {
  /** Starting player */
  start_player: ChainPlayer;
  /** Target end player */
  end_player: ChainPlayer;
  /** PAR (optimal number of steps) */
  par: number;
  /** Optional solution path for validation/hints */
  solution_path?: ChainPlayer[];
  /** Optional hint player (first step of solution) */
  hint_player?: ChainPlayer;
}

/**
 * Game status values.
 */
export type ChainGameStatus = "playing" | "complete" | "gave_up";

/**
 * The Chain game state.
 */
export interface TheChainState {
  /** Chain built so far: [start_player, ...links] */
  chain: ChainLink[];
  /** Current game status */
  gameStatus: ChainGameStatus;
  /** Score when game completes */
  score: import("../utils/scoring").ChainScore | null;
  /** Whether player search overlay is visible */
  isSearchOpen: boolean;
  /** Error state for invalid link */
  lastLinkInvalid: boolean;
  /** Loading state during RPC validation */
  isValidating: boolean;
  /** Unique attempt ID for persistence */
  attemptId: string | null;
  /** Whether attempt has been saved */
  attemptSaved: boolean;
  /** Show success particle burst */
  showSuccessBurst: boolean;
  /** Origin coordinates for success burst */
  burstOrigin: { x: number; y: number } | null;
}

/**
 * Payload for restoring progress from saved attempt.
 */
export interface RestoreProgressPayload {
  chain: ChainLink[];
  attemptId: string;
}

/**
 * Actions for The Chain game reducer.
 */
export type TheChainAction =
  | { type: "OPEN_SEARCH" }
  | { type: "CLOSE_SEARCH" }
  | { type: "START_VALIDATION" }
  | {
      type: "VALID_LINK";
      payload: { link: ChainLink; burstOrigin?: { x: number; y: number } };
    }
  | { type: "INVALID_LINK" }
  | { type: "CLEAR_INVALID" }
  | { type: "GAME_COMPLETE"; payload: import("../utils/scoring").ChainScore }
  | { type: "GIVE_UP"; payload: import("../utils/scoring").ChainScore }
  | { type: "SET_ATTEMPT_ID"; payload: string }
  | { type: "RESTORE_PROGRESS"; payload: RestoreProgressPayload }
  | { type: "MARK_ATTEMPT_SAVED" }
  | { type: "CLEAR_SUCCESS_BURST" }
  | { type: "UNDO_LAST_LINK" }
  | { type: "RESET_GAME"; payload: ChainPlayer };

/**
 * Initial state factory.
 */
export function createInitialState(startPlayer: ChainPlayer): TheChainState {
  return {
    chain: [
      {
        player: startPlayer,
        shared_club_name: "",
        overlap_start: 0,
        overlap_end: 0,
      },
    ],
    gameStatus: "playing",
    score: null,
    isSearchOpen: false,
    lastLinkInvalid: false,
    isValidating: false,
    attemptId: null,
    attemptSaved: false,
    showSuccessBurst: false,
    burstOrigin: null,
  };
}

/**
 * Metadata structure saved with The Chain attempts.
 */
export interface TheChainAttemptMetadata {
  /** Chain of linked players */
  chain: ChainLink[];
  /** Steps taken (chain.length - 1) */
  stepsTaken: number;
  /** Par for this puzzle */
  par: number;
  /** Whether player gave up */
  gaveUp?: boolean;
}

/**
 * Response from check_players_linked RPC.
 */
export interface CheckPlayersLinkedResult {
  is_linked: boolean;
  shared_club_id: string | null;
  shared_club_name: string | null;
  overlap_start: number | null;
  overlap_end: number | null;
}

/**
 * Parse and validate The Chain content from puzzle JSON.
 */
export function parseTheChainContent(
  content: unknown
): TheChainContent | null {
  if (!content || typeof content !== "object") return null;

  const obj = content as Record<string, unknown>;

  // Validate start_player
  if (!isValidChainPlayer(obj.start_player)) return null;

  // Validate end_player
  if (!isValidChainPlayer(obj.end_player)) return null;

  // Validate par
  if (typeof obj.par !== "number" || obj.par < 1) return null;

  return {
    start_player: obj.start_player as ChainPlayer,
    end_player: obj.end_player as ChainPlayer,
    par: obj.par,
    solution_path: Array.isArray(obj.solution_path)
      ? (obj.solution_path as unknown[]).filter(isValidChainPlayer) as ChainPlayer[]
      : undefined,
    hint_player: isValidChainPlayer(obj.hint_player)
      ? (obj.hint_player as ChainPlayer)
      : undefined,
  };
}

function isValidChainPlayer(value: unknown): value is ChainPlayer {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.qid === "string" && typeof obj.name === "string";
}
