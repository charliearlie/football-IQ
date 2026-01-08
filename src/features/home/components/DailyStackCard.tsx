import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Briefcase,
  ArrowRightLeft,
  Target,
  Grid3X3,
  HelpCircle,
  Check,
} from 'lucide-react-native';
import { GlassCard, ElevatedButton } from '@/components';
import { colors, textStyles, spacing } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../hooks/useDailyPuzzles';

interface DailyStackCardProps {
  /**
   * Game mode type.
   */
  gameMode: GameMode;
  /**
   * Current status of the puzzle attempt.
   */
  status: CardStatus;
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
        subtitle: '5 questions',
        icon: <HelpCircle color={colors.cardYellow} size={32} />,
        iconColor: colors.cardYellow,
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
 * - done: "Result" button (yellow)
 */
export function DailyStackCard({
  gameMode,
  status,
  onPress,
  testID,
}: DailyStackCardProps) {
  const config = getGameModeConfig(gameMode);

  return (
    <GlassCard style={styles.card} testID={testID}>
      <Pressable
        style={styles.content}
        onPress={onPress}
      >
        {/* Left: Icon + Title */}
        <View style={styles.left}>
          <View style={styles.iconContainer}>
            {config.icon}
            {/* Completion badge - small checkmark in corner */}
            {status === 'done' && (
              <View style={styles.completionBadge}>
                <Check size={12} color={colors.stadiumNavy} strokeWidth={3} />
              </View>
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>
        </View>

        {/* Right: Action Button */}
        <View style={styles.right}>
          <ElevatedButton
            title={status === 'done' ? 'Result' : status === 'resume' ? 'Resume' : 'Play'}
            onPress={onPress}
            size="small"
            topColor={status === 'done' ? colors.cardYellow : status === 'resume' ? colors.cardYellow : colors.pitchGreen}
            shadowColor={status === 'done' ? '#D4A500' : status === 'resume' ? '#D4A500' : colors.grassShadow}
          />
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
  completionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.stadiumNavy,
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
});
