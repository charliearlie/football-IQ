import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import {
  Grid3X3,
  Link,
  Shirt,
  HelpCircle,
} from 'lucide-react-native';
import { colors } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Custom puzzle icons mapping.
 * Maps game modes to their custom PNG icons.
 */
// Using require with relative paths assuming this file is in src/features/puzzles/utils
// Adjust paths as needed: ../../../assets/images/puzzles/...
const PUZZLE_ICONS: Partial<Record<GameMode, ImageSourcePropType>> = {
  career_path: require('../../../../assets/images/puzzles/career-path.png'),
  career_path_pro: require('../../../../assets/images/puzzles/career-path.png'),
  guess_the_transfer: require('../../../../assets/images/puzzles/guess-the-transfer.png'),
  guess_the_goalscorers: require('../../../../assets/images/puzzles/goalscorer-recall.png'),
  topical_quiz: require('../../../../assets/images/puzzles/quiz.png'),
  starting_xi: require('../../../../assets/images/puzzles/starting-xi.png'),
  top_tens: require('../../../../assets/images/puzzles/top-tens.png'),
};

/**
 * Game mode configuration for display.
 */
export interface GameModeConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
}

/**
 * Style for custom puzzle icon images.
 */
export const iconImageStyle = { width: 32, height: 32 };
export const archiveIconImageStyle = { width: 24, height: 24 };

/**
 * Get configuration for each game mode.
 */
export function getGameModeConfig(gameMode: GameMode, isArchive = false): GameModeConfig {
  // Check if we have a custom icon for this game mode
  const customIcon = PUZZLE_ICONS[gameMode];
  const imgStyle = isArchive ? archiveIconImageStyle : iconImageStyle;
  const iconElement = customIcon ? (
    <Image source={customIcon} style={imgStyle} resizeMode="contain" />
  ) : null;

  switch (gameMode) {
    case 'career_path':
      return {
        title: 'Career Path',
        subtitle: 'Follow the journey',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'career_path_pro':
      return {
        title: 'Career Path Pro',
        subtitle: 'For true experts',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'guess_the_transfer':
      return {
        title: 'Transfer Guess',
        subtitle: 'Who made the move?',
        icon: iconElement!,
        iconColor: colors.pitchGreen,
      };
    case 'guess_the_goalscorers':
      return {
        title: 'Goalscorer Recall',
        subtitle: 'Remember the match',
        icon: iconElement!,
        iconColor: colors.redCard,
      };
    case 'the_grid':
      return {
        title: 'The Grid (beta)',
        subtitle: 'Fill the matrix',
        icon: <Grid3X3 color={colors.pitchGreen} size={28} />,
        iconColor: colors.pitchGreen,
      };
    case 'the_chain':
      return {
        title: 'The Chain',
        subtitle: 'Link the players',
        icon: <Link color={colors.pitchGreen} size={28} />,
        iconColor: colors.pitchGreen,
      };
    case 'the_thread':
      return {
        title: 'Threads',
        subtitle: 'Follow the thread',
        icon: <Shirt color={colors.cardYellow} size={28} />,
        iconColor: colors.cardYellow,
      };
    case 'topical_quiz':
      return {
        title: 'Quiz',
        subtitle: '5 questions',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    case 'top_tens':
      return {
        title: 'Top Tens',
        subtitle: 'Name all 10',
        icon: iconElement!,
        iconColor: colors.pitchGreen,
      };
    case 'starting_xi':
      return {
        title: 'Starting XI',
        subtitle: 'Name the lineup',
        icon: iconElement!,
        iconColor: colors.cardYellow,
      };
    default:
      return {
        title: 'Unknown',
        subtitle: '',
        icon: <HelpCircle color={colors.textSecondary} size={28} />,
        iconColor: colors.textSecondary,
      };
  }
}
