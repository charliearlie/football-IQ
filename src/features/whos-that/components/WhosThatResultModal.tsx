/**
 * WhosThatResultModal Component
 *
 * Result modal shown when Who's That? game ends (won or lost).
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
import { WhosThatScore } from '../utils/scoring';
import { generateWhosThatEmojiGrid } from '../utils/share';
import { GuessFeedback } from '../types/whosThat.types';

export interface WhosThatResultModalProps {
  visible: boolean;
  score: WhosThatScore | null;
  correctPlayerName: string;
  guesses: GuessFeedback[];
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => Promise<ShareResult>;
  testID?: string;
  showNextPuzzle?: boolean;
}

export function WhosThatResultModal({
  visible,
  score,
  correctPlayerName,
  guesses,
  puzzleId,
  puzzleDate,
  onClose,
  onShare,
  testID,
  showNextPuzzle,
}: WhosThatResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isWin = score.won;
  const isPerfect = isWin && score.guessCount === 1;
  const emojiGrid = generateWhosThatEmojiGrid(guesses);

  const resultTitle = isWin
    ? isPerfect
      ? 'INCREDIBLE!'
      : 'CORRECT!'
    : 'GAME OVER';

  // Only show message for losses (win info is conveyed by ScoreDisplay + distribution)
  const resultMessage = isWin ? undefined : `It was ${correctPlayerName}`;

  const shareData: ResultShareData = {
    gameMode: 'whos-that',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isWin,
    isPerfectScore: isPerfect,
  };

  const shareCardContent = (
    <ResultShareCard
      gameMode="whos-that"
      resultType={isWin ? (isPerfect ? 'perfect' : 'win') : 'loss'}
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
      iqEarned={score.points}
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
      showNextPuzzle={showNextPuzzle}
      testID={testID}
      puzzleId={puzzleId}
      gameMode="whos-that"
      challengeScore={score.points}
    >
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="whos-that"
        userScore={score.points}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
