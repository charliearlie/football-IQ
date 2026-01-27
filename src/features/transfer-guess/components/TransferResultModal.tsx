/**
 * Transfer Result Modal Component
 *
 * Displays game results using the shared BaseResultModal component
 * with image-based sharing.
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
  AnswerReveal,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';
import { TransferGuessScore, formatTransferScore } from '../utils/transferScoring';
import { ShareResult } from '../utils/transferShare';
import { generateTransferEmojiGrid } from '../utils/transferScoreDisplay';

interface TransferResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the player won */
  won: boolean;
  /** Game score data */
  score: TransferGuessScore;
  /** The correct answer (player name) */
  correctAnswer: string;
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Callback to share result (legacy fallback) */
  onShare: () => Promise<ShareResult>;
  /** Callback to review the game */
  onReview?: () => void;
  /** Callback to close/dismiss the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Build message based on score breakdown.
 */
function getMessage(won: boolean, score: TransferGuessScore): string {
  if (!won) return 'Better luck tomorrow!';

  const parts: string[] = [];
  if (score.hintsRevealed === 0) {
    parts.push('No hints needed');
  } else {
    parts.push(`${score.hintsRevealed} hint${score.hintsRevealed > 1 ? 's' : ''} used`);
  }
  if (score.incorrectGuesses === 0) {
    parts.push('first try!');
  } else {
    parts.push(`${score.incorrectGuesses} wrong guess${score.incorrectGuesses > 1 ? 'es' : ''}`);
  }
  return parts.join(', ') + '!';
}

/**
 * Transfer game result modal with win/loss display and image-based sharing.
 */
export function TransferResultModal({
  visible,
  won,
  score,
  correctAnswer,
  puzzleId,
  puzzleDate,
  onShare,
  onReview,
  onClose,
  testID,
}: TransferResultModalProps) {
  const { profile, totalIQ } = useAuth();

  // Generate emoji grid for share card
  const emojiGrid = generateTransferEmojiGrid(score);

  // Perfect score: no hints, no wrong guesses, and won
  const isPerfectScore = won && score.hintsRevealed === 0 && score.incorrectGuesses === 0;

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'guess_the_transfer',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won,
    isPerfectScore,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="guess_the_transfer"
      resultType={won ? 'win' : 'loss'}
      scoreDisplay={emojiGrid}
      puzzleDate={puzzleDate}
      displayName={shareData.displayName}
      totalIQ={totalIQ}
      isPerfectScore={isPerfectScore}
    />
  );

  return (
    <BaseResultModal
      visible={visible}
      resultType={won ? 'win' : 'loss'}
      icon={
        won ? (
          <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
        ) : (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={won ? 'CORRECT!' : 'GAME OVER'}
      message={getMessage(won, score)}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onReview={onReview}
      onClose={onClose}
      testID={testID}
    >
      {won ? (
        <ScoreDisplay value={formatTransferScore(score)} />
      ) : (
        <AnswerReveal value={correctAnswer} />
      )}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="guess_the_transfer"
        userScore={score.points * 20}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
