/**
 * StartingXIResultModal Component
 *
 * Result modal shown when Starting XI game is complete.
 * Uses the shared BaseResultModal for consistent styling across game modes
 * with image-based sharing.
 */

import React from 'react';
import { Trophy, Star, Users } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
  ShareResult,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme';
import type { StartingXIScore, PlayerSlotState } from '../types/startingXI.types';
import { normalizeScore } from '../utils/scoring';
import { generateLinearEmojiDisplay } from '../utils/scoreDisplay';

export interface StartingXIResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Game score */
  score: StartingXIScore | null;
  /** Player slots for emoji display */
  slots: PlayerSlotState[];
  /** Match name for display */
  matchName?: string;
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Callback to share result (legacy fallback) */
  onShare: () => Promise<ShareResult>;
  /** Callback to close modal */
  onClose: () => void;
  /** Optional test ID */
  testID?: string;
}

/**
 * Get result message based on performance.
 */
function getResultMessage(found: number, total: number): string {
  const percentage = total > 0 ? (found / total) * 100 : 0;

  if (percentage === 100) return 'You named the entire starting XI!';
  if (percentage >= 80) return 'Impressive squad knowledge!';
  if (percentage >= 60) return 'Solid performance!';
  if (percentage >= 40) return 'Some familiar faces there.';
  if (percentage >= 20) return 'A few names came to mind.';
  return 'This was a tough one!';
}

/**
 * Get result title based on performance.
 */
function getResultTitle(found: number, total: number): string {
  if (found === total && total > 0) return 'PERFECT XI!';
  if (found === 0) return 'GAME OVER';
  return 'COMPLETE!';
}

/**
 * StartingXIResultModal - Shows game completion results with image-based sharing.
 */
export function StartingXIResultModal({
  visible,
  score,
  slots,
  matchName,
  puzzleId,
  puzzleDate,
  onShare,
  onClose,
  testID,
}: StartingXIResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isPerfect = score.foundCount === score.totalHidden && score.totalHidden > 0;
  const resultMessage = getResultMessage(score.foundCount, score.totalHidden);
  const resultTitle = getResultTitle(score.foundCount, score.totalHidden);
  const normalizedScoreValue = normalizeScore(score);

  // Determine result type for styling
  const resultType = isPerfect ? 'win' : score.foundCount > 0 ? 'complete' : 'loss';

  // Choose icon based on result
  const icon = isPerfect ? (
    <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
  ) : score.foundCount > 0 ? (
    <Star size={32} color={colors.stadiumNavy} strokeWidth={2} />
  ) : (
    <Users size={32} color={colors.floodlightWhite} strokeWidth={2} />
  );

  // Generate emoji grid for share card
  const emojiGrid = generateLinearEmojiDisplay(slots);

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'starting_xi',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isPerfect,
    isPerfectScore: isPerfect,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="starting_xi"
      resultType={resultType}
      scoreDisplay={emojiGrid}
      puzzleDate={puzzleDate}
      displayName={shareData.displayName}
      totalIQ={totalIQ}
      isPerfectScore={isPerfect}
    />
  );

  return (
    <BaseResultModal
      visible={visible}
      resultType={resultType}
      icon={icon}
      title={resultTitle}
      message={resultMessage}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      <ScoreDisplay
        label={`Players Found${matchName ? ` • ${matchName}` : ''}`}
        value={`${score.foundCount}/${score.totalHidden}`}
      />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="starting_xi"
        userScore={normalizedScoreValue}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
