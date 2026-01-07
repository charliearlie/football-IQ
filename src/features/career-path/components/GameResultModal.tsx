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
import { colors } from '@/theme/colors';
import { GameScore } from '../types/careerPath.types';
import { generateEmojiGrid } from '../utils/scoreDisplay';
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
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
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
  onShare,
  onClose,
  testID,
}: GameResultModalProps) {
  const emojiGrid = generateEmojiGrid(score, totalSteps);

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
      message={
        won
          ? `Solved with ${score.stepsRevealed} clue${score.stepsRevealed > 1 ? 's' : ''} revealed!`
          : 'Better luck tomorrow!'
      }
      onShare={onShare}
      onClose={onClose}
      testID={testID}
    >
      {won ? (
        <ScoreDisplay value={`${score.points}/${score.maxPoints}`} />
      ) : (
        <AnswerReveal value={correctAnswer} />
      )}
    </BaseResultModal>
  );
}
