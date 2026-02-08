/**
 * The Thread Feature
 *
 * Game mode where players guess a football club from a chronological list
 * of kit sponsors or suppliers.
 *
 * @example
 * ```tsx
 * import { useTheThreadGame, ThreadScore } from '@/features/the-thread';
 *
 * function TheThreadScreen({ puzzle }) {
 *   const {
 *     state,
 *     threadContent,
 *     brands,
 *     kitLore,
 *     isGameOver,
 *     canShowKitLore,
 *     submitGuess,
 *     giveUp,
 *     shareResult,
 *   } = useTheThreadGame(puzzle);
 *
 *   // ...
 * }
 * ```
 */

// Types
export type {
  ThreadType,
  ThreadBrand,
  KitLore,
  TheThreadContent,
  ThreadGameStatus,
  TheThreadState,
  ThreadRestorePayload,
  TheThreadAction,
  TheThreadAttemptMetadata,
} from "./types/theThread.types";

export {
  createInitialState,
  parseTheThreadContent,
} from "./types/theThread.types";

// Scoring
export type { ThreadScore } from "./utils/scoring";

export {
  calculateThreadScore,
  formatThreadScore,
  generateThreadEmojiGrid,
} from "./utils/scoring";

// Hook
export { useTheThreadGame, theThreadReducer } from "./hooks/useTheThreadGame";
export type { ShareResult } from "./hooks/useTheThreadGame";

// Screen
export { TheThreadScreen } from "./screens/TheThreadScreen";

// Components
export { LaundryLine } from "./components/LaundryLine";
export { BrandNode } from "./components/BrandNode";
export { ThreadAxis } from "./components/ThreadAxis";
export { ThreadHeader } from "./components/ThreadHeader";
export { TheThreadActionZone } from "./components/TheThreadActionZone";
export { GuessHistoryRow } from "./components/GuessHistoryRow";
export { TheThreadResultModal } from "./components/TheThreadResultModal";

// Constants
export {
  getTimelineConfig,
  getThreadTheme,
  THREAD_THEME,
  TIMELINE_ANIMATIONS,
  LAYOUT,
} from "./constants/timeline";
