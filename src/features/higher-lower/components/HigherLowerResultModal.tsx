/**
 * HigherLowerResultModal Component
 *
 * Result modal shown when Higher/Lower game ends (won or lost).
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData, ShareResult } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';
import { HigherLowerScore } from '../utils/scoring';
import { generateHigherLowerEmojiGrid } from '../utils/share';

export interface HigherLowerResultModalProps {
  visible: boolean;
  score: HigherLowerScore | null;
  results: boolean[];
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => Promise<ShareResult>;
  testID?: string;
  showNextPuzzle?: boolean;
}

export function HigherLowerResultModal({
  visible,
  score,
  results,
  puzzleId,
  puzzleDate,
  onClose,
  onShare,
  testID,
  showNextPuzzle,
}: HigherLowerResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isWin = score.won;
  const isPerfect = isWin;
  const emojiGrid = generateHigherLowerEmojiGrid(results);

  const resultTitle = isWin ? 'PERFECT 10!' : `${score.points}/10`;

  const resultMessage = '';

  const shareData: ResultShareData = {
    gameMode: 'higher_lower',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isWin,
    isPerfectScore: isPerfect,
  };

  const shareCardContent = (
    <ResultShareCard
      gameMode="higher_lower"
      resultType={isWin ? 'perfect' : 'loss'}
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
      resultType={isWin ? 'win' : 'loss'}
      icon={
        isWin ? (
          <Trophy
            size={32}
            color={colors.stadiumNavy}
            strokeWidth={2}
          />
        ) : (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={resultTitle}
      message={resultMessage}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
      puzzleId={puzzleId}
      gameMode="higher_lower"
      challengeScore={score.points}
    >
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="higher_lower"
        userScore={score.points * 10}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
