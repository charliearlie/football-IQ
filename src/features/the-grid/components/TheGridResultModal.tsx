/**
 * TheGridResultModal Component
 *
 * Result modal shown when The Grid game is complete.
 * Uses BaseResultModal pattern with confetti on perfect score.
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import {
  BaseResultModal,
  ScoreDisplay,
  ResultShareCard,
} from '@/components/GameResultModal';
import type { ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
import { colors } from '@/theme/colors';
import { TheGridScore, FilledCell } from '../types/theGrid.types';
import { getResultMessage } from '../utils/scoreDisplay';
import { generateGridEmojiGrid } from '../utils/share';

export interface TheGridResultModalProps {
  visible: boolean;
  score: TheGridScore | null;
  cells: (FilledCell | null)[];
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => void;
  /** Whether the player gave up (affects title/icon) */
  gaveUp?: boolean;
  testID?: string;
}

/**
 * TheGridResultModal - Shows game completion results.
 */
export function TheGridResultModal({
  visible,
  score,
  cells,
  puzzleId,
  puzzleDate,
  onClose,
  onShare,
  gaveUp = false,
  testID,
}: TheGridResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isPerfect = score.cellsFilled === 9 && !gaveUp;
  const resultMessage = getResultMessage(score.cellsFilled);

  // Normalize score to 0-100 for distribution chart
  const normalizedScore = Math.round((score.cellsFilled / 9) * 100);

  // Generate emoji grid for share card
  const emojiGrid = generateGridEmojiGrid(cells);

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'the_grid',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: !gaveUp,
    isPerfectScore: isPerfect,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="the_grid"
      resultType={gaveUp ? 'loss' : isPerfect ? 'win' : 'partial'}
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
      resultType={gaveUp ? 'loss' : isPerfect ? 'win' : 'partial'}
      icon={
        gaveUp ? (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        ) : (
          <Trophy
            size={32}
            color={isPerfect ? colors.stadiumNavy : colors.floodlightWhite}
            strokeWidth={2}
          />
        )
      }
      title={gaveUp ? 'GAME OVER' : isPerfect ? 'PERFECT GRID!' : 'GAME COMPLETE'}
      message={resultMessage}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      <ScoreDisplay value={`${score.cellsFilled}/9`} />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="the_grid"
        userScore={normalizedScore}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
