/**
 * TheGridResultModal Component
 *
 * Result modal shown when The Grid game is complete.
 * Uses BaseResultModal pattern with confetti on perfect score.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Trophy, Star, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { GlassCard } from '@/components/GlassCard';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/components/Confetti';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { TheGridScore, FilledCell } from '../types/theGrid.types';
import { getResultMessage } from '../utils/scoreDisplay';

export interface TheGridResultModalProps {
  visible: boolean;
  score: TheGridScore | null;
  cells: (FilledCell | null)[];
  puzzleId: string;
  onClose: () => void;
  onShare: () => void;
  testID?: string;
}

/**
 * TheGridResultModal - Shows game completion results.
 */
export function TheGridResultModal({
  visible,
  score,
  cells,
  puzzleId,
  onClose,
  onShare,
  testID,
}: TheGridResultModalProps) {
  if (!score) return null;

  const isPerfect = score.cellsFilled === 9;
  const resultMessage = getResultMessage(score.cellsFilled);

  // Normalize The Grid score to 0-100 (cells filled out of 9)
  const normalizedScore = Math.round((score.cellsFilled / 9) * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      testID={testID}
    >
      <BlurView intensity={20} style={styles.backdrop}>
        {isPerfect && <Confetti active />}

        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          style={styles.contentWrapper}
        >
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </Pressable>

          <GlassCard style={styles.card}>
            {/* Result icon */}
            <View style={styles.iconContainer}>
              {isPerfect ? (
                <Trophy size={48} color={colors.cardYellow} />
              ) : (
                <Star size={48} color={colors.pitchGreen} />
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {isPerfect ? 'Perfect Grid!' : 'Game Complete'}
            </Text>

            {/* Result message */}
            <Text style={styles.message}>{resultMessage}</Text>

            {/* Score display */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>
                {score.points}
                <Text style={styles.scoreMax}>/{score.maxPoints}</Text>
              </Text>
              <Text style={styles.cellsLabel}>
                {score.cellsFilled}/9 cells filled
              </Text>
            </View>

            {/* Score Distribution */}
            <ScoreDistributionContainer
              puzzleId={puzzleId}
              gameMode="the_grid"
              userScore={normalizedScore}
              testID={testID ? `${testID}-distribution` : undefined}
            />

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <ElevatedButton
                title="Share"
                onPress={onShare}
                topColor={colors.pitchGreen}
                shadowColor={colors.grassShadow}
                fullWidth
                testID={`${testID}-share`}
              />
              <View style={styles.buttonSpacer} />
              <ElevatedButton
                title="Close"
                onPress={onClose}
                topColor={colors.textSecondary}
                shadowColor={colors.stadiumNavy}
                fullWidth
                testID={`${testID}-close`}
              />
            </View>
          </GlassCard>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  contentWrapper: {
    width: '90%',
    maxWidth: 360,
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    padding: spacing.sm,
    zIndex: 1,
  },
  card: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.floodlightWhite,
  },
  scoreMax: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  cellsLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonSpacer: {
    height: spacing.sm,
  },
});
