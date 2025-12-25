/**
 * TicTacToeResultModal Component
 *
 * Full-screen modal showing game result with confetti,
 * emoji grid, and share functionality.
 */

import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Trophy, Handshake, Frown } from 'lucide-react-native';
import { colors, spacing, borderRadius, textStyles } from '@/theme';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/features/career-path/components/Confetti';
import type { CellArray, TicTacToeScore } from '../types/ticTacToe.types';
import {
  generateTicTacToeEmojiGrid,
  getResultMessage,
} from '../utils/scoreDisplay';

export interface TicTacToeResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Game score data */
  score: TicTacToeScore;
  /** Final cell states */
  cells: CellArray;
  /** Callback to share result */
  onShare: () => void;
  /** Callback to play again */
  onPlayAgain: () => void;
  /** Share status */
  shareStatus: 'idle' | 'shared';
}

const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * TicTacToeResultModal - End game result display
 */
export function TicTacToeResultModal({
  visible,
  score,
  cells,
  onShare,
  shareStatus,
}: TicTacToeResultModalProps) {
  const isWin = score.result === 'win';
  const emojiGrid = generateTicTacToeEmojiGrid(cells);
  const resultMessage = getResultMessage(score.result);

  const getResultTitle = () => {
    switch (score.result) {
      case 'win':
        return 'VICTORY!';
      case 'draw':
        return 'DRAW!';
      case 'loss':
        return 'DEFEAT';
    }
  };

  const getResultIcon = () => {
    switch (score.result) {
      case 'win':
        return <Trophy size={48} color={colors.cardYellow} strokeWidth={2} />;
      case 'draw':
        return <Handshake size={48} color={colors.cardYellow} strokeWidth={2} />;
      case 'loss':
        return <Frown size={48} color={colors.textSecondary} strokeWidth={2} />;
    }
  };

  const getTitleColor = () => {
    switch (score.result) {
      case 'win':
        return colors.pitchGreen;
      case 'draw':
        return colors.cardYellow;
      case 'loss':
        return colors.redCard;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Confetti for win */}
        {isWin && <Confetti active={true} />}

        <AnimatedView
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={styles.modal}
        >
          {/* Result Icon */}
          <View style={styles.iconContainer}>{getResultIcon()}</View>

          {/* Result Title */}
          <Text style={[styles.title, { color: getTitleColor() }]}>
            {getResultTitle()}
          </Text>

          {/* Result Message */}
          <Text style={styles.message}>{resultMessage}</Text>

          {/* Emoji Grid */}
          <View style={styles.emojiGridContainer}>
            <Text style={styles.emojiGrid}>{emojiGrid}</Text>
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {score.points}/{score.maxPoints}
            </Text>
          </View>

          {/* Stats */}
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

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <ElevatedButton
              title={shareStatus === 'shared' ? 'Shared!' : 'Share Result'}
              onPress={onShare}
              size="medium"
              topColor={
                shareStatus === 'shared'
                  ? colors.glassBackground
                  : colors.pitchGreen
              }
              shadowColor={
                shareStatus === 'shared'
                  ? colors.glassBorder
                  : colors.grassShadow
              }
              testID="share-button"
            />
          </View>
        </AnimatedView>
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
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emojiGridContainer: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emojiGrid: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
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
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
    color: colors.floodlightWhite,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statValue: {
    fontFamily: 'BebasNeue_400Regular',
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
});
