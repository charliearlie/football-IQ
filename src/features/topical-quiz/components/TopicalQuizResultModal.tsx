/**
 * Topical Quiz Result Modal Component
 *
 * Full-screen modal showing quiz results with:
 * - Confetti animation (always, since quiz has no fail condition)
 * - Score display with emoji grid
 * - Share button
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Trophy, Star } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { useHaptics } from '@/hooks/useHaptics';
import { TopicalQuizScore, QuizAnswer } from '../types/topicalQuiz.types';
import { formatQuizScore } from '../utils/quizScoring';
import { generateQuizEmojiGrid } from '../utils/quizScoreDisplay';
import { Confetti } from '@/features/career-path/components/Confetti';
import { ShareResult } from '../utils/quizShare';

interface TopicalQuizResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Game score data */
  score: TopicalQuizScore;
  /** All answers for emoji grid */
  answers: QuizAnswer[];
  /** Callback to share result */
  onShare: () => Promise<ShareResult>;
  /** Callback to close/dismiss the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Quiz result modal with celebration UI.
 *
 * Unlike other game modes, quiz always shows "celebration" since
 * there's no failure condition - users complete all 5 questions.
 */
export function TopicalQuizResultModal({
  visible,
  score,
  answers,
  onShare,
  onClose,
  testID,
}: TopicalQuizResultModalProps) {
  const { triggerNotification, triggerSelection } = useHaptics();
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

  // Reset share status and trigger haptics when modal opens
  useEffect(() => {
    if (visible) {
      setShareStatus('idle');
      triggerNotification('success');
    }
  }, [visible, triggerNotification]);

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

  const emojiGrid = generateQuizEmojiGrid(answers);

  // Build celebratory message based on score
  const getMessage = () => {
    if (score.correctCount === 5) {
      return 'Perfect score! Football genius!';
    } else if (score.correctCount >= 4) {
      return 'Excellent work!';
    } else if (score.correctCount >= 3) {
      return 'Well done!';
    } else if (score.correctCount >= 2) {
      return 'Not bad, keep learning!';
    } else {
      return 'Better luck tomorrow!';
    }
  };

  // Determine color theme based on performance
  const isPerfect = score.correctCount === 5;
  const isGood = score.correctCount >= 3;
  const accentColor = isPerfect
    ? colors.cardYellow
    : isGood
      ? colors.pitchGreen
      : colors.textSecondary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Confetti for good scores */}
        {isGood && <Confetti active={visible} testID="confetti" />}

        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={[styles.modal, { borderColor: accentColor }]}
        >
          {/* Icon */}
          <View
            style={[styles.iconContainer, { backgroundColor: accentColor }]}
          >
            {isPerfect ? (
              <Star
                size={32}
                color={colors.stadiumNavy}
                strokeWidth={2}
                fill={colors.stadiumNavy}
              />
            ) : (
              <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: accentColor }]}>
            {isPerfect ? 'PERFECT!' : 'QUIZ COMPLETE'}
          </Text>

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{formatQuizScore(score)}</Text>
            <Text style={styles.pointsValue}>{score.points} points</Text>
          </View>

          {/* Emoji Grid */}
          <View style={styles.gridContainer}>
            <Text style={styles.emojiGrid}>{emojiGrid}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>{getMessage()}</Text>

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
              topColor={colors.glassBackground}
              shadowColor={colors.glassBorder}
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
    fontSize: 42,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
    fontSize: 48,
    color: colors.floodlightWhite,
    letterSpacing: 2,
  },
  pointsValue: {
    ...textStyles.body,
    color: colors.cardYellow,
    marginTop: spacing.xs,
  },
  gridContainer: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emojiGrid: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 4,
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
