/**
 * Game Mode Color System
 *
 * Each game mode has a signature color palette that carries through
 * from home card → game screen → result modal.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { getDepthColor } from './colors';

export interface GameModeColorPalette {
  /** Primary signature color */
  primary: string;
  /** Darker shade for 3D depth/shadow layer */
  shadow: string;
  /** Low-opacity tint for card backgrounds (dark theme) */
  tint: string;
  /** Border color at low opacity */
  border: string;
}

const MODE_COLORS: Record<GameMode, { primary: string }> = {
  career_path:           { primary: '#2EFC5D' },  // Green (flagship)
  career_path_pro:       { primary: '#FFD700' },  // Gold (premium)
  guess_the_transfer:    { primary: '#FF9800' },  // Orange (movement)
  connections:           { primary: '#3B82F6' },  // Blue (linking)
  timeline:              { primary: '#7C4DFF' },  // Purple (history)
  'whos-that':           { primary: '#00BCD4' },  // Teal (mystery)
  higher_lower:          { primary: '#FF5252' },  // Red (tension)
  starting_xi:           { primary: '#1E88E5' },  // Royal Blue (formation)
  the_grid:              { primary: '#FFC107' },  // Amber (strategy)
  guess_the_goalscorers: { primary: '#E91E63' },  // Pink (goals)
  top_tens:              { primary: '#FACC15' },  // Yellow (leaderboard)
  last_tens:             { primary: '#94A3B8' },  // Slate (bottom of the table)
  topical_quiz:          { primary: '#26A69A' },  // Teal-green (quiz)
  who_am_i:              { primary: '#9C27B0' },  // Deep purple (mystery)
  the_chain:             { primary: '#78909C' },  // Blue-grey (links)
  the_thread:            { primary: '#8D6E63' },  // Brown (thread)
};

/** Cache computed palettes */
const paletteCache = new Map<GameMode, GameModeColorPalette>();

export function getGameModeColor(mode: GameMode): GameModeColorPalette {
  const cached = paletteCache.get(mode);
  if (cached) return cached;

  const config = MODE_COLORS[mode] ?? { primary: '#2EFC5D' };
  const palette: GameModeColorPalette = {
    primary: config.primary,
    shadow: getDepthColor(config.primary, 25),
    tint: hexToRgba(config.primary, 0.10),
    border: hexToRgba(config.primary, 0.20),
  };

  paletteCache.set(mode, palette);
  return palette;
}

/** Convert hex to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
