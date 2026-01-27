/**
 * Career Path Game Result Modal
 *
 * Displays game results using the standard BaseResultModal pattern:
 * - "Share Result" + "Close" buttons
 * - Score distribution
 * - Image-based sharing
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  AnswerReveal,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme';
import { GameScore } from '../types/careerPath.types';
import { ShareResult } from '../utils/share';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { generateEmojiGrid } from '../utils/scoreDisplay';

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
  /** Puzzle date in YYYY-MM-DD format for share card */
  puzzleDate: string;
  /** Game mode for score distribution labels */
  gameMode?: GameMode;
  /** Callback to share result (legacy text-based, used as fallback) */
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
 * Career Path game result modal with standard button layout.
 */
export function GameResultModal({
  visible,
  won,
  score,
  correctAnswer,
  totalSteps,
  puzzleId,
  puzzleDate,
  gameMode = 'career_path',
  onShare,
  onClose,
  testID,
}: GameResultModalProps) {
  const { profile, totalIQ } = useAuth();

  // Generate score description for share card
  const scoreDescription = generateEmojiGrid(score, totalSteps);

  // Check if perfect score (won with 1 clue revealed)
  const isPerfectScore = won && score.stepsRevealed === 1;

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode,
    scoreDisplay: scoreDescription,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won,
    isPerfectScore,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode={gameMode}
      resultType={won ? 'win' : 'loss'}
      scoreDisplay={scoreDescription}
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
      message={
        won
          ? `Solved with ${score.stepsRevealed} clue${score.stepsRevealed > 1 ? 's' : ''} revealed!`
          : 'Better luck tomorrow!'
      }
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      {/* Answer reveal for loss */}
      {!won && <AnswerReveal value={correctAnswer} />}

      {/* Score distribution */}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode={gameMode}
        userScore={totalSteps - score.stepsRevealed + 1}
        maxSteps={totalSteps}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
