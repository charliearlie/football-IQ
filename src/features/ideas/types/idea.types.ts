/**
 * Game Submission Types
 *
 * TypeScript types for the game ideas submission feature.
 */

/**
 * Submission status values.
 */
export type IdeaStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

/**
 * Game submission record from database.
 */
export interface GameSubmission {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  email: string | null;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for submitting a new idea.
 */
export interface SubmitIdeaPayload {
  title: string;
  description: string;
  email?: string;
}

/**
 * Result from idea submission.
 */
export interface SubmitIdeaResult {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Form field errors.
 */
export interface IdeaFormErrors {
  title?: string;
  description?: string;
  email?: string;
}
