import React from 'react';
import { colors } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { GameModeIcon } from '@/components';

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
 * Get configuration for each game mode.
 */
export function getGameModeConfig(gameMode: GameMode, isArchive = false): GameModeConfig {
  const iconSize = isArchive ? 24 : 28;
  const icon = <GameModeIcon gameMode={gameMode} size={iconSize} />;

  switch (gameMode) {
    case 'career_path':
      return {
        title: 'Career Path',
        subtitle: 'Follow the journey',
        icon,
        iconColor: colors.cardYellow,
      };
    case 'career_path_pro':
      return {
        title: 'Career Path Pro',
        subtitle: 'For true experts',
        icon,
        iconColor: colors.cardYellow,
      };
    case 'guess_the_transfer':
      return {
        title: 'Transfer Guess',
        subtitle: 'Who made the move?',
        icon,
        iconColor: colors.pitchGreen,
      };
    case 'guess_the_goalscorers':
      return {
        title: 'Goalscorer Recall',
        subtitle: 'Remember the match',
        icon,
        iconColor: colors.redCard,
      };
    case 'the_grid':
      return {
        title: 'The Grid (beta)',
        subtitle: 'Fill the matrix',
        icon,
        iconColor: colors.pitchGreen,
      };
    case 'the_chain':
      return {
        title: 'The Chain',
        subtitle: 'Link the players',
        icon,
        iconColor: colors.pitchGreen,
      };
    case 'the_thread':
      return {
        title: 'Threads',
        subtitle: 'Follow the thread',
        icon,
        iconColor: colors.cardYellow,
      };
    case 'topical_quiz':
      return {
        title: 'Quiz',
        subtitle: '5 questions',
        icon,
        iconColor: colors.cardYellow,
      };
    case 'top_tens':
      return {
        title: 'Top Tens',
        subtitle: 'Name all 10',
        icon,
        iconColor: colors.pitchGreen,
      };
    case 'starting_xi':
      return {
        title: 'Starting XI',
        subtitle: 'Name the lineup',
        icon,
        iconColor: colors.cardYellow,
      };
    case 'connections':
      return {
        title: 'Connections',
        subtitle: 'Find the groups',
        icon,
        iconColor: colors.pitchGreen,
      };
    case 'timeline':
      return {
        title: 'Timeline',
        subtitle: 'Order the career',
        icon,
        iconColor: colors.cardYellow,
      };
    default:
      return {
        title: 'Unknown',
        subtitle: '',
        icon,
        iconColor: colors.textSecondary,
      };
  }
}
