/**
 * Career Path Game Result Modal
 *
 * Displays game results using the shared BaseResultModal component.
 * Includes "View Full Path" button for winners to see their complete career path.
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  AnswerReveal,
} from '@/components/GameResultModal';
import { ElevatedButton } from '@/components';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { colors, spacing } from '@/theme';
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
  /** Callback to view full career path (win only) */
  onViewPath?: () => void;
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
  onViewPath,
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
      {!won && <AnswerReveal value={correctAnswer} />}
      {/* View Full Path button - win only */}
      {won && onViewPath && (
        <ElevatedButton
          title="View Full Path"
          onPress={onViewPath}
          variant="secondary"
          style={{ marginBottom: spacing.md }}
          testID={testID ? `${testID}-view-path` : undefined}
        />
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
