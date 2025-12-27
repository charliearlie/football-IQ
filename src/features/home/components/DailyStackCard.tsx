import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
  CheckCircle,
  Lock,
} from 'lucide-react-native';
import { GlassCard, ElevatedButton } from '@/components';
import { colors, textStyles, spacing } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../hooks/useDailyPuzzles';

interface DailyStackCardProps {
  /**
   * Unique puzzle ID for navigation.
   */
  puzzleId: string;
  /**
   * Game mode type.
   */
  gameMode: GameMode;
  /**
   * Current status of the puzzle attempt.
   */
  status: CardStatus;
  /**
   * Score display string (emoji grid) for completed puzzles.
   */
  scoreDisplay?: string;
  /**
   * Puzzle difficulty level.
   */
  difficulty?: string | null;
  /**
   * Callback when card/button is pressed.
   */
  onPress: () => void;
  /**
   * Test ID for testing.
   */
  testID?: string;
}

/**
 * Game mode configuration for display.
 */
interface GameModeConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
}

/**
 * Get configuration for each game mode.
 */
function getGameModeConfig(gameMode: GameMode): GameModeConfig {
  switch (gameMode) {
    case 'career_path':
      return {
        title: 'Career Path',
        subtitle: 'Guess the player',
        icon: <Briefcase color={colors.cardYellow} size={32} />,
        iconColor: colors.cardYellow,
      };
    case 'guess_the_transfer':
      return {
        title: 'Transfer Guess',
        subtitle: 'Name the player',
        icon: <ArrowRightLeft color={colors.pitchGreen} size={32} />,
        iconColor: colors.pitchGreen,
      };
    case 'guess_the_goalscorers':
      return {
        title: 'Goalscorer Recall',
        subtitle: 'Remember the match',
        icon: <Target color={colors.redCard} size={32} />,
        iconColor: colors.redCard,
      };
    case 'tic_tac_toe':
      return {
        title: 'Tic Tac Toe',
        subtitle: 'Beat the AI',
        icon: <Grid3X3 color={colors.floodlightWhite} size={32} />,
        iconColor: colors.floodlightWhite,
      };
    case 'topical_quiz':
      return {
        title: 'Quiz',
        subtitle: 'Coming Soon',
        icon: <HelpCircle color={colors.textSecondary} size={32} />,
        iconColor: colors.textSecondary,
      };
    default:
      return {
        title: 'Unknown',
        subtitle: '',
        icon: <HelpCircle color={colors.textSecondary} size={32} />,
        iconColor: colors.textSecondary,
      };
  }
}

/**
 * Individual game card for the Home Screen daily stack.
 *
 * Shows different states:
 * - play: "Play" button (green)
 * - resume: "Resume" button (yellow)
 * - done: Score emoji grid + checkmark
 * - Coming Soon: Locked icon (for topical_quiz)
 */
export function DailyStackCard({
  puzzleId,
  gameMode,
  status,
  scoreDisplay,
  difficulty,
  onPress,
  testID,
}: DailyStackCardProps) {
  const config = getGameModeConfig(gameMode);
  const isComingSoon = gameMode === 'topical_quiz';

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Pressable
        style={styles.content}
        onPress={isComingSoon ? undefined : onPress}
        disabled={isComingSoon}
      >
        {/* Left: Icon + Title */}
        <View style={styles.left}>
          <View style={styles.iconContainer}>{config.icon}</View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>
              {isComingSoon ? 'Coming Soon' : config.subtitle}
            </Text>
          </View>
        </View>

        {/* Right: Action or Result */}
        <View style={styles.right}>
          {isComingSoon ? (
            <View style={styles.comingSoonContainer}>
              <Lock color={colors.textSecondary} size={24} />
            </View>
          ) : status === 'done' ? (
            <View style={styles.doneContainer}>
              {scoreDisplay && (
                <Text style={styles.scoreDisplay}>{scoreDisplay}</Text>
              )}
              <CheckCircle
                color={colors.pitchGreen}
                size={24}
                fill={colors.pitchGreen}
                testID={`${testID}-checkmark`}
              />
            </View>
          ) : (
            <ElevatedButton
              title={status === 'resume' ? 'Resume' : 'Play'}
              onPress={onPress}
              size="small"
              topColor={status === 'resume' ? colors.cardYellow : colors.pitchGreen}
              shadowColor={status === 'resume' ? '#D4A500' : colors.grassShadow}
            />
          )}
        </View>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...textStyles.subtitle,
    marginBottom: 2,
  },
  subtitle: {
    ...textStyles.caption,
  },
  right: {
    marginLeft: spacing.md,
  },
  doneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreDisplay: {
    ...textStyles.bodySmall,
    color: colors.floodlightWhite,
  },
  comingSoonContainer: {
    opacity: 0.5,
  },
});
