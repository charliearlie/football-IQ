/**
 * Career Path Game Result Modal
 *
 * Displays game results with a premium button layout:
 * - Share icon button (centered)
 * - Score distribution
 * - "View career" + "Home" action buttons
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Trophy, XCircle, Share2 } from 'lucide-react-native';
import {
  BaseResultModal,
  AnswerReveal,
} from '@/components/GameResultModal';
import { ElevatedButton, IconButton } from '@/components';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useHaptics } from '@/hooks/useHaptics';
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
 * Career Path game result modal with premium button layout.
 */
export function GameResultModal({
  visible,
  won,
  score,
  correctAnswer,
  totalSteps,
  puzzleId,
  onShare,
  onViewPath,
  onClose,
  testID,
}: GameResultModalProps) {
  const { triggerSelection, triggerNotification } = useHaptics();
  const [shareLabel, setShareLabel] = useState<string | undefined>(undefined);

  // Handle share with feedback
  const handleShare = useCallback(async () => {
    triggerSelection();
    try {
      const result = await onShare();
      if (result.success) {
        triggerNotification('success');
        // Show appropriate label based on share method
        const label = Platform.OS === 'web' || result.method === 'clipboard'
          ? 'Copied!'
          : 'Shared!';
        setShareLabel(label);
        // Reset after 2 seconds
        setTimeout(() => setShareLabel(undefined), 2000);
      }
    } catch {
      // Silently fail - user cancelled or error
    }
  }, [onShare, triggerSelection, triggerNotification]);

  // Determine if we show two buttons or just one
  const showViewCareer = won && onViewPath;

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
      hideDefaultButtons
      hideCloseButton
      testID={testID}
    >
      {/* Answer reveal for loss */}
      {!won && <AnswerReveal value={correctAnswer} />}

      {/* Share icon button - centered */}
      <View style={styles.shareContainer}>
        <IconButton
          icon={<Share2 size={20} color={colors.stadiumNavy} />}
          onPress={handleShare}
          label={shareLabel}
          variant="primary"
          size="medium"
          testID={testID ? `${testID}-share` : 'share-icon-button'}
        />
      </View>

      {/* Score distribution */}
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="career_path"
        userScore={totalSteps - score.stepsRevealed + 1}
        maxSteps={totalSteps}
        testID={testID ? `${testID}-distribution` : undefined}
      />

      {/* Action buttons row */}
      <View style={styles.buttonRow}>
        {showViewCareer && (
          <ElevatedButton
            title="View career"
            onPress={onViewPath}
            variant="secondary"
            size="small"
            style={styles.buttonHalf}
            testID={testID ? `${testID}-view-path` : undefined}
          />
        )}
        <ElevatedButton
          title="Home"
          onPress={onClose}
          variant="primary"
          size="small"
          style={showViewCareer ? styles.buttonHalf : styles.buttonFull}
          testID={testID ? `${testID}-home` : undefined}
        />
      </View>
    </BaseResultModal>
  );
}

const styles = StyleSheet.create({
  shareContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    flex: 1,
  },
});
