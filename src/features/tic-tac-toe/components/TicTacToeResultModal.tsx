/**
 * TicTacToeResultModal Component
 *
 * Displays tic-tac-toe game result using the shared BaseResultModal component.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Handshake, Frown } from 'lucide-react-native';
import { BaseResultModal, ScoreDisplay } from '@/components/GameResultModal';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import type { CellArray, TicTacToeScore } from '../types/ticTacToe.types';
import { getResultMessage } from '../utils/scoreDisplay';
import type { ShareResult } from '@/components/GameResultModal';

export interface TicTacToeResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Game score data */
  score: TicTacToeScore;
  /** Final cell states */
  cells: CellArray;
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
  /** Callback to review the game */
  onReview?: () => void;
  /** Callback to close modal (optional) */
  onClose?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get result icon based on game outcome.
 */
function getResultIcon(result: TicTacToeScore['result']): React.ReactNode {
  switch (result) {
    case 'win':
      return <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />;
    case 'draw':
      return <Handshake size={32} color={colors.stadiumNavy} strokeWidth={2} />;
    case 'loss':
      return <Frown size={32} color={colors.floodlightWhite} strokeWidth={2} />;
  }
}

/**
 * Get title based on game outcome.
 */
function getResultTitle(result: TicTacToeScore['result']): string {
  switch (result) {
    case 'win':
      return 'VICTORY!';
    case 'draw':
      return 'DRAW!';
    case 'loss':
      return 'DEFEAT';
  }
}

/**
 * TicTacToeResultModal - End game result display
 */
export function TicTacToeResultModal({
  visible,
  score,
  cells,
  onShare,
  onReview,
  onClose,
  testID,
}: TicTacToeResultModalProps) {
  const resultMessage = getResultMessage(score.result);

  return (
    <BaseResultModal
      visible={visible}
      resultType={score.result}
      icon={getResultIcon(score.result)}
      title={getResultTitle(score.result)}
      onShare={onShare}
      onReview={onReview}
      onClose={onClose}
      showConfetti={score.result === 'win'}
      testID={testID}
    >
      {/* Score Display */}
      <ScoreDisplay value={`${score.points}/${score.maxPoints}`} />

      {/* Result Message */}
      <Text style={styles.message}>{resultMessage}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{score.playerCells}</Text>
          <Text style={styles.statLabel}>Your Cells</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{score.aiCells}</Text>
          <Text style={styles.statLabel}>AI Cells</Text>
        </View>
      </View>
    </BaseResultModal>
  );
}

const styles = StyleSheet.create({
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.glassBorder,
  },
});
