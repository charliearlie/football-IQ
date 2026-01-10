/**
 * Transfer Result Modal Component
 *
 * Displays game results using the shared BaseResultModal component.
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
  AnswerReveal,
} from '@/components/GameResultModal';
import { colors } from '@/theme/colors';
import { TransferGuessScore, formatTransferScore } from '../utils/transferScoring';
import { generateTransferEmojiGrid } from '../utils/transferScoreDisplay';
import { ShareResult } from '../utils/transferShare';

interface TransferResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the player won */
  won: boolean;
  /** Game score data */
  score: TransferGuessScore;
  /** The correct answer (player name) */
  correctAnswer: string;
  /** Callback to share result */
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
 * Transfer game result modal with win/loss display.
 */
export function TransferResultModal({
  visible,
  won,
  score,
  correctAnswer,
  onShare,
  onReview,
  onClose,
  testID,
}: TransferResultModalProps) {
  const emojiGrid = generateTransferEmojiGrid(score);

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
      emojiGrid={emojiGrid}
      message={getMessage(won, score)}
      onShare={onShare}
      onReview={onReview}
      onClose={onClose}
      testID={testID}
    >
      {won ? (
        <ScoreDisplay value={formatTransferScore(score)} />
      ) : (
        <AnswerReveal value={correctAnswer} />
      )}
    </BaseResultModal>
  );
}
