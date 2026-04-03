/**
 * BalldeResultModal Component
 *
 * Result modal shown when Balldle game ends (won or lost).
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
import { BalldeScore } from '../utils/scoring';
import { generateBalldeEmojiGrid } from '../utils/share';
import { GuessFeedback } from '../types/balldle.types';

export interface BalldeResultModalProps {
  visible: boolean;
  score: BalldeScore | null;
  correctPlayerName: string;
  guesses: GuessFeedback[];
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => Promise<ShareResult>;
  testID?: string;
  showNextPuzzle?: boolean;
}

export function BalldeResultModal({
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
}: BalldeResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isWin = score.won;
  const isPerfect = isWin && score.guessCount === 1;
  const emojiGrid = generateBalldeEmojiGrid(guesses);

  const resultTitle = isWin
    ? isPerfect
      ? 'INCREDIBLE!'
      : 'CORRECT!'
    : 'GAME OVER';

  const resultMessage = isWin
    ? isPerfect
      ? 'Got it in one!'
      : `Guessed in ${score.guessCount} attempt${score.guessCount === 1 ? '' : 's'}`
    : `It was ${correctPlayerName}`;

  const shareData: ResultShareData = {
    gameMode: 'balldle',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isWin,
    isPerfectScore: isPerfect,
  };

  const shareCardContent = (
    <ResultShareCard
      gameMode="balldle"
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
            color={isPerfect ? colors.stadiumNavy : colors.floodlightWhite}
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
      gameMode="balldle"
      challengeScore={score.points}
    >
      <ScoreDisplay
        label="Guesses Used"
        value={`${score.guessCount}/${score.maxPoints}`}
      />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="balldle"
        userScore={score.points}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
