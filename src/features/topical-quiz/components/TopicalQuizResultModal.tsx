/**
 * Topical Quiz Result Modal Component
 *
 * Displays quiz results using the shared BaseResultModal component.
 * Always shows "complete" state (no failure condition in quiz).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Star } from 'lucide-react-native';
import { BaseResultModal } from '@/components/GameResultModal';
import { colors } from '@/theme/colors';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { fonts } from '@/theme/typography';
import { TopicalQuizScore, QuizAnswer } from '../types/topicalQuiz.types';
import { formatQuizScore } from '../utils/quizScoring';
import { generateQuizEmojiGrid } from '../utils/quizScoreDisplay';
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
 * Build celebratory message based on score.
 */
function getMessage(score: TopicalQuizScore): string {
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
  const emojiGrid = generateQuizEmojiGrid(answers);

  // Determine color theme based on performance
  const isPerfect = score.correctCount === 5;
  const isGood = score.correctCount >= 3;
  const accentColor = isPerfect
    ? colors.cardYellow
    : isGood
      ? colors.pitchGreen
      : colors.textSecondary;

  return (
    <BaseResultModal
      visible={visible}
      resultType="complete"
      icon={
        isPerfect ? (
          <Star
            size={32}
            color={colors.stadiumNavy}
            strokeWidth={2}
            fill={colors.stadiumNavy}
          />
        ) : (
          <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
        )
      }
      title={isPerfect ? 'PERFECT!' : 'QUIZ COMPLETE'}
      titleColor={accentColor}
      emojiGrid={emojiGrid}
      message={getMessage(score)}
      onShare={onShare}
      onClose={onClose}
      showConfetti={isGood}
      testID={testID}
    >
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreValue}>{formatQuizScore(score)}</Text>
        <Text style={styles.pointsValue}>{score.points} points</Text>
      </View>
    </BaseResultModal>
  );
}

const styles = StyleSheet.create({
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
});
