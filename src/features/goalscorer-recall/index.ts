/**
 * Goalscorer Recall feature module.
 *
 * Public exports for the Goalscorer Recall game mode.
 */

// Screen
export { GoalscorerRecallScreen } from './screens/GoalscorerRecallScreen';

// Hooks
export { useGoalscorerRecallGame, getUniqueScorers } from './hooks/useGoalscorerRecallGame';
export { useCountdownTimer } from './hooks/useCountdownTimer';

// Types
export type {
  Goal,
  GoalWithState,
  GoalscorerRecallContent,
  GoalscorerRecallScore,
  GoalscorerRecallState,
  GameStatus,
} from './types/goalscorerRecall.types';
export { TIMER_DURATION, TIMER_WARNING_THRESHOLD } from './types/goalscorerRecall.types';

// Utils
export { calculateGoalscorerScore, formatGoalscorerScore, getScoreMessage } from './utils/scoring';
export { generateGoalscorerEmojiGrid } from './utils/scoreDisplay';
export { generateGoalscorerShareText } from './utils/share';

// Components (for testing/composition)
export { MatchHeader } from './components/MatchHeader';
export { Scoreboard } from './components/Scoreboard';
export { GoalSlot } from './components/GoalSlot';
export { TimerDisplay } from './components/TimerDisplay';
export { RecallActionZone } from './components/RecallActionZone';
export { GoalFlash } from './components/GoalFlash';
export { RecallResultModal } from './components/RecallResultModal';
