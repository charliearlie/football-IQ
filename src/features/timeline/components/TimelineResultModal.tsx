/**
 * TimelineResultModal Component
 *
 * Result modal shown when Timeline game ends (won, lost, or gave up).
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData, ShareResult } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';
import type { TimelineScore } from '../types/timeline.types';
import { generateTimelineEmojiRow } from '../utils/share';

export interface TimelineResultModalProps {
  visible: boolean;
  score: TimelineScore | null;
  firstAttemptResults: boolean[];
  subject: string;
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => Promise<ShareResult>;
  gaveUp?: boolean;
  testID?: string;
}

/**
 * TimelineResultModal - Shows game completion results.
 */
export function TimelineResultModal({
  visible,
  score,
  firstAttemptResults,
  subject,
  puzzleId,
  puzzleDate,
  onClose,
  onShare,
  gaveUp = false,
  testID,
}: TimelineResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isPerfect = score.firstAttemptCorrect === 6 && !gaveUp;
  const isWin = !gaveUp && score.label !== '';

  // Determine title
  const title = gaveUp ? 'GAVE UP' : isPerfect ? 'PERFECT!' : isWin ? 'COMPLETE!' : 'GAME OVER';

  // BaseResultModal uses ResultType ('win'|'loss'|'draw'|'complete')
  const baseResultType = gaveUp ? 'loss' as const : isWin ? 'win' as const : 'loss' as const;

  // ResultShareCard uses ResultShareType ('perfect'|'win'|'complete'|'loss')
  const shareResultType = gaveUp ? 'loss' as const : isPerfect ? 'perfect' as const : isWin ? 'win' as const : 'loss' as const;

  // Generate emoji row for share card
  const emojiRow = generateTimelineEmojiRow(firstAttemptResults);

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'timeline',
    scoreDisplay: emojiRow,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isWin,
    isPerfectScore: isPerfect,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="timeline"
      resultType={shareResultType}
      scoreDisplay={emojiRow}
      puzzleDate={puzzleDate}
      displayName={shareData.displayName}
      totalIQ={totalIQ}
      isPerfectScore={shareData.isPerfectScore}
    />
  );

  return (
    <BaseResultModal
      visible={visible}
      resultType={baseResultType}
      icon={
        isWin ? (
          <Trophy
            size={32}
            color={isPerfect ? colors.stadiumNavy : colors.floodlightWhite}
            strokeWidth={2}
          />
        ) : (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={title}
      message={`${score.points} IQ · ${score.label}`}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      <ScoreDisplay label="First Attempt" value={`${score.firstAttemptCorrect}/6`} />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="timeline"
        userScore={score.points}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
