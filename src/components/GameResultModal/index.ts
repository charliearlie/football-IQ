/**
 * Game Result Modal Components
 *
 * Shared components for displaying game results across all game modes.
 */

export { BaseResultModal, ScoreDisplay, AnswerReveal } from './BaseResultModal';
export type { BaseResultModalProps, ResultType } from './BaseResultModal';
export { useShareStatus, useResetShareStatus } from './useShareStatus';
export type { ShareResult, ShareStatus, UseShareStatusResult } from './useShareStatus';
export { ResultShareCard } from './ResultShareCard';
export type { ResultShareCardProps, ResultShareType } from './ResultShareCard';
export { useResultShare, generateResultShareText, captureResultCard, shareResultCard } from './useResultShare';
export type { ResultShareData } from './useResultShare';
