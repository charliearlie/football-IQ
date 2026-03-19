/**
 * WhoAmIResultModal Component
 *
 * Result modal shown when Who Am I? game ends (won, lost, or gave up).
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
import { WhoAmIScore } from '../utils/scoring';
import { generateWhoAmIEmojiGrid } from '../utils/share';

export interface WhoAmIResultModalProps {
  visible: boolean;
  score: WhoAmIScore | null;
  correctPlayerName: string;
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => Promise<ShareResult>;
  gaveUp?: boolean;
  funFact?: string;
  testID?: string;
  showNextPuzzle?: boolean;
}

export function WhoAmIResultModal({
  visible,
  score,
  correctPlayerName,
  puzzleId,
  puzzleDate,
  onClose,
  onShare,
  gaveUp = false,
  funFact,
  testID,
  showNextPuzzle,
}: WhoAmIResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isWin = score.won && !gaveUp;
  const isPerfect = isWin && score.cluesRevealed === 1;
  const emojiGrid = generateWhoAmIEmojiGrid(score);

  const resultTitle = gaveUp
    ? 'GAVE UP'
    : isWin
      ? isPerfect
        ? 'INCREDIBLE!'
        : 'CORRECT!'
      : 'GAME OVER';

  const resultMessage = isWin
    ? isPerfect
      ? `Guessed on the first clue!`
      : `Guessed after ${score.cluesRevealed} clues`
    : `It was ${correctPlayerName}`;

  const shareData: ResultShareData = {
    gameMode: 'who_am_i',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isWin,
    isPerfectScore: isPerfect,
  };

  const shareCardContent = (
    <ResultShareCard
      gameMode="who_am_i"
      resultType={gaveUp ? 'loss' : isWin ? (isPerfect ? 'perfect' : 'win') : 'loss'}
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
      resultType={gaveUp ? 'loss' : isWin ? 'win' : 'loss'}
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
      gameMode="who_am_i"
      challengeScore={score.points}
    >
      <ScoreDisplay label="Clues Used" value={`${score.cluesRevealed}/${score.maxPoints}`} />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="who_am_i"
        userScore={score.points}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
