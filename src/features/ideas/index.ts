/**
 * Ideas Feature
 *
 * Game idea submission feature allowing users to contribute
 * game mode ideas with Pro subscription reward incentive.
 */

// Screens
export { SubmitIdeaScreen } from './screens/SubmitIdeaScreen';

// Components
export { RewardBanner } from './components/RewardBanner';

// Services
export { submitIdea } from './services/ideaSubmissionService';

// Types
export type {
  IdeaStatus,
  GameSubmission,
  SubmitIdeaPayload,
  SubmitIdeaResult,
  IdeaFormErrors,
} from './types/idea.types';
