/**
 * Game Result Modal Component
 *
 * Full-screen modal showing game results with:
 * - Confetti animation on win
 * - Score display with emoji grid
 * - Share button
 * - Correct answer reveal on loss
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Trophy, XCircle } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { useHaptics } from '@/hooks/useHaptics';
import { GameScore } from '../types/careerPath.types';
import { generateEmojiGrid } from '../utils/scoreDisplay';
import { Confetti } from './Confetti';
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
 * Format score for display.
 */
function formatScoreDisplay(score: GameScore): string {
  return `${score.points}/${score.maxPoints}`;
}

/**
 * Game result modal with celebration/commiseration UI.
 *
 * @example
 * <GameResultModal
 *   visible={gameOver}
 *   won={state.gameStatus === 'won'}
 *   score={state.score}
 *   correctAnswer={answer}
 *   totalSteps={totalSteps}
 *   onShare={shareResult}
 * />
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
  const { triggerNotification, triggerSelection } = useHaptics();
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

  // Reset share status and trigger haptics when modal opens
  useEffect(() => {
    if (visible) {
      setShareStatus('idle');
      triggerNotification(won ? 'success' : 'error');
    }
  }, [visible, won, triggerNotification]);

  const handleShare = async () => {
    triggerSelection();
    const result = await onShare();

    if (result.success) {
      setShareStatus('shared');
      triggerNotification('success');

      // Reset after 2 seconds
      setTimeout(() => {
        setShareStatus('idle');
      }, 2000);
    }
  };

  const emojiGrid = generateEmojiGrid(score, totalSteps);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Confetti for win */}
        {won && <Confetti active={visible} testID="confetti" />}

        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={[
            styles.modal,
            { borderColor: won ? colors.pitchGreen : colors.redCard },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: won ? colors.pitchGreen : colors.redCard },
            ]}
          >
            {won ? (
              <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
            ) : (
              <XCircle size={32} color={colors.floodlightWhite} strokeWidth={2} />
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: won ? colors.pitchGreen : colors.redCard }]}>
            {won ? 'CORRECT!' : 'GAME OVER'}
          </Text>

          {/* Score or Answer */}
          {won ? (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{formatScoreDisplay(score)}</Text>
            </View>
          ) : (
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>The answer was:</Text>
              <Text style={styles.answerValue}>{correctAnswer}</Text>
            </View>
          )}

          {/* Emoji Grid */}
          <View style={styles.gridContainer}>
            <Text style={styles.emojiGrid}>{emojiGrid}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            {won
              ? `Solved with ${score.stepsRevealed} clue${score.stepsRevealed > 1 ? 's' : ''} revealed!`
              : 'Better luck tomorrow!'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <ElevatedButton
              title={
                shareStatus === 'shared'
                  ? Platform.OS === 'web'
                    ? 'Copied!'
                    : 'Shared!'
                  : 'Share Result'
              }
              onPress={handleShare}
              size="medium"
              topColor={
                shareStatus === 'shared' ? colors.glassBackground : colors.pitchGreen
              }
              shadowColor={
                shareStatus === 'shared' ? colors.glassBorder : colors.grassShadow
              }
              testID="share-button"
            />
            <ElevatedButton
              title="Done"
              onPress={onClose}
              size="medium"
              topColor={colors.floodlightWhite}
              shadowColor={colors.textSecondary}
              testID="done-button"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 48,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.floodlightWhite,
    letterSpacing: 2,
  },
  answerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  answerLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  answerValue: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  gridContainer: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emojiGrid: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 2,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
