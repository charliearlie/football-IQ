/**
 * Result Modal component for Goalscorer Recall.
 *
 * Uses the shared BaseResultModal for consistent styling across all game modes.
 * Displays win/loss state, score stats, and missed scorers.
 */

import { View, Text, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Trophy, Clock } from 'lucide-react-native';
import { BaseResultModal } from '@/components/GameResultModal';
import type { ShareResult } from '@/components/GameResultModal';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { fonts } from '@/theme/typography';
import type { GoalscorerRecallScore, GoalWithState } from '../types/goalscorerRecall.types';
import { generateGoalscorerShareText } from '../utils/share';
import { generateGoalscorerEmojiGrid } from '../utils/scoreDisplay';
import { getScoreMessage } from '../utils/scoring';

interface RecallResultModalProps {
  visible: boolean;
  score: GoalscorerRecallScore | null;
  goals: GoalWithState[];
  matchInfo: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition: string;
    matchDate: string;
  };
  puzzleDate: string;
  onContinue: () => void;
}

export function RecallResultModal({
  visible,
  score,
  goals,
  matchInfo,
  puzzleDate,
  onContinue,
}: RecallResultModalProps) {
  // Don't render if not visible or score not ready
  if (!visible || !score) return null;

  const emojiGrid = generateGoalscorerEmojiGrid(goals, score.timeRemaining);

  const handleShare = async (): Promise<ShareResult> => {
    const shareText = generateGoalscorerShareText(score, goals, matchInfo, puzzleDate);
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  };

  // Get missed scorers (not found and not own goals)
  const missedScorers = goals.filter((g) => !g.found && !g.isOwnGoal);

  return (
    <BaseResultModal
      visible={visible}
      resultType={score.won ? 'win' : 'loss'}
      icon={
        score.won ? (
          <Trophy size={32} color={colors.stadiumNavy} strokeWidth={2} />
        ) : (
          <Clock size={32} color={colors.floodlightWhite} strokeWidth={2} />
        )
      }
      title={score.won ? 'ALL FOUND!' : 'TIME UP!'}
      emojiGrid={emojiGrid}
      message={getScoreMessage(score)}
      onShare={handleShare}
      onClose={onContinue}
      closeLabel="Continue"
      showConfetti={score.won}
    >
      {/* Stats display */}
      <View style={styles.statsContainer}>
        <Text style={styles.scoreLabel}>Scorers Found</Text>
        <Text style={styles.scoreValue}>
          {score.scorersFound}/{score.totalScorers}
        </Text>
        <Text style={score.percentage === 100 ? styles.perfect : styles.percentage}>
          {score.percentage}%
        </Text>
        {score.timeBonus > 0 && (
          <Text style={styles.bonus}>+{score.timeBonus} time bonus</Text>
        )}
      </View>

      {/* Missed scorers (if any) */}
      {missedScorers.length > 0 && (
        <View style={styles.missedSection}>
          <Text style={styles.missedLabel}>Missed:</Text>
          {missedScorers.map((goal) => (
            <Text key={goal.id} style={styles.missedScorer}>
              {goal.scorer} ({goal.minute}')
            </Text>
          ))}
        </View>
      )}
    </BaseResultModal>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
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
  percentage: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  perfect: {
    ...textStyles.body,
    color: colors.pitchGreen,
    marginTop: spacing.xs,
  },
  bonus: {
    ...textStyles.body,
    color: colors.cardYellow,
    marginTop: spacing.xs,
  },
  missedSection: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  missedLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  missedScorer: {
    ...textStyles.body,
    color: colors.redCard,
    paddingVertical: spacing.xs / 2,
  },
});
