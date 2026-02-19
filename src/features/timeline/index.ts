/**
 * Timeline Feature
 *
 * A chronological ordering puzzle where players arrange 6 events from a footballer's career.
 *
 * @example
 * // Screen usage
 * import { TimelineScreen } from '@/features/timeline';
 * <TimelineScreen puzzleId={puzzleId} />
 *
 * // Hook usage
 * import { useTimelineGame } from '@/features/timeline';
 * const { state, content, reorderEvents, submitOrder } = useTimelineGame(puzzle);
 */

// Screen
export { TimelineScreen } from './screens/TimelineScreen';

// Hook
export { useTimelineGame } from './hooks/useTimelineGame';

// Components
export { TimelineCard } from './components/TimelineCard';
export { TimelineList } from './components/TimelineList';
export { TimelineActionBar } from './components/TimelineActionBar';
export { TimelineResultModal } from './components/TimelineResultModal';

// Utils
export {
  calculateTimelineScore,
  getTimelineScoreLabel,
  normalizeTimelineScore,
} from './utils/scoring';

export {
  generateTimelineEmojiRow,
  generateTimelineShareText,
  shareTimelineResult,
} from './utils/share';
export type { ShareResult } from './utils/share';

// Types
export type {
  TimelineEvent,
  TimelineContent,
  TimelineScore,
  TimelineState,
  TimelineAction,
  TimelineAttemptMetadata,
  RestoreProgressPayload,
  RevealPhase,
} from './types/timeline.types';

export {
  createInitialState,
  parseTimelineContent,
} from './types/timeline.types';
