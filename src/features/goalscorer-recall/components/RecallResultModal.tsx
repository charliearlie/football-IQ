/**
 * Result Modal component for Goalscorer Recall.
 *
 * Shows end-game results including:
 * - Win/Lose message
 * - Score breakdown
 * - Share button
 * - Continue button
 */

import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { ElevatedButton, GlassCard } from '@/components';
import type { GoalscorerRecallScore, GoalWithState } from '../types/goalscorerRecall.types';
import { generateGoalscorerShareText } from '../utils/share';
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
  const [copied, setCopied] = useState(false);

  // Don't render if not visible
  if (!visible) return null;

  // Show loading state if visible but score not yet available
  // This prevents the "few pixels tall" modal issue
  if (!score) {
    return (
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.overlay}>
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.pitchGreen} />
            <Text style={styles.loadingText}>Calculating score...</Text>
          </GlassCard>
        </View>
      </Modal>
    );
  }

  const handleShare = async () => {
    const shareText = generateGoalscorerShareText(score, goals, matchInfo, puzzleDate);
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resultEmoji = score.won ? '🏆' : '⏱️';
  const resultTitle = score.won ? 'All Scorers Found!' : 'Time Up!';
  const message = getScoreMessage(score);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        style={styles.overlay}
      >
        <Animated.View entering={SlideInDown.springify().damping(15)}>
          <GlassCard style={styles.card}>
            {/* Result Header */}
            <Text style={styles.emoji}>{resultEmoji}</Text>
            <Text style={[textStyles.title, styles.title]}>{resultTitle}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Score Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Scorers Found</Text>
                <Text style={styles.statValue}>
                  {score.scorersFound} / {score.totalScorers}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Percentage</Text>
                <Text style={[styles.statValue, score.percentage === 100 && styles.perfectScore]}>
                  {score.percentage}%
                </Text>
              </View>

              {score.timeBonus > 0 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Time Bonus</Text>
                  <Text style={[styles.statValue, styles.bonusValue]}>
                    +{score.timeBonus}
                  </Text>
                </View>
              )}
            </View>

            {/* Missed Scorers (if any) */}
            {!score.allFound && (
              <View style={styles.missedSection}>
                <Text style={styles.missedLabel}>Missed scorers:</Text>
                <View style={styles.missedList}>
                  {goals
                    .filter((g) => !g.found && !g.isOwnGoal)
                    .map((goal) => (
                      <Text key={goal.id} style={styles.missedScorer}>
                        {goal.scorer} ({goal.minute}')
                      </Text>
                    ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <ElevatedButton
                title={copied ? 'Copied!' : 'Share Result'}
                onPress={handleShare}
                variant="secondary"
                fullWidth
                style={styles.shareButton}
              />
              <ElevatedButton
                title="Continue"
                onPress={onContinue}
                variant="primary"
                fullWidth
              />
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.floodlightWhite,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.floodlightWhite,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.floodlightWhite,
    opacity: 0.7,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.floodlightWhite,
  },
  perfectScore: {
    color: colors.pitchGreen,
  },
  bonusValue: {
    color: colors.cardYellow,
  },
  missedSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  missedLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.floodlightWhite,
    opacity: 0.5,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missedList: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  missedScorer: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.redCard,
    paddingVertical: spacing.xs / 2,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.floodlightWhite,
    opacity: 0.7,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
