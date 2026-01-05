/**
 * Topical Quiz Feature
 *
 * A 5-question multiple-choice visual trivia quiz focused on current football events.
 */

// Screen
export { TopicalQuizScreen } from './screens/TopicalQuizScreen';

// Components
export { QuizProgressBar } from './components/QuizProgressBar';
export { QuizQuestionCard } from './components/QuizQuestionCard';
export { QuizOptionButton } from './components/QuizOptionButton';
export { TopicalQuizResultModal } from './components/TopicalQuizResultModal';

// Hooks
export { useTopicalQuizGame } from './hooks/useTopicalQuizGame';

// Context
export { QuizPrefetchProvider, useQuizPrefetch } from './context/QuizPrefetchContext';

// Utils
export { extractImageUrls, prefetchQuizImages } from './utils/imagePrefetch';
export type { PrefetchResult } from './utils/imagePrefetch';
export {
  calculateQuizScore,
  formatQuizScore,
  formatQuizScoreDetailed,
} from './utils/quizScoring';
export {
  generateQuizScoreDisplay,
  generateQuizEmojiGrid,
  generateQuizCardDisplay,
} from './utils/quizScoreDisplay';
export { shareQuizResult } from './utils/quizShare';

// Types
export type {
  QuizQuestion,
  TopicalQuizContent,
  QuizGameStatus,
  QuizAnswer,
  TopicalQuizScore,
  TopicalQuizState,
  TopicalQuizAction,
  OptionButtonState,
} from './types/topicalQuiz.types';

export {
  TOTAL_QUESTIONS,
  POINTS_PER_CORRECT,
  MAX_POINTS,
  AUTO_ADVANCE_DELAY_MS,
  OPTIONS_COUNT,
} from './types/topicalQuiz.types';
