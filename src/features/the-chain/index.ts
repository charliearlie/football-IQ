/**
 * The Chain Feature
 *
 * Connect two players through shared club history.
 * Uses Inverse Par scoring system.
 */

// Types
export * from "./types/theChain.types";

// Scoring
export {
  calculateChainScore,
  formatChainScore,
  getChainScoreEmoji,
  generateChainEmojiGrid,
  type ChainScore,
  type ChainScoreLabel,
} from "./utils/scoring";

// Share
export { shareTheChainResult, generateShareText, type ShareResult } from "./utils/share";

// Hook
export { useTheChainGame } from "./hooks/useTheChainGame";

// Components
export { ChainPlayerCard } from "./components/ChainPlayerCard";
export { ChainLinkRow } from "./components/ChainLinkRow";
export { ChainProgress } from "./components/ChainProgress";
export { TheChainResultModal } from "./components/TheChainResultModal";

// Screen
export { TheChainScreen } from "./screens/TheChainScreen";
