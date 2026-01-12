/**
 * Career Path Game Result Modal
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
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { colors } from '@/theme/colors';
import { GameScore } from '../types/careerPath.types';
import { ShareResult } from '../utils/share';

interface GameResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the player won */
  won: boolean;
  /** Game score data */
  score: GameScore;
  /** The correct answer (player name) */
  correctAnswer: string;
  /** Total steps in the puzzle */
  totalSteps: number;
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
  /** Callback to enter review mode (optional) */
  onReview?: () => void;
  /** Callback to close/dismiss the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Career Path game result modal with win/loss display.
 */
export function GameResultModal({
  visible,
  won,
  score,
  correctAnswer,
  totalSteps,
  puzzleId,
  onShare,
  onReview,
  onClose,
  testID,
}: GameResultModalProps) {
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
      message={
        won
          ? `Solved with ${score.stepsRevealed} clue${score.stepsRevealed > 1 ? 's' : ''} revealed!`
          : 'Better luck tomorrow!'
      }
      onShare={onShare}
      onReview={onReview}
      onClose={onClose}
      testID={testID}
    >
      {won ? (
        <ScoreDisplay value={`${score.points}/${score.maxPoints}`} />
      ) : (
        <AnswerReveal value={correctAnswer} />
      )}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="career_path"
        userScore={totalSteps - score.stepsRevealed + 1}
        maxSteps={totalSteps}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
