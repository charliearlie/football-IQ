/**
 * Shared design tokens for all OG image components.
 *
 * Centralises the color palette so GameOGCard, ScoutingReportOGCard,
 * and the four dynamic game-state cards stay in sync.
 */

export const OG_COLORS = {
  stadiumNavy: '#05050A',
  pitchGreen: '#2EFC5D',
  floodlightWhite: '#FFFFFF',
  textSecondary: '#A0ABC0',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  cardBackground: '#0E121A',
};

/** Per-game accent colors (used for card borders and highlights). */
export const GAME_ACCENT_COLORS = {
  careerPath: '#2EFC5D',
  transferGuess: '#FACC15',
  connections: '#3B82F6',
  topicalQuiz: '#FF6B6B',
  timeline: '#F59E0B',
};
