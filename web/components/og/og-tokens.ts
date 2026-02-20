/**
 * Shared design tokens for all OG image components.
 *
 * Centralises the color palette so GameOGCard, ScoutingReportOGCard,
 * and the four dynamic game-state cards stay in sync.
 */

export const OG_COLORS = {
  stadiumNavy: '#0F172A',
  pitchGreen: '#58CC02',
  floodlightWhite: '#F8FAFC',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  cardBackground: '#1a2744',
};

/** Per-game accent colors (used for card borders and highlights). */
export const GAME_ACCENT_COLORS = {
  careerPath: '#58CC02',
  transferGuess: '#FACC15',
  connections: '#3B82F6',
  topicalQuiz: '#FF6B6B',
  timeline: '#F59E0B',
};
