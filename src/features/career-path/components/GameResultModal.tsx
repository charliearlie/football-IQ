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
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Trophy, XCircle, Share2, Check } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { useHaptics } from '@/hooks/useHaptics';
import { GameScore } from '../types/careerPath.types';
import { generateEmojiGrid } from '../utils/scoreDisplay';
import { Confetti } from './Confetti';
import { ShareResult } from '../utils/share';

/** Spring configuration for entrance animation */
const ENTRANCE_SPRING = {
  damping: 15,
  stiffness: 120,
  mass: 0.8,
};

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
  testID,
}: GameResultModalProps) {
  const { triggerNotification, triggerSelection } = useHaptics();
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

  // Entrance animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Reset share status when modal opens
  useEffect(() => {
    if (visible) {
      setShareStatus('idle');
      // Trigger entrance animation
      scale.value = withSpring(1, ENTRANCE_SPRING);
      opacity.value = withDelay(100, withSpring(1, ENTRANCE_SPRING));
      translateY.value = withSpring(0, ENTRANCE_SPRING);

      // Haptic feedback
      triggerNotification(won ? 'success' : 'error');
    } else {
      // Reset for next open
      scale.value = 0.8;
      opacity.value = 0;
      translateY.value = 20;
    }
  }, [visible, won, scale, opacity, translateY, triggerNotification]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

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
      {/* Confetti for win */}
      {won && <Confetti active={visible} testID="confetti" />}

      <View style={styles.overlay}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <GlassCard
            style={{
              ...styles.card,
              borderColor: won ? colors.pitchGreen : colors.redCard,
            }}
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
            <Text style={styles.title}>{won ? 'CORRECT!' : 'GAME OVER'}</Text>

            {/* Score or Answer */}
            {won ? (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={styles.scoreValue}>
                  {formatScoreDisplay(score)}
                </Text>
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

            {/* Share Button */}
            <Pressable
              style={[
                styles.shareButton,
                shareStatus === 'shared' && styles.shareButtonSuccess,
              ]}
              onPress={handleShare}
            >
              {shareStatus === 'shared' ? (
                <>
                  <Check size={20} color={colors.pitchGreen} strokeWidth={2} />
                  <Text style={[styles.shareButtonText, styles.shareButtonTextSuccess]}>
                    {Platform.OS === 'web' ? 'Copied!' : 'Shared!'}
                  </Text>
                </>
              ) : (
                <>
                  <Share2 size={20} color={colors.floodlightWhite} strokeWidth={2} />
                  <Text style={styles.shareButtonText}>Share Result</Text>
                </>
              )}
            </Pressable>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.floodlightWhite,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.pitchGreen,
  },
  answerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  answerLabel: {
    ...textStyles.bodySmall,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  emojiGrid: {
    fontSize: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 160,
  },
  shareButtonSuccess: {
    borderColor: colors.pitchGreen,
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
  },
  shareButtonText: {
    ...textStyles.button,
    color: colors.floodlightWhite,
  },
  shareButtonTextSuccess: {
    color: colors.pitchGreen,
  },
});
