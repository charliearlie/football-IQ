/**
 * ConnectionsResultModal Component
 *
 * Result modal shown when Connections game ends (won or lost).
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
import { ConnectionsScore, ConnectionsGuess, ConnectionsGroup } from '../types/connections.types';
import { getConnectionsScoreLabel, normalizeConnectionsScore } from '../utils/scoring';
import { generateConnectionsEmojiGrid } from '../utils/share';

export interface ConnectionsResultModalProps {
  visible: boolean;
  score: ConnectionsScore | null;
  guesses: ConnectionsGuess[];
  allGroups: ConnectionsGroup[];
  puzzleId: string;
  puzzleDate: string;
  onClose: () => void;
  onShare: () => Promise<ShareResult>;
  testID?: string;
}

/**
 * ConnectionsResultModal - Shows game completion results.
 */
export function ConnectionsResultModal({
  visible,
  score,
  guesses,
  allGroups,
  puzzleId,
  puzzleDate,
  onClose,
  onShare,
  testID,
}: ConnectionsResultModalProps) {
  const { profile, totalIQ } = useAuth();

  if (!score) return null;

  const isWin = score.solvedCount === 4;
  const scoreLabel = getConnectionsScoreLabel(score.mistakes);

  // Normalize score to 0-100 for distribution chart
  const normalizedScore = Math.round((normalizeConnectionsScore(score) / 10) * 100);

  // Generate emoji grid for share card
  const emojiGrid = generateConnectionsEmojiGrid(guesses, allGroups);

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'connections',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: isWin,
    isPerfectScore: score.mistakes === 0 && score.perfectOrder,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="connections"
      resultType={isWin ? (score.mistakes === 0 ? 'perfect' : 'win') : 'loss'}
      scoreDisplay={emojiGrid}
      puzzleDate={puzzleDate}
      displayName={shareData.displayName}
      totalIQ={totalIQ}
      isPerfectScore={shareData.isPerfectScore}
    />
  );

  return (
    <BaseResultModal
      visible={visible}
      resultType={isWin ? 'win' : 'loss'}
      icon={
        isWin ? (
          <Trophy
            size={32}
            color={score.mistakes === 0 ? colors.stadiumNavy : colors.floodlightWhite}
            strokeWidth={2}
          />
        ) : (
          <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={isWin ? (score.mistakes === 0 ? 'PERFECT!' : 'COMPLETE!') : 'GAME OVER'}
      message={scoreLabel}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onClose={onClose}
      testID={testID}
    >
      <ScoreDisplay value={`${score.points} IQ`} />
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="connections"
        userScore={normalizedScore}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
