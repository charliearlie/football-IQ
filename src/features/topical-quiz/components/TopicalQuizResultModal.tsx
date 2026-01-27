/**
 * Topical Quiz Result Modal Component
 *
 * Displays quiz results using the shared BaseResultModal component
 * with image-based sharing.
 * Always shows "complete" state (no failure condition in quiz).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Star } from 'lucide-react-native';
import { BaseResultModal, ResultShareCard } from '@/components/GameResultModal';
import type { ResultShareData } from '@/components/GameResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { useAuth } from '@/features/auth';
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
  /** Puzzle ID for score distribution */
  puzzleId: string;
  /** Puzzle date in YYYY-MM-DD format */
  puzzleDate: string;
  /** Callback to share result (legacy fallback) */
  onShare: () => Promise<ShareResult>;
  /** Callback to review the game */
  onReview?: () => void;
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
 * Quiz result modal with celebration UI and image-based sharing.
 *
 * Unlike other game modes, quiz always shows "celebration" since
 * there's no failure condition - users complete all 5 questions.
 */
export function TopicalQuizResultModal({
  visible,
  score,
  answers,
  puzzleId,
  puzzleDate,
  onShare,
  onReview,
  onClose,
  testID,
}: TopicalQuizResultModalProps) {
  const { profile, totalIQ } = useAuth();

  // Determine color theme based on performance
  const isPerfect = score.correctCount === 5;
  const isGood = score.correctCount >= 3;
  const accentColor = isPerfect
    ? colors.cardYellow
    : isGood
      ? colors.pitchGreen
      : colors.textSecondary;

  // Generate emoji grid for share card
  const emojiGrid = generateQuizEmojiGrid(answers);

  // Build share data for image capture
  const shareData: ResultShareData = {
    gameMode: 'topical_quiz',
    scoreDisplay: emojiGrid,
    puzzleDate,
    displayName: profile?.display_name ?? 'Football Fan',
    totalIQ,
    won: true, // Quiz always completes successfully
    isPerfectScore: isPerfect,
  };

  // Share card content for image capture
  const shareCardContent = (
    <ResultShareCard
      gameMode="topical_quiz"
      resultType="complete"
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
      message={getMessage(score)}
      onShare={onShare}
      shareCardContent={shareCardContent}
      shareData={shareData}
      onReview={onReview}
      onClose={onClose}
      showConfetti={isGood}
      testID={testID}
    >
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreValue}>{formatQuizScore(score)}</Text>
        <Text style={styles.pointsValue}>{score.points} points</Text>
      </View>
      <ScoreDistributionContainer
        puzzleId={puzzleId}
        gameMode="topical_quiz"
        userScore={score.points * 10}
        testID={testID ? `${testID}-distribution` : undefined}
      />
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
